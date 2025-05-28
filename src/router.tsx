import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { MutationCache, QueryClient, notifyManager } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import toast from 'react-hot-toast';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { routeTree } from './routeTree.gen';
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary';
import { NotFound } from './components/NotFound';

import './styles.css';

export function createRouter() {
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    console.error('missing envar CONVEX_URL');
  }
  const convex = new ConvexReactClient(CONVEX_URL, {
    unsavedChangesWarning: false,
  });
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        staleTime: 30000, // Add this to prevent frequent refetches
        gcTime: 300000, // Add this to keep data in cache longer
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast(error.message, { className: 'bg-red-500 text-white' });
      },
    }),
  });
  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      context: { queryClient, convexClient: convex, convexQueryClient },
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>
      ),
      scrollRestoration: true,
    }),
    queryClient,
  );

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
