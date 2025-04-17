/**
 * Multi-Category Palette Generator
 * Combines validation logic from multiple categories
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import type { PaletteCategoryKey, CategoryValidator, PaletteGenerationOptions } from './types';
import { BasePaletteGenerator } from './base-generator';

// Import coefficient generation functions from each generator
import { generateMonochromaticCoeffs } from './generators/monochromatic';
import { generatePastelCoeffs } from './generators/pastel';
import { generateEarthyCoeffs } from './generators/earthy';
import { generateComplementaryCoeffs } from './generators/complementary';
import { generateRandomCoeffs } from './color-utils';
import { generateWarmDominantCoeffs } from './generators/warm-dominant';
import { generateSplitComplementaryCoeffs } from './generators/split-complementary';
import { generateTetradicCoeffs } from './generators/tetradic';
import { generateNeonCoeffs } from './generators/neon';
import { generateAnalogousCoeffs } from './generators/analogous';
import { generateNeutralCoeffs } from './generators/neutral';
import { generateHighValueCoeffs } from './generators/high-value';
import { generateLowValueCoeffs } from './generators/low-value';

/**
 * Generator that combines validation logic from multiple palette categories
 * This enables creation of palettes that satisfy multiple style constraints
 */
export class MultiCategoryGenerator extends BasePaletteGenerator {
  private categoryValidators: CategoryValidator[] = [];
  private allCategories: PaletteCategoryKey[] = [];

  /**
   * Constructor for multi-category generator
   * @param primaryCategory The strategy to use for coefficient generation
   * @param allCategories All categories to validate against
   * @param validators Validation functions for each category
   * @param steps Number of color steps
   * @param options Generation options
   */
  constructor(
    primaryCategory: PaletteCategoryKey,
    allCategories: PaletteCategoryKey[],
    validators: CategoryValidator[],
    steps: number,
    options: PaletteGenerationOptions = {},
  ) {
    super(primaryCategory, steps, options);

    // Store all categories for result
    this.allCategories = [...allCategories];

    // Store validators
    this.categoryValidators = validators;
  }

  /**
   * Generate candidate coefficients for this multi-category palette
   * Uses the primary category's strategy while considering all constraints
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    // Special handling for specific category combinations
    // This ensures the right strategy is used regardless of which category was passed as primary
    if (this.allCategories.includes('Complementary') && this.allCategories.includes('Earthy')) {
      // For Complementary+Earthy, always use Earthy as the base
      return generateEarthyCoeffs();
    }

    if (this.allCategories.includes('Monochromatic') && this.allCategories.includes('Earthy')) {
      // For Monochromatic+Earthy, always use Monochromatic as the base
      return generateMonochromaticCoeffs();
    }

    if (
      this.allCategories.includes('WarmDominant') &&
      this.allCategories.includes('Monochromatic')
    ) {
      // For WarmDominant+Monochromatic, use Monochromatic as the base
      return generateMonochromaticCoeffs();
    }

    switch (this.category) {
      case 'Monochromatic':
        return generateMonochromaticCoeffs();
      case 'Pastel':
        return generatePastelCoeffs();
      case 'Earthy':
        return generateEarthyCoeffs();
      case 'Complementary':
        return generateComplementaryCoeffs();
      case 'WarmDominant':
        return generateWarmDominantCoeffs();
      case 'SplitComplementary':
        return generateSplitComplementaryCoeffs();
      case 'Tetradic':
        return generateTetradicCoeffs();
      case 'Neon':
        return generateNeonCoeffs();
      case 'Analogous':
        return generateAnalogousCoeffs();
      case 'Neutral':
        return generateNeutralCoeffs();
      case 'High-Value':
        return generateHighValueCoeffs();
      case 'Low-Value':
        return generateLowValueCoeffs();
      case 'Random':
      default:
        return generateRandomCoeffs();
    }
  }

  /**
   * Validate that generated colors meet ALL selected category-specific criteria
   * This is the key to multi-category validation
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    // Skip validation if no validators are defined
    if (this.categoryValidators.length === 0) {
      return true;
    }

    // A palette is valid if ALL category validators pass
    return this.categoryValidators.every((validator) => validator(colors));
  }

  /**
   * Override the generate method to include all applied categories in the result
   */
  public generate(): ReturnType<BasePaletteGenerator['generate']> {
    const result = super.generate();

    if (result) {
      // Add all applied categories to the result
      result.appliedCategories = [...this.allCategories];
    }

    return result;
  }
}
