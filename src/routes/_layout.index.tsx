import { createFileRoute, stripSearchParams, useLoaderData } from '@tanstack/react-router';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection } from '~/types';
import { COMMON_SEARCH_DEFAULTS, searchValidatorSchema } from '~/validators';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';

export const Route = createFileRoute('/_layout/')({
  component: Home,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(COMMON_SEARCH_DEFAULTS)],
  },
  loader: async () => {
    const data = await fetchCollections();
    return data;
  },
  headers: () => {
    return {
      'cache-control': 'public, max-age=3600, must-revalidate', // 1 hour
      'cdn-cache-control': 'public, max-age=3600, stale-while-revalidate=1800, durable', // 1 hour + 30min stale
      // from https://github.com/TanStack/tanstack.com/blob/5ee97b505d0f9ef3fdbff12a5f70cfaad60a795a/app/routes/%24libraryId/%24version.docs.tsx#L37
      // 'cache-control': 'public, max-age=0, must-revalidate',
      // 'cdn-cache-control': 'max-age=300, stale-while-revalidate=300, durable',
    };
  },
});

function Home() {
  const collections = useLoaderData({ from: '/_layout/' }) as AppCollection[];

  return <CollectionsDisplay collections={collections} />;
}
