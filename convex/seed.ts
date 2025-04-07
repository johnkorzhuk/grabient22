import { internalMutation } from './_generated/server';
import { v as convexV } from 'convex/values';
import seedData from '../seed.json';
import * as v from 'valibot';
import { collectionSchema, componentSchema } from '../src/validators';

export const seed = internalMutation({
  args: {},
  returns: convexV.null(),
  handler: async (ctx) => {
    for (const collection of seedData) {
      try {
        const transformedCoeffs = collection.coeffs.map((vec) => [
          ...vec.slice(0, 3).map((component) => v.parse(componentSchema, component)),
          1,
        ]);

        const validatedCollection = v.parse(collectionSchema, {
          ...collection,
          coeffs: transformedCoeffs,
        });

        await ctx.db.insert('collections', validatedCollection);
      } catch (error) {
        console.error(`Failed to validate collection:`, error);
        console.error('Problematic collection:', collection);
      }
    }

    return null;
  },
});
