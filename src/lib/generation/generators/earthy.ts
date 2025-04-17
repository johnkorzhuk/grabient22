/**
 * Earthy Palette Generator with Integrated Validator
 * Creates palettes with natural colors like browns, tans, olive greens
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv } from '../color-utils';
import { HueRanges } from '../color-constants';

/**
 * Utility function to generate earthy-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generateEarthyCoeffs(): CosineCoeffs {
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

    case 1: // Forest and olive greens
      baseHue = 0.26 + Math.random() * 0.1; // 0.26-0.36 (olive to forest)
      offsetRange = [0.35, 0.55];
      amplitudeRange = [0.15, 0.35];
      frequencyRange = [0.3, 0.5];
      phaseVariation = 0.12;
      break;

    case 2: // Muted sage and clay
      baseHue = 0.15 + Math.random() * 0.15; // 0.15-0.3 (yellow-green to sage)
      offsetRange = [0.45, 0.65];
      amplitudeRange = [0.1, 0.25];
      frequencyRange = [0.2, 0.4];
      phaseVariation = 0.1;
      break;

    case 3: // Rich terra cotta and russets
      baseHue = 0.02 + Math.random() * 0.04; // 0.02-0.06 (red-orange)
      offsetRange = [0.3, 0.5];
      amplitudeRange = [0.2, 0.4];
      frequencyRange = [0.35, 0.55];
      phaseVariation = 0.2;
      break;

    case 4: // Muted sand and wheat
      baseHue = 0.08 + Math.random() * 0.07; // 0.08-0.15 (yellow-tan)
      offsetRange = [0.5, 0.7];
      amplitudeRange = [0.1, 0.2];
      frequencyRange = [0.25, 0.4];
      phaseVariation = 0.08;
      break;

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

export class EarthyGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Earthy', steps, options);
  }

  /**
   * Generate candidate coefficients for an earthy palette
   * Now uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateEarthyCoeffs();
  }

  /**
   * Validate that the palette meets earthy criteria
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateEarthyPalette(colors);
  }
}

/**
 * Validates that a palette contains only earthy colors
 * Ensures colors stay within brown, tan, olive, and green-brown ranges
 */
export function validateEarthyPalette(colors: RGBAVector[]): boolean {
  // Define earthy hue ranges
  const earthyHueRanges = [
    [0.02, 0.12], // Browns/Oranges/Terracotta
    [0.1, 0.15], // Tans/Khaki
    [0.26, 0.4], // Olive/Forest greens
  ];

  let earthyCount = 0;

  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Skip very dark or very light colors
    if (hsv[2] < 0.1 || hsv[2] > 0.9) {
      continue;
    }

    // Earthy colors typically have moderate-low saturation
    if (hsv[1] < 0.1 || hsv[1] > 0.7) {
      continue;
    }

    // Check if hue falls within any earthy range
    const isEarthyHue = earthyHueRanges.some(([min, max]) => hsv[0] >= min && hsv[0] <= max);

    if (isEarthyHue) {
      earthyCount++;
    }
  }

  // For standard validation, at least 80% of colors should be earthy
  const strictEarthy = earthyCount / colors.length >= 0.8;

  if (strictEarthy) {
    return true;
  }

  // If strict validation fails, try a more relaxed validation
  // Define broader earthy hue ranges for edge cases
  const broadEarthyHueRanges = [
    [0.01, 0.15], // Browns/Oranges/Terracotta (expanded)
    [0.08, 0.17], // Tans/Khaki (expanded)
    [0.2, 0.45], // Olive/Forest greens (expanded)
  ];

  // Reset counter for relaxed validation
  let relaxedEarthyCount = 0;

  // Check each color against broader criteria
  for (const color of colors) {
    const hsv = rgbToHsv(color);

    // Skip very dark or very light colors
    if (hsv[2] < 0.08 || hsv[2] > 0.95) {
      continue;
    }

    // Allow more saturation range
    if (hsv[1] < 0.08 || hsv[1] > 0.85) {
      continue;
    }

    // Check if hue falls within any broader earthy range
    const isEarthyHue = broadEarthyHueRanges.some(([min, max]) => hsv[0] >= min && hsv[0] <= max);

    if (isEarthyHue) {
      relaxedEarthyCount++;
    }
  }

  // For relaxed validation, at least 70% colors should be earthy
  return relaxedEarthyCount / colors.length >= 0.7;
}
