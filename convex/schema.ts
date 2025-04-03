import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';
import { z } from 'zod';
import { zodToConvex } from 'convex-helpers/server/zod';
import { COLLECTION_STYLES } from '../src/stores/ui';

const numberTuple4Schema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .describe('Represents a 4-component numerical tuple (e.g., RGBA or coefficient parameters).');

const gradientCoeffsSchema = z.tuple([
  numberTuple4Schema.describe("Parameter 'a': Bias/Exposure vector."),
  numberTuple4Schema.describe("Parameter 'b': Amplitude/Contrast vector."),
  numberTuple4Schema.describe("Parameter 'c': Frequency vector."),
  numberTuple4Schema.describe("Parameter 'd': Phase vector."),
]);

const styleSchema = z.enum(COLLECTION_STYLES);

export const collectionSchema = z.object({
  coeffs: gradientCoeffsSchema.describe(
    'Defines the structure for the four coefficient vectors [a, b, c, d] of the cosine palette formula.',
  ),
  globals: numberTuple4Schema.describe('Global modifier parameters [a, b, c, d].'),
  style: styleSchema.describe('The type of gradient collection to generate.'),
  steps: z.number().describe('Number of color stops generated.'),
});

// Define the Collections table with individual field validators
export const Collections = Table('collections', {
  coeffs: zodToConvex(gradientCoeffsSchema),
  globals: zodToConvex(numberTuple4Schema),
  steps: v.number(),
  style: zodToConvex(styleSchema),
});

export default defineSchema({
  collections: Collections.table,
});
