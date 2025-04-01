import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';
import { z } from 'zod';
import { zodToConvex } from 'convex-helpers/server/zod';

/** Represents a 4-component numerical tuple (e.g., RGBA or coefficient parameters). */
const numberTuple4Schema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

/** Defines the structure for the four coefficient vectors [a, b, c, d] of the cosine palette formula. */
export const gradientCoeffsSchema = z.tuple([
  /** Parameter 'a': Bias/Exposure vector. */
  numberTuple4Schema,
  /** Parameter 'b': Amplitude/Contrast vector. */
  numberTuple4Schema,
  /** Parameter 'c': Frequency vector. */
  numberTuple4Schema,
  /** Parameter 'd': Phase vector. */
  numberTuple4Schema,
]);

export const collectionSchema = z.object({
  coeffs: gradientCoeffsSchema,
  /** Number of color stops to generate. */
  numStops: z.number(),
  /** Global modifier parameters [a, b, c, d]. */
  globals: numberTuple4Schema,
});

// Define the Collections table with individual field validators
export const Collections = Table('collections', {
  coeffs: zodToConvex(gradientCoeffsSchema),
  numStops: v.number(),
  globals: zodToConvex(numberTuple4Schema),
});

export default defineSchema({
  collections: Collections.table,
});
