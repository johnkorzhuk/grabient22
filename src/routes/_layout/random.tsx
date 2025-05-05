import { createFileRoute, stripSearchParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { PaletteCategoryKey } from '~/validators';
import * as v from 'valibot';
import { categoriesValidator, DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import { CollectionsDisplay } from '~/components/ResizableCollectionsDisplay';
import type { AppCollection } from '~/types';
import { wrap } from 'comlink';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import {
  paletteStore$,
  generatePalettesForCategories,
  REGENERATE_PALETTES_EVENT,
  DEFAULT_CATEGORIES,
} from '~/stores/palette';
import type { WorkerApi } from '~/workers/palette-generator.worker';

// We're now using the optimal orders from the palette store, so we can remove this local copy

// Define search defaults specific to the random route
const SEARCH_DEFAULTS = {
  categories: DEFAULT_CATEGORIES,
};

export const Route = createFileRoute('/_layout/random')({
  component: GeneratePageWrapper,
  validateSearch: v.object({
    categories: categoriesValidator,
  }),
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
  beforeLoad({ search }) {
    // Always ensure categories are set in the store
    paletteStore$.categories.set(search.categories || DEFAULT_CATEGORIES);
  },
  onLeave: ({ search }) => {
    // Ensure categories are preserved when leaving
    paletteStore$.categories.set(search.categories || DEFAULT_CATEGORIES);
  },
});

function GeneratePageWrapper() {
  return <GeneratePage />;
}

// Use the REGENERATE_PALETTES_EVENT from the palette store

const GeneratePage = observer(function GeneratePage() {
  // Get search params from the layout route, not the current route
  const layoutSearch = useSearch({
    from: '/_layout',
  });
  // Get categories from the current route's search params
  const routeSearch = useSearch({
    from: Route.id,
  });
  const navigate = useNavigate({
    from: '/random',
  });

  // During initial render, use the URL state to initialize the store
  useEffect(() => {
    paletteStore$.categories.set(routeSearch.categories || DEFAULT_CATEGORIES);
  }, []);

  const storedCategories = use$(paletteStore$.categories) ?? DEFAULT_CATEGORIES;
  const { categories = storedCategories } = routeSearch;
  const angle = layoutSearch.angle === 'auto' ? DEFAULT_ANGLE : layoutSearch.angle;
  const steps = layoutSearch.steps === 'auto' ? DEFAULT_STEPS : layoutSearch.steps;
  const style = layoutSearch.style === 'auto' ? DEFAULT_STYLE : layoutSearch.style;

  // Use the cached palettes from the store
  // For Random category, always use 'Random' as the cache key to ensure consistent caching
  const cacheKey =
    categories.length === 1 && categories[0] === 'Random'
      ? 'Random'
      : [...categories].sort().join(',');
  const cachedPalettes = use$(paletteStore$.cachedPalettes[cacheKey]) || [];

  // Keep local state for collections to ensure proper rendering
  const [collections, setCollections] = useState<AppCollection[]>([]);

  useEffect(() => {
    // Always update the route search parameters to match stored categories
    navigate({
      search: (s) => ({
        ...s,
        categories: storedCategories,
      }),
      replace: true,
    });
  }, [storedCategories]);

  // Update collections when cached palettes change
  useEffect(() => {
    if (cachedPalettes && cachedPalettes.length > 0) {
      // Make sure each palette has the required properties
      const processedPalettes = cachedPalettes.map((palette) => ({
        ...palette,
        // Ensure these properties exist with defaults if they're undefined
        steps,
        angle,
        style,
      }));
      setCollections(processedPalettes);
    }
  }, [cachedPalettes, cacheKey, angle, steps, style]);

  // Keep track of the current worker and generation task
  const workerRef = useRef<Worker | null>(null);
  const generationAbortController = useRef<AbortController | null>(null);
  const currentCategoriesRef = useRef<PaletteCategoryKey[]>(categories);

  // Function to clean up current generation
  const cleanupCurrentGeneration = () => {
    // Abort any ongoing generation
    if (generationAbortController.current) {
      generationAbortController.current.abort();
      generationAbortController.current = null;
    }

    // Terminate worker if it exists
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    uiTempStore$.isGeneratingPalettes.set(false);
  };

  // Function to generate palettes
  const generatePalettesInStream = async () => {
    // Clean up any existing generation
    cleanupCurrentGeneration();

    // Update current categories ref
    currentCategoriesRef.current = categories;

    // Create abort controller for this generation
    const abortController = new AbortController();
    generationAbortController.current = abortController;
    const { signal } = abortController;

    // Show loading state
    uiTempStore$.isGeneratingPalettes.set(true);

    // Create worker
    const worker = new Worker(
      new URL('../../workers/palette-generator.worker.ts', import.meta.url),
      {
        type: 'module',
      },
    );
    workerRef.current = worker;

    // Wrap worker with comlink
    const workerApi = wrap<WorkerApi>(worker);

    try {
      // Generate palettes using the store function
      await generatePalettesForCategories(
        categories,
        steps,
        angle,
        style,
        workerApi,
        signal,
        false, // Don't force regenerate
      );

      // The palettes are now automatically stored in the Legend state
      // No need to update local state
    } catch (err) {
      // Silently handle errors
      console.log('Generation error:', err);
    } finally {
      if (workerRef.current === worker) {
        worker.terminate();
        workerRef.current = null;
      }
      if (!signal.aborted) {
        uiTempStore$.isGeneratingPalettes.set(false);
      }
    }
  };

  // Generate palettes when categories change if not already cached
  useEffect(() => {
    // Check if we already have cached palettes
    if (!cachedPalettes || cachedPalettes.length === 0) {
      generatePalettesInStream();
    }

    // Cleanup on unmount
    return () => {
      cleanupCurrentGeneration();
    };
  }, [categories]);

  // Listen for the regenerate palettes event
  useEffect(() => {
    const handleRegeneratePalettes = () => {
      // Clear the cache for the current categories
      if (paletteStore$.cachedPalettes[cacheKey]) {
        paletteStore$.cachedPalettes[cacheKey].set([]);
      }
      // Generate new palettes
      generatePalettesInStream();
    };

    // Add event listener
    window.addEventListener(REGENERATE_PALETTES_EVENT, handleRegeneratePalettes);

    // Cleanup
    return () => {
      window.removeEventListener(REGENERATE_PALETTES_EVENT, handleRegeneratePalettes);
    };
  }, [categories, cacheKey]);

  // We no longer need the event listener since the UI components directly call invalidatePaletteCache

  return (
    <div className="h-full w-full flex flex-col relative">
      {collections.length > 0 ? (
        <CollectionsDisplay collections={collections} isSeedRoute={false} isRandomRoute={true} />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center py-8">
            <p className="text-gray-500">
              No palettes could be generated with the current settings.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Try different category combinations for better results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
