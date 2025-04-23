/**
 * Low-Value Palette Generator
 * Creates dark, rich palettes with low brightness/lightness values
 * Perfect for dark themes, night scenes, and dramatic designs
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv } from '../color-utils';

/**
 * Utility function to generate low-value style coefficients
 */
export function generateLowValueCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Select from multiple low-value strategies
  const strategyType = Math.floor(Math.random() * 4);

  // Define base values based on selected strategy
  let baseHue: number;
  let offsetRange: [number, number];
  let amplitudeRange: [number, number];
  let frequencyRange: [number, number];
  let phaseDistribution: 'mono' | 'compl' | 'triad' | 'analog' = 'mono';

  switch (strategyType) {
    case 0: // Dark monochromatic
      baseHue = Math.random(); // Any hue can be low-value
      offsetRange = [0.1, 0.3]; // Very low offset for darkness
      amplitudeRange = [0.05, 0.25]; // Lower amplitude for subtle variations
      frequencyRange = [0.3, 0.7]; // Moderate frequency for smooth transitions
      phaseDistribution = 'mono';
      break;

    case 1: // Dark complementary
      baseHue = Math.random();
      offsetRange = [0.15, 0.35]; // Very low offset for darkness
      amplitudeRange = [0.1, 0.3]; // Moderate amplitude for some color contrast
      frequencyRange = [0.5, 0.9]; // Higher frequency for more varied transitions
      phaseDistribution = 'compl';
      break;

    case 2: // Dark triadic
      baseHue = Math.random();
      offsetRange = [0.15, 0.35]; // Very low offset for darkness
      amplitudeRange = [0.1, 0.3]; // Moderate amplitude for some color contrast
      frequencyRange = [0.6, 1.0]; // Higher frequency for more varied transitions
      phaseDistribution = 'triad';
      break;

    case 3: // Dark analogous
      baseHue = Math.random();
      offsetRange = [0.1, 0.3]; // Very low offset for darkness
      amplitudeRange = [0.05, 0.25]; // Lower amplitude for subtle hue shifts
      frequencyRange = [0.4, 0.8]; // Moderate frequency for smooth transitions
      phaseDistribution = 'analog';
      break;

    default: // Fallback to dark monochromatic
      baseHue = Math.random();
      offsetRange = [0.1, 0.3];
      amplitudeRange = [0.05, 0.2];
      frequencyRange = [0.3, 0.7];
      phaseDistribution = 'mono';
  }

  const basePhase = baseHue * TAU;

  // Random value within a range helper
  const randomInRange = (range: [number, number]): number => {
    return range[0] + Math.random() * (range[1] - range[0]);
  };

  // Create diversity in each RGB channel while maintaining low value
  // The key is low offset values (close to 0.0) for darkness
  const redOffset = randomInRange(offsetRange);
  const greenOffset = randomInRange(offsetRange);
  const blueOffset = randomInRange(offsetRange);

  // Use moderate to low amplitude to maintain darkness
  const redAmp = randomInRange(amplitudeRange);
  const greenAmp = randomInRange(amplitudeRange);
  const blueAmp = randomInRange(amplitudeRange);

  // Moderate frequency values for varied transitions
  const redFreq = randomInRange(frequencyRange);
  const greenFreq = randomInRange(frequencyRange);
  const blueFreq = randomInRange(frequencyRange);

  // Phase distribution based on color scheme
  let redPhase: number, greenPhase: number, bluePhase: number;

  switch (phaseDistribution) {
    case 'mono': // Monochromatic - slight variations of same hue
      redPhase = basePhase;
      greenPhase = basePhase + (Math.random() * 0.05 - 0.025); // Minor variation
      bluePhase = basePhase + (Math.random() * 0.05 - 0.025); // Minor variation
      break;

    case 'compl': // Complementary - opposite hues
      redPhase = basePhase;
      greenPhase = Math.random() > 0.5 ? basePhase : (basePhase + TAU / 2) % TAU; // 50% chance of complement
      bluePhase = Math.random() > 0.5 ? basePhase : (basePhase + TAU / 2) % TAU; // 50% chance of complement
      break;

    case 'triad': // Triadic - three evenly spaced hues
      redPhase = basePhase;
      greenPhase = (basePhase + TAU / 3) % TAU; // +120°
      bluePhase = (basePhase + (2 * TAU) / 3) % TAU; // +240°
      break;

    case 'analog': // Analogous - adjacent hues
      redPhase = basePhase;
      greenPhase = (basePhase + TAU / 12) % TAU; // +30°
      bluePhase = (basePhase - TAU / 12 + TAU) % TAU; // -30°
      break;

    default: // Fallback to monochromatic
      redPhase = basePhase;
      greenPhase = basePhase + (Math.random() * 0.05 - 0.025);
      bluePhase = basePhase + (Math.random() * 0.05 - 0.025);
  }

  return [
    // a: offset vector - very low values for darkness
    [
      redOffset,
      greenOffset,
      blueOffset,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - moderate to low for controlled variation
    [
      redAmp,
      greenAmp,
      blueAmp,
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // c: frequency vector - moderate for pleasant transitions
    [
      redFreq,
      greenFreq,
      blueFreq,
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // d: phase vector - varied based on color scheme
    [
      redPhase,
      greenPhase,
      bluePhase,
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class LowValueGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Dark', steps, options);
  }

  /**
   * Generate candidate coefficients for a low-value palette
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateLowValueCoeffs();
  }

  /**
   * Validate that the palette meets low-value criteria
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateLowValuePalette(colors);
  }
}

/**
 * Validates that a palette contains low-value (dark) colors
 */
export function validateLowValuePalette(colors: RGBAVector[]): boolean {
  let lowValueCount = 0;

  // Define low-value quality thresholds
  const LOW_VALUE_MAX = 0.4; // Maximum brightness to qualify as low-value

  // Check each color for darkness
  for (const color of colors) {
    const hsv = rgbToHsv(color);
    const v = hsv[2]; // Value/brightness component

    // Count colors that meet maximum low-value threshold
    if (v <= LOW_VALUE_MAX) {
      lowValueCount++;
    }
  }

  // Calculate percentage of low-value colors
  const lowValuePercentage = lowValueCount / colors.length;

  // For a low-value palette, at least 75% of colors should be dark
  const hasLowValueColors = lowValuePercentage >= 0.75;

  // Also check that we don't have too many extremely bright colors
  const brightColors = colors.filter((c) => rgbToHsv(c)[2] > 0.7);
  const hasTooManyBrightColors = brightColors.length > colors.length * 0.1; // No more than 10% can be bright

  // Calculate average brightness across the palette
  const avgBrightness = colors.reduce((sum, c) => sum + rgbToHsv(c)[2], 0) / colors.length;
  const hasLowAverageBrightness = avgBrightness <= 0.35; // Palette average should be dark

  // Additional check for perceived richness - not just black
  // At least some colors should have saturation
  const hasRichColors = colors.some((c) => {
    const hsv = rgbToHsv(c);
    return hsv[1] > 0.4 && hsv[2] > 0.15; // Some saturation and not too dark to see
  });

  return hasLowValueColors && hasLowAverageBrightness && !hasTooManyBrightColors && hasRichColors;
}
