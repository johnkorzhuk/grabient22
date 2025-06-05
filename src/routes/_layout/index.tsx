import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import { useAuth } from '@clerk/tanstack-react-start';
import { useConvexPaginatedQuery } from '@convex-dev/react-query';
import { DEFAULT_COLLECTION_PAGE_SIZE } from '../_layout';

// // Process seed data by applying globals to coeffs and removing globals field
// const processedSeedData = (seedData as unknown as Array<{
//   coeffs: number[][];
//   globals: number[];
//   steps: number;
//   angle: number;
//   style: string;
// }>).map((item) => {
//   const { globals, ...rest } = item;
//   // Use type assertion to match the expected type for applyGlobals
//   const newCoeffs = applyGlobals(item.coeffs as any, globals as any);
//   return {
//     ...rest,
//     coeffs: newCoeffs
//   };
// });

// // Output stringified JSON without globals field
// console.log(JSON.stringify(processedSeedData, null, 2));

export const Route = createFileRoute('/_layout/')({
  component: Home,
  loaderDeps: ({ search }) => {
    return {
      tags: search.tags,
    };
  },
  loader: async ({ context, deps }) => {
    context.queryClient.ensureQueryData({
      ...convexQuery(api.collections.listCollections, {
        tags: deps.tags && deps.tags.length > 0 ? deps.tags : undefined,
        paginationOpts: {
          numItems: DEFAULT_COLLECTION_PAGE_SIZE,
          cursor: null,
        },
      }),
      gcTime: 4000,
    });
  },
});

function Home() {
  const { userId } = useAuth();
  // Get tags from the search parameters
  const search = useSearch({
    from: '/_layout',
  });

  const {
    results: collections,
    isLoading,
    loadMore,
    status,
  } = useConvexPaginatedQuery(
    api.collections.listCollections,
    {
      tags: search.tags && search.tags.length > 0 ? search.tags : undefined,
    },
    { initialNumItems: DEFAULT_COLLECTION_PAGE_SIZE }, // or whatever page size you want
  );

  const { data: likedSeedsArray = [], isPending: likesPending } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeedsNew, {
      userId,
      seeds: collections.map((c) => c.seed),
    }),
    gcTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(userId) && collections.length > 0 && status !== 'LoadingMore',
  });

  // Construct the record on the client side
  const likedSeeds = Object.fromEntries(
    collections.map((collection, index) => [collection.seed, likedSeedsArray[index] || false]),
  );

  return (
    <>
      <CollectionsDisplay
        collections={collections}
        likedSeeds={likedSeeds}
        likesPending={likesPending}
        isLoading={isLoading}
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
