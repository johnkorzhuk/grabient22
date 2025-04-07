import {
  createFileRoute,
  Outlet,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
