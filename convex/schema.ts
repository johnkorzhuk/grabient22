import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';
import { z } from 'zod';
import { zodToConvex } from 'convex-helpers/server/zod';
import { COLLECTION_STYLES } from '../src/stores/ui';

// Define the exact type for a 4-element number tuple
export const numberTuple4Schema = z
  .array(z.number())
  .length(4)
  .transform((arr): [number, number, number, number] => arr as [number, number, number, number])
  .describe('RGBA coefficient parameters.');

// Define the gradient coefficients schema
export const gradientCoeffsSchema = z
  .array(numberTuple4Schema)
  .length(4)
  .transform(
    (
      arr,
    ): [
      [number, number, number, number],
      [number, number, number, number],
      [number, number, number, number],
      [number, number, number, number],
    ] =>
      arr as [
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
      ],
  )
  .describe('The four coefficient vectors [a, b, c, d] of the cosine palette formula.');

export const styleSchema = z.enum(COLLECTION_STYLES);
export const stepsSchema = z.number().min(2).max(50);
export const angleSchema = z.number().min(0).max(360);

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
