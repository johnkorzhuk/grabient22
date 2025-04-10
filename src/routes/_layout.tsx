import { createFileRoute, Outlet, stripSearchParams, useMatches } from '@tanstack/react-router';
import { AppHeader, APP_HEADER_HEIGHT } from '~/components/AppHeader';
import * as v from 'valibot';
import {
  rowHeightValidator,
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
  DEFAULT_ITEM_HEIGHT_ROW,
} from '~/validators';

export const SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
  rowHeight: DEFAULT_ITEM_HEIGHT_ROW,
};

export const searchValidatorSchema = v.object({
  rowHeight: v.optional(
    v.fallback(rowHeightValidator, DEFAULT_ITEM_HEIGHT_ROW),
    DEFAULT_ITEM_HEIGHT_ROW,
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
  const isSeedRoute = matches.some((match) => match.routeId === '/_layout/$seed');

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
