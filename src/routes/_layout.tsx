import {
  createFileRoute,
  Outlet,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';
import * as v from 'valibot';
import { rowHeightValidator } from '~/validators';

export const LAYOUT_SEARCH_DEFAULTS = {
  rowHeight: 25,
};

export const rowHeightSearchValidatorSchema = v.optional(
  v.fallback(rowHeightValidator, LAYOUT_SEARCH_DEFAULTS.rowHeight),
  LAYOUT_SEARCH_DEFAULTS.rowHeight,
);

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: v.object({
    rowHeight: rowHeightSearchValidatorSchema,
  }),
  search: {
    middlewares: [stripSearchParams(LAYOUT_SEARCH_DEFAULTS), retainSearchParams(['rowHeight'])],
  },
});

function RouteComponent() {
  return <Outlet />;
}
