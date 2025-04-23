import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import seedData from '../../../seed.json';
import { applyGlobals } from '~/lib/cosineGradient';

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
  // pendingComponent: () => <Loader />,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      ...convexQuery(api.collections.list, {}),
      gcTime: 2000,
    });
  },
});

function Home() {
  const { data: collections } = useSuspenseQuery({
    ...convexQuery(api.collections.list, {}),
    gcTime: Number.POSITIVE_INFINITY,
  });

  return <CollectionsDisplay collections={collections} isSeedRoute={false} />;
}
