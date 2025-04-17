/**
 * Tetradic Palette Generator
 * Creates palettes based on four colors arranged in two complementary pairs
 * (Also known as rectangular or double-complementary color schemes)
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv, hsvToRgb } from '../color-utils';

/**
 * Utility function to generate tetradic-style coefficients
 * Extracted from the generator to make it reusable
 */
export function generateTetradicCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Choose a base hue (0-1)
  const baseHue = Math.random();

  // Calculate the other three colors
  // A true tetradic scheme uses two complementary pairs
  // We'll use a variation with adjustable angle between pairs
  const angle = 0.2 + Math.random() * 0.15; // Between 0.2-0.35 (72° to 126°)

  const tetra1 = (baseHue + angle) % 1.0; // First pair, second color
  const tetra2 = (baseHue + 0.5) % 1.0; // Second pair, first color (complement of base)
  const tetra3 = (baseHue + 0.5 + angle) % 1.0; // Second pair, second color (complement of tetra1)

  // Convert hues to phases in cosine gradient
  const basePhase = baseHue * TAU;
  const tetra1Phase = tetra1 * TAU;
  const tetra2Phase = tetra2 * TAU;
  const tetra3Phase = tetra3 * TAU;

  // Determine which phases to use for RGB channels
  // Different arrangements create different tetradic effects

  // Choose arrangement: standard, balanced, or weighted
  const arrangementType = Math.floor(Math.random() * 3);

  let redPhase: number, greenPhase: number, bluePhase: number;

  switch (arrangementType) {
    case 0: // Standard arrangement
      redPhase = basePhase;
      greenPhase = tetra1Phase;
      bluePhase = tetra2Phase;
      break;
    case 1: // Balanced arrangement
      redPhase = basePhase;
      greenPhase = tetra2Phase;
      bluePhase = tetra3Phase;
      break;
    case 2: // Weighted arrangement
      redPhase = basePhase;
      greenPhase = tetra1Phase;
      bluePhase = tetra3Phase;
      break;
    default:
      redPhase = basePhase;
      greenPhase = tetra1Phase;
      bluePhase = tetra2Phase;
  }

  // Amplitude controls the color vibrancy
  const amplitude = 0.25 + Math.random() * 0.2; // 0.25-0.45

  // Create a frequency profile
  const frequency = 0.5 + Math.random() * 0.7; // 0.5-1.2

  // Add variance to create more natural transitions
  const phaseVariance = Math.random() * 0.05; // Small variance

  return [
    // a: offset vector - balanced midpoint
    [
      0.5,
      0.5,
      0.5,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - controls the color range and vibrancy
    [
      amplitude,
      amplitude * (0.9 + Math.random() * 0.2), // Slight variance
      amplitude * (0.9 + Math.random() * 0.2), // Slight variance
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // c: frequency vector - controls the color cycling
    [
      frequency,
      frequency * (0.9 + Math.random() * 0.2), // Slight variance
      frequency * (0.9 + Math.random() * 0.2), // Slight variance
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // d: phase vector - creates the tetradic relationship
    [
      redPhase + (Math.random() * phaseVariance - phaseVariance / 2), // Red channel phase
      greenPhase + (Math.random() * phaseVariance - phaseVariance / 2), // Green channel phase
      bluePhase + (Math.random() * phaseVariance - phaseVariance / 2), // Blue channel phase
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class TetradicGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Tetradic', steps, options);
  }

  /**
   * Generate candidate coefficients for a tetradic palette
   * Uses the shared function for coefficient generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateTetradicCoeffs();
  }

  /**
   * Validates that the palette meets tetradic criteria
   * Checks for four main colors arranged as two complementary pairs
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateTetradicPalette(colors);
  }
}

/**
 * Checks if four hues form a tetradic relationship
 * @param hues Array of four hues (0-1)
 * @param tolerance Tolerance for tetradic angles (in hue units, 0-1)
 * @returns Boolean indicating if hues are in a tetradic relationship
 */
function areTetradicHues(hues: number[], tolerance: number = 0.08): boolean {
  if (hues.length < 4) return false;

  // Sort hues for consistent comparison
  const sortedHues = [...hues].sort((a, b) => a - b);

  // Calculate differences between adjacent hues (accounting for wraparound)
  const diffs: number[] = [];
  for (let i = 0; i < sortedHues.length; i++) {
    const next = (i + 1) % sortedHues.length;
    let diff = sortedHues[next] - sortedHues[i];
    if (diff < 0) diff += 1; // Handle wraparound
    diffs.push(diff);
  }

  // For rectangular tetradic, we expect two pairs of similar differences
  // Sort differences to compare
  diffs.sort((a, b) => a - b);

  // First two should be similar, and last two should be similar
  // (if the differences are all sorted, this means opposite sides of the rectangle are equal)
  const diff1Similar = Math.abs(diffs[0] - diffs[1]) <= tolerance;
  const diff2Similar = Math.abs(diffs[2] - diffs[3]) <= tolerance;

  // The sum of all differences should be close to 1.0
  const sumDiffs = diffs.reduce((sum, diff) => sum + diff, 0);
  const sumValid = Math.abs(sumDiffs - 1.0) <= tolerance;

  return diff1Similar && diff2Similar && sumValid;
}

/**
 * Validates that a palette has a tetradic structure
 * Ensures there are four main colors arranged as two complementary pairs
 */
export function validateTetradicPalette(colors: RGBAVector[]): boolean {
  // Need at least 4 colors for a tetradic palette
  if (colors.length < 4) {
    return false;
  }

  // Convert to HSV for hue analysis
  const hsvColors = colors.map(rgbToHsv);

  // We need colors with sufficient saturation to determine hues
  const saturatedColors = hsvColors.filter((hsv) => hsv[1] > 0.2);

  // Need at least 4 saturated colors
  if (saturatedColors.length < 4) {
    return false;
  }

  // Group hues by their position on the color wheel (36 segments for precision)
  const hueSegments = new Array(36).fill(0);
  let totalHueWeight = 0;

  // Weight by saturation and brightness (more vibrant colors count more)
  for (const hsv of saturatedColors) {
    const segment = Math.floor(hsv[0] * 36) % 36;
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

  // Find the top segments with significant weights
  const topSegments: { segment: number; weight: number }[] = [];

  for (let i = 0; i < hueSegments.length; i++) {
    if (hueSegments[i] > 0.08) {
      // Lower threshold for tetradic patterns
      topSegments.push({ segment: i, weight: hueSegments[i] });
    }
  }

  // Sort by weight descending
  topSegments.sort((a, b) => b.weight - a.weight);

  // Take up to top 4 segments
  const top4 = topSegments.slice(0, 4);

  // Need at least 4 significant segments for tetradic
  if (top4.length < 4) {
    return false;
  }

  // Convert segments to hues (0-1)
  const hues = top4.map((s) => s.segment / 36);

  // Check if these four hues form a tetradic relationship
  if (areTetradicHues(hues)) {
    return true;
  }

  // If the top 4 segments don't form a tetradic relationship,
  // try checking all combinations of the top 6 segments if available
  if (topSegments.length >= 6) {
    const top6 = topSegments.slice(0, 6);
    const top6Hues = top6.map((s) => s.segment / 36);

    // Check all combinations of 4 hues from the top 6
    for (let i = 0; i < top6.length; i++) {
      for (let j = i + 1; j < top6.length; j++) {
        for (let k = j + 1; k < top6.length; k++) {
          for (let l = k + 1; l < top6.length; l++) {
            if (areTetradicHues([top6Hues[i], top6Hues[j], top6Hues[k], top6Hues[l]])) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}
