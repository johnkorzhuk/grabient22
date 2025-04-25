import { Migrations } from '@convex-dev/migrations';
import { api, components, internal } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';
import { publicLikesBySeed } from './likes.js';

export const migrations = new Migrations<DataModel>(components.migrations);

export const addIsPublic = migrations.define({
  table: 'likes',
  migrateOne: () => ({ public: undefined, isPublic: true }),
});

export const runAddPublic = migrations.runner(internal.migrations.addIsPublic);

export const backfillPublicLikes = migrations.define({
  table: 'likes',
  // Only process public likes
  customRange: (query) => query.withIndex('isPublic', (q) => q.eq('isPublic', true)),
  migrateOne: async (ctx, like) => {
    // Insert the like into the aggregate if it doesn't exist already
    await publicLikesBySeed.insertIfDoesNotExist(ctx, like);
  },
});

// Export a function to run from CLI
export const runBackfill = migrations.runner(internal.migrations.backfillPublicLikes);
