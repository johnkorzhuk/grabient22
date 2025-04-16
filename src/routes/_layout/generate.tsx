import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { generatePalettes, PaletteCategories } from '~/lib/generation';
import type { PaletteCategoryKey, PaletteGenerationResult } from '~/lib/generation/types';
import { rgbToHex } from '~/lib/generation';
import { serializeCoeffs } from '~/lib/serialization';
import { DualRangeSlider } from '~/components/DualRangeSlider';
import { cn } from '~/lib/utils';
import { COEFF_PRECISION } from '~/validators';
import { RefreshCw } from 'lucide-react';

// Configuration constants
const AVAILABLE_CATEGORIES: PaletteCategoryKey[] = [
  'Monochromatic',
  'Pastel',
  'Earthy',
  'Random',
  // 'Analogous',
  // 'Complementary',
  // 'Split-Complementary',
  // 'Triadic',
  // 'Tetradic',
  // 'Hexadic',
  // 'Warm-Dominant',
  // 'Cool-Dominant',
  // 'Temperature-Balanced',
  // 'Neutral',
  // 'High-Value',
  // 'Low-Value',
  // 'Jewel-Tones',
  // 'Neon',
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
  onValueChange: (value: [number, number]) => void;
  onDragEnd: () => void;
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
          <span className="capitalize">
            {palette.category === 'Random'
              ? 'Random'
              : palette.category.replace(/([A-Z])/g, ' $1').trim()}
          </span>{' '}
          palette
          <span className="ml-2">•</span>
          <span className="ml-2">
            Generated in {palette.attemptsTaken}{' '}
            {palette.attemptsTaken === 1 ? 'attempt' : 'attempts'}
          </span>
        </p>
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
    return (
      <Link
        to="/$seed"
        params={{ seed }}
        search={(search) => ({
          rowHeight: 6,
          style: 'linearSwatches',
          steps: PaletteCategories[palette.category].recommendedColorStops,
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

// Global modifier item component
const GlobalModifierItem = ({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  onDragEnd,
}: GlobalModifierItemProps) => {
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
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategoryKey>('Monochromatic');

  // Global modifiers state - now using [min, max] ranges
  const [exposureRange, setExposureRange] = useState<[number, number]>([-0.5, 0.5]);
  const [contrastRange, setContrastRange] = useState<[number, number]>([0.8, 1.2]);
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([0.8, 1.2]);

  // Update global modifiers when category changes
  useEffect(() => {
    const bounds = PaletteCategories[selectedCategory].initialGlobalsBounds;

    // Set exposure range from bounds or default
    if (bounds.exposure) {
      setExposureRange([bounds.exposure[0], bounds.exposure[1]]);
    } else {
      // Use default range from validators if bounds are null
      setExposureRange([-1, 1]);
    }

    // Set contrast range from bounds or default
    if (bounds.contrast) {
      setContrastRange([bounds.contrast[0], bounds.contrast[1]]);
    } else {
      // Use default range from validators if bounds are null
      setContrastRange([0, 2]);
    }

    // Set frequency range from bounds or default
    if (bounds.frequency) {
      setFrequencyRange([bounds.frequency[0], bounds.frequency[1]]);
    } else {
      // Use default range from validators if bounds are null
      setFrequencyRange([0, 2]);
    }
  }, [selectedCategory]);

  // Generate palettes on component mount or when category changes
  useEffect(() => {
    generateAllPalettes();
  }, [selectedCategory]);

  // Function to generate palettes
  const generateAllPalettes = useCallback(async () => {
    setLoading(true);
    setPalettes([]); // Clear existing palettes

    try {
      // Use the new generator system to create palettes with global modifiers
      // Using the average of the min/max values from each range
      const newPalettes = generatePalettes(100, selectedCategory, {
        initialGlobals: {
          exposure: (exposureRange[0] + exposureRange[1]) / 2,
          contrast: (contrastRange[0] + contrastRange[1]) / 2,
          frequency: (frequencyRange[0] + frequencyRange[1]) / 2,
        },
      });
      console.log({ newPalettes });

      // Update state with the generated palettes
      setPalettes(newPalettes);
    } catch (error) {
      console.error('Error generating palettes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, exposureRange, contrastRange, frequencyRange]);

  // Handler to regenerate palettes with the same category
  const handleRegenerate = () => {
    generateAllPalettes();
  };

  // Handler to change category and regenerate palettes
  const handleCategoryChange = (category: PaletteCategoryKey) => {
    setSelectedCategory(category);
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
              Generating{' '}
              {selectedCategory === 'Random'
                ? 'random'
                : selectedCategory.toLowerCase().replace(/-/g, ' ')}{' '}
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
            </div>
          )}
        </div>

        {/* Right column - Controls */}
        <div className="w-full md:w-1/3 lg:w-1/4 sticky top-4 self-start">
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 shadow-sm">
            <div className="mb-4">
              <label htmlFor="category-select" className="block text-sm font-medium mb-1">
                Color Harmony Category:
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value as PaletteCategoryKey)}
                className="block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {AVAILABLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {/* Format the category name for display */}
                    {category === 'Random' ? 'Random' : category.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-5">
              <h3 className="text-sm font-semibold">Global Modifiers</h3>

              {/* Exposure Slider - only show if not null in initialGlobalsBounds */}
              {PaletteCategories[selectedCategory].initialGlobalsBounds.exposure !== null && (
                <GlobalModifierItem
                  label="Exposure"
                  value={exposureRange}
                  min={-1} // Full range from validators
                  max={1} // Full range from validators
                  step={0.001}
                  onValueChange={setExposureRange}
                  onDragEnd={handleRegenerate}
                />
              )}

              {/* Contrast Slider - only show if not null in initialGlobalsBounds */}
              {PaletteCategories[selectedCategory].initialGlobalsBounds.contrast !== null && (
                <GlobalModifierItem
                  label="Contrast"
                  value={contrastRange}
                  min={0} // Full range from validators
                  max={2} // Full range from validators
                  step={0.001}
                  onValueChange={setContrastRange}
                  onDragEnd={handleRegenerate}
                />
              )}

              {/* Frequency Slider - only show if not null in initialGlobalsBounds */}
              {PaletteCategories[selectedCategory].initialGlobalsBounds.frequency !== null && (
                <GlobalModifierItem
                  label="Frequency"
                  value={frequencyRange}
                  min={0} // Full range from validators
                  max={2} // Full range from validators
                  step={0.001}
                  onValueChange={setFrequencyRange}
                  onDragEnd={handleRegenerate}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
