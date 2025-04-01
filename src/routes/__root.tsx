import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router';

import { ConvexClientProvider } from '../convex';

import appCss from '../styles.css?url';
import { seo } from '~/utils/seo';
import {
  SentryWrappedErrorBoundary,
  DefaultCatchBoundary,
} from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { ThemeProvider } from '~/components/theme/ThemeProvider';
import { wrapCreateRootRouteWithSentry } from '@sentry/tanstackstart-react';

export const Route = wrapCreateRootRouteWithSentry(
  createRootRoute({
    head: () => ({
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        ...seo({
          title: 'TanStack Start | Type-Safe, Client-First, Full-Stack React Framework',
          description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
        }),
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
        { rel: 'icon', href: '/favicon.ico' },
      ],
    }),
    errorComponent: (props) => {
      return (
        <RootDocument>
          {import.meta.env.VITE_SENTRY_DSN ? (
            <SentryWrappedErrorBoundary {...props} />
          ) : (
            <DefaultCatchBoundary {...props} />
          )}
        </RootDocument>
      );
    },
    notFoundComponent: () => <NotFound />,
    component: RootComponent,
  }),
);

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
