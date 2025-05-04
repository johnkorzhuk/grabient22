import { v } from 'convex/values';
import { query } from './_generated/server';
import { Id } from './_generated/dataModel';

export const searchCollectionsByTagText = query({
  args: { searchText: v.string() },
  handler: async (ctx, args) => {
    // Search for tags matching the search text
    const taggedCollections = await ctx.db
      .query('tagged_collections')
      .withSearchIndex('search_tag', (q) => q.search('tag', args.searchText))
      .collect();

    // Get unique collection IDs
    const collectionIds = new Set<Id<'collections'>>(
      taggedCollections.map((item) => item.collectionId),
    );

    // Fetch the actual collections
    const collections = await Promise.all(Array.from(collectionIds).map((id) => ctx.db.get(id)));

    // Filter out any null values (in case a collection was deleted)
    return collections.filter(Boolean);
  },
});

export const getCollectionsByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Early return if no tags provided
    if (args.tags.length === 0) {
      return [];
    }

    // For each tag, get the collections with that tag
    const taggedCollectionsPromises = args.tags.map((tag) =>
      ctx.db
        .query('tagged_collections')
        .withIndex('tag', (q) => q.eq('tag', tag))
        .collect(),
    );

    const taggedCollectionsArrays = await Promise.all(taggedCollectionsPromises);

    // Flatten and get unique collection IDs
    const collectionIds = new Set<Id<'collections'>>();
    taggedCollectionsArrays.forEach((taggedCollections) => {
      taggedCollections.forEach((item) => {
        collectionIds.add(item.collectionId);
      });
    });

    // Fetch the actual collections
    const collections = await Promise.all(Array.from(collectionIds).map((id) => ctx.db.get(id)));

    // Filter out any null values (in case a collection was deleted)
    return collections.filter(Boolean);
  },
});
