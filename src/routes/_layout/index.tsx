import {
  createFileRoute,
  retainSearchParams,
  stripSearchParams,
  useLoaderData,
} from '@tanstack/react-router';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection } from '~/types';
import {
  angleWithAutoValidator,
  COMMON_SEARCH_DEFAULTS,
  stepsWithAutoValidator,
  styleWithAutoValidator,
} from '~/validators';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import * as v from 'valibot';

export const DEFAULT_ITEM_HEIGHT = 25;
export const MIN_ITEM_HEIGHT = 10;
export const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;
export const rowHeightValidator = v.pipe(
  v.number(),
  v.minValue(MIN_ITEM_HEIGHT),
  v.maxValue(MAX_ITEM_HEIGHT),
  v.transform((input) => Number(input.toFixed(1))),
);

export const searchValidatorSchema = v.object({
  rowHeight: v.optional(
    v.fallback(rowHeightValidator, COMMON_SEARCH_DEFAULTS.rowHeight),
    COMMON_SEARCH_DEFAULTS.rowHeight,
  ),
  style: v.optional(
    v.fallback(styleWithAutoValidator, COMMON_SEARCH_DEFAULTS.style),
    COMMON_SEARCH_DEFAULTS.style,
  ),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, COMMON_SEARCH_DEFAULTS.steps),
    COMMON_SEARCH_DEFAULTS.steps,
  ),
  angle: v.optional(
    v.fallback(angleWithAutoValidator, COMMON_SEARCH_DEFAULTS.angle),
    COMMON_SEARCH_DEFAULTS.angle,
  ),
});

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
