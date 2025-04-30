import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  Scripts,
  useRouteContext,
} from '@tanstack/react-router';
import appCss from '../styles.css?url';
import { seo } from '~/utils/seo';
import {
  SentryWrappedErrorBoundary,
  DefaultCatchBoundary,
} from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { wrapCreateRootRouteWithSentry } from '@sentry/tanstackstart-react';
import { TooltipProvider } from '~/components/ui/tooltip';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import type { QueryClient } from '@tanstack/react-query';
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import type { ConvexReactClient } from 'convex/react';
import type { ConvexQueryClient } from '@convex-dev/react-query';
import { ThemeProvider } from '~/components/theme/ThemeProvider';
import { PostHogProvider } from 'posthog-js/react';

// const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
//   const auth = await getAuth(getWebRequest());
//   const token = await auth.getToken({ template: 'convex' });

//   return {
//     userId: auth.userId,
//     token,
//   };
// });

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

export const Route = wrapCreateRootRouteWithSentry(
  createRootRouteWithContext<{
    queryClient: QueryClient;
    convexClient: ConvexReactClient;
    convexQueryClient: ConvexQueryClient;
  }>()({
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
          image: '/grabber.png',
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
    // beforeLoad: async (ctx) => {
    //   const auth = await fetchClerkAuth();
    //   const { userId, token } = auth;

    //   // During SSR only (the only time serverHttpClient exists),
    //   // set the Clerk auth token to make HTTP queries with.
    //   if (token) {
    //     ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    //   }

    //   return {
    //     userId,
    //     token,
    //   };
    // },
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
  const context = useRouteContext({ from: Route.id });
  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY!} options={options}>
      <ClerkProvider>
        <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
          <html suppressHydrationWarning lang="en">
            <head>
              <HeadContent />
            </head>
            <body>
              <ThemeProvider>
                <TooltipProvider>
                  <div className="h-screen flex flex-col min-h-0">
                    <div className="flex-grow min-h-0 h-full flex flex-col">
                      {children}
                      {/* <Toaster /> */}
                    </div>
                  </div>
                </TooltipProvider>
              </ThemeProvider>
              {import.meta.env.DEV && (
                <>
                  <ReactQueryDevtools position="left" buttonPosition="bottom-left" />
                  <TanStackRouterDevtools position="bottom-left" />
                </>
              )}
              <Scripts />
            </body>
          </html>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </PostHogProvider>
  );
}
