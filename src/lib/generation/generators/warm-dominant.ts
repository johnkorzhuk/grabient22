/**
 * Warm-Dominant Palette Generator
 * Creates palettes dominated by warm colors (reds, oranges, yellows)
 * with optional cool color accents
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, isWarmColor, isCoolColor } from '../color-utils';
import { HueRanges } from '../color-constants';

/**
 * Utility function to generate warm-dominant coefficients
 * Extracted from the generator to make it reusable
 */
export function generateWarmDominantCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Select from multiple warm palette strategies
  const strategyType = Math.floor(Math.random() * 5);

  // Define base values based on selected strategy
  let baseHue: number;
  let offsetRange: [number, number];
  let amplitudeRange: [number, number];
  let frequencyRange: [number, number];
  let phaseVariation: number;
  let includeAccent: boolean = Math.random() > 0.3; // 70% chance of including accent colors

  switch (strategyType) {
    case 0: // Pure warm with red dominance
      baseHue = 0.98 + Math.random() * 0.04; // 0.98-0.02 (deep reds)
      offsetRange = [0.4, 0.6];
      amplitudeRange = [0.25, 0.4];
      frequencyRange = [0.4, 0.8];
      phaseVariation = 0.1;
      includeAccent = false; // No cool accents in this palette
      break;

    case 1: // Orange-dominated warm
      baseHue = 0.05 + Math.random() * 0.04; // 0.05-0.09 (oranges)
      offsetRange = [0.45, 0.65];
      amplitudeRange = [0.25, 0.45];
      frequencyRange = [0.5, 0.9];
      phaseVariation = 0.15;
      break;

    case 2: // Yellow-dominated warm
      baseHue = 0.12 + Math.random() * 0.05; // 0.12-0.17 (yellows)
      offsetRange = [0.5, 0.7];
      amplitudeRange = [0.2, 0.35];
      frequencyRange = [0.4, 0.7];
      phaseVariation = 0.2;
      break;

    case 3: // Mixed warm (all warm hues with transitions)
      // Select from warm hue ranges randomly
      const warmRanges = HueRanges.WARM_HUES;
      const selectedRange = warmRanges[Math.floor(Math.random() * warmRanges.length)];
      baseHue = selectedRange[0] + Math.random() * (selectedRange[1] - selectedRange[0]);
      offsetRange = [0.4, 0.65];
      amplitudeRange = [0.25, 0.45];
      frequencyRange = [0.6, 1.0]; // Higher frequency for more hue variation
      phaseVariation = 0.25; // More variation for mixed hues
      break;

    case 4: // Warm with cool accent
      baseHue = 0.03 + Math.random() * 0.12; // 0.03-0.15 (red-orange-yellow)
      offsetRange = [0.35, 0.6];
      amplitudeRange = [0.3, 0.5];
      frequencyRange = [0.7, 1.1];
      phaseVariation = 0.3; // High variation to include cool accent
      includeAccent = true; // Ensure cool accent
      break;

    default: // Fallback to balanced warm colors
      baseHue = 0.05 + Math.random() * 0.1; // 0.05-0.15
      offsetRange = [0.4, 0.6];
      amplitudeRange = [0.25, 0.4];
      frequencyRange = [0.5, 0.8];
      phaseVariation = 0.2;
  }

  const basePhase = baseHue * TAU;

  // Random value within a range helper
  const randomInRange = (range: [number, number]): number => {
    return range[0] + Math.random() * (range[1] - range[0]);
  };

  // Create diversity in each RGB channel
  const redOffset = randomInRange(offsetRange);
  const greenOffset = randomInRange([offsetRange[0] - 0.1, offsetRange[1] - 0.1]); // Slightly darker green for warmth
  const blueOffset = randomInRange([offsetRange[0] - 0.15, offsetRange[1] - 0.15]); // Even darker blue for warmth

  // Higher amplitude for red to emphasize warmth
  const redAmp = randomInRange(amplitudeRange) * 1.2;
  const greenAmp = randomInRange(amplitudeRange);
  const blueAmp = randomInRange([amplitudeRange[0] * 0.7, amplitudeRange[1] * 0.7]); // Lower blue amplitude

  const redFreq = randomInRange(frequencyRange);
  const greenFreq = randomInRange(frequencyRange);
  const blueFreq = randomInRange(frequencyRange);

  // For cool accent, we adjust the phase offset of blue channel significantly
  let bluePhaseOffset = 0;
  if (includeAccent) {
    // Add significant offset to blue phase to create cool accents
    bluePhaseOffset = Math.PI / 2 + (Math.random() * Math.PI) / 2; // 90° to 180° offset
  }

  // Enhanced warm palette with careful RGB distribution
  return [
    // a: offset vector - strategic brightness with warm bias
    [
      redOffset,
      greenOffset,
      blueOffset,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - higher red amplitude for warmth
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
      basePhase + bluePhaseOffset + (Math.random() * phaseVariation - phaseVariation / 2),
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class WarmDominantGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('WarmDominant', steps, options);
  }

  /**
   * Generate candidate coefficients for a warm-dominant palette
   * Uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateWarmDominantCoeffs();
  }

  /**
   * Validate that the palette meets warm-dominant criteria
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateWarmDominantPalette(colors);
  }
}

/**
 * Validates that a palette is dominated by warm colors
 * Ensures the majority of colors are warm with optional cool accents
 */
export function validateWarmDominantPalette(colors: RGBAVector[]): boolean {
  let warmCount = 0;
  let coolCount = 0;
  let neutralCount = 0;

  // Calculate warm/cool distributions
  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Skip very dark colors in the calculation
    if (hsv[2] < 0.1) {
      continue;
    }

    // Skip colors with very low saturation (neutrals)
    if (hsv[1] < 0.15) {
      neutralCount++;
      continue;
    }

    if (isWarmColor(hsv)) {
      warmCount++;
    } else if (isCoolColor(hsv)) {
      coolCount++;
    }
  }

  // Count colors with meaningful hue
  const meaningfulColors = warmCount + coolCount;

  // Skip validation if too many colors are neutral or too dark
  if (meaningfulColors < colors.length * 0.5) {
    // At least half the colors should have meaningful hue
    return false;
  }

  // For strict warm-dominant validation:
  // At least 65% of colors with meaningful hue should be warm
  const strictWarmDominant = warmCount / meaningfulColors >= 0.65;

  if (strictWarmDominant) {
    return true;
  }

  // For more flexible validation, check if we have a warm-dominant palette
  // with intentional cool accents: 55-65% warm with at least one cool accent
  const flexibleWarmDominant =
    warmCount / meaningfulColors >= 0.55 && warmCount / meaningfulColors < 0.65 && coolCount >= 1;

  return flexibleWarmDominant;
}
