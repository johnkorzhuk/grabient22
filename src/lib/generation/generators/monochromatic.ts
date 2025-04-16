/**
 * Monochromatic Palette Generator with Improved Validation
 * Creates palettes with variations of a single hue
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';

export class MonochromaticGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Monochromatic', steps, options);
  }

  /**
   * Generate candidate coefficients for a monochromatic palette
   * Improved to ensure truly monochromatic results
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    const TAU = Math.PI * 2;

    // Choose a single base hue (0-1)
    const baseHue = Math.random();

    // Convert hue to phase in cosine gradient
    const basePhase = baseHue * TAU;

    // Create a stronger monochromatic effect by:
    // 1. Using VERY similar phase values for all RGB channels (slight variance for richness)
    // 2. Using lower frequency values for smoother transitions
    // 3. Carefully controlling amplitude to prevent hue shifts

    // Generate a balanced coefficient set for monochromatic palettes
    const phaseVariance = Math.random() * 0.05; // Very small variance (max 5% of cycle)

    // The key to monochromatic palettes is precisely balanced RGB amplitudes
    // Too much difference creates hue shifts
    const baseAmplitude = 0.15 + Math.random() * 0.2; // 0.15-0.35

    // We'll create coordinated amplitudes to maintain hue
    // These small variances prevent completely flat colors
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
   * Validates that the palette meets monochromatic criteria
   * Greatly improved strictness to ensure true monochromatic palettes
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateMonochromaticPalette(colors);
  }
}

/**
 * Significantly more strict validation for monochromatic palettes
 * Ensures all colors truly share the same hue with minimal variance
 */
export function validateMonochromaticPalette(colors: RGBAVector[]): boolean {
  // Convert to HSV for easier hue analysis
  const hsvColors = colors.map(rgbToHsv);

  // We need a minimum brightness range for visual interest
  const values = hsvColors.map((hsv) => hsv[2]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;

  // Monochromatic palettes should have good brightness variation
  if (valueRange < 0.2) {
    return false; // Reject palettes with insufficient value range
  }

  // Exclude palettes with too many very dark or very light colors
  const veryDarkCount = values.filter((v) => v < 0.15).length;
  const veryLightCount = values.filter((v) => v > 0.9).length;

  // More than one very dark or very light color is suspicious for monochromatic
  if (veryDarkCount > 1 || veryLightCount > 1) {
    return false;
  }

  // Find colors with enough saturation to determine a reference hue
  const saturatedColors = hsvColors.filter((hsv) => hsv[1] > 0.15);

  // Need at least 2 saturated colors to validate hue consistency
  if (saturatedColors.length < 2) {
    return false;
  }

  // Get the reference hue from the most saturated color
  const mostSaturatedColor = hsvColors.reduce(
    (prev, curr) => (curr[1] > prev[1] ? curr : prev),
    hsvColors[0],
  );
  const referenceHue = mostSaturatedColor[0];

  // Track consistency of hue across all reasonably saturated colors
  let hueDifferences = [];

  for (const hsv of saturatedColors) {
    let hueDiff = Math.abs(hsv[0] - referenceHue);

    // Handle color wheel wrap-around
    if (hueDiff > 0.5) {
      hueDiff = 1.0 - hueDiff;
    }

    hueDifferences.push(hueDiff);
  }

  // Calculate the max hue difference
  const maxHueDiff = Math.max(...hueDifferences);

  // For strict monochromatic validation:
  // - Maximum hue difference should be very small (under 5% of the color wheel)
  // - Special exemption for very high or very low saturation colors
  const isMonochromatic = maxHueDiff <= 0.05;

  // Also check if there's at least some saturation range for visual interest
  const saturations = hsvColors.map((hsv) => hsv[1]);
  const saturationRange = Math.max(...saturations) - Math.min(...saturations);
  const hasSufficientSaturationRange = saturationRange >= 0.1;

  // Check if colors transition smoothly (not abrupt jumps)
  let hasSmooth = true;
  const sortedByValue = [...hsvColors].sort((a, b) => a[2] - b[2]);

  for (let i = 1; i < sortedByValue.length; i++) {
    const valueDiff = sortedByValue[i][2] - sortedByValue[i - 1][2];
    // No big jumps in value allowed for monochromatic palettes
    if (valueDiff > 0.3) {
      hasSmooth = false;
      break;
    }
  }

  return isMonochromatic && hasSufficientSaturationRange && hasSmooth;
}
