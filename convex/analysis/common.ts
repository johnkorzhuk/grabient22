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
  - Color harmony relationships (complementary, analogous, triadic, etc.)
  - Emotional mood and psychological associations
  - Color temperature (warm/cool)
  - Saturation levels (vibrant/muted/pastel)
  - Contrast levels (high/low contrast)
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
