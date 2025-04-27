import type { CosineCoeffs } from '../types';
import { cosineGradient } from './cosineGradient';
import type { RGBAVector } from '../types';
import { rgbToHex } from './generation/color-utils';

// Constants
const TAU = Math.PI * 2;

/**
 * Generates cosine gradient coefficients from a set of input colors.
 * This creates a single set of coefficients that approximates a gradient
 * passing through all provided colors.
 *
 * @param colors Array of color vectors (RGB or RGBA)
 * @returns Cosine coefficients [a, b, c, d] that approximate the gradient
 */
export function generateCoeffsFromColors(colors: number[][]): CosineCoeffs {
  if (colors.length < 2) {
    throw new Error('At least 2 colors are required');
  }

  // Handle basic case of 2 colors
  if (colors.length === 2) {
    return twoColorCosineCoeffs(colors[0], colors[1]);
  }

  const numColors = colors.length;
  const numChannels = colors[0].length;

  // Initialize coefficient arrays
  const a: number[] = new Array(numChannels).fill(0);
  const b: number[] = new Array(numChannels).fill(0);
  const c: number[] = new Array(numChannels).fill(0);
  const d: number[] = new Array(numChannels).fill(0);

  // Optimize each channel independently
  for (let channel = 0; channel < numChannels; channel++) {
    // Extract channel values from all colors
    const targetValues = colors.map((color) => color[channel]);

    // Calculate average for offset (a)
    a[channel] = targetValues.reduce((sum, v) => sum + v, 0) / numColors;

    // Calculate min and max for amplitude (b)
    const min = Math.min(...targetValues);
    const max = Math.max(...targetValues);
    b[channel] = (max - min) / 2;

    // Set frequency (c) based on number of colors
    // For 3-4 colors, about 1 cycle works well
    c[channel] = (numColors - 1) / 2;

    // Find optimal phase (d) through optimization
    let bestError = Infinity;
    let bestD = 0;

    // Try different phase values to minimize error
    for (let testD = 0; testD <= 1; testD += 0.01) {
      let error = 0;
      for (let i = 0; i < numColors; i++) {
        const t = i / (numColors - 1);
        const target = targetValues[i];
        const computed = a[channel] + b[channel] * Math.cos(TAU * (c[channel] * t + testD));
        error += Math.pow(computed - target, 2);
      }

      if (error < bestError) {
        bestError = error;
        bestD = testD;
      }
    }

    d[channel] = bestD;
  }

  return [a, b, c, d] as CosineCoeffs;
}

/**
 * Generate cosine coefficients for a gradient between two colors.
 * This is a standalone implementation of two-color coefficient generation
 * to avoid circular dependencies.
 *
 * @param from Start color
 * @param to End color
 * @returns Cosine coefficients for the gradient
 */
export function twoColorCosineCoeffs(from: number[], to: number[]): CosineCoeffs {
  // Calculate amplitude vector
  const amp = from.map((a, i) => 0.5 * (a - to[i]));

  // Calculate offset vector
  const offset = from.map((s, i) => s - amp[i]);

  // Return standard cosine coefficients for two-color gradient
  return [
    offset,
    amp,
    new Array(from.length).fill(-0.5), // Frequency is -0.5 for all channels
    new Array(from.length).fill(0), // Phase is 0 for all channels
  ] as CosineCoeffs;
}

/**
 * Options for coefficient refinement
 */
export type OptimizationOptions = {
  iterations?: number; // Number of refinement iterations
  learningRate?: number; // Initial learning rate
  minLearningRate?: number; // Minimum learning rate
  decayRate?: number; // Learning rate decay factor
  targetError?: number; // Target error for early stopping
};

/**
 * Computes a color at a specific position in the gradient
 */
export function computeColorAtPosition(coeffs: CosineCoeffs, t: number): number[] {
  const [offsets, amplitudes, frequencies, phases] = coeffs;
  const result = new Array(offsets.length);

  for (let channel = 0; channel < offsets.length; channel++) {
    // Cosine gradient formula: offset + amplitude * cos(2π * (frequency * t + phase))
    const value =
      offsets[channel] +
      amplitudes[channel] * Math.cos(TAU * (frequencies[channel] * t + phases[channel]));

    // Clamp the value between 0 and 1
    result[channel] = Math.max(0, Math.min(1, value));
  }

  return result;
}

/**
 * Calculates the total error between original colors and colors generated from coefficients
 */
export function calculateTotalError(
  coeffs: CosineCoeffs,
  originalColors: number[][],
  positions: number[],
): number {
  let totalError = 0;

  for (let i = 0; i < positions.length; i++) {
    const t = positions[i];
    const originalColor = originalColors[i];
    const generatedColor = computeColorAtPosition(coeffs, t);

    // Calculate squared error across channels
    for (let j = 0; j < originalColor.length; j++) {
      // Skip alpha channel for error calculation
      if (j === 3) continue;

      const channelError = originalColor[j] - generatedColor[j];
      totalError += channelError * channelError;
    }
  }

  return Math.sqrt(totalError);
}

/**
 * Refines cosine gradient coefficients to better match original input colors.
 * Uses a gradient descent approach to iteratively improve the coefficients.
 *
 * @param originalColors Array of original RGB colors to match
 * @param initialCoeffs Initial cosine gradient coefficients
 * @param options Optimization options
 * @returns Refined coefficients
 */
export function refineCoefficients(
  originalColors: number[][],
  initialCoeffs: CosineCoeffs,
  options: OptimizationOptions = {},
): CosineCoeffs {
  const {
    iterations = 200, // Number of refinement iterations
    learningRate = 0.01, // Learning rate for gradient descent
    minLearningRate = 0.001, // Minimum learning rate
    decayRate = 0.98, // Learning rate decay
    targetError = 0.01, // Target error to achieve (early stopping)
  } = options;

  // Clone the initial coefficients to avoid modifying the original
  const coeffs = initialCoeffs.map((arr) => [...arr]) as CosineCoeffs;
  const numColors = originalColors.length;
  const numChannels = originalColors[0].length;

  // Create an array of target positions (t values)
  const positions = Array.from({ length: numColors }, (_, i) => i / (numColors - 1));

  // Track best coefficients and error
  let bestCoeffs = coeffs.map((arr) => [...arr]) as CosineCoeffs;
  let bestError = calculateTotalError(coeffs, originalColors, positions);

  // Current learning rate
  let currentLearningRate = learningRate;

  // For each iteration
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate current error
    const currentError = calculateTotalError(coeffs, originalColors, positions);

    // If we've reached target error, stop early
    if (currentError < targetError) {
      break;
    }

    // If current error is better than best, update best
    if (currentError < bestError) {
      bestError = currentError;
      bestCoeffs = coeffs.map((arr) => [...arr]) as CosineCoeffs;
    }

    // Compute gradients and update coefficients
    for (let i = 0; i < 4; i++) {
      // For each coefficient type (a, b, c, d)
      for (let j = 0; j < numChannels; j++) {
        // For each channel (R, G, B, A)
        // Skip alpha channel optimization if it's fixed
        if (j === 3 && i > 0) continue;

        // Calculate error gradient
        const delta = 0.0001; // Small delta for numerical gradient

        // Save original value
        const originalValue = coeffs[i][j];

        // Compute error with a small positive change
        coeffs[i][j] = originalValue + delta;
        const errorPlus = calculateTotalError(coeffs, originalColors, positions);

        // Compute error with a small negative change
        coeffs[i][j] = originalValue - delta;
        const errorMinus = calculateTotalError(coeffs, originalColors, positions);

        // Restore original value
        coeffs[i][j] = originalValue;

        // Calculate gradient (derivative of error with respect to coefficient)
        const gradient = (errorPlus - errorMinus) / (2 * delta);

        // Update coefficient with gradient descent
        coeffs[i][j] -= currentLearningRate * gradient;

        // Apply constraints based on coefficient type
        if (i === 1) {
          // Amplitude (b) should typically be positive
          coeffs[i][j] = Math.max(0, coeffs[i][j]);
        }
      }
    }

    // Decay learning rate
    currentLearningRate = Math.max(minLearningRate, currentLearningRate * decayRate);
  }

  // Return the best coefficients found
  return bestCoeffs;
}

/**
 * Validates how well the generated coefficients reproduce the original input colors
 *
 * @param coeffs Cosine coefficients
 * @param originalColors The original input colors
 * @returns An error measure (lower is better) and the reproduced colors
 */
export function validateGradientCoeffs(
  coeffs: CosineCoeffs,
  originalColors: number[][],
): { error: number; generatedColors: number[][] } {
  const numColors = originalColors.length;
  const generatedColors: number[][] = [];
  const positions = Array.from({ length: numColors }, (_, i) => i / (numColors - 1));

  // Generate colors at the same positions as original colors
  for (let i = 0; i < numColors; i++) {
    const t = positions[i];
    const color = computeColorAtPosition(coeffs, t);
    generatedColors.push(color);
  }

  const error = calculateTotalError(coeffs, originalColors, positions);

  return {
    error,
    generatedColors,
  };
}

/**
 * Utility function to convert hex color strings to RGB arrays
 */
export function hexToRgb(hex: string): RGBAVector {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b, 1.0] as RGBAVector;
}

/**
 * Creates a preview of the gradient for visualization
 *
 * @param coeffs Cosine coefficients
 * @param steps Number of steps to generate
 * @returns Array of hex color strings
 */
export function previewGradient(coeffs: CosineCoeffs, steps: number = 10): string[] {
  const colors = cosineGradient(steps, coeffs) as RGBAVector[];
  return colors.map(rgbToHex);
}
