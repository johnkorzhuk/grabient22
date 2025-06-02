import { v } from 'convex/values';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

import { getCollectionStyleSVG } from '../../src/lib/getCollectionStyleSVG';
// Using the WebAssembly version for Convex environment
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { internal } from '../_generated/api';
import { internalAction, internalMutation } from '../_generated/server';
import { colorToAllFormats } from '../../src/lib/colorUtils';
import { deserializeCoeffs } from '../../src/lib/serialization';
import { applyGlobals, cosineGradient } from '../../src/lib/cosineGradient';
import { AnalysisSchema, getColorAnalysisPrompt } from './common';
import { CollectionsAnalysis } from '../schema';

export const processAllItems = internalAction({
  args: { startIndexKey: v.optional(v.any()) },
  handler: async (ctx, { startIndexKey }) => {
    // Fetch a batch of 30 items
    const { page, indexKeys, hasMore } = await ctx.runQuery(internal.analysis.common.batchOfItems, {
      startIndexKey,
    });

    // Analyze all items in parallel
    const results = await Promise.all(
      page.map((item) =>
        ctx.runAction(internal.analysis.gemini.analyzeColorsWithGemini, { seed: item.seed }),
      ),
    );

    // Insert all analyses in parallel
    await Promise.all(
      page.map((collection, i) => {
        const { existingTags, additionalTags, meta } = results[i];
        const { model, ...restMeta } = meta;

        return ctx.runMutation(internal.analysis.common.insertCollectionsAnalysis, {
          collectionId: collection._id,
          existingTags,
          additionalTags,
          model,
          meta: restMeta,
        });
      }),
    );

    // If there are more items, schedule the next batch
    if (hasMore) {
      const nextStartIndexKey = indexKeys[indexKeys.length - 1];
      await ctx.scheduler.runAfter(0, internal.analysis.gemini.processAllItems, {
        startIndexKey: nextStartIndexKey,
      });
    }
  },
});

export const analyzeColorsWithGemini = internalAction({
  args: {
    seed: v.string(),
  },
  handler: async (ctx, args) => {
    const STEPS = 5 as const;
    const { coeffs, globals } = deserializeCoeffs(args.seed);
    const processedCoeffs = applyGlobals(coeffs, globals);
    const gradientColors = cosineGradient(STEPS, processedCoeffs);

    // Convert colors to all formats
    const colorFormats = gradientColors.map((color) => colorToAllFormats(color));

    // Initialize WebAssembly for resvg
    await initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'));

    // Create SVG representation using your existing function
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

    // Prepare the comprehensive prompt
    const prompt = getColorAnalysisPrompt(colorFormats);
    const temperature = 0.5;
    const model = 'gemini-2.0-flash-lite' as const;

    const startTime = Date.now();

    // Call Gemini 2.5 Flash with structured output and the PNG image
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
      schema: AnalysisSchema,
      temperature: temperature, // Lower temperature for more consistent results
    });

    return {
      existingTags: result.object.existingTags,
      additionalTags: result.object.additionalTags,
      meta: {
        model,
        temperature,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        duration: Date.now() - startTime,
      },
    };
  },
});
