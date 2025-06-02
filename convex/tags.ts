import { v } from 'convex/values';
import { internalAction, internalMutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { api, internal } from './_generated/api';
import { deserializeCoeffs } from '../src/lib/serialization';
import { applyGlobals, cosineGradient } from '../src/lib/cosineGradient';
import { ColorFormats, colorToAllFormats } from '../src/lib/colorUtils';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { getCollectionStyleSVG } from '../src/lib/getCollectionStyleSVG';
import { getColorAnalysisPrompt } from './analysis/common';
import { TAGS } from '../tags';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { TagAnalysis, TaggedCollections } from './schema';

export const searchCollectionsByTagText = query({
  args: { searchText: v.string() },
  handler: async (ctx, args) => {
    // Search for tags matching the search text
    const taggedCollections = await ctx.db
      .query('tagged_collections')
      .withSearchIndex('search_tag', (q) => q.search('tag', args.searchText))
      .collect();

    // Get unique collection IDs
    const collectionIds = new Set<Id<'collections'>>(
      taggedCollections.map((item) => item.collectionId),
    );

    // Fetch the actual collections
    const collections = await Promise.all(Array.from(collectionIds).map((id) => ctx.db.get(id)));

    // Filter out any null values (in case a collection was deleted)
    return collections.filter((c) => c !== null);
  },
});

export const getCollectionsByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Early return if no tags provided
    if (args.tags.length === 0) {
      return [];
    }

    // For each tag, get the collections with that tag
    const taggedCollectionsPromises = args.tags.map((tag) =>
      ctx.db
        .query('tagged_collections')
        .withIndex('tag', (q) => q.eq('tag', tag))
        .collect(),
    );

    const taggedCollectionsArrays = await Promise.all(taggedCollectionsPromises);

    // Flatten and get unique collection IDs
    const collectionIds = new Set<Id<'collections'>>();
    taggedCollectionsArrays.forEach((taggedCollections) => {
      taggedCollections.forEach((item) => {
        collectionIds.add(item.collectionId);
      });
    });

    // Fetch the actual collections
    const collections = await Promise.all(Array.from(collectionIds).map((id) => ctx.db.get(id)));

    // Filter out any null values (in case a collection was deleted)
    return collections.filter((c) => c !== null);
  },
});

export const TagGenerationSchema = z.object({
  // 5 tags selected from the tagFrequency that also exist in TAGS array
  existingTags: z
    .array(z.enum(TAGS as readonly [string, ...string[]]))
    .length(5)
    .describe(
      '5 most relevant tags selected from the tag frequency data that exist in the TAGS array.',
    ),
  additionalTags: z
    .array(z.string())
    .max(3)
    .describe(
      '0-3 unique additional tags that would be valuable additions to the TAGS list. These should be specific, meaningful, and not too generic (avoid terms like "Gradient", "Color", etc.).',
    ),
});

export const analyzeTagFrequency = internalAction({
  args: {
    collectionId: v.id('collections'),
    tagFrequency: TagAnalysis.withoutSystemFields.tagFrequency, // Record<string, number>
  },
  handler: async (ctx, { collectionId, tagFrequency }) => {
    const collection = await ctx.runQuery(api.collections.getCollectionById, {
      id: collectionId,
    });

    if (!collection) {
      console.log(`Collection ${collectionId} not found, skipping...`);
      return null;
    }

    const STEPS = 5 as const;
    const { coeffs, globals } = deserializeCoeffs(collection.seed);
    const appliedCoeffs = applyGlobals(coeffs, globals);

    const gradientColors = cosineGradient(STEPS, appliedCoeffs);
    const colorFormats = gradientColors.map((color) => colorToAllFormats(color));

    // Initialize WebAssembly for resvg
    await initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'));

    const svgString = getCollectionStyleSVG(
      'linearSwatches',
      gradientColors,
      90,
      undefined,
      undefined,
      800,
      200,
    );

    // Convert SVG to PNG using resvg-wasm
    const resvg = new Resvg(svgString, {
      background: 'transparent',
      fitTo: {
        mode: 'width',
        value: 800,
      },
      font: {
        loadSystemFonts: true,
      },
    });

    // Render the PNG
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    const prompt = getTagAnalysisPrompt(tagFrequency, colorFormats);
    const temperature = 0.5; // Lower temperature for more consistent tag selection
    // const model = 'gemini-2.5-pro-preview-05-06' as const;
    const model = 'gemini-2.5-flash-preview-05-20' as const;

    const startTime = Date.now();

    // Call Gemini with structured output and the PNG image
    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: pngBuffer,
            },
          ],
        },
      ],
      schema: TagGenerationSchema,
      temperature: temperature,
    });

    // Store the analysis in TagAnalysis table
    await ctx.runMutation(internal.tags.insertTagAnalysis, {
      collectionId,
      tagFrequency,
      existingTags: result.object.existingTags,
      additionalTags: result.object.additionalTags,
      model,
      meta: {
        temperature,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        duration: Date.now() - startTime,
      },
    });

    // Create TaggedCollections records for the selected existing tags in a single batch
    // to avoid OCC conflicts when running parallel mutations
    await ctx.runMutation(internal.tags.insertTaggedCollections, {
      tags: result.object.existingTags,
      collectionId,
    });

    return {
      existingTags: result.object.existingTags,
      additionalTags: result.object.additionalTags,
    };
  },
});

export const insertTaggedCollections = internalMutation({
  args: {
    tags: v.array(v.string()),
    collectionId: v.id('collections'),
  },
  handler: async (ctx, { tags, collectionId }) => {
    // Process each tag sequentially to avoid OCC conflicts
    for (const tag of tags) {
      // Check if this tag-collection combination already exists
      const existing = await ctx.db
        .query('tagged_collections')
        .withIndex('collectionId', (q) => q.eq('collectionId', collectionId))
        .filter((q) => q.eq(q.field('tag'), tag))
        .first();

      // Only insert if it doesn't exist
      if (!existing) {
        await ctx.db.insert('tagged_collections', {
          tag,
          collectionId,
        });
      }
    }
  },
});

export const insertTaggedCollection = internalMutation({
  args: TaggedCollections.withoutSystemFields,
  handler: async (ctx, args) => {
    // Check if this tag-collection combination already exists
    const existing = await ctx.db
      .query('tagged_collections')
      .withIndex('collectionId', (q) => q.eq('collectionId', args.collectionId))
      .filter((q) => q.eq(q.field('tag'), args.tag))
      .first();

    if (!existing) {
      await ctx.db.insert('tagged_collections', args);
    }
  },
});

export const insertTagAnalysis = internalMutation({
  args: TagAnalysis.withoutSystemFields,
  handler: async (ctx, args) => {
    await ctx.db.insert('tag_analysis', args);
  },
});

export const generateTags = internalAction({
  args: { startIndexKey: v.optional(v.any()) },
  handler: async (ctx, { startIndexKey }) => {
    // Fetch a batch of items
    const { page, indexKeys, hasMore } = await ctx.runQuery(internal.analysis.common.batchOfItems, {
      startIndexKey,
    });

    // Process all items in the page in parallel
    const tagCounts = await Promise.all(
      page.map(async (item) => {
        // Query all CollectionsAnalysis records for this collection
        const analysisRecords = await ctx.runQuery(internal.analysis.common.getCollectionAnalysis, {
          collectionId: item._id,
        });

        // Count tag occurrences from existingTags
        const tagFrequency: Record<string, number> = {};

        // Process each analysis record
        analysisRecords.forEach((record) => {
          // Process existingTags
          if (record.existingTags && record.existingTags.length > 0) {
            record.existingTags.forEach((tag) => {
              tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
          }

          // Process additionalTags
          if (record.additionalTags && record.additionalTags.length > 0) {
            record.additionalTags.forEach((tag) => {
              tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
          }
        });

        // Sort tags by frequency (most common to least common)
        const sortedTagFrequency: Record<string, number> = {};

        // Create array of [tag, count] pairs and sort by count in descending order
        const sortedEntries = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1]);

        // Rebuild object with sorted entries
        sortedEntries.forEach(([tag, count]) => {
          sortedTagFrequency[tag] = count;
        });

        return {
          collectionId: item._id,
          tagFrequency: sortedTagFrequency,
        };
      }),
    );

    // Process each collection's tag analysis
    const results = await Promise.all(
      tagCounts.map(async ({ collectionId, tagFrequency }) => {
        // Skip if no tags were found in the analysis
        if (Object.keys(tagFrequency).length === 0) {
          console.log(`No tags found for collection ${collectionId}, skipping...`);
          return null;
        }

        // Analyze the tag frequency and generate final tags
        const analysis = await ctx.runAction(internal.tags.analyzeTagFrequency, {
          collectionId,
          tagFrequency,
        });

        return {
          collectionId,
          analysis,
        };
      }),
    );

    // Filter out null results
    const successfulResults = results.filter((result) => result !== null);

    console.log(`Processed ${successfulResults.length} collections in this batch`);

    // If there are more items, schedule the next batch
    if (hasMore) {
      const nextStartIndexKey = indexKeys[indexKeys.length - 1];
      await ctx.scheduler.runAfter(5000, internal.tags.generateTags, {
        startIndexKey: nextStartIndexKey,
      });
    }
  },
});

const getTagAnalysisPrompt = (
  tagFrequency: Record<string, number>,
  colorFormats: ColorFormats[],
) => {
  const availableTagsList = TAGS.join(', ');
  const tagFrequencyEntries = Object.entries(tagFrequency)
    .map(([tag, count]) => `${tag}: ${count}`)
    .join('\n');

  return `You are an expert color theorist and designer analyzing tag frequency data for a color palette. Based on previous AI analysis of this palette, you need to select the most relevant tags and suggest valuable additions.

CONTEXT:
- Multiple AI models have analyzed this color palette and suggested tags
- The tag frequency data shows how often each tag was suggested across different analyses
- You have access to the original color data and visual representation
- Your task is to distill this into the 5 most relevant existing tags plus 0-3 valuable new tags

ORIGINAL COLOR ANALYSIS CONTEXT:
${getColorAnalysisPrompt(colorFormats)}

TAG FREQUENCY DATA (tag: occurrence_count):
${tagFrequencyEntries}

AVAILABLE TAGS TO CHOOSE FROM:
${availableTagsList}

TASK REQUIREMENTS:

1. EXISTING TAGS (exactly 5 required):
Select exactly 5 tags from the predefined TAGS list that:
- Appear in the tag frequency data (prioritize higher frequency tags when appropriate)
- Best represent the core characteristics of this color palette
- Provide the most descriptive and useful categorization
- Cover different aspects: color theory, mood, temperature, style, etc.

Consider both frequency AND relevance - a tag that appears less frequently might still be more descriptive than a more common but generic tag.

2. ADDITIONAL TAGS (0-3 optional):
Suggest 0-3 new tags that:
- Are NOT already in the predefined TAGS list
- Would be valuable additions to the overall tag vocabulary
- Are specific and meaningful (avoid generic terms like "Gradient", "Palette", "Color")
- Capture unique aspects of color palettes that aren't well represented in the current tag set
- Are single words or short compound terms
- Would be useful for categorizing other color palettes, not just this one

Focus on quality over quantity - only suggest additional tags if they truly add value to the existing tag system.`;
};
