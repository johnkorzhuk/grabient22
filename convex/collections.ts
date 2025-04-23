import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import seedData from '../seed.json';
import * as vb from 'valibot';
import {
  collectionSchema,
  componentSchema,
  DEFAULT_ANGLE,
  DEFAULT_GLOBALS,
  DEFAULT_STEPS,
  DEFAULT_STYLE,
} from '../src/validators';
import { deserializeCoeffs, serializeCoeffs } from '../src/lib/serialization';
import type { CosineCoeffs } from '../src/types';

import schema, { angleValidator, stepsValidator, styleValidator } from './schema';

export const list = query({
  handler: async (ctx) => {
    const collections = await ctx.db
      .query('collections')
      .take(100)
      .then((collections) => {
        return collections.map(({ _creationTime, ...collection }) => ({
          ...collection,
          coeffs: collection.coeffs as CosineCoeffs,
          globals: DEFAULT_GLOBALS,
        }));
      });

    return collections.map((collection) => ({
      ...collection,
      seed: serializeCoeffs(collection.coeffs, collection.globals),
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

export const checkUserLikedSeed = query({
  args: {
    // TODO: this and LikeButton needs updating
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
      .unique();

    return like !== null;
  },
});

export const getAllLikedSeedsByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query('likes')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .collect();

    return likes;
  },
});

export const toggleLikeSeed = mutation({
  args: {
    userId: v.string(),
    seed: v.string(),
    steps: v.optional(stepsValidator),
    style: v.optional(styleValidator),
    angle: v.optional(angleValidator),
  },
  handler: async (ctx, args) => {
    // Validate the seed
    deserializeCoeffs(args.seed);
    // Check if the user has already liked this seed
    const existingLike = await ctx.db
      .query('likes')
      .withIndex('byUserIdAndSeed', (q) => q.eq('userId', args.userId).eq('seed', args.seed))
      .unique();

    // If the user has already liked this seed, delete the like (toggle off)
    if (existingLike !== null) {
      await ctx.db.delete(existingLike._id);
      return { success: true, deleted: true };
    }

    const steps = args.steps || DEFAULT_STEPS;
    const style = args.style || DEFAULT_STYLE;
    const angle = args.angle || DEFAULT_ANGLE;

    // Create a new like
    const likeId = await ctx.db.insert('likes', {
      userId: args.userId,
      seed: args.seed,
      steps,
      style,
      angle,
    });

    return { success: true, likeId };
  },
});
