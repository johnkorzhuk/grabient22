/**
 * Multi-Category Palette Generator
 * Combines validation logic from multiple categories
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import type { PaletteCategoryKey, CategoryValidator, PaletteGenerationOptions } from './types';
import { BasePaletteGenerator } from './base-generator';
import { generateRandomCoeffs } from './color-utils';

/**
 * Generator that combines validation from multiple palette categories
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
    // Strategy selection depends on the primary category
    switch (this.category) {
      case 'Monochromatic':
        // If primary is Monochromatic, generate monochromatic-style coefficients
        return this.generateMonochromaticStyleCoeffs();
      case 'Pastel':
        // If primary is Pastel, generate pastel-style coefficients
        return this.generatePastelStyleCoeffs();
      case 'Earthy':
        // If primary is Earthy, generate earthy-style coefficients
        return this.generateEarthyStyleCoeffs();
      case 'Random':
      default:
        // Default to random generation
        return generateRandomCoeffs();
    }
  }

  /**
   * Generate Monochromatic-style coefficients
   * Focuses on a single hue with variations in brightness/saturation
   */
  private generateMonochromaticStyleCoeffs(): CosineCoeffs {
    const TAU = Math.PI * 2;

    // Choose a single base hue (0-1)
    const baseHue = Math.random();

    // Convert hue to phase in cosine gradient
    const basePhase = baseHue * TAU;

    // Create a stronger monochromatic effect
    const phaseVariance = Math.random() * 0.05; // Very small variance (max 5% of cycle)

    // The key to monochromatic palettes is balanced RGB amplitudes
    const baseAmplitude = 0.15 + Math.random() * 0.2; // 0.15-0.35
    const ampVariance = 0.05; // Small amplitude variance

    return [
      // a: offset vector - base colors (mid-range with intentional subtle variance)
      [
        0.45 + Math.random() * 0.1, // Red component (0.45-0.55)
        0.45 + Math.random() * 0.1, // Green component (0.45-0.55)
        0.45 + Math.random() * 0.1, // Blue component (0.45-0.55)
        1, // Alpha always 1
      ] as [number, number, number, 1],

      // b: amplitude vector - carefully balanced to maintain hue
      [
        baseAmplitude, // Red
        baseAmplitude * (0.95 + Math.random() * ampVariance), // Green - small variation
        baseAmplitude * (0.95 + Math.random() * ampVariance), // Blue - small variation
        1, // Alpha for serialization
      ] as [number, number, number, 1],

      // c: frequency vector - VERY LOW to maintain smooth transitions
      [
        0.1 + Math.random() * 0.15, // Low frequency for Red (0.1-0.25)
        0.1 + Math.random() * 0.15, // Low frequency for Green (0.1-0.25)
        0.1 + Math.random() * 0.15, // Low frequency for Blue (0.1-0.25)
        1, // Alpha for serialization
      ] as [number, number, number, 1],

      // d: phase vector - NEARLY IDENTICAL phase values with minor variance
      [
        basePhase, // Red - base phase
        basePhase + (Math.random() * phaseVariance - phaseVariance / 2), // Green - tiny variance
        basePhase + (Math.random() * phaseVariance - phaseVariance / 2), // Blue - tiny variance
        1, // Alpha for serialization
      ] as [number, number, number, 1],
    ];
  }

  /**
   * Generate Pastel-style coefficients
   * Focuses on high brightness and low-medium saturation
   */
  private generatePastelStyleCoeffs(): CosineCoeffs {
    const TAU = Math.PI * 2;

    // Pastel strategy selection (7 types)
    const strategyType = Math.floor(Math.random() * 7);

    // Define hue distribution approach
    let hueDistribution: number[];
    let brightnessStrategy: 'high' | 'varied' | 'gradient' | 'mixed';
    let saturationLevel: 'very-low' | 'low' | 'medium' | 'mixed';

    // Configure based on strategy (simplified from pastel.ts)
    switch (strategyType) {
      case 0: // Classic pastel with evenly distributed hues
        hueDistribution = [0, 0.33, 0.67]; // Evenly distributed RGB phases
        brightnessStrategy = 'high'; // Uniformly high brightness
        saturationLevel = 'low'; // Classic low saturation
        break;
      // ... other cases would be implemented similar to pastel.ts
      default: // Fallback - balanced pastel
        hueDistribution = [0, 0.33, 0.67];
        brightnessStrategy = 'high';
        saturationLevel = 'low';
    }

    // Configure brightness
    const offsetBase = 0.75;
    const offsetVariation = 0.15; // 0.75-0.9

    // Configure amplitude (saturation)
    const amplitudeBase = 0.08;
    const amplitudeVariation = 0.12; // 0.08-0.2

    // Add intentional diversity to RGB channels
    const redOffset = offsetBase + Math.random() * offsetVariation;
    const greenOffset = offsetBase + Math.random() * offsetVariation;
    const blueOffset = offsetBase + Math.random() * offsetVariation;

    const redAmp = amplitudeBase + Math.random() * amplitudeVariation;
    const greenAmp = amplitudeBase + Math.random() * amplitudeVariation;
    const blueAmp = amplitudeBase + Math.random() * amplitudeVariation;

    // Frequency controls color cycling - keep moderate for pastels
    const frequency = 0.4 + Math.random() * 0.8; // 0.4-1.2

    // Create enhanced pastel palette with more diversity
    return [
      // a: offset vector - high values for brightness with variation
      [
        redOffset,
        greenOffset,
        blueOffset,
        1, // Alpha always 1
      ] as [number, number, number, 1],

      // b: amplitude vector - controls saturation
      [
        redAmp,
        greenAmp,
        blueAmp,
        1, // Alpha for serialization
      ] as [number, number, number, 1],

      // c: frequency vector - controls cycling
      [
        frequency * (0.8 + Math.random() * 0.4),
        frequency * (0.8 + Math.random() * 0.4),
        frequency * (0.8 + Math.random() * 0.4),
        1, // Alpha for serialization
      ] as [number, number, number, 1],

      // d: phase vector - varied for different hue distributions
      [
        hueDistribution[0] * TAU,
        hueDistribution[1] * TAU,
        hueDistribution[2] * TAU,
        1, // Alpha for serialization
      ] as [number, number, number, 1],
    ];
  }

  /**
   * Generate Earthy-style coefficients
   * Focuses on natural colors like browns, tans, olive greens
   */
  private generateEarthyStyleCoeffs(): CosineCoeffs {
    const TAU = Math.PI * 2;

    // Select from multiple earthy palette strategies
    const strategyType = Math.floor(Math.random() * 5);

    // Define base values based on selected strategy
    let baseHue: number;
    let offsetRange: [number, number];
    let amplitudeRange: [number, number];
    let frequencyRange: [number, number];
    let phaseVariation: number;

    switch (strategyType) {
      case 0: // Warm browns and oranges
        baseHue = 0.05 + Math.random() * 0.05; // 0.05-0.1 (orange-brown)
        offsetRange = [0.4, 0.6];
        amplitudeRange = [0.15, 0.3];
        frequencyRange = [0.25, 0.45];
        phaseVariation = 0.15;
        break;
      // ... other cases would be implemented similar to earthy.ts
      default: // Fallback to balanced earthy tones
        baseHue = 0.1 + Math.random() * 0.2; // 0.1-0.3
        offsetRange = [0.4, 0.6];
        amplitudeRange = [0.15, 0.3];
        frequencyRange = [0.3, 0.5];
        phaseVariation = 0.15;
    }

    const basePhase = baseHue * TAU;

    // Random value within a range helper
    const randomInRange = (range: [number, number]): number => {
      return range[0] + Math.random() * (range[1] - range[0]);
    };

    // Create diversity in each RGB channel
    const redOffset = randomInRange(offsetRange);
    const greenOffset = randomInRange(offsetRange);
    const blueOffset = randomInRange(offsetRange);

    const redAmp = randomInRange(amplitudeRange);
    const greenAmp = randomInRange(amplitudeRange);
    const blueAmp = randomInRange(amplitudeRange);

    const redFreq = randomInRange(frequencyRange);
    const greenFreq = randomInRange(frequencyRange);
    const blueFreq = randomInRange(frequencyRange);

    // Enhanced earthy palette with more diversity
    return [
      // a: offset vector - varied brightness
      [
        redOffset,
        greenOffset,
        blueOffset,
        1, // Alpha always 1
      ] as [number, number, number, 1],

      // b: amplitude vector - varied saturation
      [
        redAmp,
        greenAmp,
        blueAmp,
        1, // Alpha for serialization
      ] as [number, number, number, 1],

      // c: frequency vector - controls color cycling
      [
        redFreq,
        greenFreq,
        blueFreq,
        1, // Alpha for serialization
      ] as [number, number, number, 1],

      // d: phase vector - controls hue shifting
      [
        basePhase,
        basePhase + (Math.random() * phaseVariation - phaseVariation / 2),
        basePhase + (Math.random() * phaseVariation - phaseVariation / 2),
        1, // Alpha for serialization
      ] as [number, number, number, 1],
    ];
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
