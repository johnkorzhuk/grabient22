import { observable } from '@legendapp/state';
import type {
  RGBAVector,
  AppCollection,
  CollectionStyle,
  CosineCoeffs,
  CosineGlobals,
} from '~/types';
import { filterIncompatibleCategories } from '~/lib/generation';
import type { PaletteGenerationOptions } from '~/lib/generation/types';
import { type PaletteCategoryKey } from '~/validators';
import { serializeCoeffs } from '~/lib/serialization';
import type { Id } from '../../convex/_generated/dataModel';

// Type definition for the worker API
interface WorkerAPI {
  generatePalettes(
    count: number,
    category: PaletteCategoryKey,
    options?: PaletteGenerationOptions,
  ): Promise<
    Array<{
      seed: string;
      coeffs: CosineCoeffs;
      globals: CosineGlobals;
    } | null>
  >;
}

export const DEFAULT_CATEGORIES = ['Random'] as PaletteCategoryKey[];

// Known optimal category orderings for consistent results
// The key is a comma-separated list of categories, sorted alphabetically
const OPTIMAL_CATEGORY_ORDERS: Record<string, PaletteCategoryKey[]> = {
  // Basic combinations
  'Complementary,Earthy': ['Earthy', 'Complementary'],
  'Earthy,Monochromatic': ['Monochromatic', 'Earthy'],
  'Earthy,Analogous': ['Earthy', 'Analogous'],
  'Analogous,Earthy': ['Earthy', 'Analogous'],
  'Monochromatic,Pastel': ['Monochromatic', 'Pastel'],
  // 'Complementary,Pastel': ['Complementary', 'Pastel'],
  // 'Pastel,Complementary': ['Complementary', 'Pastel'],
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

  // Combinations with Dark
  'Dark,Neutral': ['Dark', 'Neutral'],
  'Neutral,Dark': ['Dark', 'Neutral'],
  'Dark,Earthy': ['Dark', 'Earthy'],
  'Earthy,Dark': ['Dark', 'Earthy'],
  'Dark,SplitComplementary': ['Dark', 'SplitComplementary'],
  'SplitComplementary,Dark': ['Dark', 'SplitComplementary'],
  'Dark,Tetradic': ['Dark', 'Tetradic'],
  'Tetradic,Dark': ['Dark', 'Tetradic'],
  'Dark,Complementary': ['Dark', 'Complementary'],
  'Complementary,Dark': ['Dark', 'Complementary'],

  // Combinations with Bright
  'Bright,Neutral': ['Bright', 'Neutral'],
  'Neutral,Bright': ['Bright', 'Neutral'],
  'Bright,Earthy': ['Bright', 'Earthy'],
  'Earthy,Bright': ['Bright', 'Earthy'],
  'Bright,SplitComplementary': ['Bright', 'SplitComplementary'],
  'SplitComplementary,Bright': ['Bright', 'SplitComplementary'],
  'Bright,Tetradic': ['Bright', 'Tetradic'],
  'Tetradic,Bright': ['Bright', 'Tetradic'],

  // Other combinations
  'Analogous,Neutral': ['Neutral', 'Analogous'],
  'Neutral,Analogous': ['Neutral', 'Analogous'],
  'Analogous,Neon': ['Neon', 'Analogous'],
  'Neon,Analogous': ['Neon', 'Analogous'],
  'Tetradic,Neon': ['Tetradic', 'Neon'],
  'Neon,Tetradic': ['Tetradic', 'Neon'],

  // Combinations with Warm
  'Cool,Warm': ['Cool', 'Warm'],
  'Warm,Cool': ['Warm', 'Cool'],
  'Warm,Earthy': ['Warm', 'Earthy'],
  'Earthy,Warm': ['Earthy', 'Warm'],
  'Warm,Neutral': ['Warm', 'Neutral'],
  'Neutral,Warm': ['Neutral', 'Warm'],
  'Warm,Bright': ['Warm', 'Bright'],
  'Bright,Warm': ['Bright', 'Warm'],
  'Warm,Dark': ['Warm', 'Dark'],
  'Dark,Warm': ['Dark', 'Warm'],

  // Combinations with Cool
  'Cool,Earthy': ['Cool', 'Earthy'],
  'Earthy,Cool': ['Earthy', 'Cool'],
  'Cool,Neutral': ['Cool', 'Neutral'],
  'Neutral,Cool': ['Neutral', 'Cool'],
  'Cool,Bright': ['Cool', 'Bright'],
  'Bright,Cool': ['Bright', 'Cool'],
  'Cool,Dark': ['Cool', 'Dark'],
  'Dark,Cool': ['Dark', 'Cool'],
  'Cool,Neon': ['Cool', 'Neon'],
  'Neon,Cool': ['Neon', 'Cool'],
};

// Constants for palette generation
const REQUIRED_PALETTES = 96;
const BATCH_SIZE = 96;

// Create a custom event for regenerating palettes
export const REGENERATE_PALETTES_EVENT = 'regenerate-palettes';

// Helper function to get optimal order
function getOptimalOrder(categories: PaletteCategoryKey[]): PaletteCategoryKey[] {
  if (categories.length <= 1) {
    return [...categories];
  }

  // Sort categories alphabetically to create a consistent key
  const sortedCategories = [...categories].sort();
  const key = sortedCategories.join(',');

  // Check if we have an optimal order for this combination
  if (key in OPTIMAL_CATEGORY_ORDERS) {
    return OPTIMAL_CATEGORY_ORDERS[key];
  }

  // If no optimal order is defined, return the original order
  return [...categories];
}

// Store for sharing palette data between components
export const paletteStore$ = observable({
  // Current palette colors for the seed route
  seedPaletteColors: [] as RGBAVector[],

  // Cache for generated palettes, keyed by category combination
  cachedPalettes: {} as Record<string, AppCollection[]>,

  // Flag to indicate if palettes are being generated
  isGenerating: false,

  categories: ['Random'] as PaletteCategoryKey[],
});

// Generate palettes for the given categories
export async function generatePalettesForCategories(
  categories: PaletteCategoryKey[],
  steps: number,
  angle: number,
  style: string,
  workerApi: any,
  signal: AbortSignal,
  forceRegenerate = false,
): Promise<AppCollection[]> {
  // Create a key for the cache based on the categories
  const cacheKey = categories.slice().sort().join(',');

  // Check if we already have cached palettes for these categories
  const existingPalettes = paletteStore$.cachedPalettes[cacheKey]?.get();
  if (!forceRegenerate && existingPalettes && existingPalettes.length > 0) {
    return existingPalettes;
  }

  // Set generating flag
  paletteStore$.isGenerating.set(true);

  try {
    let allCollections: AppCollection[] = [];
    let attempts = 0;
    let noProgressCount = 0;

    // Keep generating palettes until we have 96 total or reach the maximum number of attempts (333)
    while (allCollections.length < REQUIRED_PALETTES && attempts < 333) {
      // Check if we should abort
      if (signal.aborted) {
        break;
      }

      const compatibleCategories = filterIncompatibleCategories(categories);
      if (compatibleCategories.length === 0) {
        break; // Silently stop if no compatible categories
      }

      const orderedCategories = getOptimalOrder([...compatibleCategories]);
      const mainCategory = orderedCategories[0];
      const additionalCategories = orderedCategories.slice(1);

      const options: PaletteGenerationOptions = {};
      if (additionalCategories.length > 0) {
        options.additionalCategories = additionalCategories;
      }

      const remainingNeeded = REQUIRED_PALETTES - allCollections.length;
      const currentBatchSize = Math.min(BATCH_SIZE, remainingNeeded);

      // Generate a small batch
      const newPalettes = await (workerApi as WorkerAPI).generatePalettes(
        currentBatchSize,
        mainCategory,
        options,
      );

      // Check again if we should abort
      if (signal.aborted) {
        break;
      }

      const validPalettes = newPalettes.filter((p): p is NonNullable<typeof p> => p !== null);

      if (validPalettes.length === 0) {
        noProgressCount++;
        if (noProgressCount > 10) {
          console.warn('Reducing batch size due to lack of progress');
          const reducedBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
          if (reducedBatchSize < 1) {
            break; // Silently stop if unable to generate any more palettes
          }
        }
        attempts++; // Count attempts even when no valid palettes are generated
        continue;
      } else {
        noProgressCount = 0;
      }

      // Convert to AppCollection format
      const newCollections: AppCollection[] = validPalettes.map((palette, index) => {
        // Generate a seed if it doesn't exist
        // Cast the coeffs to the expected type for serializeCoeffs
        const typedCoeffs = palette.coeffs;
        const seed = palette.seed || serializeCoeffs(typedCoeffs, palette.globals);
        // Create a unique ID using the seed and index
        const id = `${seed}_${allCollections.length + index}`;

        // Cast the coeffs and globals to the expected types for AppCollection
        return {
          _id: id as Id<'collections'>,
          seed: seed,
          coeffs: palette.coeffs,
          globals: palette.globals,
          style: style as CollectionStyle,
          steps,
          angle,
        };
      });

      // Update collections
      allCollections = [...allCollections, ...newCollections];

      // Only update state if we're still generating for the current categories
      if (!signal.aborted) {
        // Make sure the cache path exists
        if (!paletteStore$.cachedPalettes[cacheKey].peek()) {
          paletteStore$.cachedPalettes[cacheKey].set([]);
        }
        // Update the cache
        paletteStore$.cachedPalettes[cacheKey].set([...allCollections]);
      }

      attempts++;
    }

    return allCollections;
  } catch (err) {
    // Silently handle errors
    console.log('Generation error:', err);
    return [];
  } finally {
    // Reset generating flag
    paletteStore$.isGenerating.set(false);

    // Note: Worker termination should be handled by the caller
  }
}

// Reset the generating flag
export function resetGeneratingState() {
  paletteStore$.isGenerating.set(false);
}

// Function to invalidate the cache for specific categories
export function invalidatePaletteCache(categories?: PaletteCategoryKey[]) {
  if (categories) {
    // Invalidate only the specified categories
    const cacheKey = categories.slice().sort().join(',');
    paletteStore$.cachedPalettes[cacheKey].set([]);
  } else {
    // Invalidate all cached palettes
    paletteStore$.cachedPalettes.set({});
  }
}
