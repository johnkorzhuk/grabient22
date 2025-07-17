import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from '@tanstack/react-router'
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'
import { QueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { getAuth } from '@clerk/tanstack-react-start/server'
import { getWebRequest } from '@tanstack/react-start/server'
import appCss from '~/styles/app.css?url'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ThemeProvider } from '~/components/theme/ThemeProvider'
import { seo } from '~/utils/seo'
import { NotFound } from '~/components/NotFound'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { PostHogProvider } from 'posthog-js/react'
import { TooltipProvider } from '~/components/ui/tooltip'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production'

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest()
  if (!request) throw new Error('No request found')

  const auth = await getAuth(getWebRequest())
  const token = await auth.getToken({ template: 'convex' })

  return {
    userId: auth.userId,
    token,
  }
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
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
        title: 'Grabient | Gradient Generator & Palette Finder',
        description: `Use Grabient and discover endless color palettes.`,
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
  //   const auth = await fetchClerkAuth()
  //   const { userId, token } = auth
  //   // During SSR only (the only time serverHttpClient exists),
  //   // set the Clerk auth token to make HTTP queries with.
  //   if (token) {
  //     ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
  //   }

  //   return {
  //     userId,
  //     token,
  //   }
  // },
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY!}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      }}
    >
      <ClerkProvider>
        <ConvexProviderWithClerk
          client={context.convexClient}
          useAuth={useAuth}
        >
          <RootDocument>
            <Outlet />
          </RootDocument>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </PostHogProvider>
  )
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
            <ReactQueryDevtools
              position="right"
              buttonPosition="bottom-right"
            />
            <TanStackRouterDevtools position="bottom-left" />
          </>
        )}
        <Scripts />
      </body>
    </html>
  )
}
