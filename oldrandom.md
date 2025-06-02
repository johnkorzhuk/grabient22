```tsx
import { createFileRoute, stripSearchParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { PaletteCategoryKey } from '~/validators';
import * as v from 'valibot';
import { categoriesValidator, DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
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
        <CollectionsDisplay collections={collections} />
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
```

```tsx
import { ThemeToggle } from '../theme/ThemeToggle';
import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import { useMatches } from '@tanstack/react-router';
import { Route as SeedRoute } from '~/routes/$seed/index';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Button } from '~/components/ui/button';
import { Settings2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  useAuth,
} from '@clerk/tanstack-react-start';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Badge } from '../ui/badge';
import { cn } from '~/lib/utils';
import { PALETTE_CATEGORIES, getCategoryDisplayName } from '~/validators';
import type { PaletteCategoryKey } from '~/validators';
import { DEFAULT_CATEGORIES, paletteStore$, REGENERATE_PALETTES_EVENT } from '~/stores/palette';
import { observer, use$ } from '@legendapp/state/react';
import { PaletteCategories } from '~/lib/generation';
import { Carousel, CarouselContent, CarouselItem } from '~/components/ui/carousel';
import { PaletteCategoryDisplay } from '../PaletteCategoryDisplay';
import { useMounted } from '@mantine/hooks';
import { uiTempStore$ } from '~/stores/ui';
import { GrabientLogo } from '../GrabientLogo';

// Category badge component for selection
function CategoryBadge({
  category,
  isSelected,
  onClick,
}: {
  category: PaletteCategoryKey;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Badge
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors select-none',
      )}
      onClick={onClick}
    >
      {/* Format the category name for display using centralized helper */}
      {getCategoryDisplayName(category)}
    </Badge>
  );
}
// Category selector component with carousel for mobile
const CategorySelector = observer(function CategorySelector() {
  const search = useSearch({
    from: '/_layout/random',
  });
  const layoutSearch = useSearch({
    from: '/_layout',
  });

  let selectedCategories = use$(paletteStore$.categories) ?? DEFAULT_CATEGORIES;
  const searchCategories = search.categories ?? DEFAULT_CATEGORIES;

  const isCategoriesEqual =
    selectedCategories.length === searchCategories.length &&
    selectedCategories.every((c, i) => c === searchCategories[i]);
  if (!isCategoriesEqual) selectedCategories = searchCategories;
  // Use the correct route for navigation
  const navigate = useNavigate({
    from: '/random',
  });

  // Regenerate functionality moved to button in the header

  // Use the hardcoded order from validators.ts
  const sortedCategories = PALETTE_CATEGORIES;

  const handleCategoryToggle = (category: PaletteCategoryKey) => {
    let newCategories: PaletteCategoryKey[];
    const isSelected = selectedCategories.includes(category);

    // If clicking on Random, always replace all categories with Random
    if (category === 'Random') {
      newCategories = ['Random'];
    }
    // If Random is selected and clicking on another category, replace Random with the new category
    else if (selectedCategories.includes('Random')) {
      newCategories = [category];
    }
    // If deselecting a category
    else if (isSelected) {
      // Remove the category
      newCategories = selectedCategories.filter((c) => c !== category);

      // If no categories left, default to Random
      if (newCategories.length === 0) {
        newCategories = ['Random'];
      }
    }
    // If adding a new category
    else {
      // Check if the new category is compatible with existing categories
      const incompatibleCategories = selectedCategories.filter((selected) => {
        try {
          const selectedCategory = PaletteCategories[selected];
          const newCategory = PaletteCategories[category];

          if (!selectedCategory || !newCategory) {
            console.warn(`Category not found in PaletteCategories: ${selected} or ${category}`);
            return false;
          }

          // Check if the new category is in the exclusiveWith list of any selected category
          // or if any selected category is in the exclusiveWith list of the new category
          return (
            selectedCategory.exclusiveWith?.includes(category) ||
            newCategory.exclusiveWith?.includes(selected)
          );
        } catch (error) {
          console.error('Error checking category compatibility:', error);
          return false;
        }
      });

      if (incompatibleCategories.length > 0) {
        // If there are incompatible categories, replace them with the new one
        newCategories = [
          ...selectedCategories.filter((c) => !incompatibleCategories.includes(c)),
          category,
        ];
      } else {
        // If all are compatible, add the new category
        newCategories = [...selectedCategories, category];
      }
    }

    // Update URL with new categories using TanStack Router
    navigate({
      search: {
        ...layoutSearch,
        categories: newCategories,
      },
      replace: true,
    });
  };

  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent className="-ml-1 py-1">
          {/* Reduced spacing between items */}
          {sortedCategories.map((category) => (
            <CarouselItem key={category} className="basis-auto pl-1 flex-shrink-0">
              {/* Reduced padding */}
              <CategoryBadge
                category={category}
                isSelected={selectedCategories.includes(category)}
                onClick={() => handleCategoryToggle(category)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
});

export const AppHeader = observer(function AppHeader({ className }: { className?: string }) {
  // const { style, steps, angle } = useSearch({
  //   from: '/_layout',
  // });
  const preferredOptions = use$(uiTempStore$.preferredOptions);
  const mounted = useMounted();
  // Get palette colors from the store
  const seedPaletteColors = use$(paletteStore$.seedPaletteColors);
  const location = useLocation();
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === SeedRoute.id);
  const [open, setOpen] = useState(false);
  const isRandomRoute = location.pathname === '/random';
  const shouldShowControls = isRandomRoute || isSeedRoute;
  const { isSignedIn } = useAuth();

  // Function to handle regeneration via event
  const handleRegenerate = () => {
    // Dispatch an event to trigger palette regeneration
    window.dispatchEvent(new CustomEvent(REGENERATE_PALETTES_EVENT));
  };

  return (
    <header className={cn('w-full bg-background', className)}>
      <div className="mx-auto flex w-full items-center justify-between bg-background px-5 lg:px-14 pt-3 pb-4 lg:pt-5 lg:pb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            search={(search) => {
              return {
                ...search,
                ...preferredOptions,
              };
            }}
          >
            <div className="md:w-[200px] relative flex items-center">
              <GrabientLogo />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div
            className={cn(
              'flex items-center justify-end',
              isSignedIn ? 'w-[48px] sm:w-[72px]' : 'w-[80px]',
            )}
          >
            {mounted ? (
              <>
                <SignedIn>
                  <div className="scale-130 relative right-[4px] top-[2px] transform-gpu origin-center">
                    <UserButton afterSignOutUrl={location.pathname} />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button
                      size="default"
                      variant="outline"
                      className="font-poppins cursor-pointer disable-animation-on-theme-change relative right-[2px]"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
              </>
            ) : (
              <div className="w-10 h-10 transform-gpu origin-center rounded-full bg-muted animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

// <div className="md:hidden px-4 pb-2 pt-1">
//   <div className="flex items-center justify-between w-full">
//     {/* Category carousel for mobile - only show on random route */}
//     {shouldShowControls && isRandomRoute && (
//       <div className="flex-grow overflow-hidden mx-2">
//         <CategorySelector />
//       </div>
//     )}

//     {/* Palette categories for seed route */}
//     {shouldShowControls && isSeedRoute && !isRandomRoute && seedPaletteColors.length > 0 && (
//       <div className="flex-grow overflow-hidden mx-2">
//         <PaletteCategoryDisplay colors={seedPaletteColors} />
//       </div>
//     )}

//     {/* Control buttons in a flex container */}
//     <div
//       className={cn('flex items-center gap-2 flex-shrink-0', {
//         'ml-auto': !shouldShowControls || (isSeedRoute && !isRandomRoute), // Push to right when on seed route or non-control routes
//       })}
//     >
//       {/* Regenerate button with tooltip - only show on random route */}
//       {shouldShowControls && isRandomRoute && (
//         <TooltipProvider>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleRegenerate}
//                 className="cursor-pointer h-8 w-8 p-1"
//               >
//                 <RefreshCw className="h-5 w-5" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Regenerate Palettes</p>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//       )}

//       {/* Settings button with tooltip */}
//       <Popover open={open} onOpenChange={setOpen}>
//         <TooltipProvider>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   aria-label="Open gradient settings"
//                   className="cursor-pointer h-8 w-8 p-1"
//                 >
//                   <Settings2 className="h-5 w-5" />
//                 </Button>
//               </PopoverTrigger>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Gradient Settings</p>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//         <PopoverContent className="w-[220px] p-3 bg-background border-border">
//           <div className="space-y-3">
//             <div className="space-y-1">
//               <h3 className="text-xs font-medium text-muted-foreground mb-2">Style</h3>
//               <div>
//                 <StyleSelect value={style} />
//               </div>
//             </div>

//             <div className="flex gap-2">
//               <div className="w-1/2 space-y-1">
//                 <h3 className="text-xs font-medium text-muted-foreground mb-2">Steps</h3>
//                 <StepsInput value={steps} />
//               </div>

//               <div className="w-1/2 space-y-1">
//                 <h3 className="text-xs font-medium text-muted-foreground mb-2">Angle</h3>
//                 <AngleInput value={angle} />
//               </div>
//             </div>
//           </div>
//         </PopoverContent>
//       </Popover>
//     </div>
//   </div>
// </div>
