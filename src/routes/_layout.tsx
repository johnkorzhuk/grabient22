import {
  createFileRoute,
  Outlet,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';
import { LAYOUT_SEARCH_DEFUALTS } from '~/constants';
import { rowHeightSearchValidatorSchema } from '~/validators';
import * as v from 'valibot';

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: v.object({
    rowHeight: rowHeightSearchValidatorSchema,
  }),
  search: {
    middlewares: [stripSearchParams(LAYOUT_SEARCH_DEFUALTS), retainSearchParams(['rowHeight'])],
  },
});

function RouteComponent() {
  return <Outlet />;
}
