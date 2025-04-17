/**
 * Complementary Palette Generator with Advanced Validation
 * Creates palettes based on opposite colors on the color wheel
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';

/**
 * Utility function to generate complementary-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generateComplementaryCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Choose a base hue (0-1)
  const baseHue = Math.random();

  // Calculate complementary hue (opposite on color wheel, +0.5 with wraparound)
  const compHue = (baseHue + 0.5) % 1.0;

  // Convert hues to phases in cosine gradient
  const basePhase = baseHue * TAU;
  const compPhase = compHue * TAU;

  // We'll use a strategy to create two distinct color regions
  // by carefully setting the phase values and frequencies

  // Determine the balance between primary and complementary colors
  // 0.0 = equal balance, 1.0 = primary dominance, -1.0 = complementary dominance
  const balance = Math.random() * 0.6 - 0.3; // Range -0.3 to 0.3 for moderate balance

  // Amplitude controls the color vibrancy and distinctness
  const amplitude = 0.25 + Math.random() * 0.15; // 0.25-0.40

  // Create a frequency profile that emphasizes the two color regions
  const frequency = 0.5 + Math.random() * 0.5; // 0.5-1.0

  // Add slight variance to create more natural transitions
  const phaseVariance = Math.random() * 0.1; // Small variance (max 10% of cycle)
  const freqVariance = Math.random() * 0.2; // Small frequency variance

  return [
    // a: offset vector - mid-range with slight bias toward brighter colors
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

    // c: frequency vector - controls the transitions between complementary colors
    [
      frequency,
      frequency * (1 + freqVariance), // Add variance
      frequency * (1 - freqVariance), // Add inverse variance
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // d: phase vector - creates the complementary hue opposition
    [
      basePhase + balance * 0.2, // Primary hue with balance shift
      compPhase + (Math.random() * phaseVariance - phaseVariance / 2), // Complementary hue with tiny variance
      basePhase + (Math.random() * phaseVariance - phaseVariance / 2) + Math.PI / 2, // Orthogonal phase for more interesting colors
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class ComplementaryGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Complementary', steps, options);
  }

  /**
   * Generate candidate coefficients for a complementary palette
   * Now uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateComplementaryCoeffs();
  }

  /**
   * Validates that the palette meets complementary criteria
   * Checks for colors on opposite sides of the color wheel
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateComplementaryPalette(colors);
  }
}

/**
 * Checks if two hues are complementary (opposite on color wheel)
 * @param hue1 First hue (0-1)
 * @param hue2 Second hue (0-1)
 * @param tolerance Tolerance for complementary angle (in hue units, 0-1)
 * @returns Boolean indicating if hues are complementary
 */
function areComplementaryHues(hue1: number, hue2: number, tolerance: number = 0.1): boolean {
  // Calculate the difference between hues, considering wraparound
  let hueDiff = Math.abs(hue1 - hue2);

  // Handle wraparound (e.g., hue 0.1 and 0.9 are 0.2 apart, not 0.8)
  if (hueDiff > 0.5) {
    hueDiff = 1 - hueDiff;
  }

  // Complementary hues should be approximately 0.5 (180°) apart
  return Math.abs(hueDiff - 0.5) <= tolerance;
}

/**
 * Validates that a palette has complementary colors
 * Ensures there are distinct color groups on opposite sides of the color wheel
 */
export function validateComplementaryPalette(colors: RGBAVector[]): boolean {
  // Need at least 3 colors for a meaningful complementary palette
  if (colors.length < 3) {
    return false;
  }

  // Convert to HSV for easier hue analysis
  const hsvColors = colors.map(rgbToHsv);

  // We need colors with sufficient saturation to determine hues
  const saturatedColors = hsvColors.filter((hsv) => hsv[1] > 0.2);

  // Need at least 2 saturated colors
  if (saturatedColors.length < 2) {
    return false;
  }

  // Group hues by their position on the color wheel (12 segments)
  const hueSegments = new Array(12).fill(0);
  let totalHueWeight = 0;

  // Weight by saturation and brightness (more vibrant colors count more)
  for (const hsv of saturatedColors) {
    const segment = Math.floor(hsv[0] * 12) % 12;
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

  // Check for complementary pattern:
  // We should have significant color weight in opposing segments
  let foundComplementary = false;

  for (let i = 0; i < 6; i++) {
    const segment1 = i;
    const segment2 = (i + 6) % 12; // Opposite segment

    // Adjacent segments can contribute to the same hue region
    const region1 =
      hueSegments[segment1] +
      hueSegments[(segment1 + 1) % 12] * 0.5 +
      hueSegments[(segment1 + 11) % 12] * 0.5;

    const region2 =
      hueSegments[segment2] +
      hueSegments[(segment2 + 1) % 12] * 0.5 +
      hueSegments[(segment2 + 11) % 12] * 0.5;

    // Both regions should have significant weight, and their sum should be substantial
    if (region1 > 0.15 && region2 > 0.15 && region1 + region2 > 0.6) {
      foundComplementary = true;
      break;
    }
  }

  // If we failed the segment test, try a direct hue-pair analysis
  if (!foundComplementary) {
    // Test each pair of saturated colors for complementary relationship
    for (let i = 0; i < saturatedColors.length; i++) {
      for (let j = i + 1; j < saturatedColors.length; j++) {
        if (areComplementaryHues(saturatedColors[i][0], saturatedColors[j][0])) {
          // Check if these colors have sufficient importance in the palette
          // (by being bright/saturated or by having multiple similar hues)
          const hue1 = saturatedColors[i][0];
          const hue2 = saturatedColors[j][0];
          let weight1 = 0;
          let weight2 = 0;

          for (const hsv of saturatedColors) {
            const hueDiff1 = Math.min(Math.abs(hsv[0] - hue1), 1 - Math.abs(hsv[0] - hue1));
            const hueDiff2 = Math.min(Math.abs(hsv[0] - hue2), 1 - Math.abs(hsv[0] - hue2));

            if (hueDiff1 < 0.1) {
              weight1 += hsv[1] * hsv[2]; // Add saturation * value as weight
            }
            if (hueDiff2 < 0.1) {
              weight2 += hsv[1] * hsv[2]; // Add saturation * value as weight
            }
          }

          if (weight1 > 0.2 && weight2 > 0.2) {
            foundComplementary = true;
            break;
          }
        }
      }
      if (foundComplementary) break;
    }
  }

  return foundComplementary;
}
