import { v } from 'convex/values';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

import { getCollectionStyleSVG } from '../../src/lib/getCollectionStyleSVG';
// Using the WebAssembly version for Convex environment
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { api, internal } from '../_generated/api';
import { internalAction, internalMutation } from '../_generated/server';
import { colorToAllFormats } from '../../src/lib/colorUtils';
import { deserializeCoeffs } from '../../src/lib/serialization';
import { applyGlobals, cosineGradient } from '../../src/lib/cosineGradient';
import {
  AnalysisSchema,
  getColorAnalysisPrompt,
  getTagAnalysisPrompt,
  TagGenerationSchema,
} from './common';
import { CollectionsAnalysis, TagAnalysis } from '../schema';

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
        ctx.runAction(internal.analysis.openai.analyzeColorsWithOpenAI, { seed: item.seed }),
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
      await ctx.scheduler.runAfter(15000, internal.analysis.openai.processAllItems, {
        startIndexKey: nextStartIndexKey,
      });
    }
  },
});

export const analyzeColorsWithOpenAI = internalAction({
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
    const temperature = 0.6;
    const model = 'gpt-4o-mini' as const; // Using GPT-4o which has vision capabilities

    const startTime = Date.now();

    // Call OpenAI with structured output and the PNG image
    const result = await generateObject({
      model: openai(model, {
        structuredOutputs: true, // Enable structured outputs for strict schema adherence
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: pngBuffer,
              providerOptions: {
                openai: { imageDetail: 'low' },
              },
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
    const temperature = 0.6; // Lower temperature for more consistent tag selection
    // const model = 'gemini-2.5-pro-preview-05-06' as const;
    const model = 'gpt-4o-mini' as const;

    const startTime = Date.now();

    // Call Gemini with structured output and the PNG image
    const result = await generateObject({
      model: openai(model, {
        structuredOutputs: true, // Enable structured outputs for strict schema adherence
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: pngBuffer,
              providerOptions: {
                openai: { imageDetail: 'low' },
              },
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
