import { mutation } from './_generated/server';
import { v } from 'convex/values';
import type { CollectionPreset } from '../src/types';

/**
 * Seed the collections table with CosGradientPresets data.
 * This function will add all the gradient presets from seedData.ts to the collections table.
 */
// export const seedCollections = mutation({
//   args: {},
//   returns: v.number(),
//   handler: async (ctx) => {
//     let count = 0;

//     // Iterate through all gradient presets and add them to the collections table
//     for (const [key, preset] of Object.entries(cosGradientsPresets)) {
//       await ctx.db.insert('collections', {
//         coeffs: preset.coeffs,
//         numStops: preset.numStops,
//         globals: preset.globals,
//       });
//       count++;
//     }

//     console.log(`Successfully seeded ${count} gradient presets to the collections table.`);
//     return count;
//   },
// });
