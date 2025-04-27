import { query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import seedData from '../seed.json';
import * as vb from 'valibot';
import {
  collectionSchema,
  componentSchema,
  DEFAULT_GLOBALS,
  DEFAULT_STEPS,
  DEFAULT_STYLE,
  DEFAULT_ANGLE,
} from '../src/validators';
import { deserializeCoeffs, serializeCoeffs } from '../src/lib/serialization';
import type { CosineCoeffs } from '../src/types';
import { applyGlobals } from '../src/lib/cosineGradient';
import { publicLikesBySeed } from './likes';

export const updatePopularCollections = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Set a default limit of 1000 if not provided
    const limit = args.limit ?? 1000;

    // Instead of using iterNamespaces which might return undefined values,
    // query likes table directly to get popular seeds
    const allLikes = await ctx.db
      .query('likes')
      .withIndex('isPublic', (q) => q.eq('isPublic', true))
      .collect();

    // Extract unique seeds
    const uniqueSeeds = [...new Set(allLikes.map((like) => like.seed))];

    // Get count for each seed
    const seedCounts = await Promise.all(
      uniqueSeeds.map(async (seed) => {
        if (!seed) return null; // Skip any undefined/null seeds

        // Count likes for this seed directly from the database
        const likesForSeed = allLikes.filter((like) => like.seed === seed);
        return { seed, count: likesForSeed.length };
      }),
    );

    // Filter out null entries and sort by count
    const topSeeds = seedCounts
      .filter((item) => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Clear the existing popular collections table
    const existingPopular = await ctx.db.query('popular').collect();
    await Promise.all(
      existingPopular.map(async (doc) => {
        await ctx.db.delete(doc._id);
      }),
    );

    // Fetch and insert the collection details for each top seed in parallel
    await Promise.all(
      topSeeds.map(async ({ seed, count }) => {
        // Get the original collection data
        const collection = await ctx.db
          .query('likes')
          .withIndex('seed', (q) => q.eq('seed', seed))
          .first();

        if (collection) {
          try {
            const { coeffs, globals } = deserializeCoeffs(collection.seed);
            const appliedCoeffs = applyGlobals(coeffs, globals);

            await ctx.db.insert('popular', {
              seed,
              likes: count,
              coeffs: appliedCoeffs,
              steps: collection.steps,
              style: collection.style,
              angle: collection.angle,
            });
          } catch (error) {
            console.error(`Failed to deserialize seed ${seed}:`, error);
            // Skip this seed if deserialization fails
          }
        } else {
          // If collection not found, try to deserialize the coefficients from the seed
          try {
            const { coeffs, globals } = deserializeCoeffs(seed);
            const appliedCoeffs = applyGlobals(coeffs, globals);

            await ctx.db.insert('popular', {
              seed,
              likes: count,
              coeffs: appliedCoeffs,
              steps: DEFAULT_STEPS,
              style: DEFAULT_STYLE,
              angle: DEFAULT_ANGLE,
            });
          } catch (error) {
            console.error(`Failed to deserialize seed ${seed}:`, error);
            // Skip this seed if deserialization fails
          }
        }

        // if (collection) {
        //   // Insert into the popular collections table
        //   await ctx.db.insert('popular', {
        //     seed: collection.seed,
        //     likes: count,
        //     coeffs: collection.coeffs,
        //     steps: collection.steps,
        //     style: collection.style,
        //     angle: collection.angle,
        //   });
        // } else {
        //   // If collection not found, try to deserialize the coefficients from the seed
        //   try {
        //     const { coeffs, globals } = deserializeCoeffs(seed);
        //     const appliedCoeffs = applyGlobals(coeffs, globals);

        //     await ctx.db.insert('popular', {
        //       seed,
        //       likes: count,
        //       coeffs: appliedCoeffs,
        //       steps: DEFAULT_STEPS,
        //       style: DEFAULT_STYLE,
        //       angle: DEFAULT_ANGLE,
        //     });
        //   } catch (error) {
        //     console.error(`Failed to deserialize seed ${seed}:`, error);
        //     // Skip this seed if deserialization fails
        //   }
        // }
      }),
    );

    return null;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('collections')
      .take(100)
      .then((collections) => {
        return collections.map(({ _creationTime, ...collection }) => ({
          ...collection,
          coeffs: collection.coeffs as CosineCoeffs,
          globals: DEFAULT_GLOBALS,
        }));
      });
  },
});

export const listPopular = query({
  handler: async (ctx) => {
    const collections = await ctx.db.query('popular').withIndex('likes').order('desc').take(96);

    return collections.map(({ _creationTime, ...collection }) => ({
      ...collection,
      coeffs: collection.coeffs as CosineCoeffs,
      globals: DEFAULT_GLOBALS,
    }));
  },
});

export const seed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const collections = await ctx.db.query('collections').collect();
    if (collections.length > 0) {
      return;
    }
    for (const collection of seedData) {
      try {
        const transformedCoeffs = collection.coeffs.map((vec) => [
          ...vec.slice(0, 3).map((component) => vb.parse(componentSchema, component)),
          1,
        ]);

        const validatedCollection = vb.parse(collectionSchema, {
          ...collection,
          coeffs: transformedCoeffs,
          globals: DEFAULT_GLOBALS,
        });

        const { globals, ...collectionWithoutGlobals } = validatedCollection;
        await ctx.db.insert('collections', {
          ...collectionWithoutGlobals,
          seed: serializeCoeffs(validatedCollection.coeffs, DEFAULT_GLOBALS),
        });
      } catch (error) {
        console.error(`Failed to validate collection:`, error);
        console.error('Problematic collection:', collection);
      }
    }

    return;
  },
});

// these are causing a convex deploy error if they dont exists in collections
// even though api.collections.checkUserLikedSeeds/checkUserLikedSeed isn't referenced anywhere.
// TODO: figure out why
export const checkUserLikedSeeds = query({
  args: {
    userId: v.optional(v.union(v.string(), v.null())),
    seeds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId || args.seeds.length === 0) {
      return {};
    }

    const results = await Promise.all(
      args.seeds.map(async (seed) => {
        const like = await ctx.db
          .query('likes')
          .withIndex('byUserIdAndSeed', (q) => q.eq('userId', args.userId!).eq('seed', seed))
          .first();
        return [seed, like !== null];
      }),
    );

    return Object.fromEntries(results);
  },
});

export const checkUserLikedSeed = query({
  args: {
    // TODO: this and LikeButton needs updating. auth is isnt set up correctly
    userId: v.optional(v.union(v.string(), v.null())),
    seed: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return false;
    }

    const like = await ctx.db
      .query('likes')
      .withIndex('byUserIdAndSeed', (q) => q.eq('userId', args.userId!).eq('seed', args.seed))
      .first();

    return like !== null;
  },
});
