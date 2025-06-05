import { query, internalMutation, mutation } from './_generated/server';
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
import { Collections } from './schema';
import { Doc, Id } from './_generated/dataModel';
import { paginationOptsValidator } from 'convex/server';

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
          .order('asc')
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
      }),
    );

    return null;
  },
});

export const updateCollectionLikes = internalMutation({
  returns: v.null(),
  handler: async (ctx) => {
    // Get all likes from the database
    const allLikes = await ctx.db.query('likes').collect();

    // Group likes by seed
    const likesBySeed = new Map();
    for (const like of allLikes) {
      if (!likesBySeed.has(like.seed)) {
        likesBySeed.set(like.seed, []);
      }
      likesBySeed.get(like.seed).push(like);
    }

    // Process each unique seed
    for (const [seed, likes] of likesBySeed.entries()) {
      // Count total likes for this seed (regardless of isPublic status)
      const totalLikes = likes.length;

      // Get public likes only
      const publicLikes = likes.filter((like: Doc<'likes'>) => like.isPublic);

      // Check if we already have this collection in the database
      const existingCollection = await ctx.db
        .query('collections')
        .withIndex('seed', (q) => q.eq('seed', seed))
        .first();

      if (existingCollection) {
        // Update the existing collection with the total likes count
        await ctx.db.patch(existingCollection._id, { likes: totalLikes });
      } else if (publicLikes.length > 0) {
        // Only create a new collection if there's at least one public like
        // Use the first public like as a reference for collection properties
        const referenceLike = publicLikes[0];

        try {
          const { coeffs, globals } = deserializeCoeffs(referenceLike.seed);
          const appliedCoeffs = applyGlobals(coeffs, globals);

          // Create a new collection entry
          await ctx.db.insert('collections', {
            seed,
            likes: totalLikes,
            coeffs: appliedCoeffs,
            steps: referenceLike.steps,
            style: referenceLike.style,
            angle: referenceLike.angle,
          });
        } catch (error) {
          console.error(`Failed to deserialize seed ${seed}:`, error);
          // Try with just the seed if the like's seed fails to deserialize
          try {
            const { coeffs, globals } = deserializeCoeffs(seed);
            const appliedCoeffs = applyGlobals(coeffs, globals);

            await ctx.db.insert('collections', {
              seed,
              likes: totalLikes,
              coeffs: appliedCoeffs,
              steps: referenceLike.steps || DEFAULT_STEPS,
              style: referenceLike.style || DEFAULT_STYLE,
              angle: referenceLike.angle || DEFAULT_ANGLE,
            });
          } catch (innerError) {
            console.error(`Failed to deserialize seed directly ${seed}:`, innerError);
            // Skip this seed if both deserialization attempts fail
          }
        }
      }
    }

    return null;
  },
});

export const getCollectionById = query({
  args: { id: v.id('collections') },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.id);

    if (!collection) return null;

    return {
      ...collection,
      coeffs: collection.coeffs as CosineCoeffs,
      globals: DEFAULT_GLOBALS,
    };
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('collections')
      .take(100)
      .then((collections) => {
        return collections.map((collection) => ({
          ...collection,
          coeffs: collection.coeffs as CosineCoeffs,
          globals: DEFAULT_GLOBALS,
        }));
      });
  },
});

export const listPopular = query({
  handler: async (ctx) => {
    const collections = await ctx.db.query('popular').withIndex('likes').order('desc').take(72);

    return collections.map((collection) => ({
      ...collection,
      coeffs: collection.coeffs as CosineCoeffs,
      globals: DEFAULT_GLOBALS,
    }));
  },
});

export const listPopularNew = query({
  handler: async (ctx) => {
    const collections = await ctx.db.query('collections').withIndex('likes').order('desc').take(72);

    return collections.map((collection) => ({
      ...collection,
      coeffs: collection.coeffs as CosineCoeffs,
      globals: DEFAULT_GLOBALS,
    }));
  },
});

export const listCollections = query({
  args: {
    tags: v.optional(v.array(v.string())),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('popular'), v.literal('new'), v.literal('old'))), // "popular", "new", "old"
  },
  handler: async (ctx, args) => {
    const pageSize = args.paginationOpts.numItems ?? 72;
    const offset = args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor, 10) : 0;
    const sort = args.sort ?? 'popular'; // default to "popular"

    // If no tags, use native Convex pagination with the requested sort
    if (!args.tags || args.tags.length === 0) {
      const query = ctx.db.query('collections');

      let paginationResult;

      if (sort === 'popular') {
        paginationResult = await query
          .withIndex('likes')
          .order('desc')
          .paginate(args.paginationOpts);
      } else if (sort === 'new') {
        paginationResult = await query.order('desc').paginate(args.paginationOpts);
      } else {
        // 'old' or any other value
        paginationResult = await query.order('asc').paginate(args.paginationOpts);
      }

      // Add globals field to each collection
      return {
        ...paginationResult,
        page: paginationResult.page.map((collection) => ({
          ...collection,
          coeffs: collection.coeffs as CosineCoeffs,
          globals: DEFAULT_GLOBALS,
        })),
      };
    }

    // Tags filtering (manual pagination)
    const taggedCollectionsArrays = await Promise.all(
      args.tags.map((tag) =>
        ctx.db
          .query('tagged_collections')
          .withIndex('tag', (q) => q.eq('tag', tag))
          .collect(),
      ),
    );

    const matchCount: Record<string, number> = {};
    const matchedTags: Record<string, string[]> = {};
    taggedCollectionsArrays.forEach((taggedCollections, tagIdx) => {
      const tag = args.tags![tagIdx];
      taggedCollections.forEach((item) => {
        matchCount[item.collectionId] = (matchCount[item.collectionId] || 0) + 1;
        if (!matchedTags[item.collectionId]) matchedTags[item.collectionId] = [];
        matchedTags[item.collectionId].push(tag);
      });
    });

    const collectionsWithNulls = await Promise.all(
      Object.keys(matchCount).map((id) => ctx.db.get(id as Id<'collections'>)),
    );
    const collections = collectionsWithNulls.filter((c): c is Doc<'collections'> => c !== null);

    // Sort: first by match count (desc), then by requested sort
    collections.sort((a, b) => {
      const matchDiff = (matchCount[b._id] ?? 0) - (matchCount[a._id] ?? 0);
      if (matchDiff !== 0) return matchDiff;
      if (sort === 'popular') {
        return (b.likes ?? 0) - (a.likes ?? 0);
      } else if (sort === 'new') {
        return (b._creationTime ?? 0) - (a._creationTime ?? 0);
      } else if (sort === 'old') {
        return (a._creationTime ?? 0) - (b._creationTime ?? 0);
      }
      return 0;
    });

    const page = collections.slice(offset, offset + pageSize);

    return {
      page: page.map((collection) => ({
        ...collection,
        coeffs: collection.coeffs as CosineCoeffs,
        globals: DEFAULT_GLOBALS,
        tagMatches: matchedTags[collection._id] ?? [],
      })),
      isDone: offset + pageSize >= collections.length,
      continueCursor: (offset + pageSize).toString(),
    };
  },
});

export const listNew = query({
  handler: async (ctx) => {
    // Fetch collections ordered by creation time (newest first)
    const collections = await ctx.db.query('collections').order('desc').take(72);

    return collections.map((collection) => ({
      ...collection,
      coeffs: collection.coeffs as CosineCoeffs,
      globals: DEFAULT_GLOBALS,
    }));
  },
});

export const listOld = query({
  handler: async (ctx) => {
    // Fetch collections ordered by creation time (oldest first)
    const collections = await ctx.db.query('collections').order('asc').take(72);

    return collections.map((collection) => ({
      ...collection,
      coeffs: collection.coeffs as CosineCoeffs,
      globals: DEFAULT_GLOBALS,
    }));
  },
});

// export const listPopularNew = query({
//   args: { paginationOpts: paginationOptsValidator },
//   handler: async (ctx, args) => {
//     const paginationResult = await ctx.db
//       .query('collections')
//       .withIndex('likes')
//       .order('desc')
//       .paginate(args.paginationOpts);

//     return {
//       ...paginationResult,
//       page: paginationResult.page.map((collection) => ({
//         ...collection,
//         coeffs: collection.coeffs as CosineCoeffs,
//         globals: DEFAULT_GLOBALS,
//       })),
//     };
//   },
// });

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
          likes: 0,
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

export const createCollection = mutation({
  args: Collections.withoutSystemFields,
  handler: async (ctx, args) => {
    // Create the collection
    const collectionId = await ctx.db.insert('collections', {
      coeffs: args.coeffs,
      steps: args.steps,
      style: args.style,
      angle: args.angle,
      seed: args.seed,
      likes: 0,
    });

    return collectionId;
  },
});
