import { createFileRoute, Outlet } from '@tanstack/react-router';
import { APP_HEADER_HEIGHT, AppHeader } from '~/components/AppHeader';
import * as v from 'valibot';
import { rowHeightSearchValidatorSchema } from '~/validators';

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: v.object({
    rowHeight: rowHeightSearchValidatorSchema,
  }),
});

function RouteComponent() {
  return (
    <>
      <AppHeader />
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
