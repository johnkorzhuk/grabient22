import { z } from 'zod';
import { TAG_DESCRIPTIONS, TAGS } from '../../tags';
import type { ColorFormats } from '../../src/lib/colorUtils';
import { v } from 'convex/values';
import { getPage, IndexKey } from 'convex-helpers/server/pagination';
import schema, { CollectionsAnalysis } from '../schema';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';

export const insertCollectionsAnalysis = internalMutation({
  args: CollectionsAnalysis.withoutSystemFields,
  handler: async (ctx, args) => {
    await ctx.db.insert('collections_analysis', args);
  },
});

export const batchOfItems = internalQuery({
  args: { startIndexKey: v.optional(v.any()) },
  handler: (ctx, { startIndexKey }) => {
    return getPage(ctx, {
      table: 'collections',
      index: 'by_creation_time',
      schema,
      startIndexKey: startIndexKey as IndexKey | undefined,
      targetMaxRows: 10,
    });
  },
});

export const AnalysisSchema = z.object({
  // 5 tags that must exist in the TAGS array
  existingTags: z
    .array(z.enum(TAGS as readonly [string, ...string[]]))
    .length(5)
    .describe('5 tags that must exist in the TAGS array.'),
  additionalTags: z
    .array(z.string())
    .max(3)
    .describe(
      '0-3 additional tags that might not exist in the predefined list. Terms should be single words and exclude terms that are too generic e.g. Gradient.',
    ),
});

export const getColorAnalysisPrompt = (colorFormats: ColorFormats[]) => {
  const availableTagsList = TAGS.join(', ');

  return `You are an expert color theorist and designer analyzing color palettes. I need you to analyze the provided color palette and generate structured data.
  
  CONTEXT:
  - You have access to colors in multiple formats: HEX, RGB, HSL, and LCH
  - The palette contains ${colorFormats.length} colors
  - A PNG image representation has been provided showing the color swatches
  
  COLOR DATA:
  ${colorFormats
    .map(
      (formats, index) =>
        `Color ${index + 1}:
   - HEX: ${formats.hex}
   - RGB: ${formats.rgb}  
   - HSL: ${formats.hsl}
   - LCH: ${formats.lch}`,
    )
    .join('\n')}
  
  TAG DESCRIPTIONS:
  ${Object.entries(TAG_DESCRIPTIONS)
    .map(([tag, description]) => ` - ${tag}: ${description}`)
    .join('\n')}
  
  TASK REQUIREMENTS:
  
  1. EXISTING TAGS (exactly ${colorFormats.length} required):
  Select exactly ${colorFormats.length} tags from this predefined list that best describe this palette:
  ${availableTagsList}
  
  Your selection should include the most relevant tags that capture:
  - Emotional mood and psychological associations
  - Seasonal associations
  - Style categories
  - Use case scenarios
  
  2. ADDITIONAL TAGS (0-3 optional):
  Provide 0-3 additional descriptive tags that might not exist in the predefined list but still accurately describe unique aspects of this palette that aren't captured by the existing tags.
  `;
};

export const getCollectionAnalysis = internalQuery({
  args: { collectionId: v.id('collections') },
  handler: async (ctx, { collectionId }) => {
    // Query all analysis records for this collection
    return await ctx.db
      .query('collections_analysis')
      .withIndex('collectionId', (q) => q.eq('collectionId', collectionId))
      .collect();
  },
});

export const getTagAnalysisPrompt = (
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
  - Your task is to distill this into the most relevant existing tags plus 0-3 valuable new tags
  
  ORIGINAL COLOR ANALYSIS CONTEXT:
  ${getColorAnalysisPrompt(colorFormats)}
  
  TAG FREQUENCY DATA (tag: occurrence_count):
  ${tagFrequencyEntries}
  
  AVAILABLE TAGS TO CHOOSE FROM:
  ${availableTagsList}
  
  TASK REQUIREMENTS:
  
  1. EXISTING TAGS (required):
  Select tags from the predefined TAGS list that:
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

export const TagGenerationSchema = z.object({
  // 5 tags selected from the tagFrequency that also exist in TAGS array
  existingTags: z
    .array(z.enum(TAGS as readonly [string, ...string[]]))
    .describe(
      'The most relevant tags selected from the tag frequency data that exist in the TAGS array.',
    ),
  additionalTags: z
    .array(z.string())
    .max(3)
    .describe(
      '0-3 unique additional tags that would be valuable additions to the TAGS list. These should be specific, meaningful, and not too generic (avoid terms like "Gradient", "Color", etc.).',
    ),
});
