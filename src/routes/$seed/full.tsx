import { createFileRoute, useParams, useRouteContext } from '@tanstack/react-router';

export const Route = createFileRoute('/$seed/full')({
  component: EditRouteComponent,
});

function EditRouteComponent() {
  const { seed: encodedSeedData } = useParams({
    from: '/$seed/full',
  });
  const { seedData } = useRouteContext({
    from: '/$seed',
  });

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      {encodedSeedData} full-screen
    </div>
  );
}
