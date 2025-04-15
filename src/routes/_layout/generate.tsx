import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  generateHarmoniousPalette,
  rgbToHex,
  type ColorHarmonyCategory,
  type PaletteResult,
} from '~/lib/harmoniousPaletteGenerator';
import { serializeCoeffs } from '~/lib/serialization';

// Configuration constants
const NUM_PALETTES_TO_GENERATE = 50;
const AVAILABLE_CATEGORIES: ColorHarmonyCategory[] = [
  'monochromatic',
  'analogous',
  'complementary',
  'split-complementary',
  'high-contrast',
  'pastel',
  'earthy',
  'random',
];

// Component interface definitions
interface PaletteDisplayProps {
  palette: PaletteResult;
  index: number;
}

interface CategorySelectorProps {
  selectedCategory: ColorHarmonyCategory;
  onChange: (category: ColorHarmonyCategory) => void;
}

export const Route = createFileRoute('/_layout/generate')({
  component: GeneratePage,
});

// Category selector component
const CategorySelector = ({ selectedCategory, onChange }: CategorySelectorProps) => {
  return (
    <div className="mb-4">
      <label htmlFor="category-select" className="block text-sm font-medium mb-1">
        Color Harmony Category:
      </label>
      <select
        id="category-select"
        value={selectedCategory}
        onChange={(e) => onChange(e.target.value as ColorHarmonyCategory)}
        className="block w-full md:w-64 px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {AVAILABLE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Convert a harmonious palette to a format compatible with the serialization function
 */
const convertPaletteToSerializableFormat = (palette: PaletteResult) => {
  // Check if we already have valid coeffs from the palette generator
  if (palette.coeffs && Array.isArray(palette.coeffs) && palette.coeffs.length === 4) {
    // Fix the coeffs to ensure all vectors have 1 as the last element
    const fixedCoeffs = palette.coeffs.map((vector) => {
      // Create a new vector with the first 3 elements from the original and 1 as the last element
      return [vector[0], vector[1], vector[2], 1] as [number, number, number, 1];
    }) as [
      [number, number, number, 1],
      [number, number, number, 1],
      [number, number, number, 1],
      [number, number, number, 1],
    ];

    return { coeffs: fixedCoeffs, globals: palette.globals };
  }

  // Fallback: Create coefficients from colors if coeffs are not available
  // Extract RGB values from the palette colors
  const colors = palette.colors.slice(0, 4); // Use up to 4 colors

  // Ensure we have exactly 4 colors by duplicating the last one if needed
  while (colors.length < 4) {
    colors.push(colors[colors.length - 1] || [0, 0, 0, 1]);
  }

  // Create coeffs in the format [[r,g,b,1], [r,g,b,1], [r,g,b,1], [r,g,b,1]]
  const coeffs = colors.map((color) => {
    // Normalize RGB values to [0,1] range if needed
    const r = color[0] <= 1 ? color[0] : color[0] / 255;
    const g = color[1] <= 1 ? color[1] : color[1] / 255;
    const b = color[2] <= 1 ? color[2] : color[2] / 255;

    return [r, g, b, 1] as [number, number, number, 1];
  }) as [
    [number, number, number, 1],
    [number, number, number, 1],
    [number, number, number, 1],
    [number, number, number, 1],
  ];

  // Create default globals
  const globals = palette.globals || ([0, 1, 1, 0] as [number, number, number, number]); // [exposure, contrast, frequency, phase]

  return { coeffs, globals };
};

// Component to display a single palette
const PaletteDisplay = ({ palette, index }: PaletteDisplayProps) => {
  // Generate seed by converting the palette to a serializable format
  let seed: string | undefined;

  try {
    // Convert the harmonious palette to a format compatible with serializeCoeffs
    const { coeffs, globals } = convertPaletteToSerializableFormat(palette);
    seed = serializeCoeffs(coeffs, globals);
  } catch (error) {
    console.error('Error serializing palette:', error);
    // Leave seed as undefined if serialization fails
  }

  const content = (
    <div className="mb-6 border rounded shadow p-3 hover:shadow-md transition-shadow">
      <div className="mb-2">
        <h3 className="text-lg font-medium">Palette #{index + 1}</h3>
        <p className="text-sm text-gray-500">
          <span className="capitalize">{palette.category.replace('-', ' ')}</span> palette
          <span className="ml-2">•</span>
          <span className="ml-2">Generated in {palette.attemptsTaken} attempts</span>
          {palette.quality && <span className="ml-2">• {palette.quality}</span>}
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

// Main component for the generate page
function GeneratePage() {
  const [palettes, setPalettes] = useState<PaletteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ColorHarmonyCategory>('random');

  // Generate palettes on component mount or when category changes
  useEffect(() => {
    generatePalettes();
  }, [selectedCategory]);

  // Function to generate palettes based on selected category
  const generatePalettes = async () => {
    setLoading(true);
    setPalettes([]); // Clear existing palettes

    // Use batched generation to prevent UI freeze
    const newPalettes: PaletteResult[] = [];

    for (let i = 0; i < NUM_PALETTES_TO_GENERATE; i += 5) {
      // Generate up to 5 palettes per batch
      const batchSize = Math.min(5, NUM_PALETTES_TO_GENERATE - i);

      const batchPalettes = Array.from({ length: batchSize }, () =>
        generateHarmoniousPalette({ category: selectedCategory }),
      );

      newPalettes.push(...batchPalettes);
      setPalettes([...newPalettes]); // Update UI with current progress

      // Allow UI to update between batches
      if (i + batchSize < NUM_PALETTES_TO_GENERATE) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    setLoading(false);
  };

  // Handler to regenerate palettes with the same category
  const handleRegenerate = () => {
    generatePalettes();
  };

  // Handler to change category and regenerate palettes
  const handleCategoryChange = (category: ColorHarmonyCategory) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-h-full overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Harmonious Palette Generator</h1>

      <div className="mb-6 sticky top-0 bg-white py-2 z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <CategorySelector selectedCategory={selectedCategory} onChange={handleCategoryChange} />

          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Regenerate Palettes'}
          </button>
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Current mode:{' '}
            <span className="font-medium capitalize">{selectedCategory.replace('-', ' ')}</span>
            {selectedCategory === 'monochromatic' &&
              ' - Variations of a single hue with different brightness and saturation'}
            {selectedCategory === 'analogous' &&
              ' - Colors that are adjacent on the color wheel (within 30-60 degrees)'}
            {selectedCategory === 'complementary' &&
              ' - Colors opposite each other on the color wheel'}
            {selectedCategory === 'split-complementary' &&
              ' - A base color and two colors adjacent to its complement'}
            {selectedCategory === 'high-contrast' && ' - Colors with maximum perceptual distance'}
            {selectedCategory === 'pastel' &&
              ' - Soft, light colors with high brightness and low saturation'}
            {selectedCategory === 'earthy' && ' - Colors found in nature (browns, greens, etc.)'}
            {selectedCategory === 'random' && ' - Completely random color generation'}
          </p>
        </div>
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
  );
}
