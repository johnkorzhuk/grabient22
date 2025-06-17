import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { TAGS, TAG_DESCRIPTIONS } from '../../tags';
import { internal } from '../_generated/api';

const getPrompt = (tag: string, description: string) => {
  return `Generate 10 distinct color palettes for the theme: "${tag}"

    Theme description: ${description}

    For each palette, create 4-7 colors that work harmoniously together. Each color should be provided as a hex color code (e.g., #FF5733).
    
    Consider the "${tag}" theme: "${description}"
    
    Create palettes that:
    1. Reflect the mood and aesthetic of this theme
    2. Show variety within the theme (different interpretations)
    3. Include appropriate lightness variations (dark, medium, light tones)
    4. Use appropriate saturation levels for the theme
    5. Choose colors that represent the theme well
    6. Each palette should have 4-7 colors
    7. Palettes should be distinct from each other while staying thematic
    
    REQUIRED FORMAT - Return an array of 10 palette objects, each containing an array of hex color strings:
    [
      {
        "name": "Descriptive palette name",
        "colors": ["#8B4513", "#CD853F", "#F4A460", "#DEB887"]
      },
      {
        "name": "Another palette name", 
        "colors": ["#2E8B57", "#3CB371", "#98FB98", "#F0FFF0", "#006400"]
      }
    ]
    
    Generate 10 palettes for: ${tag}`;
};

const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code like #FF5733');

const PaletteSchema = z.object({
  name: z.string().describe('Descriptive name for this palette'),
  colors: z.array(HexColorSchema).min(3).max(7).describe('4-7 hex color codes in this palette'),
});

const PalettesArraySchema = z.array(PaletteSchema).length(10).describe('Exactly 10 color palettes');

type PalettesArray = z.infer<typeof PalettesArraySchema>;

// Define the return type for generatePalettesWithGemini
type PaletteGenerationResult = {
  palettes: PalettesArray;
  model: string;
  meta: {
    temperature: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    duration: number;
  };
};

// Define result types for the batch processing
type SuccessfulResult = {
  tag: string;
  success: true;
  data: PaletteGenerationResult;
};

type FailedResult = {
  tag: string;
  success: false;
  error: string;
};

type ProcessingResult = SuccessfulResult | FailedResult;

export const generatePalettesWithGemini = internalAction({
  args: {
    tag: v.string(),
    description: v.string(),
  },
  handler: async (_, { tag, description }): Promise<PaletteGenerationResult> => {
    const prompt = getPrompt(tag, description);
    const temperature = 0.7;
    const model = 'gemini-2.5-flash-preview-04-17' as const;
    const startTime = Date.now();

    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      schema: PalettesArraySchema,
      temperature,
    });

    return {
      palettes: result.object,
      model,
      meta: {
        temperature,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        duration: Date.now() - startTime,
      },
    };
  },
});

/**
 * Processes all tags in parallel chunks of 5, generating palettes for each tag
 * Returns results grouped by successful generations and any errors encountered
 */
export const generateAllPalettes = internalAction({
  args: {},
  handler: async (ctx) => {
    const chunkSize = 5; // Reduced from 10 since each request will be larger
    const chunks: string[][] = [];

    // Split TAGS into chunks of 5
    for (let i = 0; i < TAGS.length; i += chunkSize) {
      chunks.push(TAGS.slice(i, i + chunkSize));
    }

    console.log(`Processing ${TAGS.length} tags in ${chunks.length} chunks of ${chunkSize}`);

    const results: ProcessingResult[] = [];

    // Process each chunk in parallel
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];

      console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} tags`);

      // Process all tags in this chunk in parallel
      const chunkPromises = chunk.map(async (tag): Promise<ProcessingResult> => {
        try {
          const description = TAG_DESCRIPTIONS[tag as keyof typeof TAG_DESCRIPTIONS];
          const result = await ctx.runAction(
            internal.generate.palettes.generatePalettesWithGemini,
            {
              tag,
              description,
            },
          );

          console.log(`✓ Generated 10 palettes for tag: ${tag}`);

          return {
            tag,
            success: true,
            data: result,
          } satisfies SuccessfulResult;
        } catch (error) {
          console.error(`✗ Failed to generate palettes for tag: ${tag}`, error);

          return {
            tag,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          } satisfies FailedResult;
        }
      });

      // Wait for all tags in this chunk to complete
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Log chunk completion
      const successCount = chunkResults.filter((r) => r.success).length;
      const errorCount = chunkResults.filter((r) => !r.success).length;
      console.log(
        `Chunk ${chunkIndex + 1} completed: ${successCount} successful, ${errorCount} errors`,
      );

      // Add 3 second delay after each chunk (except the last one) - longer delay due to larger requests
      if (chunkIndex < chunks.length - 1) {
        console.log('Waiting 3 seconds before next chunk...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Calculate final statistics with proper type guards
    const successful = results.filter((r): r is SuccessfulResult => r.success);
    const failed = results.filter((r): r is FailedResult => !r.success);

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total tags processed: ${results.length}`);
    console.log(`Successful generations: ${successful.length}`);
    console.log(`Failed generations: ${failed.length}`);
    console.log(`Total palettes generated: ${successful.length * 10}`);

    if (failed.length > 0) {
      console.log(`Failed tags: ${failed.map((f) => f.tag).join(', ')}`);
    }

    return {
      totalProcessed: results.length,
      successful: successful.length,
      failed: failed.length,
      totalPalettes: successful.length * 10,
      results: results,
      successfulTags: successful.map((r) => r.tag),
      failedTags: failed.map((r) => ({ tag: r.tag, error: r.error })),
      // Include the full successful results for persistence
      palettes: successful.map((r) => ({
        tag: r.tag,
        ...r.data,
      })),
    };
  },
});
