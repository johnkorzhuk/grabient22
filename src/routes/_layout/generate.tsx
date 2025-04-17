import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  generatePalettes,
  PaletteCategories,
  validateCategorySet,
  getIncompatibleCategories,
} from '~/lib/generation';
import type {
  PaletteCategoryKey,
  PaletteGenerationResult,
  PaletteGenerationOptions,
} from '~/lib/generation/types';
import { rgbToHex } from '~/lib/generation';
import { serializeCoeffs } from '~/lib/serialization';
import { cn } from '~/lib/utils';
import { RefreshCw } from 'lucide-react';
import { Checkbox } from '~/components/ui/checkbox';
import { Badge } from '~/components/ui/badge';

const AVAILABLE_CATEGORIES: PaletteCategoryKey[] = [
  'Monochromatic',
  'Pastel',
  'Earthy',
  'Complementary',
  'WarmDominant',
  'CoolDominant',
  'SplitComplementary',
  'Tetradic',
  'Neon',
  'Analogous',
  'Neutral',
  'High-Value',
  'Low-Value',
  'Random',
  // Additional categories would be listed here
];
// Known optimal category orderings for consistent results
// The key is a comma-separated list of categories, sorted alphabetically
const OPTIMAL_CATEGORY_ORDERS: Record<string, PaletteCategoryKey[]> = {
  'Complementary,Earthy': ['Earthy', 'Complementary'],
  'Earthy,Monochromatic': ['Monochromatic', 'Earthy'],
  'Earthy,Analogous': ['Earthy', 'Analogous'],
  'Analogous,Earthy': ['Earthy', 'Analogous'],
  'Monochromatic,Pastel': ['Monochromatic', 'Pastel'],
  'Complementary,Pastel': ['Complementary', 'Pastel'],
  'Tetradic,Pastel': ['Pastel', 'Tetradic'],
  'Pastel,Tetradic': ['Pastel', 'Tetradic'],
  'Pastel,SplitComplementary': ['Pastel', 'SplitComplementary'],
  'Pastel,Analogous': ['Pastel', 'Analogous'],
  'SplitComplementary,Pastel': ['Pastel', 'SplitComplementary'],
  'Analogous,Pastel': ['Pastel', 'Analogous'],
  'Neon,SplitComplementary': ['SplitComplementary', 'Neon'],
  'SplitComplementary,Neon': ['SplitComplementary', 'Neon'],
  'Monochromatic,Neon': ['Monochromatic', 'Neon'],
  'Neutral,Monochromatic': ['Monochromatic', 'Neutral'],
  'Monochromatic,Neutral': ['Monochromatic', 'Neutral'],
  'SplitComplementary,Earthy': ['Earthy', 'SplitComplementary'],
  'Earthy,SplitComplementary': ['Earthy', 'SplitComplementary'],
  'Low-Value,Neutral': ['Low-Value', 'Neutral'],
  'Neutral,Low-Value': ['Low-Value', 'Neutral'],
  'High-Value,Neutral': ['High-Value', 'Neutral'],
  'Neutral,High-Value': ['High-Value', 'Neutral'],
  'Low-Value,Earthy': ['Low-Value', 'Earthy'],
  'Earthy,Low-Value': ['Low-Value', 'Earthy'],
  'High-Value,Earthy': ['High-Value', 'Earthy'],
  'Earthy,High-Value': ['High-Value', 'Earthy'],
  'Analogous,Neutral': ['Neutral', 'Analogous'],
  'Neutral,Analogous': ['Neutral', 'Analogous'],
  'Analogous,Neon': ['Neon', 'Analogous'],
  'Neon,Analogous': ['Neon', 'Analogous'],
  'Tetradic,Neon': ['Tetradic', 'Neon'],
  'Neon,Tetradic': ['Tetradic', 'Neon'],
  'High-Value,SplitComplementary': ['High-Value', 'SplitComplementary'],
  'SplitComplementary,High-Value': ['High-Value', 'SplitComplementary'],
  'Low-Value,SplitComplementary': ['Low-Value', 'SplitComplementary'],
  'SplitComplementary,Low-Value': ['Low-Value', 'SplitComplementary'],
  'Low-Value,Tetradic': ['Low-Value', 'Tetradic'],
  'Tetradic,Low-Value': ['Low-Value', 'Tetradic'],
  'High-Value,Tetradic': ['High-Value', 'Tetradic'],
  'Tetradic,High-Value': ['High-Value', 'Tetradic'],
};

// Helper function to get optimal order
function getOptimalOrder(categories: PaletteCategoryKey[]): PaletteCategoryKey[] {
  // If only one category, no reordering needed
  if (categories.length <= 1) {
    return [...categories];
  }

  // Create a sorted key for lookup
  const lookupKey = [...categories].sort().join(',');

  // Check if we have an optimal order defined
  if (OPTIMAL_CATEGORY_ORDERS[lookupKey]) {
    return [...OPTIMAL_CATEGORY_ORDERS[lookupKey]];
  }

  // If no optimal order is defined, return the original order
  return [...categories];
}

// Component interface definitions
interface PaletteDisplayProps {
  palette: PaletteGenerationResult;
  index: number;
}

interface CategoryCheckboxProps {
  category: PaletteCategoryKey;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (category: PaletteCategoryKey, checked: boolean) => void;
}

export const Route = createFileRoute('/_layout/generate')({
  component: GeneratePage,
});

// Component to display a single palette
const PaletteDisplay = ({ palette, index }: PaletteDisplayProps) => {
  // Generate seed using palette's coeffs and globals
  let seed: string | undefined;

  try {
    // Use the palette's actual globals instead of default globals
    seed = serializeCoeffs(palette.coeffs, palette.globals);
  } catch (error) {
    console.error('Error serializing palette:', error);
    // Leave seed as undefined if serialization fails
  }

  const content = (
    <div className="mb-6 border rounded shadow p-3 hover:shadow-md transition-shadow">
      <div className="mb-2">
        <h3 className="text-lg font-medium">Palette #{index + 1}</h3>
        <p className="text-sm text-gray-500">
          {/* Show categories count */}
          {palette.appliedCategories && palette.appliedCategories.length > 0 ? (
            <span>
              {palette.appliedCategories.length}{' '}
              {palette.appliedCategories.length === 1 ? 'category' : 'categories'}
            </span>
          ) : (
            <span className="capitalize">
              {palette.category === 'Random'
                ? 'Random'
                : palette.category.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          )}

          <span className="ml-2">•</span>
          <span className="ml-2">
            Generated in {palette.attemptsTaken}{' '}
            {palette.attemptsTaken === 1 ? 'attempt' : 'attempts'}
          </span>
        </p>

        {/* Display category badges */}
        {palette.appliedCategories && palette.appliedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {palette.appliedCategories.map((cat, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex h-12 rounded overflow-hidden">
        {palette.colors.map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: rgbToHex(color) }}
            title={`${rgbToHex(color)}`}
          ></div>
        ))}
      </div>
      <div className="flex text-xs mt-1 text-center">
        {palette.colors.map((color, i) => (
          <div key={i} className="flex-1 overflow-hidden">
            {rgbToHex(color)}
          </div>
        ))}
      </div>

      {palette.basicColors.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <p>
            Contains:{' '}
            {palette.basicColors
              .slice(0, 3)
              .map((c) => c.name)
              .join(', ')}
            {palette.basicColors.length > 3 ? '...' : ''}
          </p>
        </div>
      )}
    </div>
  );

  // Only wrap with Link if we have a valid seed
  if (seed) {
    // Calculate recommended steps based on categories
    const recommendedSteps =
      palette.appliedCategories && palette.appliedCategories.length > 0
        ? Math.max(
            ...palette.appliedCategories.map((cat) => PaletteCategories[cat].recommendedColorStops),
          )
        : PaletteCategories[palette.category].recommendedColorStops;

    return (
      <Link
        to="/$seed"
        params={{ seed }}
        search={(search) => ({
          rowHeight: 6,
          style: 'linearSwatches',
          steps: recommendedSteps,
        })}
        className="block"
        aria-label={`Gradient ${index + 1}`}
      >
        {content}
      </Link>
    );
  }

  // Otherwise just return the content without a link
  return content;
};

// Category checkbox for multi-selection
const CategoryCheckbox = ({
  category,
  isSelected,
  isDisabled,
  onToggle,
}: CategoryCheckboxProps) => {
  const categoryInfo = PaletteCategories[category];

  return (
    <div
      className={cn(
        'flex items-center space-x-2 p-2 rounded-md',
        isSelected && 'bg-secondary/10',
        isDisabled && 'opacity-50',
      )}
    >
      <Checkbox
        id={`category-${category}`}
        checked={isSelected}
        disabled={isDisabled}
        onCheckedChange={(checked) => {
          if (typeof checked === 'boolean') {
            onToggle(category, checked);
          }
        }}
      />
      <div className="flex flex-col flex-grow">
        <label
          htmlFor={`category-${category}`}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            isDisabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {/* Format the category name for display */}
          {category === 'Random' ? 'Random' : category.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <p className="text-xs text-muted-foreground">{categoryInfo.description}</p>
      </div>
    </div>
  );
};

// Main component for the generate page
function GeneratePage() {
  const [palettes, setPalettes] = useState<PaletteGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-category selection state
  const [selectedCategories, setSelectedCategories] = useState<PaletteCategoryKey[]>(['Earthy']);

  // Generate palettes on component mount or when selection changes
  useEffect(() => {
    if (selectedCategories.length > 0) {
      generateAllPalettes();
    }
  }, [selectedCategories]);

  // Handle category toggle
  const handleCategoryToggle = (category: PaletteCategoryKey, checked: boolean) => {
    if (checked) {
      // Find conflicting categories
      const conflictingCategories = selectedCategories.filter((selected) => {
        return (
          PaletteCategories[selected].exclusiveWith.includes(category) ||
          PaletteCategories[category].exclusiveWith.includes(selected)
        );
      });

      // Create new selection by removing conflicts and adding the new category
      const newSelection = [
        ...selectedCategories.filter((c) => !conflictingCategories.includes(c)),
        category,
      ];

      setSelectedCategories(newSelection);
    } else {
      // Handle deselection
      const newSelection = selectedCategories.filter((c) => c !== category);

      // If empty, default to Random
      if (newSelection.length === 0) {
        setSelectedCategories(['Random']);
      } else {
        setSelectedCategories(newSelection);
      }
    }
  };

  // Function to generate palettes
  const generateAllPalettes = () => {
    if (selectedCategories.length === 0) {
      return;
    }

    setLoading(true);
    setPalettes([]); // Clear existing palettes

    try {
      // Initialize options with proper typing
      const options: PaletteGenerationOptions = {};

      // Get the optimal category order to ensure consistent results
      // regardless of the order categories were selected in the UI
      const orderedCategories = getOptimalOrder([...selectedCategories]);

      // Use first category as main category and the rest as additional
      const mainCategory = orderedCategories[0];
      const additionalCategories = orderedCategories.slice(1);

      if (additionalCategories.length > 0) {
        options.additionalCategories = additionalCategories;
      }

      const newPalettes = generatePalettes(96, mainCategory, options);

      // Update state with the generated palettes
      setPalettes(newPalettes);
    } catch (error) {
      console.error('Error generating palettes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler to regenerate palettes
  const handleRegenerate = () => {
    generateAllPalettes();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-h-full overflow-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - Palettes */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Harmonious Palette Generator</h1>

            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Regenerate Palettes"
            >
              <RefreshCw
                className={cn(
                  'h-5 w-5 text-gray-700 dark:text-gray-300',
                  loading && 'animate-spin',
                )}
              />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generating {/* Display selected categories */}
              {selectedCategories.length > 0 ? (
                <>
                  {selectedCategories.map((cat, index) => (
                    <span key={cat}>
                      {index > 0 && ' + '}
                      <span>
                        {cat === 'Random' ? 'random' : cat.toLowerCase().replace(/-/g, ' ')}
                      </span>
                    </span>
                  ))}
                </>
              ) : (
                'random'
              )}{' '}
              palettes
            </p>
          </div>

          {loading && palettes.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg">Generating palettes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
              {palettes.map((palette, index) => (
                <PaletteDisplay key={index} palette={palette} index={index} />
              ))}

              {palettes.length === 0 && !loading && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">
                    No palettes could be generated with the current settings.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try different category combinations for better results.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column - Controls */}
        <div className="w-full md:w-1/3 lg:w-1/4 sticky top-4 self-start">
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="font-medium mb-2">Category Selection</h3>

              {/* Category multi-selection with checkboxes */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                {AVAILABLE_CATEGORIES.map((category) => (
                  <CategoryCheckbox
                    key={category}
                    category={category}
                    isSelected={selectedCategories.includes(category)}
                    isDisabled={false}
                    onToggle={handleCategoryToggle}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select one or more categories to generate palettes. Each category applies specific
                color theory rules to create harmonious color combinations.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Click on any palette to explore its gradient settings and customize further.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
