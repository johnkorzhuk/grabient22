/**
 * Pastel Palette Generator with Integrated Validator
 * Creates palettes with high brightness, low-medium saturation colors
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';

export class PastelGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Pastel', steps, options);
  }

  /**
   * Generate candidate coefficients for a pastel palette
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    const TAU = Math.PI * 2;

    // Select from multiple pastel palette strategies
    const strategyType = Math.floor(Math.random() * 4);

    // Define hue distribution approach
    let hueDistribution: number[];
    let brightnessStrategy: 'high' | 'varied' | 'gradient';
    let saturationLevel: 'very-low' | 'low' | 'medium';

    // Configure palette characteristics based on strategy
    switch (strategyType) {
      case 0: // Classic pastel with evenly distributed hues
        hueDistribution = [0, 0.33, 0.67]; // Evenly distributed RGB phases
        brightnessStrategy = 'high'; // Uniformly high brightness
        saturationLevel = 'low'; // Classic low saturation
        break;

      case 1: // Analogous pastel - clustered hues for more harmony
        const baseHue = Math.random();
        hueDistribution = [baseHue, (baseHue + 0.1) % 1.0, (baseHue + 0.2) % 1.0];
        brightnessStrategy = 'varied'; // More variation in brightness
        saturationLevel = 'low'; // Classic low saturation
        break;

      case 2: // Contrasting pastel - more vibrant
        const contrastHue = Math.random();
        hueDistribution = [
          contrastHue,
          (contrastHue + 0.5) % 1.0, // Complementary hue
          (contrastHue + 0.2) % 1.0, // Supporting hue
        ];
        brightnessStrategy = 'high'; // High brightness
        saturationLevel = 'medium'; // Higher saturation for more vibrant pastels
        break;

      case 3: // Gradient pastel - varied brightness
        const gradientHue = Math.random();
        hueDistribution = [gradientHue, (gradientHue + 0.15) % 1.0, (gradientHue + 0.3) % 1.0];
        brightnessStrategy = 'gradient'; // Gradient of brightness
        saturationLevel = 'very-low'; // Very delicate saturation
        break;

      default: // Fallback - balanced pastel
        hueDistribution = [0, 0.33, 0.67];
        brightnessStrategy = 'high';
        saturationLevel = 'low';
    }

    // Configure brightness based on selected strategy
    let offsetBase: number;
    let offsetVariation: number;

    switch (brightnessStrategy) {
      case 'high':
        offsetBase = 0.75;
        offsetVariation = 0.15; // 0.75-0.9
        break;
      case 'varied':
        offsetBase = 0.65;
        offsetVariation = 0.25; // 0.65-0.9
        break;
      case 'gradient':
        offsetBase = 0.6;
        offsetVariation = 0.3; // 0.6-0.9
        break;
      default:
        offsetBase = 0.75;
        offsetVariation = 0.15;
    }

    // Configure amplitude (saturation) based on selected level
    let amplitudeBase: number;
    let amplitudeVariation: number;

    switch (saturationLevel) {
      case 'very-low':
        amplitudeBase = 0.03;
        amplitudeVariation = 0.07; // 0.03-0.1
        break;
      case 'low':
        amplitudeBase = 0.08;
        amplitudeVariation = 0.12; // 0.08-0.2
        break;
      case 'medium':
        amplitudeBase = 0.15;
        amplitudeVariation = 0.15; // 0.15-0.3
        break;
      default:
        amplitudeBase = 0.08;
        amplitudeVariation = 0.12;
    }

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
   * Validate that the palette meets pastel criteria
   * Integrated directly into the generator class
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validatePastelPalette(colors);
  }
}

/**
 * Validates that a palette has pastel colors
 * Ensures colors have high brightness and appropriate saturation
 */
export function validatePastelPalette(colors: RGBAVector[]): boolean {
  let pastelCount = 0;

  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Standard pastel criteria:
    // - High value (brightness)
    // - Low to medium saturation
    if (
      hsv[2] > 0.8 && // High brightness
      hsv[1] >= 0.1 &&
      hsv[1] <= 0.5 // Low-medium saturation
    ) {
      pastelCount++;
    }
  }

  // For standard pastel palette, at least 70% should be pastel colors
  const strictPastel = pastelCount / colors.length >= 0.7;

  if (strictPastel) {
    return true;
  }

  // If strict validation fails, try a more flexible validation for diverse pastels
  let flexiblePastelCount = 0;

  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Extended pastel criteria:
    // - High value (brightness) with more flexibility
    // - Low to medium saturation with more flexibility
    if (
      hsv[2] > 0.7 && // Slightly more flexible brightness threshold
      hsv[1] >= 0.05 &&
      hsv[1] <= 0.6 // Wider saturation range
    ) {
      flexiblePastelCount++;
    }
  }

  // For flexible pastel validation, at least 60% should meet the criteria
  return flexiblePastelCount / colors.length >= 0.6;
}
