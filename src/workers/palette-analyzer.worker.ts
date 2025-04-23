// src/workers/palette-analyzer.worker.ts
import { expose } from 'comlink';
import type { RGBAVector } from '../types';
import type { PaletteCategoryKey } from '../validators';
import { CATEGORY_VALIDATORS } from '../lib/generation/category-validators';

export interface PaletteAnalyzerResult {
  categories: PaletteCategoryKey[];
  matchScores: Record<PaletteCategoryKey, number>;
}

export interface WorkerApi {
  analyzePalette: (colors: RGBAVector[]) => PaletteAnalyzerResult;
}

/**
 * Analyzes a palette and determines which categories it belongs to
 * @param colors The RGBA vectors representing the palette colors
 * @returns An object containing the matching categories and their match scores
 */
function analyzePalette(colors: RGBAVector[]): PaletteAnalyzerResult {
  // Skip the Random category since it's not a real category (always returns true)
  const categoriesToCheck = Object.keys(CATEGORY_VALIDATORS).filter(
    (key) => key !== 'Random',
  ) as PaletteCategoryKey[];

  const matchingCategories: PaletteCategoryKey[] = [];
  const matchScores: Record<PaletteCategoryKey, number> = {} as Record<PaletteCategoryKey, number>;

  // Check each category validator
  for (const category of categoriesToCheck) {
    const validator = CATEGORY_VALIDATORS[category];

    try {
      // For binary validators, we get a simple true/false
      const isMatch = validator(colors);

      // Store the result (1 for match, 0 for no match)
      const score = isMatch ? 1 : 0;
      matchScores[category] = score;

      // If it's a match, add to matching categories
      if (isMatch) {
        matchingCategories.push(category);
      }
    } catch (error) {
      console.error(`Error validating category ${category}:`, error);
      matchScores[category] = 0;
    }
  }

  return {
    categories: matchingCategories,
    matchScores,
  };
}

const workerApi: WorkerApi = {
  analyzePalette,
};

expose(workerApi);
