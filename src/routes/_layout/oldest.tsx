import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import { useAuth } from '@clerk/tanstack-react-start';
import { uiTempStore$ } from '~/stores/ui';

export const Route = createFileRoute('/_layout/oldest')({
  component: OldestCollections,
  // pendingComponent: () => <Loader />,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      ...convexQuery(api.collections.listOld, {}),
      gcTime: 2000,
    });
  },
});

function OldestCollections() {
  const { data: collections } = useSuspenseQuery({
    ...convexQuery(api.collections.listOld, {}),
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { userId } = useAuth();

  const { data: likedSeeds } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeeds, {
      userId,
      seeds: collections.map((c) => c.seed),
    }),
    gcTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(userId),
  });

  return <CollectionsDisplay collections={collections} likedSeeds={likedSeeds} />;
}
