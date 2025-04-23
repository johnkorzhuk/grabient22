/**
 * Enhanced Random Palette Generator
 * Randomly selects category/categories instead of generating purely random coefficients
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import type { PaletteCategoryKey } from '~/validators';
import { BasePaletteGenerator } from '../base-generator';
import { validateMultiCategoryPalette } from '../category-validators';
import { PaletteCategories } from '../color-constants';

// Import all generator functions directly
import { generateMonochromaticCoeffs } from './monochromatic';
import { generatePastelCoeffs } from './pastel';
import { generateEarthyCoeffs } from './earthy';
import { generateComplementaryCoeffs } from './complementary';
import { generateSplitComplementaryCoeffs } from './split-complementary';
import { generateWarmDominantCoeffs } from './warm-dominant';
import { generateCoolDominantCoeffs } from './cool-dominant';
import { generateTetradicCoeffs } from './tetradic';
import { generateNeonCoeffs } from './neon';
import { generateAnalogousCoeffs } from './analogous';
import { generateNeutralCoeffs } from './neutral';
import { generateHighValueCoeffs } from './high-value';
import { generateLowValueCoeffs } from './low-value';

/**
 * Selects random categories that are compatible with each other
 * @returns Array of 1-3 compatible categories
 */
function selectRandomCategories(): PaletteCategoryKey[] {
  // All available categories (excluding Random itself)
  const allCategories: PaletteCategoryKey[] = [
    'Monochromatic',
    'Pastel',
    'Earthy',
    'Complementary',
    'Warm',
    'Cool',
    'SplitComplementary',
    'Tetradic',
    'Neon',
    'Analogous',
    'Neutral',
    'Bright',
    'Dark',
  ];

  // Decide how many categories to use (1-3)
  const categoryCount = Math.floor(Math.random() * 2) + 1; // 1-2 categories

  // For single category, simply pick one randomly
  if (categoryCount === 1) {
    const randomIndex = Math.floor(Math.random() * allCategories.length);
    return [allCategories[randomIndex]];
  }

  // For multiple categories, we need to ensure compatibility
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;

    // Shuffle the categories
    const shuffled = [...allCategories].sort(() => 0.5 - Math.random());

    // Take the first n categories
    const selectedCategories = shuffled.slice(0, categoryCount);

    // Check if they're compatible
    const isValid = validateCategoryCompatibility(selectedCategories);
    if (isValid) {
      return selectedCategories;
    }
  }

  // If we couldn't find a compatible set, return a single random category
  const randomIndex = Math.floor(Math.random() * allCategories.length);
  return [allCategories[randomIndex]];
}

/**
 * Validates that a set of categories are compatible with each other
 */
function validateCategoryCompatibility(categories: PaletteCategoryKey[]): boolean {
  // Empty or single category is always valid
  if (categories.length <= 1) {
    return true;
  }

  // Check each pair of categories for exclusivity
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const exclusiveWith = PaletteCategories[category].exclusiveWith || [];

    for (let j = 0; j < categories.length; j++) {
      if (i !== j && exclusiveWith.includes(categories[j])) {
        return false; // Found an incompatible pair
      }
    }
  }

  return true; // No incompatible pairs found
}

/**
 * Get coefficient generation function for a specific category
 */
function getCoefficientGenerator(category: PaletteCategoryKey): () => CosineCoeffs {
  switch (category) {
    case 'Monochromatic':
      return generateMonochromaticCoeffs;
    case 'Pastel':
      return generatePastelCoeffs;
    case 'Earthy':
      return generateEarthyCoeffs;
    case 'Complementary':
      return generateComplementaryCoeffs;
    case 'Warm':
      return generateWarmDominantCoeffs;
    case 'Cool':
      return generateCoolDominantCoeffs;
    case 'SplitComplementary':
      return generateSplitComplementaryCoeffs;
    case 'Tetradic':
      return generateTetradicCoeffs;
    case 'Neon':
      return generateNeonCoeffs;
    case 'Analogous':
      return generateAnalogousCoeffs;
    case 'Neutral':
      return generateNeutralCoeffs;
    case 'Bright':
      return generateHighValueCoeffs;
    case 'Dark':
      return generateLowValueCoeffs;
    default:
      // Fallback to monochromatic
      return generateMonochromaticCoeffs;
  }
}

export class RandomGenerator extends BasePaletteGenerator {
  private selectedCategories: PaletteCategoryKey[];

  constructor(steps: number, options = {}) {
    super('Random', steps, options);

    // Select random categories on initialization
    this.selectedCategories = selectRandomCategories();

    // Update applied categories for result metadata
    this.appliedCategories = [...this.selectedCategories];
  }

  /**
   * Generate candidate coefficients from a random category or combo
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    // Always use the primary category's coefficient generator
    const primaryCategory = this.selectedCategories[0];
    const generateCoeffs = getCoefficientGenerator(primaryCategory);

    return generateCoeffs();
  }

  /**
   * Validate against all selected categories
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    // Use the multi-category validator to check against all selected categories
    return validateMultiCategoryPalette(colors, this.selectedCategories);
  }

  /**
   * Override the generate method to include selected categories in the result
   */
  public generate(): ReturnType<BasePaletteGenerator['generate']> {
    const result = super.generate();

    if (result) {
      // Add the randomly selected categories to the result
      result.appliedCategories = [...this.selectedCategories];
      result.category = 'Random'; // Keep the main category as Random for UI/display purposes
    }

    return result;
  }
}

// For backward compatibility, maintain the randomly generated coefficients export
export function generateRandomCoeffs(): CosineCoeffs {
  // Select a random category and use its generation function
  const allCategories: PaletteCategoryKey[] = [
    'Monochromatic',
    'Pastel',
    'Earthy',
    'Complementary',
    'Warm',
    'Cool',
    'SplitComplementary',
    'Tetradic',
    'Neon',
    'Analogous',
    'Neutral',
    'Bright',
    'Dark',
  ];

  const randomIndex = Math.floor(Math.random() * allCategories.length);
  const category = allCategories[randomIndex];
  const generateCoeffs = getCoefficientGenerator(category);

  return generateCoeffs();
}
