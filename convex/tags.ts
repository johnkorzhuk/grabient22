import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
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

export const getTagAnalysisForCollection = internalQuery({
  args: { collectionId: v.id('collections') },
  handler: async (ctx, { collectionId }) => {
    return await ctx.db
      .query('tag_analysis')
      .withIndex('collectionId', (q: any) => q.eq('collectionId', collectionId))
      .collect();
  },
});

export const generateTags = internalAction({
  args: {
    startIndexKey: v.optional(v.any()),
    model: v.union(v.literal('gemini'), v.literal('openai')),
  },
  handler: async (ctx, { startIndexKey, model }) => {
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

        // Query existing TagAnalysis records for this collection
        const tagAnalysisRecords = await ctx.runQuery(internal.tags.getTagAnalysisForCollection, {
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

        // Include data from TagAnalysis records
        tagAnalysisRecords.forEach((record: {
          existingTags?: string[];
          additionalTags?: string[];
        }) => {
          // Include existingTags
          if (record.existingTags && record.existingTags.length > 0) {
            record.existingTags.forEach((tag: string) => {
              tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
          }

          // Include additionalTags
          if (record.additionalTags && record.additionalTags.length > 0) {
            record.additionalTags.forEach((tag: string) => {
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
        const analysis = await ctx.runAction(internal.analysis[model].analyzeTagFrequency, {
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
      await ctx.scheduler.runAfter(model === 'gemini' ? 5000 : 15000, internal.tags.generateTags, {
        startIndexKey: nextStartIndexKey,
        model,
      });
    }
  },
});
