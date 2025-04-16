import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  generatePalettes,
  PaletteCategories,
  validateCategorySet,
  getIncompatibleCategories,
  getGlobalBoundsForCategories,
} from '~/lib/generation';
import type {
  PaletteCategoryKey,
  PaletteGenerationResult,
  GlobalModifierBounds,
  PaletteGenerationOptions,
} from '~/lib/generation/types';
import { rgbToHex } from '~/lib/generation';
import { serializeCoeffs } from '~/lib/serialization';
import { DualRangeSlider } from '~/components/DualRangeSlider';
import { cn } from '~/lib/utils';
import { COEFF_PRECISION } from '~/validators';
import { RefreshCw, Info } from 'lucide-react';
import { Checkbox } from '~/components/ui/checkbox';
import { Badge } from '~/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

// Configuration constants
const AVAILABLE_CATEGORIES: PaletteCategoryKey[] = [
  'Monochromatic',
  'Pastel',
  'Earthy',
  'Random',
  // Additional categories would be listed here
];

// Component interface definitions
interface PaletteDisplayProps {
  palette: PaletteGenerationResult;
  index: number;
}

interface GlobalModifierItemProps {
  label: string;
  value: [number, number]; // Range with min/max values
  min: number;
  max: number;
  step: number;
  isVisible: boolean;
  onValueChange: (value: [number, number]) => void;
  onDragEnd: () => void;
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

// Global modifier item component
const GlobalModifierItem = ({
  label,
  value,
  min,
  max,
  step,
  isVisible,
  onValueChange,
  onDragEnd,
}: GlobalModifierItemProps) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'flex flex-col relative',
        'rounded',
        'hover:bg-gray-50 dark:hover:bg-gray-900/30',
        'transition-all',
        'gap-5 p-2 pl-3 -ml-3',
        '2xl:gap-4 2xl:p-2 2xl:pl-4 2xl:-ml-4',
      )}
    >
      <div className={cn('flex justify-between')}>
        <label className={cn('text-sm font-medium')}>{label}</label>
        <span className={cn('text-sm', 'text-gray-500')}>
          {value[0].toFixed(COEFF_PRECISION)} - {value[1].toFixed(COEFF_PRECISION)}
        </span>
      </div>
      <DualRangeSlider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        onMouseUp={onDragEnd}
        onKeyUp={onDragEnd}
        onPointerUp={onDragEnd}
      />
    </div>
  );
};

// Main component for the generate page
function GeneratePage() {
  const [palettes, setPalettes] = useState<PaletteGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-category selection state
  const [selectedCategories, setSelectedCategories] = useState<PaletteCategoryKey[]>([
    'Monochromatic',
  ]);

  // Global modifiers state - using [min, max] ranges
  const [exposureRange, setExposureRange] = useState<[number, number]>([-0.5, 0.5]);
  const [contrastRange, setContrastRange] = useState<[number, number]>([0.8, 1.2]);
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([0.8, 1.2]);

  // Global bounds based on selected categories
  const [globalBounds, setGlobalBounds] = useState<GlobalModifierBounds>({
    exposure: [-0.5, 0.5],
    contrast: [0.8, 1.2],
    frequency: [0.8, 1.2],
  });

  // Update global bounds when category selection changes
  useEffect(() => {
    if (selectedCategories.length > 0) {
      // Get combined bounds for all selected categories
      const bounds = getGlobalBoundsForCategories(selectedCategories);
      setGlobalBounds(bounds);

      // Set ranges based on bounds, maintaining current values if they're within bounds
      // Exposure
      if (bounds.exposure) {
        const [min, max] = bounds.exposure;
        setExposureRange([
          Math.max(min, Math.min(exposureRange[0], max)),
          Math.max(min, Math.min(exposureRange[1], max)),
        ]);
      }

      // Contrast
      if (bounds.contrast) {
        const [min, max] = bounds.contrast;
        setContrastRange([
          Math.max(min, Math.min(contrastRange[0], max)),
          Math.max(min, Math.min(contrastRange[1], max)),
        ]);
      }

      // Frequency
      if (bounds.frequency) {
        const [min, max] = bounds.frequency;
        setFrequencyRange([
          Math.max(min, Math.min(frequencyRange[0], max)),
          Math.max(min, Math.min(frequencyRange[1], max)),
        ]);
      }
    }
  }, [selectedCategories]);

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

      // Only add initialGlobals if a single category is selected
      if (selectedCategories.length === 1) {
        options.initialGlobals = {};

        // Only add a global if it's visible
        if (globalBounds.exposure) {
          options.initialGlobals.exposure = (exposureRange[0] + exposureRange[1]) / 2;
        }

        if (globalBounds.contrast) {
          options.initialGlobals.contrast = (contrastRange[0] + contrastRange[1]) / 2;
        }

        if (globalBounds.frequency) {
          options.initialGlobals.frequency = (frequencyRange[0] + frequencyRange[1]) / 2;
        }
      }

      // Use first category as main category and the rest as additional
      const mainCategory = selectedCategories[0];
      const additionalCategories = selectedCategories.slice(1);

      if (additionalCategories.length > 0) {
        options.additionalCategories = additionalCategories;
      }

      const newPalettes = generatePalettes(100, mainCategory, options);

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
                    Try different category combinations or adjust the global modifiers.
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

            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Global Modifiers</h3>

                {/* Info tooltip about combined bounds */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-blue-500">
                      <Info className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {selectedCategories.length > 1
                        ? 'Global modifiers are disabled when multiple categories are selected.'
                        : 'These controls use the combined bounds from all selected categories. Some modifiers may not be available for certain category combinations.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Only show global modifiers if a single category is selected */}
              {selectedCategories.length === 1 ? (
                <>
                  {/* Exposure Slider */}
                  <GlobalModifierItem
                    label="Exposure"
                    value={exposureRange}
                    min={globalBounds.exposure ? globalBounds.exposure[0] : -1}
                    max={globalBounds.exposure ? globalBounds.exposure[1] : 1}
                    step={0.001}
                    isVisible={!!globalBounds.exposure}
                    onValueChange={setExposureRange}
                    onDragEnd={handleRegenerate}
                  />

                  {/* Contrast Slider */}
                  <GlobalModifierItem
                    label="Contrast"
                    value={contrastRange}
                    min={globalBounds.contrast ? globalBounds.contrast[0] : 0}
                    max={globalBounds.contrast ? globalBounds.contrast[1] : 2}
                    step={0.001}
                    isVisible={!!globalBounds.contrast}
                    onValueChange={setContrastRange}
                    onDragEnd={handleRegenerate}
                  />

                  {/* Frequency Slider */}
                  <GlobalModifierItem
                    label="Frequency"
                    value={frequencyRange}
                    min={globalBounds.frequency ? globalBounds.frequency[0] : 0}
                    max={globalBounds.frequency ? globalBounds.frequency[1] : 2}
                    step={0.001}
                    isVisible={!!globalBounds.frequency}
                    onValueChange={setFrequencyRange}
                    onDragEnd={handleRegenerate}
                  />

                  {/* Message when no controls are available */}
                  {!globalBounds.exposure && !globalBounds.contrast && !globalBounds.frequency && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>No global modifiers are available for the current category selection.</p>
                    </div>
                  )}
                </>
              ) : (
                // Message when multiple categories are selected
                <div className="mt-2 text-xs text-gray-500">
                  <p>Global modifiers are disabled when multiple categories are selected.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
