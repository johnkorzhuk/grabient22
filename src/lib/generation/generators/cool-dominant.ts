/**
 * Cool-Dominant Palette Generator
 * Creates palettes dominated by cool colors (blues, greens, purples)
 * with optional warm color accents
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, isWarmColor, isCoolColor } from '../color-utils';
import { HueRanges } from '../color-constants';

/**
 * Utility function to generate cool-dominant coefficients
 * Extracted from the generator to make it reusable
 */
export function generateCoolDominantCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Select from multiple cool palette strategies
  const strategyType = Math.floor(Math.random() * 5);

  // Define base values based on selected strategy
  let baseHue: number;
  let offsetRange: [number, number];
  let amplitudeRange: [number, number];
  let frequencyRange: [number, number];
  let phaseVariation: number;
  let includeAccent: boolean = Math.random() > 0.3; // 70% chance of including accent colors

  switch (strategyType) {
    case 0: // Pure blue with depth variation
      baseHue = 0.6 + Math.random() * 0.08; // 0.6-0.68 (deep blues)
      offsetRange = [0.4, 0.6];
      amplitudeRange = [0.25, 0.4];
      frequencyRange = [0.4, 0.8];
      phaseVariation = 0.1;
      includeAccent = false; // No warm accents in this palette
      break;

    case 1: // Cool cyan-dominated
      baseHue = 0.5 + Math.random() * 0.08; // 0.5-0.58 (teals/cyans)
      offsetRange = [0.45, 0.65];
      amplitudeRange = [0.25, 0.45];
      frequencyRange = [0.5, 0.9];
      phaseVariation = 0.15;
      break;

    case 2: // Purple-dominated cool
      baseHue = 0.7 + Math.random() * 0.15; // 0.7-0.85 (purples)
      offsetRange = [0.5, 0.7];
      amplitudeRange = [0.2, 0.35];
      frequencyRange = [0.4, 0.7];
      phaseVariation = 0.2;
      break;

    case 3: // Mixed cool (variety of cool hues)
      // Select from cool hue ranges randomly
      const coolRanges = HueRanges.COOL_HUES;
      const selectedRange = coolRanges[Math.floor(Math.random() * coolRanges.length)];
      baseHue = selectedRange[0] + Math.random() * (selectedRange[1] - selectedRange[0]);
      offsetRange = [0.4, 0.65];
      amplitudeRange = [0.25, 0.45];
      frequencyRange = [0.6, 1.0]; // Higher frequency for more hue variation
      phaseVariation = 0.25; // More variation for mixed hues
      break;

    case 4: // Cool with warm accent
      baseHue = 0.55 + Math.random() * 0.15; // 0.55-0.7 (blues to purples)
      offsetRange = [0.35, 0.6];
      amplitudeRange = [0.3, 0.5];
      frequencyRange = [0.7, 1.1];
      phaseVariation = 0.3; // High variation to include warm accent
      includeAccent = true; // Ensure warm accent
      break;

    default: // Fallback to balanced cool colors
      baseHue = 0.55 + Math.random() * 0.2; // 0.55-0.75
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
  // For cool colors, blue and green channels are typically higher than red
  const blueOffset = randomInRange(offsetRange);
  const greenOffset = randomInRange([offsetRange[0] - 0.05, offsetRange[1] - 0.05]); // Slightly lower green for cooler look
  const redOffset = randomInRange([offsetRange[0] - 0.15, offsetRange[1] - 0.15]); // Even lower red for coolness

  // Higher amplitude for blue to emphasize coolness
  const blueAmp = randomInRange(amplitudeRange) * 1.2;
  const greenAmp = randomInRange(amplitudeRange);
  const redAmp = randomInRange([amplitudeRange[0] * 0.7, amplitudeRange[1] * 0.7]); // Lower red amplitude

  const redFreq = randomInRange(frequencyRange);
  const greenFreq = randomInRange(frequencyRange);
  const blueFreq = randomInRange(frequencyRange);

  // For warm accent, we adjust the phase offset of red channel significantly
  let redPhaseOffset = 0;
  if (includeAccent) {
    // Add significant offset to red phase to create warm accents
    redPhaseOffset = Math.PI / 2 + (Math.random() * Math.PI) / 2; // 90° to 180° offset
  }

  // Enhanced cool palette with careful RGB distribution
  return [
    // a: offset vector - strategic brightness with cool bias
    [
      redOffset,
      greenOffset,
      blueOffset,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - higher blue amplitude for coolness
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
      basePhase + redPhaseOffset + (Math.random() * phaseVariation - phaseVariation / 2),
      basePhase + (Math.random() * phaseVariation - phaseVariation / 2),
      basePhase, // Base blue phase is the reference
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class CoolDominantGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Cool', steps, options);
  }

  /**
   * Generate candidate coefficients for a cool-dominant palette
   * Uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateCoolDominantCoeffs();
  }

  /**
   * Validate that the palette meets cool-dominant criteria
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateCoolDominantPalette(colors);
  }
}

/**
 * Validates that a palette is dominated by cool colors
 * Ensures the majority of colors are cool with optional warm accents
 */
export function validateCoolDominantPalette(colors: RGBAVector[]): boolean {
  let coolCount = 0;
  let warmCount = 0;
  let neutralCount = 0;

  // Calculate cool/warm distributions
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

    if (isCoolColor(hsv)) {
      coolCount++;
    } else if (isWarmColor(hsv)) {
      warmCount++;
    }
  }

  // Count colors with meaningful hue
  const meaningfulColors = coolCount + warmCount;

  // Skip validation if too many colors are neutral or too dark
  if (meaningfulColors < colors.length * 0.5) {
    // At least half the colors should have meaningful hue
    return false;
  }
  
  // Critical check: If there are more warm colors than cool colors,
  // this is definitely not a cool-dominant palette
  if (warmCount > coolCount) {
    return false;
  }

  // For strict cool-dominant validation:
  // At least 65% of colors with meaningful hue should be cool
  const strictCoolDominant = coolCount / meaningfulColors >= 0.65;

  if (strictCoolDominant) {
    return true;
  }

  // For more flexible validation, check if we have a cool-dominant palette
  // with intentional warm accents: 55-65% cool with at least one warm accent
  const flexibleCoolDominant =
    coolCount / meaningfulColors >= 0.55 && coolCount / meaningfulColors < 0.65 && warmCount >= 1;

  return flexibleCoolDominant;
}
