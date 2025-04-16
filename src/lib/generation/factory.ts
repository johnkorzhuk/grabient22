/**
 * Palette Generator Factory
 * Creates and manages different palette generators based on category
 */

import type {
  PaletteCategoryKey,
  PaletteGenerationOptions,
  PaletteGenerationResult,
} from './types';
import type { CosineCoeffs, RGBAVector } from '~/types';
import { PaletteCategories } from './color-constants';
import { analyzeBasicColors } from './color-utils';
import { cosineGradient } from '../cosineGradient';
import { DEFAULT_MAX_ATTEMPTS } from './base-generator';
import type { BasePaletteGenerator } from './base-generator';
// Import all generators
import { EarthyGenerator } from './generators/earthy';
import { MonochromaticGenerator } from './generators/monochromatic';
import { PastelGenerator } from './generators/pastel';
import { RandomGenerator } from './generators/random';

// import { ComplementaryGenerator } from './generators/complementary';
// import { SplitComplementaryGenerator } from './generators/split-complementary';
// import { TriadicGenerator } from './generators/triadic';
// import { TetradicGenerator } from './generators/tetradic';
// import { HexadicGenerator } from './generators/hexadic';
// import { WarmDominantGenerator } from './generators/warm-dominant';
// import { CoolDominantGenerator } from './generators/cool-dominant';
// import { TemperatureBalancedGenerator } from './generators/temperature-balanced';
// import { NeutralGenerator } from './generators/neutral';
// import { HighValueGenerator } from './generators/high-value';
// import { LowValueGenerator } from './generators/low-value';

// import { JewelTonesGenerator } from './generators/jewel-tones';

// import { NeonGenerator } from './generators/neon';
// import { RandomGenerator } from './generators/random';

// import { AnalogousGenerator } from './generators/analogous';

/**
 * Factory class to create palette generators based on the requested category
 */
export class PaletteGeneratorFactory {
  /**
   * Create a generator for the specified palette category
   */
  public static createGenerator(
    category: PaletteCategoryKey,
    options: PaletteGenerationOptions = {},
  ): BasePaletteGenerator {
    // Get recommended color stops for this category
    const steps = PaletteCategories[category].recommendedColorStops;

    // Validate initialGlobals against category bounds
    if (options.initialGlobals) {
      const bounds = PaletteCategories[category].initialGlobalsBounds;

      // Validate and adjust exposure if needed
      if (options.initialGlobals.exposure !== undefined && bounds.exposure) {
        const [min, max] = bounds.exposure;
        options.initialGlobals.exposure = Math.max(
          min,
          Math.min(max, options.initialGlobals.exposure),
        );
      }

      // Validate and adjust contrast if needed
      if (options.initialGlobals.contrast !== undefined && bounds.contrast) {
        const [min, max] = bounds.contrast;
        options.initialGlobals.contrast = Math.max(
          min,
          Math.min(max, options.initialGlobals.contrast),
        );
      }

      // Validate and adjust frequency if needed
      if (options.initialGlobals.frequency !== undefined && bounds.frequency) {
        const [min, max] = bounds.frequency;
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

    // Create the appropriate generator based on category
    switch (category) {
      case 'Monochromatic':
        return new MonochromaticGenerator(steps, options);
      case 'Pastel':
        return new PastelGenerator(steps, options);
      case 'Earthy':
        return new EarthyGenerator(steps, options);
      // case 'Analogous':
      //     return new AnalogousGenerator(steps, options);
      //   case 'Complementary':
      //     return new ComplementaryGenerator(steps, options);
      //   case 'Split-Complementary':
      //     return new SplitComplementaryGenerator(steps, options);
      //   case 'Triadic':
      //     return new TriadicGenerator(steps, options);
      //   case 'Tetradic':
      //     return new TetradicGenerator(steps, options);
      //   case 'Hexadic':
      //     return new HexadicGenerator(steps, options);
      //   case 'Warm-Dominant':
      //     return new WarmDominantGenerator(steps, options);
      //   case 'Cool-Dominant':
      //     return new CoolDominantGenerator(steps, options);
      //   case 'Temperature-Balanced':
      //     return new TemperatureBalancedGenerator(steps, options);
      //   case 'Neutral':
      //     return new NeutralGenerator(steps, options);
      //   case 'High-Value':
      //     return new HighValueGenerator(steps, options);
      //   case 'Low-Value':
      //     return new LowValueGenerator(steps, options);

      //   case 'Jewel-Tones':
      //     return new JewelTonesGenerator(steps, options);

      //   case 'Neon':
      //     return new NeonGenerator(steps, options);
      case 'Random':
      default:
        return new RandomGenerator(steps, options);
    }
  }

  /**
   * Generate a palette of the specified category
   * Returns null if generation fails
   */
  public static generatePalette(
    category: PaletteCategoryKey,
    options: PaletteGenerationOptions = {},
  ): PaletteGenerationResult | null {
    const generator = this.createGenerator(category, options);
    return generator.generate(); // Return null if generation fails
  }

  /**
   * Generate multiple palettes of the specified category
   * Returns as many valid palettes as could be generated, up to the requested count
   */
  public static generatePalettes(
    count: number,
    category: PaletteCategoryKey = 'Random',
    options: PaletteGenerationOptions = {},
  ): PaletteGenerationResult[] {
    const results: PaletteGenerationResult[] = [];
    let totalAttempts = 0;
    const maxTotalAttempts = options.maxAttempts || 10000; // Add a safeguard

    // Keep trying until we either get the requested count or hit the max attempts
    while (results.length < count && totalAttempts < maxTotalAttempts) {
      const generator = this.createGenerator(category, options);
      const result = generator.generate();

      // Track attempt count
      totalAttempts += result ? result.attemptsTaken : options.maxAttempts || DEFAULT_MAX_ATTEMPTS;

      // Only add successful generations to results
      if (result !== null) {
        results.push(result);
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
}

/**
 * Convenience function to generate a single palette
 */
export function generatePalette(
  category: PaletteCategoryKey,
  options: PaletteGenerationOptions = {},
): PaletteGenerationResult | null {
  return PaletteGeneratorFactory.generatePalette(category, options);
}

/**
 * Convenience function to generate multiple palettes
 */
export function generatePalettes(
  count: number,
  category: PaletteCategoryKey = 'Random',
  options: PaletteGenerationOptions = {},
): PaletteGenerationResult[] {
  return PaletteGeneratorFactory.generatePalettes(count, category, options);
}

/**
 * Convenience function to get global bounds for a category
 */
export function getGlobalBoundsForCategory(category: PaletteCategoryKey) {
  return PaletteGeneratorFactory.getGlobalBoundsForCategory(category);
}
