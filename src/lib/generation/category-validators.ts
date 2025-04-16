/**
 * Centralized collection of category validators
 * Makes it easier to access and manage validators for multi-category support
 */

import type { CategoryValidator, PaletteCategoryKey } from './types';
import type { RGBAVector } from '~/types';

// Import all validator functions from generators
import { validateMonochromaticPalette } from './generators/monochromatic';
import { validatePastelPalette } from './generators/pastel';
import { validateEarthyPalette } from './generators/earthy';

/**
 * Map of validator functions for each palette category
 * This allows us to easily look up validators by category name
 */
export const CATEGORY_VALIDATORS: Record<PaletteCategoryKey, CategoryValidator> = {
  // Each validator returns true if the palette meets that category's criteria
  Monochromatic: validateMonochromaticPalette,
  Pastel: validatePastelPalette,
  Earthy: validateEarthyPalette,

  // Random has no specific constraints - it's valid for any palette
  Random: () => true,
};

/**
 * Get a validator function for a specific category
 * @param category The category to get a validator for
 * @returns A validator function that returns true if colors meet criteria
 */
export function getCategoryValidator(category: PaletteCategoryKey): CategoryValidator {
  const validator = CATEGORY_VALIDATORS[category];

  // If no validator found, use a default that always returns true
  if (!validator) {
    console.warn(`No validator found for category: ${category}`);
    return () => true;
  }

  return validator;
}

/**
 * Validate colors against multiple category criteria
 * @param colors RGB color vectors to validate
 * @param categories Categories to validate against
 * @returns True if the colors satisfy all category requirements
 */
export function validateMultiCategoryPalette(
  colors: RGBAVector[],
  categories: PaletteCategoryKey[],
): boolean {
  // If no categories provided, consider it valid
  if (!categories || categories.length === 0) {
    return true;
  }

  // Single category check
  if (categories.length === 1) {
    return getCategoryValidator(categories[0])(colors);
  }

  // Multi-category validation - must pass ALL validators
  return categories.every((category) => {
    const validator = getCategoryValidator(category);
    return validator(colors);
  });
}
