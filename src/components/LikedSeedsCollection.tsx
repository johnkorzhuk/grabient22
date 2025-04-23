import { useEffect, useMemo } from 'react';
import { useIntersection } from '@mantine/hooks';
import { cn } from '~/lib/utils';
import { GradientPreview } from '~/components/GradientPreview';
import { LikeButton } from '~/components/LikeButton';
import { DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import { deserializeCoeffs } from '~/lib/serialization';
import type { AppCollection } from '~/types';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@clerk/tanstack-react-start';
import type { Id } from '../../convex/_generated/dataModel';

// Number of items to fetch per page
const ITEMS_PER_PAGE = 12;

export function LikedSeedsCollection() {
  const { userId } = useAuth();

  // Setup intersection observer with Mantine's hook
  const { ref: intersectionRef, entry } = useIntersection({
    threshold: 0.5,
    root: null,
    rootMargin: '100px',
  });

  // Use Convex's usePaginatedQuery hook for proper pagination
  const {
    results: likedSeeds,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.collections.getAllLikedSeedsByUser,
    userId ? { userId } : 'skip', // Use "skip" as a literal string, not an object
    { initialNumItems: ITEMS_PER_PAGE },
  );

  // Load next page when the user scrolls to the bottom
  useEffect(() => {
    if (entry?.isIntersecting && status === 'CanLoadMore') {
      loadMore(ITEMS_PER_PAGE);
    }
  }, [entry?.isIntersecting, status, loadMore]);

  // Transform the data into AppCollection format
  const likedCollections = useMemo(() => {
    if (!likedSeeds) return [];

    return likedSeeds
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
          };

          return collection;
        } catch (error) {
          console.error('Error deserializing seed:', error);
          return null;
        }
      })
      .filter(Boolean) as AppCollection[];
  }, [likedSeeds]);

  if (status === 'LoadingFirstPage') {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // Changed from status === 'Error' to check if string contains 'Error'
  if (typeof status === 'string' && status.includes('Error')) {
    return <div className="flex items-center justify-center h-full">Error loading liked seeds</div>;
  }

  if (likedCollections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-2">No Liked Seeds</h2>
        <p className="text-gray-500">You haven't liked any seeds yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {likedCollections.map((collection) => (
        <div
          key={collection.seed}
          className={cn(
            'relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800',
            'h-64 flex flex-col',
            'hover:shadow-md transition-shadow duration-200',
          )}
        >
          <div className="flex-grow">
            <GradientPreview
              initialStyle={collection.style}
              initialSteps={collection.steps}
              initialAngle={collection.angle}
              processedCoeffs={collection.coeffs}
            />
          </div>
          <div className="absolute bottom-2 right-2">
            <LikeButton
              steps={collection.steps}
              angle={collection.angle}
              style={collection.style}
              seed={collection.seed}
            />
          </div>
        </div>
      ))}

      {/* Loading indicator and intersection observer target */}
      <div ref={intersectionRef} className="col-span-full flex justify-center h-20 mt-4">
        {status === 'LoadingMore' && (
          <div className="text-center">
            <div className="spinner"></div>
            <p>Loading more...</p>
          </div>
        )}
        {status === 'Exhausted' && likedCollections.length > 0 && (
          <div className="text-gray-500">No more seeds to load</div>
        )}
      </div>
    </div>
  );
}
