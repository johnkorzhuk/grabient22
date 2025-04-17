/**
 * Analogous Palette Generator
 * Creates palettes with colors adjacent to each other on the color wheel
 * (typically spanning 30°-60° total)
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';
import { HueRanges } from '../color-constants';

/**
 * Utility function to generate analogous-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generateAnalogousCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Choose a base hue (0-1)
  const baseHue = Math.random();

  // Analogous colors are adjacent on the color wheel
  // We'll use a smaller angle range (30°-60°) compared to split-complementary
  const angleRange = 0.08 + Math.random() * 0.08; // ~30°-60° range with randomness

  // Calculate the adjacent hues
  const adjacentHue1 = (baseHue + angleRange) % 1.0;
  const adjacentHue2 = (baseHue - angleRange + 1.0) % 1.0;

  // Convert hues to phases in cosine gradient
  const basePhase = baseHue * TAU;
  const adjacentPhase1 = adjacentHue1 * TAU;
  const adjacentPhase2 = adjacentHue2 * TAU;

  // Select from multiple analogous palette strategies
  const strategyType = Math.floor(Math.random() * 3);

  // Define the approach for phase allocation based on selected strategy
  let redPhase: number, greenPhase: number, bluePhase: number;

  switch (strategyType) {
    case 0: // Dominant base hue with subtle adjacents
      // Assign base hue to two channels for dominance
      redPhase = basePhase;
      greenPhase = adjacentPhase1;
      bluePhase = basePhase;
      break;

    case 1: // Balanced analogous distribution
      // One channel per hue for balanced representation
      redPhase = basePhase;
      greenPhase = adjacentPhase1;
      bluePhase = adjacentPhase2;
      break;

    case 2: // Shifted analogous (more gradual transition)
      // Use midpoint phases between adjacent hues
      redPhase = basePhase;
      greenPhase = (basePhase + adjacentPhase1) / 2;
      bluePhase = adjacentPhase1;
      break;

    default:
      redPhase = basePhase;
      greenPhase = adjacentPhase1;
      bluePhase = adjacentPhase2;
  }

  // Determine balance between colors
  const balance = Math.random() * 0.3 - 0.15; // Range -0.15 to 0.15 for moderate balance

  // Amplitude controls the color vibrancy and distinctness
  const amplitude = 0.2 + Math.random() * 0.2; // 0.2-0.4

  // Create a frequency profile that emphasizes the color transitions
  const frequency = 0.4 + Math.random() * 0.4; // 0.4-0.8 (lower than complementary for smoother transitions)

  // Add slight variance to create more natural transitions
  const phaseVariance = Math.random() * 0.05; // Small variance (max 5% of cycle)
  const freqVariance = Math.random() * 0.1; // Small frequency variance

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

    // d: phase vector - creates the analogous relationship
    [
      redPhase + (Math.random() * phaseVariance - phaseVariance / 2), // Red phase
      greenPhase + (Math.random() * phaseVariance - phaseVariance / 2), // Green phase
      bluePhase + (Math.random() * phaseVariance - phaseVariance / 2), // Blue phase
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class AnalogousGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Analogous', steps, options);
  }

  /**
   * Generate candidate coefficients for an analogous palette
   * Uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateAnalogousCoeffs();
  }

  /**
   * Validates that the palette meets analogous criteria
   * Checks for colors adjacent on the color wheel
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateAnalogousPalette(colors);
  }
}

/**
 * Checks if hues are in an analogous relationship
 * @param hues Array of hues (0-1)
 * @param maxSpread Maximum total angle spread in hue units (0-1)
 * @returns Boolean indicating if hues are in an analogous relationship
 */
function areAnalogousHues(hues: number[], maxSpread: number = 0.17): boolean {
  if (hues.length < 2) return false;

  // Sort hues for consistent comparison
  const sortedHues = [...hues].sort((a, b) => a - b);

  // Calculate max spread accounting for wraparound
  // First, check normal case
  const normalSpread = sortedHues[sortedHues.length - 1] - sortedHues[0];

  // Then check wraparound case
  const lastHue = sortedHues[sortedHues.length - 1];
  const firstHue = sortedHues[0];
  const wrapSpread = 1 - lastHue + firstHue;

  // Use the smaller spread (will be the actual visual distance on color wheel)
  const actualSpread = Math.min(normalSpread, wrapSpread);

  // For analogous, all colors should be within a relatively small angle (typically 60° = 0.17)
  return actualSpread <= maxSpread;
}

/**
 * Validates that a palette has an analogous structure
 * Ensures colors are adjacent on the color wheel
 */
export function validateAnalogousPalette(colors: RGBAVector[]): boolean {
  // Need at least 3 colors for a meaningful analogous palette
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

  // Find the most prominent segment and its weight
  let maxSegment = 0;
  let maxWeight = hueSegments[0];

  for (let i = 1; i < hueSegments.length; i++) {
    if (hueSegments[i] > maxWeight) {
      maxWeight = hueSegments[i];
      maxSegment = i;
    }
  }

  // For analogous, we want significant weight in adjacent segments
  let totalSpread = 0;
  let significantSegments = 0;

  // Check 4 segments in each direction (up to 120° total)
  for (let offset = -4; offset <= 4; offset++) {
    if (offset === 0) continue; // Skip center segment (already counted)

    // Handle wraparound
    const segmentIndex = (maxSegment + offset + 24) % 24;

    // If segment has significant weight, count it
    if (hueSegments[segmentIndex] > 0.05) {
      significantSegments++;
      totalSpread = Math.max(totalSpread, Math.abs(offset));
    }
  }

  // For strict analogous validation:
  // 1. Need at least 2 significant segments besides the main one
  // 2. Total spread should be 4 or less segments (60° or less)
  // 3. Main segment should have strong presence
  const strictAnalogous = significantSegments >= 2 && totalSpread <= 4 && maxWeight > 0.2;

  if (strictAnalogous) {
    return true;
  }

  // For more flexible validation, directly check significant hues
  // Extract all hues with significant presence
  const significantHues: number[] = [];
  for (let i = 0; i < hsvColors.length; i++) {
    const hsv = hsvColors[i];
    if (hsv[1] > 0.3 && hsv[2] > 0.3) {
      significantHues.push(hsv[0]);
    }
  }

  // If we have enough hues, check their analogous relationship
  if (significantHues.length >= 3) {
    // Allow a slightly larger spread for flexible validation
    return areAnalogousHues(significantHues, 0.22); // ~80° maximum spread
  }

  return false;
}
