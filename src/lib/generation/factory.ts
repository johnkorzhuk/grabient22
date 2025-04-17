/**
 * Palette Generator Factory
 * Creates and manages different palette generators based on category
 * With support for multi-category palette generation
 */

import type {
  PaletteCategoryKey,
  PaletteGenerationOptions,
  PaletteGenerationResult,
} from './types';
import { PaletteCategories, mergeGlobalsBounds, getRecommendedStops } from './color-constants';
import { DEFAULT_MAX_ATTEMPTS } from './base-generator';
import type { BasePaletteGenerator } from './base-generator';
import { getCategoryValidator } from './category-validators';
import { MultiCategoryGenerator } from './multi-category-generator';

// Import all generators
import { EarthyGenerator } from './generators/earthy';
import { MonochromaticGenerator } from './generators/monochromatic';
import { PastelGenerator } from './generators/pastel';
import { ComplementaryGenerator } from './generators/complementary';
import { RandomGenerator } from './generators/random';
import { WarmDominantGenerator } from './generators/warm-dominant';
import { CoolDominantGenerator } from './generators/cool-dominant';
import { SplitComplementaryGenerator } from './generators/split-complementary';
import { TetradicGenerator } from './generators/tetradic';
import { NeonGenerator } from './generators/neon';
import { AnalogousGenerator } from './generators/analogous';

import { NeutralGenerator } from './generators/neutral';
import { LowValueGenerator } from './generators/low-value';
import { HighValueGenerator } from './generators/high-value';

/**
 * Factory class to create palette generators based on the requested category
 */
export class PaletteGeneratorFactory {
  /**
   * Validate that a combination of categories is allowed
   * @param categories Array of categories to validate
   * @returns Boolean indicating if the combination is valid
   */
  public static validateCategorySet(categories: PaletteCategoryKey[]): boolean {
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
   * Get categories that are incompatible with the selected ones
   * @param categories Currently selected categories
   * @returns Array of category keys that cannot be selected
   */
  public static getIncompatibleCategories(categories: PaletteCategoryKey[]): PaletteCategoryKey[] {
    if (categories.length === 0) {
      return [];
    }

    // Collect all categories that are exclusive with any selected category
    const incompatible = new Set<PaletteCategoryKey>();

    for (const category of categories) {
      const exclusiveWith = PaletteCategories[category].exclusiveWith || [];
      for (const exclusive of exclusiveWith) {
        incompatible.add(exclusive);
      }
    }

    return Array.from(incompatible);
  }

  /**
   * Updated segments of the PaletteGeneratorFactory class
   * This focuses on the changes needed to support the enhanced Random generator
   */

  // In the createGenerator method of the PaletteGeneratorFactory class
  public static createGenerator(
    categories: PaletteCategoryKey[],
    options: PaletteGenerationOptions = {},
  ): BasePaletteGenerator {
    // Make sure we have at least one category
    if (!categories || categories.length === 0) {
      categories = ['Random']; // Default to Random if no categories specified
    }

    // Validate the category combination
    if (!this.validateCategorySet(categories)) {
      // Filter to keep only compatible categories
      const compatible: PaletteCategoryKey[] = [];

      for (const category of categories) {
        // Check if this category is compatible with all currently selected
        const isCompatible = compatible.every(
          (selected) =>
            !PaletteCategories[category].exclusiveWith.includes(selected) &&
            !PaletteCategories[selected].exclusiveWith.includes(category),
        );

        if (isCompatible) {
          compatible.push(category);
        }
      }

      // Use compatible categories or default to Random if none
      categories = compatible.length > 0 ? compatible : ['Random'];
    }

    // Get recommended color stops for these categories
    const steps = getRecommendedStops(categories);

    // Get the merged global bounds for all categories
    const globalBounds = mergeGlobalsBounds(categories);

    // Validate initialGlobals against merged bounds
    if (options.initialGlobals) {
      // Validate and adjust exposure if needed
      if (options.initialGlobals.exposure !== undefined && globalBounds.exposure) {
        const [min, max] = globalBounds.exposure;
        options.initialGlobals.exposure = Math.max(
          min,
          Math.min(max, options.initialGlobals.exposure),
        );
      }

      // Validate and adjust contrast if needed
      if (options.initialGlobals.contrast !== undefined && globalBounds.contrast) {
        const [min, max] = globalBounds.contrast;
        options.initialGlobals.contrast = Math.max(
          min,
          Math.min(max, options.initialGlobals.contrast),
        );
      }

      // Validate and adjust frequency if needed
      if (options.initialGlobals.frequency !== undefined && globalBounds.frequency) {
        const [min, max] = globalBounds.frequency;
        options.initialGlobals.frequency = Math.max(
          min,
          Math.min(max, options.initialGlobals.frequency),
        );
      }

      // Round values to 3 decimal places
      if (options.initialGlobals.exposure !== undefined) {
        options.initialGlobals.exposure = Number(options.initialGlobals.exposure.toFixed(3));
      }
      if (options.initialGlobals.contrast !== undefined) {
        options.initialGlobals.contrast = Number(options.initialGlobals.contrast.toFixed(3));
      }
      if (options.initialGlobals.frequency !== undefined) {
        options.initialGlobals.frequency = Number(options.initialGlobals.frequency.toFixed(3));
      }
      if (options.initialGlobals.phase !== undefined) {
        options.initialGlobals.phase = Number(options.initialGlobals.phase.toFixed(3));
      }
    }

    // Handle Random category specially - our enhanced implementation
    if (categories.length === 1 && categories[0] === 'Random') {
      return new RandomGenerator(steps, options);
    }

    // Single category case (non-Random)
    if (categories.length === 1) {
      const category = categories[0];

      // Create the appropriate generator based on category
      switch (category) {
        case 'Monochromatic':
          return new MonochromaticGenerator(steps, options);
        case 'Pastel':
          return new PastelGenerator(steps, options);
        case 'Earthy':
          return new EarthyGenerator(steps, options);
        case 'Complementary':
          return new ComplementaryGenerator(steps, options);
        case 'SplitComplementary':
          return new SplitComplementaryGenerator(steps, options);
        case 'WarmDominant':
          return new WarmDominantGenerator(steps, options);
        case 'CoolDominant':
          return new CoolDominantGenerator(steps, options);
        case 'Tetradic':
          return new TetradicGenerator(steps, options);
        case 'Neon':
          return new NeonGenerator(steps, options);
        case 'Analogous':
          return new AnalogousGenerator(steps, options);
        case 'Neutral':
          return new NeutralGenerator(steps, options);
        case 'High-Value':
          return new HighValueGenerator(steps, options);
        case 'Low-Value':
          return new LowValueGenerator(steps, options);
        default:
          return new RandomGenerator(steps, options);
      }
    }

    // Multi-category case - use MultiCategoryGenerator
    // Use the first category for coefficient generation approach
    const primaryCategory = categories[0];

    // Get validators for each category
    const validators = categories.map(getCategoryValidator);

    // Create a multi-category generator
    return new MultiCategoryGenerator(primaryCategory, categories, validators, steps, options);
  }

  /**
   * Generate a palette matching the specified categories
   * @param categories Array of categories to match
   * @param options Generation options
   * @returns A generated palette or null if generation failed
   */
  public static generatePalette(
    categories: PaletteCategoryKey[],
    options: PaletteGenerationOptions = {},
  ): PaletteGenerationResult | null {
    // Validate that the category set is valid
    if (!this.validateCategorySet(categories)) {
      return null;
    }

    // Create appropriate generator and generate palette
    const generator = this.createGenerator(categories, options);
    return generator.generate();
  }

  /**
   * Generate multiple palettes matching the specified categories
   * Returns as many valid palettes as could be generated, up to the requested count
   */
  public static generatePalettes(
    count: number,
    categories: PaletteCategoryKey[] | PaletteCategoryKey = 'Random',
    options: PaletteGenerationOptions = {},
  ): PaletteGenerationResult[] {
    // Convert single category to array if needed
    const categoryArray = Array.isArray(categories) ? categories : [categories];

    const results: PaletteGenerationResult[] = [];
    let totalAttempts = 0;
    const maxTotalAttempts = options.maxAttempts || 10000; // Add a safeguard

    // Validate category combination
    if (!this.validateCategorySet(categoryArray)) {
      return [];
    }

    // Keep trying until we either get the requested count or hit the max attempts
    while (results.length < count && totalAttempts < maxTotalAttempts) {
      try {
        const generator = this.createGenerator(categoryArray, options);
        const result = generator.generate();

        // Track attempt count
        totalAttempts += result
          ? result.attemptsTaken
          : options.maxAttempts || DEFAULT_MAX_ATTEMPTS;

        // Only add successful generations to results
        if (result !== null) {
          results.push(result);
        }
      } catch (error) {
        console.error('Error generating palette:', error);
        totalAttempts += options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
      }
    }

    return results; // Return only the successful palettes, might be fewer than requested
  }

  /**
   * Get the initial global bounds for a specific category
   * Useful for UI components that need to know the valid ranges
   */
  public static getGlobalBoundsForCategory(category: PaletteCategoryKey) {
    return PaletteCategories[category].initialGlobalsBounds;
  }

  /**
   * Get global bounds for a set of categories
   * Returns the merged bounds for all categories
   */
  public static getGlobalBoundsForCategories(categories: PaletteCategoryKey[]) {
    return mergeGlobalsBounds(categories);
  }
}

/**
 * Convenience function to generate a single palette
 */
export function generatePalette(
  categories: PaletteCategoryKey[] | PaletteCategoryKey,
  options: PaletteGenerationOptions = {},
): PaletteGenerationResult | null {
  // Convert single category to array if needed
  const categoryArray = Array.isArray(categories) ? categories : [categories];
  return PaletteGeneratorFactory.generatePalette(categoryArray, options);
}

/**
 * Convenience function to generate multiple palettes
 */
export function generatePalettes(
  count: number,
  categories: PaletteCategoryKey[] | PaletteCategoryKey = 'Random',
  options: PaletteGenerationOptions = {},
): PaletteGenerationResult[] {
  return PaletteGeneratorFactory.generatePalettes(count, categories, options);
}

/**
 * Convenience function to get global bounds for a category
 */
export function getGlobalBoundsForCategory(category: PaletteCategoryKey) {
  return PaletteGeneratorFactory.getGlobalBoundsForCategory(category);
}

/**
 * Convenience function to get global bounds for multiple categories
 */
export function getGlobalBoundsForCategories(categories: PaletteCategoryKey[]) {
  return PaletteGeneratorFactory.getGlobalBoundsForCategories(categories);
}

/**
 * Convenience function to validate a set of categories
 */
export function validateCategorySet(categories: PaletteCategoryKey[]): boolean {
  return PaletteGeneratorFactory.validateCategorySet(categories);
}

/**
 * Convenience function to get incompatible categories
 */
export function getIncompatibleCategories(categories: PaletteCategoryKey[]): PaletteCategoryKey[] {
  return PaletteGeneratorFactory.getIncompatibleCategories(categories);
}
