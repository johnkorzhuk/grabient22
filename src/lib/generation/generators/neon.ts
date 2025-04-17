/**
 * Neon Palette Generator
 * Creates vibrant, high-intensity, saturated palettes with glowing quality
 * Enhanced for compatibility with Monochromatic category
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv } from '../color-utils';
import { HueRanges } from '../color-constants';

/**
 * Utility function to generate neon-style coefficients
 * With enhanced monochromatic-compatible option
 */
export function generateNeonCoeffs(options: { forMonochromatic?: boolean } = {}): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Check if we're generating for monochromatic compatibility
  const forMonochromatic = options.forMonochromatic || false;

  // If generating for monochromatic, force the monochromatic neon strategy
  const strategyType = forMonochromatic ? 0 : Math.floor(Math.random() * 4);

  let baseHue: number;
  let offsetRange: [number, number];
  let amplitudeRange: [number, number];
  let frequencyRange: [number, number];
  let phaseVariation: number;
  let distributeHues: boolean = false;

  switch (strategyType) {
    case 0: // Monochromatic neon (single vibrant color)
      baseHue = Math.random(); // Any hue can be neon
      offsetRange = [0.5, 0.7]; // Higher offset for brightness
      amplitudeRange = [0.4, 0.6]; // High amplitude for vibrance
      frequencyRange = [0.15, 0.3]; // Lowered for monochromatic compatibility
      phaseVariation = 0.03; // Reduced for tighter hue control
      distributeHues = false;
      break;

    case 1: // Cyberpunk neon (neon colors against dark)
      // Choose from classic cyberpunk colors: magenta, cyan, blue
      const cyberpunkHues = [0.5, 0.65, 0.85]; // Cyan, blue, magenta
      baseHue = cyberpunkHues[Math.floor(Math.random() * cyberpunkHues.length)];
      offsetRange = [0.3, 0.5]; // Lower offset for darker backgrounds
      amplitudeRange = [0.5, 0.7]; // Very high amplitude for extreme contrast
      frequencyRange = [0.4, 0.7]; // Moderate-high frequency
      phaseVariation = 0.2; // More variation for color accents
      distributeHues = true; // Distribute phases for multi-color effect
      break;

    case 2: // Vaporwave neon (80s aesthetic, pastels with neon accents)
      // Choose from vaporwave palette: pink, cyan, purple
      const vaporwaveHues = [0.83, 0.5, 0.75]; // Pink, cyan, purple
      baseHue = vaporwaveHues[Math.floor(Math.random() * vaporwaveHues.length)];
      offsetRange = [0.6, 0.8]; // Higher offset for pastel base
      amplitudeRange = [0.3, 0.5]; // Moderate amplitude
      frequencyRange = [0.6, 0.9]; // Higher frequency for more color variation
      phaseVariation = 0.15; // Moderate variation
      distributeHues = true; // Distribute phases for iconic vaporwave look
      break;

    case 3: // RGB Gamer neon (vibrant red, green, blue)
      baseHue = 0; // Start with red, but we'll distribute the RGB channels specifically
      offsetRange = [0.4, 0.6]; // Moderate offset
      amplitudeRange = [0.4, 0.6]; // High amplitude for vibrance
      frequencyRange = [0.2, 0.4]; // Lower frequency for cleaner transitions
      phaseVariation = 0.1; // Some variation
      distributeHues = true; // Specifically distribute for RGB effect
      break;

    default: // Fallback to generic neon
      baseHue = Math.random();
      offsetRange = [0.5, 0.7];
      amplitudeRange = [0.4, 0.6];
      frequencyRange = [0.3, 0.6];
      phaseVariation = 0.1;
      distributeHues = false;
  }

  // Random value within a range helper
  const randomInRange = (range: [number, number]): number => {
    return range[0] + Math.random() * (range[1] - range[0]);
  };

  // Create diversity in each RGB channel
  const redOffset = randomInRange(offsetRange);
  const greenOffset = randomInRange(offsetRange);
  const blueOffset = randomInRange(offsetRange);

  // Higher amplitude values for neon effect
  const redAmp = randomInRange(amplitudeRange);
  const greenAmp = randomInRange(amplitudeRange);
  const blueAmp = randomInRange(amplitudeRange);

  const redFreq = randomInRange(frequencyRange);
  const greenFreq = randomInRange(frequencyRange);
  const blueFreq = randomInRange(frequencyRange);

  // Calculate phases based on strategy
  let redPhase: number, greenPhase: number, bluePhase: number;

  if (distributeHues && !forMonochromatic) {
    if (strategyType === 3) {
      // RGB Gamer neon: specifically set RGB channels
      redPhase = 0; // Red
      greenPhase = TAU / 3; // Green (120°)
      bluePhase = (2 * TAU) / 3; // Blue (240°)
    } else {
      // Distribute phases for multi-color effect
      redPhase = baseHue * TAU;
      greenPhase = ((baseHue + 0.33) % 1.0) * TAU; // Offset by ~120°
      bluePhase = ((baseHue + 0.67) % 1.0) * TAU; // Offset by ~240°
    }
  } else {
    // Single-hue neon: keep phases close but with small variations
    redPhase = baseHue * TAU;
    greenPhase = baseHue * TAU + (Math.random() * phaseVariation - phaseVariation / 2);
    bluePhase = baseHue * TAU + (Math.random() * phaseVariation - phaseVariation / 2);
  }

  // Enhanced neon palette with intentional vibrancy
  return [
    // a: offset vector - high values for brightness
    [
      redOffset,
      greenOffset,
      blueOffset,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - high values for vibrant colors
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

    // d: phase vector - creates the specific neon color relationships
    [
      redPhase,
      greenPhase,
      bluePhase,
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class NeonGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Neon', steps, options);
  }

  /**
   * Generate candidate coefficients for a neon palette
   * With special handling for multi-category cases
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    // When combined with Monochromatic, use the monochromatic-compatible option
    if (this.appliedCategories.includes('Monochromatic')) {
      return generateNeonCoeffs({ forMonochromatic: true });
    }

    // Otherwise use standard generation
    return generateNeonCoeffs();
  }

  /**
   * Validates that the palette meets neon criteria
   * With special handling for multi-category combinations
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    // Use appropriate validation based on applied categories
    if (this.appliedCategories.includes('Monochromatic')) {
      return validateMonochromaticNeonPalette(colors);
    }

    // Standard validation
    return validateNeonPalette(colors);
  }
}

/**
 * Validates that a palette contains neon colors
 * Ensures colors are bright, saturated, and vibrant
 */
export function validateNeonPalette(colors: RGBAVector[]): boolean {
  let neonCount = 0;
  let vibrantCount = 0;

  // Define neon quality threshold
  const MIN_SATURATION = 0.5;
  const MIN_VALUE = 0.6;
  const HIGH_VIBRANCE_SAT = 0.7;
  const HIGH_VIBRANCE_VAL = 0.7;

  for (const color of colors) {
    const hsv = rgbToHsv(color);
    const [h, s, v] = hsv;

    // Count vibrant colors (high saturation, high brightness)
    if (s > MIN_SATURATION && v > MIN_VALUE) {
      vibrantCount++;

      // Check if the hue corresponds to traditionally neon colors
      // (blues, pinks, greens, cyans, purples)
      const isNeonHue =
        (h >= 0.45 && h <= 0.65) || // Blues, cyans
        (h >= 0.75 && h <= 0.95) || // Magentas, pinks
        (h >= 0.25 && h <= 0.43) || // Greens
        (h >= 0.0 && h <= 0.05); // Reds

      // Extra boost for particularly vibrant colors regardless of hue
      if (
        (isNeonHue && s > MIN_SATURATION && v > MIN_VALUE) ||
        (s > HIGH_VIBRANCE_SAT && v > HIGH_VIBRANCE_VAL)
      ) {
        neonCount++;
      }
    }
  }

  // For relaxed neon validation:
  // At least 30% of colors should qualify as neon
  // and at least 50% should be vibrant
  const relaxedNeon = neonCount / colors.length >= 0.3 && vibrantCount / colors.length >= 0.5;

  // Check for high contrast between colors
  // (characteristic of neon palettes)
  let minValue = 1.0;
  let maxValue = 0.0;

  for (const color of colors) {
    const hsv = rgbToHsv(color);
    minValue = Math.min(minValue, hsv[2]);
    maxValue = Math.max(maxValue, hsv[2]);
  }

  const hasHighContrast = maxValue - minValue > 0.4;

  return relaxedNeon || (vibrantCount / colors.length >= 0.4 && hasHighContrast);
}

/**
 * Special validator for monochromatic neon palettes
 * Focuses on vibrancy within a single hue
 */
export function validateMonochromaticNeonPalette(colors: RGBAVector[]): boolean {
  // Convert to HSV for analysis
  const hsvColors = colors.map(rgbToHsv);

  // Get the reference hue from the most saturated color
  const mostSaturatedColor = hsvColors.reduce(
    (prev, curr) => (curr[1] > prev[1] ? curr : prev),
    hsvColors[0],
  );
  const referenceHue = mostSaturatedColor[0];

  // Check hue consistency (monochromatic constraint)
  let similarHueCount = 0;
  const maxHueDiff = 0.1; // 10% of the color wheel

  for (const hsv of hsvColors) {
    if (hsv[1] < 0.2) continue; // Skip very desaturated colors

    let hueDiff = Math.abs(hsv[0] - referenceHue);
    if (hueDiff > 0.5) hueDiff = 1.0 - hueDiff; // Handle wraparound

    if (hueDiff <= maxHueDiff) {
      similarHueCount++;
    }
  }

  // Count vibrant colors (neon constraint)
  let vibrantCount = 0;
  const MIN_VALUE = 0.6;
  const MIN_SATURATION = 0.5;

  for (const hsv of hsvColors) {
    if (hsv[1] >= MIN_SATURATION && hsv[2] >= MIN_VALUE) {
      vibrantCount++;
    }
  }

  // For a monochromatic neon palette:
  // 1. At least 70% of saturated colors should share the same hue (monochromatic constraint)
  // 2. At least 40% of all colors should be vibrant (neon constraint)
  const saturatedColors = hsvColors.filter((hsv) => hsv[1] >= 0.2);

  const hasConsistentHue =
    saturatedColors.length > 0 && similarHueCount / saturatedColors.length >= 0.7;

  const hasVibrantColors = vibrantCount / colors.length >= 0.4;

  // Check brightness range - neon palettes often have good contrast
  const values = hsvColors.map((hsv) => hsv[2]);
  const brightnessRange = Math.max(...values) - Math.min(...values);
  const hasGoodContrast = brightnessRange >= 0.3;

  return hasConsistentHue && hasVibrantColors && hasGoodContrast;
}
