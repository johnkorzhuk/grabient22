import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { convexQuery, useConvexPaginatedQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import { useAuth } from '@clerk/tanstack-react-start';
import { DEFAULT_COLLECTION_PAGE_SIZE } from '../_layout';

export const Route = createFileRoute('/_layout/newest')({
  component: NewestCollections,
  loaderDeps: ({ search }) => {
    return {
      tags: search.tags,
    };
  },
  loader: async ({ context, deps }) => {
    context.queryClient.ensureQueryData({
      ...convexQuery(api.collections.listCollections, {
        tags: deps.tags && deps.tags.length > 0 ? deps.tags : undefined,
        sort: 'new',
        paginationOpts: {
          numItems: DEFAULT_COLLECTION_PAGE_SIZE,
          cursor: null,
        },
      }),
      gcTime: 4000,
    });
  },
});

function NewestCollections() {
  const { userId } = useAuth();
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
      sort: 'new',
    },
    { initialNumItems: DEFAULT_COLLECTION_PAGE_SIZE }, // or whatever page size you want
  );

  const { data: likedSeeds, isPending: likesPending } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeeds, {
      userId,
      seeds: collections.map((c) => c.seed),
    }),
    gcTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(userId) && collections.length > 0 && status !== 'LoadingMore',
  });

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
