import { createFileRoute, Outlet, stripSearchParams, useMatches } from '@tanstack/react-router';
import * as v from 'valibot';
import { AppHeader } from '~/components/AppHeader';
import { Sidebar } from '~/components/Sidebar';
import { MobileNavigation } from '~/components/MobileNavigation';
import {
  rowHeightValidator,
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
  DEFAULT_ITEM_HEIGHT_ROW,
  layoutValidator,
  DEFAULT_LAYOUT,
} from '~/validators';
import { Route as SeedRoute } from './_layout/$seed';

export const SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
  rowHeight: DEFAULT_ITEM_HEIGHT_ROW,
  layout: DEFAULT_LAYOUT,
};

export const searchValidatorSchema = v.object({
  rowHeight: v.optional(
    v.fallback(rowHeightValidator, SEARCH_DEFAULTS.rowHeight),
    SEARCH_DEFAULTS.rowHeight,
  ),
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
  layout: v.optional(v.fallback(layoutValidator, SEARCH_DEFAULTS.layout), SEARCH_DEFAULTS.layout),
});

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
});

function RouteComponent() {
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === SeedRoute.id);

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar isSeedRoute={isSeedRoute} />
        </div>
        <main className="flex-1 overflow-auto pb-14 md:pb-0">
          <Outlet />
        </main>
      </div>
      {/* Mobile navigation footer - only visible on small screens */}
      <MobileNavigation />      
    </div>
  );
}
