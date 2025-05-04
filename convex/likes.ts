import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '../src/validators';
import { deserializeCoeffs, serializeCoeffs } from '../src/lib/serialization';
import { angleValidator, stepsValidator, styleValidator } from './schema';
import { paginationOptsValidator } from 'convex/server';

import { TableAggregate } from '@convex-dev/aggregate';
import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';

export const publicLikesBySeed = new TableAggregate<{
  Namespace: string; // seed as namespace
  Key: number; // creation time for time-based queries
  DataModel: DataModel;
  TableName: 'likes';
}>(components.likesAggregate, {
  namespace: (doc) => doc.seed,
  sortKey: (doc) => doc._creationTime,
  sumValue: () => 1,
});

export const getPublicLikesCount = query({
  args: { seeds: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.seeds.length === 0) {
      return {};
    }

    const results = await Promise.all(
      args.seeds.map(async (seed) => {
        const likeCount = await publicLikesBySeed.count(ctx, {
          namespace: seed,
          bounds: {}, // Add empty bounds to count all items
        });
        return [seed, likeCount];
      }),
    );

    return Object.fromEntries(results);
  },
});

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
          .unique();
        return [seed, like !== null];
      }),
    );

    return Object.fromEntries(results);
  },
});

export const getAllLikedSeedsByUser = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('likes')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .order('desc') // Most recent first
      .paginate(args.paginationOpts);
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
    try {
      // Validate the seed
      deserializeCoeffs(args.seed);

      // Check if the user has already liked this seed
      const existingLike = await ctx.db
        .query('likes')
        .withIndex('byUserIdAndSeed', (q) => q.eq('userId', args.userId).eq('seed', args.seed))
        .unique();

      // If the user has already liked this seed, delete the like (toggle off)
      if (existingLike !== null) {
        try {
          // Delete from the aggregate before deleting from the database
          // Using deleteIfExists for better resilience in case of sync issues
          await publicLikesBySeed.deleteIfExists(ctx, existingLike);
        } catch (error) {
          console.error('Error removing like from aggregate:', error);
          // Continue with database deletion even if aggregate operation fails
        }

        // Delete the like from the database
        await ctx.db.delete(existingLike._id);
        return { success: true, deleted: true };
      }

      // Configure the new like with defaults if not provided
      const steps = args.steps || DEFAULT_STEPS;
      const style = args.style || DEFAULT_STYLE;
      const angle = args.angle || DEFAULT_ANGLE;
      const isPublic = true;

      // Create a new like
      const likeId = await ctx.db.insert('likes', {
        userId: args.userId,
        seed: args.seed,
        steps,
        style,
        angle,
        isPublic,
      });

      // Get the inserted document and add it to the aggregate
      const newLike = await ctx.db.get(likeId);
      if (newLike) {
        try {
          // Only add to the aggregate if it's marked as public
          if (newLike.isPublic) {
            // Using insertIfDoesNotExist for better resilience
            await publicLikesBySeed.insertIfDoesNotExist(ctx, newLike);
          }
        } catch (error) {
          console.error('Error adding like to aggregate:', error);
          // Like was still added to the database, so return success
        }
      }

      return { success: true, likeId };
    } catch (error) {
      console.error('Error in toggleLikeSeed:', error);
      throw new Error(
        `Failed to toggle like: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
      .unique();

    return like !== null;
  },
});
