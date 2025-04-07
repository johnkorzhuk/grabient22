import {
  createFileRoute,
  Outlet,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';

import {
  angleWithAutoValidator,
  COMMON_SEARCH_DEFAULTS,
  stepsWithAutoValidator,
  styleWithAutoValidator,
} from '~/validators';

import * as v from 'valibot';

export const DEFAULT_ITEM_HEIGHT = 15;
export const MIN_ITEM_HEIGHT = 5;
export const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;
export const rowHeightValidator = v.pipe(
  v.number(),
  v.minValue(MIN_ITEM_HEIGHT),
  v.maxValue(MAX_ITEM_HEIGHT),
  v.transform((input) => Number(input.toFixed(1))),
);

export const searchValidatorSchema = v.object({
  rowHeight: v.optional(
    v.fallback(rowHeightValidator, COMMON_SEARCH_DEFAULTS.rowHeight),
    COMMON_SEARCH_DEFAULTS.rowHeight,
  ),
  style: v.optional(
    v.fallback(styleWithAutoValidator, COMMON_SEARCH_DEFAULTS.style),
    COMMON_SEARCH_DEFAULTS.style,
  ),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, COMMON_SEARCH_DEFAULTS.steps),
    COMMON_SEARCH_DEFAULTS.steps,
  ),
  angle: v.optional(
    v.fallback(angleWithAutoValidator, COMMON_SEARCH_DEFAULTS.angle),
    COMMON_SEARCH_DEFAULTS.angle,
  ),
});

export const Route = createFileRoute('/_layout/_seedLayout')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(COMMON_SEARCH_DEFAULTS), retainSearchParams(['rowHeight'])],
  },
});

function RouteComponent() {
  return <Outlet />;
}
