import { createFileRoute } from '@tanstack/react-router';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import { deserializeCoeffs } from '~/lib/serialization';
import { DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import type { AppCollection } from '~/types';
import { usePaginatedQuery } from 'convex/react';
import { useAuth } from '@clerk/tanstack-react-start';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
const PAGE_SIZE = 200 as const;
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
  } = usePaginatedQuery(
    api.likes.getAllLikedSeedsByUser,
    userId ? { userId } : 'skip',
    { initialNumItems: PAGE_SIZE }, // Start with just 10 items
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
              _creationTime: Date.now(),
            };

            return collection;
          } catch (error) {
            console.error('Error deserializing seed:', error);
            return null;
          }
        })
        .filter(Boolean) as AppCollection[])
    : [];

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
    <div className="h-full w-full flex flex-col">
      <div className="flex-grow">
        <CollectionsDisplay collections={collections} />
      </div>
    </div>
  );
}
