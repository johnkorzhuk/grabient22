import { createFileRoute } from '@tanstack/react-router';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import { deserializeCoeffs } from '~/lib/serialization';
import { DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import type { AppCollection } from '~/types';

import { useAuth } from '@clerk/tanstack-react-start';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useConvexPaginatedQuery } from '@convex-dev/react-query';
import { DEFAULT_COLLECTION_PAGE_SIZE } from '../_layout';

// Define the route
export const Route = createFileRoute('/_layout/collection')({
  component: CollectionRoute,
});

function CollectionRoute() {
  const { userId } = useAuth();

  // Use Convex's usePaginatedQuery hook with a small initial count
  const {
    results: likedSeeds,
    status,
    loadMore,
    isLoading: collectionsLoading,
  } = useConvexPaginatedQuery(
    api.likes.getAllLikedSeedsByUser,
    userId ? { userId } : 'skip',
    { initialNumItems: DEFAULT_COLLECTION_PAGE_SIZE }, // Start with just 10 items
  );

  // Process collections directly in the render function
  const isLoading = status === 'LoadingFirstPage';

  // Process the collections from likedSeeds
  const collections = likedSeeds
    ? (likedSeeds
        .map((like) => {
          try {
            // Deserialize the seed to get coeffs and globals
            const { coeffs, globals } = deserializeCoeffs(like.seed);

            // Create an AppCollection object
            const collection: AppCollection = {
              coeffs,
              globals,
              style: like.style || DEFAULT_STYLE,
              steps: like.steps || DEFAULT_STEPS,
              angle: like.angle || DEFAULT_ANGLE,
              _id: like._id as unknown as Id<'collections'>,
              seed: like.seed,
              likes: 0,
              _creationTime: like._creationTime,
            };

            return collection;
          } catch (error) {
            console.error('Error deserializing seed:', error);
            return null;
          }
        })
        .filter(Boolean) as AppCollection[])
    : [];

  const { data, isPending: likesPending } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeeds, {
      userId,
      seeds: collections.map((c) => c.seed),
    }),
    gcTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(userId),
  });

  // Manual function to load more
  // const handleLoadMore = () => {
  //   if (status === 'CanLoadMore') {
  //     loadMore(PAGE_SIZE);
  //   }
  // };

  // if (isLoading || status === 'LoadingFirstPage') {
  //   return (
  //     <div className="flex h-full items-center justify-center">
  //       <div className="text-center">
  //         <div className="spinner mb-4"></div>
  //         <p>Loading your liked collections...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (collections.length === 0) {
  //   return (
  //     <div className="flex flex-col h-full items-center justify-center">
  //       <h2 className="text-xl font-semibold mb-2">No Liked Collections</h2>
  //       <p className="text-gray-500">You haven't liked any collections yet.</p>
  //     </div>
  //   );
  // }

  return (
    <>
      <CollectionsDisplay
        collections={collections}
        likedSeeds={data}
        likesPending={likesPending}
        isLoading={collectionsLoading || isLoading}
      />

      {status === 'CanLoadMore' && collections.length < 120 && (
        <div className="flex justify-center mt-24">
          <button
            onClick={() => loadMore(DEFAULT_COLLECTION_PAGE_SIZE)}
            className="disable-animation-on-theme-change cursor-pointer font-poppins transition-all duration-200 
                          px-5 py-1.5 rounded-sm border select-none z-10 whitespace-nowrap inline-flex justify-center 
                          items-center h-10 lowercase gap-1.5 text-sm
                          bg-background/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 
                          border-border font-normal backdrop-blur-sm"
            aria-label="Load more gradients"
          >
            load more
          </button>
        </div>
      )}
    </>
  );
}
