/**
 * Enhanced Pastel Palette Generator
 * Creates diverse pastel palettes with improved color distribution
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';

/**
 * Utility function to generate pastel-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generatePastelCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Select from expanded pastel palette strategies
  const strategyType = Math.floor(Math.random() * 7); // Increased from 4 to 7 strategies

  // Define hue distribution approach
  let hueDistribution: number[];
  let brightnessStrategy: 'high' | 'varied' | 'gradient' | 'mixed';
  let saturationLevel: 'very-low' | 'low' | 'medium' | 'mixed';

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

    case 4: // Monochromatic pastel with more saturation variation
      const monoHue = Math.random();
      // Tighter hue distribution for monochromatic feel
      hueDistribution = [monoHue, monoHue, monoHue];
      brightnessStrategy = 'gradient'; // Gradient brightness for variation
      saturationLevel = 'mixed'; // Mixed saturation for interest while keeping pastel
      break;

    case 5: // Duo-tone pastel with higher saturation
      const primaryHue = Math.random();
      const secondaryHue = (primaryHue + 0.3 + Math.random() * 0.2) % 1.0; // 0.3-0.5 away
      // Use two main hues with slight variation in the third
      hueDistribution = [primaryHue, secondaryHue, (primaryHue + 0.1) % 1.0];
      brightnessStrategy = 'mixed'; // Mixed brightness levels
      saturationLevel = 'medium'; // Medium saturation for more color presence
      break;

    case 6: // Naturalistic pastel - earthy pastels (greens, pinks, blues)
      // Select from pastel-friendly nature hues (blue, green, pink, peach)
      const natureHues = [0.08, 0.3, 0.58, 0.85]; // Peach, green, blue, pink
      const natureBase = natureHues[Math.floor(Math.random() * natureHues.length)];
      hueDistribution = [natureBase, (natureBase + 0.05) % 1.0, (natureBase + 0.1) % 1.0];
      brightnessStrategy = 'varied';
      saturationLevel = 'mixed';
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
    case 'mixed':
      // Create variety by having different base values per channel
      return generateMixedPastelCoeffs(hueDistribution);
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
    case 'mixed':
      // Handle mixed in the mixed method
      amplitudeBase = 0.1;
      amplitudeVariation = 0.2;
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
 * Special function to generate mixed pastel coefficients with more channel variation
 * This creates much more diverse pastels
 */
function generateMixedPastelCoeffs(hueDistribution: number[]): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Create more diverse offset values to get a variety of base brightnesses
  // This is key to getting diverse pastel bands rather than all white-based
  const redOffset = 0.5 + Math.random() * 0.3; // 0.5-0.8
  const greenOffset = 0.5 + Math.random() * 0.3; // 0.5-0.8
  const blueOffset = 0.5 + Math.random() * 0.3; // 0.5-0.8

  // Use higher amplitude values for more color presence
  // This creates those stronger pastel colors rather than just white tints
  const redAmp = 0.15 + Math.random() * 0.2; // 0.15-0.35
  const greenAmp = 0.15 + Math.random() * 0.2; // 0.15-0.35
  const blueAmp = 0.15 + Math.random() * 0.2; // 0.15-0.35

  // Use varied frequencies per channel for more color mixing
  // This creates those interesting transitions between pastel bands
  const baseFreq = 0.5 + Math.random() * 0.5; // 0.5-1.0
  const redFreq = baseFreq * (0.8 + Math.random() * 0.4);
  const greenFreq = baseFreq * (0.8 + Math.random() * 0.4);
  const blueFreq = baseFreq * (0.8 + Math.random() * 0.4);

  // Use more diverse phase distribution
  // This helps create those bands of different colors rather than just gradients
  const phaseSpread = 0.2 + Math.random() * 0.3; // How far to spread phases
  const redPhase = hueDistribution[0] * TAU;
  const greenPhase = ((hueDistribution[1] + phaseSpread) % 1.0) * TAU;
  const bluePhase = ((hueDistribution[2] + phaseSpread * 2) % 1.0) * TAU;

  return [
    // a: offset vector with intentional variety
    [redOffset, greenOffset, blueOffset, 1] as [number, number, number, 1],

    // b: amplitude vector with stronger values
    [redAmp, greenAmp, blueAmp, 1] as [number, number, number, 1],

    // c: frequency vector with per-channel variation
    [redFreq, greenFreq, blueFreq, 1] as [number, number, number, 1],

    // d: phase vector with wider spread
    [redPhase, greenPhase, bluePhase, 1] as [number, number, number, 1],
  ];
}

export class PastelGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Pastel', steps, options);
  }

  /**
   * Generate candidate coefficients for a pastel palette
   * Now uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generatePastelCoeffs();
  }

  /**
   * Validate that the palette meets pastel criteria
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validatePastelPalette(colors);
  }
}

/**
 * Validates that a palette has pastel colors with improved diversity
 * Ensures colors have high brightness and appropriate saturation
 * Modified to allow more diverse pastel ranges
 */
export function validatePastelPalette(colors: RGBAVector[]): boolean {
  let pastelCount = 0;
  let uniqueHues = new Set();

  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Track unique hues (rounded to nearest 0.1) for diversity check
    if (hsv[1] > 0.15) {
      // Only count hues if saturation is meaningful
      uniqueHues.add(Math.round(hsv[0] * 10) / 10);
    }

    // Enhanced pastel criteria:
    // - High value (brightness)
    // - Low to medium saturation
    // - Flexibility for more color presence
    if (
      hsv[2] > 0.7 && // High brightness (lowered from 0.8)
      hsv[1] >= 0.1 &&
      hsv[1] <= 0.6 // Increased upper saturation limit for more color presence
    ) {
      pastelCount++;
    }
  }

  // For standard pastel palette, at least 70% should be pastel colors
  // AND we should have at least 2 distinct hues for diversity
  const strictPastel = pastelCount / colors.length >= 0.7 && uniqueHues.size >= 2;

  if (strictPastel) {
    return true;
  }

  // If strict validation fails, try a more flexible validation for diverse pastels
  let flexiblePastelCount = 0;

  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Expanded pastel criteria:
    // - More flexibility on brightness to allow for those pastel bands
    // - Wider saturation range for more color presence
    if (
      hsv[2] > 0.6 && // More flexible brightness threshold
      hsv[1] >= 0.05 &&
      hsv[1] <= 0.7 // Even wider saturation range
    ) {
      flexiblePastelCount++;
    }
  }

  // For flexible pastel validation, at least 60% should meet the criteria
  // AND we should have at least 2 distinct hues for diversity
  return flexiblePastelCount / colors.length >= 0.6 && uniqueHues.size >= 2;
}
