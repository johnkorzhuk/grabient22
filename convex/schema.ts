import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';
import { z } from 'zod';
import { zodToConvex } from 'convex-helpers/server/zod';
import { COLLECTION_STYLES } from '../src/stores/ui';

const numberTuple4Schema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .describe('RGBA coefficient parameters.');

const gradientCoeffsSchema = z.tuple([
  numberTuple4Schema.describe("Parameter 'a': Bias/Exposure vector."),
  numberTuple4Schema.describe("Parameter 'b': Amplitude/Contrast vector."),
  numberTuple4Schema.describe("Parameter 'c': Frequency vector."),
  numberTuple4Schema.describe("Parameter 'd': Phase vector."),
]);

const styleSchema = z.enum(COLLECTION_STYLES);
const stepsSchema = z.number().min(2).max(50);
const angleSchema = z.number().min(0).max(360);

export const collectionSchema = z.object({
  coeffs: gradientCoeffsSchema.describe(
    'Defines the structure for the four coefficient vectors [a, b, c, d] of the cosine palette formula.',
  ),
  globals: numberTuple4Schema.describe('Global modifier parameters [a, b, c, d].'),
  style: styleSchema.describe('Style of gradient.'),
  steps: stepsSchema.describe('Number of color stops.'),
  angle: angleSchema.describe('Angle of gradient in degrees.'),
});

export const Collections = Table('collections', {
  coeffs: zodToConvex(gradientCoeffsSchema),
  globals: zodToConvex(numberTuple4Schema),
  steps: zodToConvex(stepsSchema),
  style: zodToConvex(styleSchema),
  angle: zodToConvex(angleSchema),
});

export default defineSchema({
  collections: Collections.table,
});
