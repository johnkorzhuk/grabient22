import { StyleSelect } from './header/StyleSelect';
import { StepsInput } from './header/StepsInput';
import { AngleInput } from './header/AngleInput';
import { useSearch, useLocation, useNavigate } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { PaletteCategories } from '~/lib/generation';
import { PALETTE_CATEGORIES } from '~/validators';
import type { PaletteCategoryKey } from '~/validators';
import { observer, use$ } from '@legendapp/state/react';
import { DEFAULT_CATEGORIES, paletteStore$, REGENERATE_PALETTES_EVENT } from '~/stores/palette';
import { PaletteCategorySidebar } from './PaletteCategorySidebar';
import { CategoryBadge } from './CategoryBadge';
import { Navigation } from './Navigation';

// Category selector component
const CategorySelector = observer(function CategorySelector() {
  let randomSearch;

  try {
    randomSearch = useSearch({
      from: '/_layout/random',
    });
  } catch (error) {}

  let selectedCategories = use$(paletteStore$.categories) ?? DEFAULT_CATEGORIES;
  const searchCategories = randomSearch?.categories ?? DEFAULT_CATEGORIES;
  const isCategoriesEqual =
    selectedCategories.length === searchCategories.length &&
    selectedCategories.every((c, i) => c === searchCategories[i]);
  if (!isCategoriesEqual) selectedCategories = searchCategories;

  const navigate = useNavigate({
    from: '/random',
  });

  // Handler to regenerate palettes via event
  const handleRegenerate = () => {
    // Dispatch an event to trigger palette regeneration
    window.dispatchEvent(new CustomEvent(REGENERATE_PALETTES_EVENT));
  };

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

    paletteStore$.categories.set(newCategories);

    // Update URL with new categories using TanStack Router
    navigate({
      search: (s) => s,
      replace: true,
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-medium text-muted-foreground">Categories</h3>
        <button
          onClick={handleRegenerate}
          className="cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Regenerate Palettes"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {sortedCategories.map((category) => (
          <CategoryBadge
            key={category}
            category={category}
            isSelected={selectedCategories.includes(category)}
            onClick={() => handleCategoryToggle(category)}
          />
        ))}
      </div>
    </div>
  );
});

type SidebarProps = {
  isSeedRoute: boolean;
};

export const Sidebar = observer(function Sidebar({ isSeedRoute }: SidebarProps) {
  const { style, steps, angle } = useSearch({
    from: '/_layout',
  });

  const location = useLocation();
  const isRandomRoute = location.pathname === '/random';

  // Always get the palette colors, regardless of route
  // This ensures hooks are called in the same order on every render
  const seedPaletteColors = use$(paletteStore$.seedPaletteColors);

  return (
    <aside className="w-[200px] h-full border-r border-border bg-background px-4 py-2 flex flex-col gap-2">
      {/* Navigation Links */}
      <div className="space-y-1">
        <Navigation />
      </div>

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

      {/* Category Selector - only visible on md and larger screens */}
      {isRandomRoute && <CategorySelector />}

      {/* Palette Categories for seed route */}
      {isSeedRoute && <PaletteCategorySidebar colors={seedPaletteColors} />}

      {/* Spacer to push legacy link to bottom */}
      <div className="flex-grow" />

      {/* Legacy site link */}
      <div className="pt-2 border-t border-border mt-2 pb-1">
        <a
          href="https://old.grabient.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <span>Legacy site</span>
        </a>
      </div>
    </aside>
  );
});
