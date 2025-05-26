import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import { useAuth } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/_layout/newest')({
  component: NewestCollections,
  // pendingComponent: () => <Loader />,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      ...convexQuery(api.collections.listNew, {}),
      gcTime: 2000,
    });
  },
});

function NewestCollections() {
  const { data: collections } = useSuspenseQuery({
    ...convexQuery(api.collections.listNew, {}),
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { userId } = useAuth();

  const { data: likedSeeds, isPending: likesPending } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeeds, {
      userId,
      seeds: collections.map((c) => c.seed),
    }),
    gcTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(userId),
  });

  return (
    <CollectionsDisplay
      collections={collections}
      likedSeeds={likedSeeds}
      likesPending={likesPending}
    />
  );
}
