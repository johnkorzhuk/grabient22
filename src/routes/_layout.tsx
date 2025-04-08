import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router';
import { AppHeader, APP_HEADER_HEIGHT } from '~/components/AppHeader';

// TODO: move
export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === '/_layout/_seedLayout/$seed');

  return (
    <>
      <AppHeader isSeedRoute={isSeedRoute} />
      <main
        className="mx-auto w-full relative overflow-hidden"
        style={{
          marginTop: `${APP_HEADER_HEIGHT}px`,
          height: `calc(100vh - ${APP_HEADER_HEIGHT}px)`,
        }}
      >
        <Outlet />
      </main>
    </>
  );
}
