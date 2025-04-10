import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection } from '~/types';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';

// export const DEFAULT_ITEM_HEIGHT_ROW = 15;
// export const DEFAULT_ITEM_HEIGHT_GRID = 35;
// export const MIN_ITEM_HEIGHT = 10;
// export const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;

// // Use the factory function to create the search validator schema
// export const searchValidatorSchema = createSearchValidatorSchemaFactory({
//   defaultItemHeightRow: DEFAULT_ITEM_HEIGHT_ROW,
//   minItemHeight: MIN_ITEM_HEIGHT,
//   maxItemHeight: MAX_ITEM_HEIGHT,
// });

export const Route = createFileRoute('/_layout/')({
  component: Home,

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
