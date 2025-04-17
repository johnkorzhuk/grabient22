/**
 * Neutral Palette Generator
 * Creates subtle, desaturated palettes with minimal hue variation
 * Focuses on grays, taupes, beiges, and other neutral tones
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv } from '../color-utils';

/**
 * Utility function to generate neutral-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generateNeutralCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Select from multiple neutral palette strategies
  const strategyType = Math.floor(Math.random() * 5);

  // Define base values based on selected strategy
  let baseHue: number;
  let offsetRange: [number, number];
  let amplitudeRange: [number, number];
  let frequencyRange: [number, number];
  let phaseVariation: number;

  switch (strategyType) {
    case 0: // Pure grayscale
      baseHue = Math.random(); // Hue doesn't matter when saturation is near zero
      offsetRange = [0.3, 0.7]; // Wide range for varied grays
      amplitudeRange = [0.01, 0.08]; // Very low amplitude for minimal saturation
      frequencyRange = [0.2, 0.4]; // Low frequency for smooth transitions
      phaseVariation = 0.01; // Minimal phase variation
      break;

    case 1: // Warm neutrals (beiges, taupes, creams)
      baseHue = 0.08 + Math.random() * 0.08; // 0.08-0.16 (warm neutrals)
      offsetRange = [0.5, 0.75]; // Higher offset for lighter tones
      amplitudeRange = [0.05, 0.15]; // Low amplitude but with some warmth
      frequencyRange = [0.2, 0.5]; // Low frequency for smooth transitions
      phaseVariation = 0.05; // Low phase variation
      break;

    case 2: // Cool neutrals (slate, silver, ash)
      baseHue = 0.55 + Math.random() * 0.15; // 0.55-0.70 (cool blue-gray tones)
      offsetRange = [0.4, 0.65]; // Moderate offset
      amplitudeRange = [0.05, 0.15]; // Low amplitude but with some coolness
      frequencyRange = [0.2, 0.5]; // Low frequency
      phaseVariation = 0.05; // Low phase variation
      break;

    case 3: // Earth neutrals (browns, tans, umbers)
      baseHue = 0.05 + Math.random() * 0.07; // 0.05-0.12 (earthy browns)
      offsetRange = [0.35, 0.6]; // Lower offset for deeper tones
      amplitudeRange = [0.1, 0.2]; // Slightly higher amplitude for earthy richness
      frequencyRange = [0.2, 0.4]; // Low frequency
      phaseVariation = 0.05; // Low phase variation
      break;

    case 4: // Monochromatic neutral with one accent color
      baseHue = Math.random(); // Any hue can work with right settings
      offsetRange = [0.4, 0.65]; // Moderate offset
      amplitudeRange = [0.1, 0.2]; // Low-moderate amplitude
      frequencyRange = [0.3, 0.5]; // Slightly higher frequency for accent
      phaseVariation = 0.1; // Slight phase variation for accent
      break;

    default: // Fallback to classic neutrals
      baseHue = Math.random();
      offsetRange = [0.4, 0.6];
      amplitudeRange = [0.05, 0.15];
      frequencyRange = [0.2, 0.4];
      phaseVariation = 0.05;
  }

  const basePhase = baseHue * TAU;

  // Random value within a range helper
  const randomInRange = (range: [number, number]): number => {
    return range[0] + Math.random() * (range[1] - range[0]);
  };

  // Create subtle diversity in each RGB channel
  // Neutral palettes need very balanced RGB values
  const redOffset = randomInRange(offsetRange);
  const greenOffset = randomInRange([offsetRange[0], offsetRange[1]]); // Very close to red
  const blueOffset = randomInRange([offsetRange[0], offsetRange[1]]); // Very close to red

  // For neutral palettes, keep RGB amplitudes very low and similar
  const baseAmp = randomInRange(amplitudeRange);
  const ampVariance = baseAmp * 0.2; // Small variance (20% of base)

  const redAmp = baseAmp;
  const greenAmp = baseAmp + (Math.random() * ampVariance - ampVariance / 2);
  const blueAmp = baseAmp + (Math.random() * ampVariance - ampVariance / 2);

  // Low frequency for subtle changes
  const baseFreq = randomInRange(frequencyRange);
  const freqVariance = baseFreq * 0.1; // Small variance (10% of base)

  const redFreq = baseFreq;
  const greenFreq = baseFreq + (Math.random() * freqVariance - freqVariance / 2);
  const blueFreq = baseFreq + (Math.random() * freqVariance - freqVariance / 2);

  // Neutral palette with intentional subtlety
  return [
    // a: offset vector - balanced offsets for neutrality
    [
      redOffset,
      greenOffset,
      blueOffset,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - very low amplitudes for desaturation
    [
      redAmp,
      greenAmp,
      blueAmp,
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // c: frequency vector - low frequency for subtle transitions
    [
      redFreq,
      greenFreq,
      blueFreq,
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // d: phase vector - minimal phase differences for neutrality
    [
      basePhase,
      basePhase + (Math.random() * phaseVariation - phaseVariation / 2),
      basePhase + (Math.random() * phaseVariation - phaseVariation / 2),
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class NeutralGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Neutral', steps, options);
  }

  /**
   * Generate candidate coefficients for a neutral palette
   * Uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateNeutralCoeffs();
  }

  /**
   * Validates that the palette meets neutral criteria
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateNeutralPalette(colors);
  }
}

/**
 * Validates that a palette contains neutral colors
 * Ensures colors are desaturated and have minimal hue contrast
 */
export function validateNeutralPalette(colors: RGBAVector[]): boolean {
  let neutralCount = 0;
  let lowSaturationCount = 0;

  // Define neutral quality thresholds
  const NEUTRAL_SATURATION_MAX = 0.25; // Low saturation is essential for neutrals

  // For tracking hue spread to ensure minimal hue contrast
  let hues: number[] = [];

  // Evaluate each color
  for (const color of colors) {
    const hsv = rgbToHsv(color);
    const [h, s, v] = hsv;

    // Track low saturation colors
    if (s < NEUTRAL_SATURATION_MAX) {
      lowSaturationCount++;

      // Additional quality check for true neutrals
      if (s < 0.15 || (s < NEUTRAL_SATURATION_MAX && v > 0.2 && v < 0.85)) {
        neutralCount++;
      }
    }

    // Only track hues for colors with enough saturation to matter
    if (s > 0.1) {
      hues.push(h);
    }
  }

  // Calculate hue spread (if we have enough colors with meaningful hues)
  let hueDiversity = 0;

  if (hues.length >= 2) {
    // Simple measure of hue spread - max distance between any two hues
    let maxHueDiff = 0;

    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        let hueDiff = Math.abs(hues[i] - hues[j]);
        // Handle color wheel wraparound
        if (hueDiff > 0.5) hueDiff = 1 - hueDiff;
        maxHueDiff = Math.max(maxHueDiff, hueDiff);
      }
    }

    hueDiversity = maxHueDiff;
  }

  // For a palette to be considered neutral:
  // - At least 70% of colors should have low saturation
  // - At least 50% should be true neutrals
  // - The hue diversity should be limited (when applicable)
  const hasLowSaturation = lowSaturationCount / colors.length >= 0.7;
  const hasNeutrals = neutralCount / colors.length >= 0.5;
  const hasLimitedHueDiversity = hues.length < 3 || hueDiversity < 0.25; // Allow only 25% of the color wheel

  return hasLowSaturation && hasNeutrals && hasLimitedHueDiversity;
}
