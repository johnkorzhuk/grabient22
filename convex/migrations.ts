import { Migrations } from '@convex-dev/migrations';
import { api, components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { publicLikesBySeed } from './likes';
import { Doc } from './_generated/dataModel';

export const migrations = new Migrations<DataModel>(components.migrations);

export const addIsPublic = migrations.define({
  table: 'likes',
  migrateOne: () => ({ public: undefined, isPublic: true }),
});

export const runAddPublic = migrations.runner(internal.migrations.addIsPublic);

export const backfillPublicLikess = migrations.define({
  table: 'likes',
  // Only process public likes
  customRange: (query) => query.withIndex('isPublic', (q) => q.eq('isPublic', true)),
  migrateOne: async (ctx, like) => {
    // Insert the like into the aggregate if it doesn't exist already
    await publicLikesBySeed.insertIfDoesNotExist(ctx, like);
  },
});

// Export a function to run from CLI
export const runBackfills = migrations.runner(internal.migrations.backfillPublicLikess);

// Migration to merge PopularCollections into Collections
export const mergePopularIntoCollections = migrations.define({
  table: 'popular',
  migrateOne: async (ctx, popularCollection) => {
    const { seed, likes, coeffs, steps, style, angle } = popularCollection;

    // Check if this collection already exists in the Collections table
    const existingCollection = await ctx.db
      .query('collections')
      .withIndex('seed', (q) => q.eq('seed', seed))
      .first();

    if (existingCollection) {
      // Update the existing collection with likes from popular collection
      await ctx.db.patch(existingCollection._id, { likes });
    } else {
      // Create a new collection with the popular collection data
      await ctx.db.insert('collections', {
        seed,
        likes,
        coeffs,
        steps,
        style,
        angle,
      });
    }
  },
});

// Migration to ensure all Collections have likes field (default to 0)
export const ensureCollectionsHaveLikes = migrations.define({
  table: 'collections',
  migrateOne: async (ctx, collection) => {
    if (collection.likes === undefined) {
      await ctx.db.patch(collection._id, { likes: 0 });
    }
  },
});

// Export runners for the new migrations
export const runMergePopular = migrations.runner(internal.migrations.mergePopularIntoCollections);
export const runEnsureLikes = migrations.runner(internal.migrations.ensureCollectionsHaveLikes);
