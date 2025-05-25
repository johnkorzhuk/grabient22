import { createFileRoute, useParams, useRouteContext } from '@tanstack/react-router';

export const Route = createFileRoute('/$seed/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { seed: encodedSeedData } = useParams({
    from: '/$seed/',
  });
  const { seedData } = useRouteContext({
    from: '/$seed',
  });

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      {encodedSeedData}
    </div>
  );
}
