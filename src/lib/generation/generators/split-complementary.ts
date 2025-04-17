/**
 * Split-Complementary Palette Generator
 * Creates palettes based on a base color plus two colors adjacent to its complement
 * This provides high contrast with more harmony than pure complementary
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';

/**
 * Utility function to generate split-complementary-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generateSplitComplementaryCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Choose a base hue (0-1)
  const baseHue = Math.random();

  // Calculate complementary hue (opposite on color wheel)
  const compHue = (baseHue + 0.5) % 1.0;

  // Calculate the split complements by shifting ~30° (0.08-0.12) from the complementary
  const splitAngle = 0.08 + Math.random() * 0.04; // ~30° shift with slight randomness
  const splitComp1 = (compHue + splitAngle) % 1.0;
  const splitComp2 = (compHue - splitAngle + 1.0) % 1.0;

  // Convert hues to phases in cosine gradient
  const basePhase = baseHue * TAU;
  const splitComp1Phase = splitComp1 * TAU;
  const splitComp2Phase = splitComp2 * TAU;

  // Determine balance between colors
  const balance = Math.random() * 0.4 - 0.2; // Range -0.2 to 0.2 for moderate balance

  // Amplitude controls the color vibrancy and distinctness
  const amplitude = 0.25 + Math.random() * 0.2; // 0.25-0.45

  // Create a frequency profile that emphasizes the color transitions
  const frequency = 0.6 + Math.random() * 0.6; // 0.6-1.2

  // Add slight variance to create more natural transitions
  const phaseVariance = Math.random() * 0.1; // Small variance (max 10% of cycle)
  const freqVariance = Math.random() * 0.2; // Small frequency variance

  return [
    // a: offset vector - mid-range with slight bias
    [
      0.5 + balance * 0.1, // Red with slight balance bias
      0.5, // Green at midpoint
      0.5 - balance * 0.1, // Blue with opposite balance bias
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - controls the color range and vibrancy
    [
      amplitude,
      amplitude * (0.9 + Math.random() * 0.2), // Slight variance
      amplitude * (0.9 + Math.random() * 0.2), // Slight variance
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // c: frequency vector - controls the transitions between colors
    [
      frequency,
      frequency * (1 + freqVariance), // Add variance
      frequency * (1 - freqVariance), // Add inverse variance
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // d: phase vector - creates the split complementary relationship
    [
      basePhase, // Base color phase
      splitComp1Phase + (Math.random() * phaseVariance - phaseVariance / 2), // Split comp 1 with tiny variance
      splitComp2Phase + (Math.random() * phaseVariance - phaseVariance / 2), // Split comp 2 with tiny variance
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class SplitComplementaryGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('SplitComplementary', steps, options);
  }

  /**
   * Generate candidate coefficients for a split-complementary palette
   * Uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateSplitComplementaryCoeffs();
  }

  /**
   * Validates that the palette meets split-complementary criteria
   * Checks for a main color and two colors near the complement
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateSplitComplementaryPalette(colors);
  }
}

/**
 * Validates that a palette has a split-complementary structure
 * Ensures there's at least one main color and two colors near its complement
 */
export function validateSplitComplementaryPalette(colors: RGBAVector[]): boolean {
  // Need at least 3 colors for a split-complementary palette
  if (colors.length < 3) {
    return false;
  }

  // Convert to HSV for hue analysis
  const hsvColors = colors.map(rgbToHsv);

  // We need colors with sufficient saturation to determine hues
  const saturatedColors = hsvColors.filter((hsv) => hsv[1] > 0.2);

  // Need at least 3 saturated colors
  if (saturatedColors.length < 3) {
    return false;
  }

  // Group hues by their position on the color wheel (24 segments for precision)
  const hueSegments = new Array(24).fill(0);
  let totalHueWeight = 0;

  // Weight by saturation and brightness (more vibrant colors count more)
  for (const hsv of saturatedColors) {
    const segment = Math.floor(hsv[0] * 24) % 24;
    const weight = hsv[1] * hsv[2]; // Weight by saturation * value
    hueSegments[segment] += weight;
    totalHueWeight += weight;
  }

  // Normalize weights
  if (totalHueWeight > 0) {
    for (let i = 0; i < hueSegments.length; i++) {
      hueSegments[i] /= totalHueWeight;
    }
  }

  // Find the most prominent hue segment (the main color)
  let maxSegment = 0;
  let maxWeight = hueSegments[0];

  for (let i = 1; i < hueSegments.length; i++) {
    if (hueSegments[i] > maxWeight) {
      maxWeight = hueSegments[i];
      maxSegment = i;
    }
  }

  // If the main color isn't prominent enough, not a valid split-complementary palette
  if (maxWeight < 0.15) {
    return false;
  }

  // Calculate complementary segment (opposite on the wheel)
  const compSegment = (maxSegment + 12) % 24;

  // Calculate adjacent segments to the complementary (the split complements)
  const splitComp1 = (compSegment + 1) % 24;
  const splitComp2 = (compSegment - 1 + 24) % 24;
  const splitComp3 = (compSegment + 2) % 24;
  const splitComp4 = (compSegment - 2 + 24) % 24;

  // Check the split complementary segments and their immediately adjacent segments
  // We expect to find significant color weight in these regions
  const splitCompWeight1 = hueSegments[splitComp1] + hueSegments[splitComp2];
  const splitCompWeight2 = hueSegments[splitComp3] + hueSegments[splitComp4];

  // Both splits should have some significant presence
  const hasSplitComp1 = splitCompWeight1 > 0.1;
  const hasSplitComp2 = splitCompWeight2 > 0.1;

  // For strict split-complementary validation:
  // We need the main color plus weight in both split complementary regions
  const strictSplitComp = hasSplitComp1 && hasSplitComp2 && maxWeight > 0.2;

  if (strictSplitComp) {
    return true;
  }

  // More flexible validation - check if we have main color plus at least one split region
  const flexibleSplitComp = (hasSplitComp1 || hasSplitComp2) && maxWeight > 0.2;

  return flexibleSplitComp;
}
