import { internalMutation } from './_generated/server';
import { v as convexV } from 'convex/values';
import seedData from '../seed.json';
import * as v from 'valibot';
import { collectionSchema, componentSchema } from '../src/validators';

export const seed = internalMutation({
  args: {},
  returns: convexV.null(),
  handler: async (ctx) => {
    // Process and insert each collection from seed data
    for (const collection of seedData) {
      try {
        // Transform coefficients - just ensure precision and alpha=1
        const transformedCoeffs = collection.coeffs.map((vec) => [
          // First 3 components - just ensure precision
          ...vec.slice(0, 3).map((component) => v.parse(componentSchema, component)),
          // Always set alpha to 1
          1,
        ]);

        // Validate the entire collection at once
        const validatedCollection = v.parse(collectionSchema, {
          ...collection,
          coeffs: transformedCoeffs,
        });

        // Insert the validated collection
        await ctx.db.insert('collections', validatedCollection);
      } catch (error) {
        // Log validation errors but continue processing other collections
        console.error(`Failed to validate collection:`, error);
        console.error('Problematic collection:', collection);
      }
    }

    return null;
  },
});
