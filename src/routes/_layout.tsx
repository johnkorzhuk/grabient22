import { createFileRoute, Outlet, stripSearchParams, useMatches } from '@tanstack/react-router';
import * as v from 'valibot';
import { AppHeader } from '~/components/AppHeader';
import { Sidebar } from '~/components/Sidebar';
import { MobileNavigation } from '~/components/MobileNavigation';
import { ScrollToTop } from '~/components/ScrollToTop';
import { uiTempStore$ } from '~/stores/ui';
import {
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
} from '~/validators';
import { Route as SeedRoute } from './_layout/$seed';
import { observer } from '@legendapp/state/react';

export const SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
};

export const searchValidatorSchema = v.object({
  style: v.optional(
    v.fallback(styleWithAutoValidator, SEARCH_DEFAULTS.style),
    SEARCH_DEFAULTS.style,
  ),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, SEARCH_DEFAULTS.steps),
    SEARCH_DEFAULTS.steps,
  ),
  angle: v.optional(
    v.fallback(angleWithAutoValidator, SEARCH_DEFAULTS.angle),
    SEARCH_DEFAULTS.angle,
  ),
});

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
});

function RouteComponent() {
  // const matches = useMatches();
  // const isSeedRoute = matches.some((match) => match.routeId === SeedRoute.id);

  return <Layout />;
}

const Layout = observer(function Layout() {
  const isDragging = uiTempStore$.isDragging.get();

  return (
    <div
      className={`h-screen scrollbar-stable ${isDragging ? 'overflow-hidden' : 'overflow-auto'}`}
    >
      <AppHeader className="sticky top-0 z-50 bg-background" />
      <div className="pt-12">
        {/* <div className="hidden md:block">
    <Sidebar isSeedRoute={isSeedRoute} />
  </div> */}
        <main className="relative">
          <Outlet />
        </main>
        <ScrollToTop />
      </div>
      {/* Mobile navigation footer - only visible on small screens */}
      {/* <MobileNavigation /> */}
    </div>
  );
});
