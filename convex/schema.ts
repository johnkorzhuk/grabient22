import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';
import { z } from 'zod';
import { zodToConvex } from 'convex-helpers/server/zod';
import { COLLECTION_STYLES } from '../src/validators';

// Define the exact type for a 4-element number tuple
export const numberTuple4Schema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .describe('RGB components (any number) + alpha (always 1)');

// Define the gradient coefficients schema
export const gradientCoeffsSchema = z
  .tuple([numberTuple4Schema, numberTuple4Schema, numberTuple4Schema, numberTuple4Schema])
  .describe('Cosine gradient formula: color(t) = a + b * cos(2π * (c*t + d))');

export const styleSchema = z.enum(COLLECTION_STYLES);
export const stepsSchema = z.number().min(2).max(50);
export const angleSchema = z.number().min(0).max(360);

// Global modifier schemas with constraints
export const globalModifiersSchema = z
  .tuple([
    z.number().min(-1).max(1), // exposure [-1, 1]
    z.number().min(0).max(2), // contrast [0, 2]
    z.number().min(0).max(2), // frequency [0, 2]
    z.number().min(-Math.PI).max(Math.PI), // phase [-π, π]
  ])
  .describe('Global modifiers.');

export const collectionSchema = z.object({
  coeffs: gradientCoeffsSchema.describe(
    'Four coefficient vectors: offset (a), amplitude (b), frequency (c), phase (d)',
  ),
  globals: globalModifiersSchema,
  style: styleSchema.describe('Gradient rendering style (linear/angular, gradient/swatches)'),
  steps: stepsSchema.describe('Number of color stops (2-50)'),
  angle: angleSchema.describe('Gradient rotation in degrees (0-360)'),
});

export const Collections = Table('collections', {
  coeffs: zodToConvex(gradientCoeffsSchema),
  globals: zodToConvex(globalModifiersSchema),
  steps: zodToConvex(stepsSchema),
  style: zodToConvex(styleSchema),
  angle: zodToConvex(angleSchema),
});

export default defineSchema({
  collections: Collections.table,
});
