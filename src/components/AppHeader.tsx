import { ThemeToggle } from './theme/ThemeToggle';
import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import { useMatches } from '@tanstack/react-router';
import { Route as SeedRoute } from '~/routes/_layout/$seed';
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
import { Badge } from './ui/badge';
import { cn } from '~/lib/utils';
import { PALETTE_CATEGORIES, getCategoryDisplayName } from '~/validators';
import type { PaletteCategoryKey } from '~/validators';
import { DEFAULT_CATEGORIES, paletteStore$, REGENERATE_PALETTES_EVENT } from '~/stores/palette';
import { observer, use$ } from '@legendapp/state/react';
import { PaletteCategories } from '~/lib/generation';
import { Carousel, CarouselContent, CarouselItem } from '~/components/ui/carousel';
import { PaletteCategoryDisplay } from './PaletteCategoryDisplay';
import { useMounted } from '@mantine/hooks';
import { LayoutToggle } from './LayoutToggle';
import { uiTempStore$ } from '~/stores/ui';
import { GrabientLogo } from './GrabientLogo';

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

export const AppHeader = observer(function AppHeader() {
  const { style, steps, angle } = useSearch({
    from: '/_layout',
  });
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
    <header className="w-full border-b border-border bg-background ">
      <div className="mx-auto flex w-full items-center justify-between border-b border-border bg-background px-4 py-2">
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
            <div className="md:w-[168px] relative">
              <GrabientLogo />
            </div>
          </Link>

          <LayoutToggle />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://iquilezles.org/articles/palettes/"
            target="_blank"
            rel="noopener noreferrer external"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            aria-label="Article on cosine gradients by Inigo Quilez (opens in a new window)"
          >
            About
            <span className="sr-only">(opens in a new window)</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-external-link"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <ThemeToggle />
          <div
            className={cn('flex items-center justify-end', isSignedIn ? 'w-[30px]' : 'w-[60px]')}
          >
            {mounted ? (
              <>
                <SignedIn>
                  <UserButton afterSignOutUrl={location.pathname} />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer disable-animation-on-theme-change"
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                </SignedOut>
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile controls - only visible below md breakpoint */}
      <div className="md:hidden px-4 pb-2 pt-1">
        <div className="flex items-center justify-between w-full">
          {/* Category carousel for mobile - only show on random route */}
          {shouldShowControls && isRandomRoute && (
            <div className="flex-grow overflow-hidden mr-2">
              <CategorySelector />
            </div>
          )}

          {/* Palette categories for seed route */}
          {shouldShowControls && isSeedRoute && !isRandomRoute && seedPaletteColors.length > 0 && (
            <div className="flex-grow overflow-hidden mr-2">
              <PaletteCategoryDisplay colors={seedPaletteColors} />
            </div>
          )}

          {/* Control buttons in a flex container */}
          <div
            className={cn('flex items-center gap-2 flex-shrink-0', {
              'ml-auto': !shouldShowControls || (isSeedRoute && !isRandomRoute), // Push to right when on seed route or non-control routes
            })}
          >
            {/* Regenerate button with tooltip - only show on random route */}
            {shouldShowControls && isRandomRoute && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerate}
                      className="cursor-pointer h-8 w-8 p-1"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Regenerate Palettes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Settings button with tooltip */}
            <Popover open={open} onOpenChange={setOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Open gradient settings"
                        className="cursor-pointer h-8 w-8 p-1"
                      >
                        <Settings2 className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gradient Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent className="w-[220px] p-3 bg-background border-border">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Style</h3>
                    <div>
                      <StyleSelect value={style} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-1/2 space-y-1">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2">Steps</h3>
                      <StepsInput value={steps} />
                    </div>

                    <div className="w-1/2 space-y-1">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2">Angle</h3>
                      <AngleInput value={angle} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
});
