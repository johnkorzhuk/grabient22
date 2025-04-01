import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get all conversations
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('collections').collect();
  },
});

// Get a specific conversation
export const get = query({
  args: { id: v.id('collections') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
