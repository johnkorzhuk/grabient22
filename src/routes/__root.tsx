import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router';

// import { ConvexClientProvider } from '../convex';

import appCss from '../styles.css?url';
import { seo } from '~/utils/seo';
import {
  SentryWrappedErrorBoundary,
  DefaultCatchBoundary,
} from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { ThemeProvider } from '~/components/theme/ThemeProvider';
import { wrapCreateRootRouteWithSentry } from '@sentry/tanstackstart-react';
import { TooltipProvider } from '~/components/ui/tooltip';

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
          title: 'Grabient | Cosine Gradient Generator & Palette Finder',
          description: `Use Grabient, a cosine gradient generator, to create custom CSS gradients and discover inspiring color palettes. Perfect for designers and developers.`,
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
    <html suppressHydrationWarning lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {/* <ConvexClientProvider>{children}</ConvexClientProvider> */}
            {children}
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
