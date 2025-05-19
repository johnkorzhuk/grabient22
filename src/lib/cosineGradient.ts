import type { CollectionPreset, CollectionStyle, CosineCoeffs } from '../types';
import type { AppCollection } from '../types';
import { nanoid } from 'nanoid';
import { COEFF_PRECISION, PI, coeffsSchema } from '../validators';
import { serializeCoeffs } from './serialization';
import * as v from 'valibot';
import type { Id } from '../../convex/_generated/dataModel';

export const applyGlobals = (
  cosCoeffs: CollectionPreset['coeffs'],
  globals: CollectionPreset['globals'],
): v.InferOutput<typeof coeffsSchema> => {
  return cosCoeffs.map((coeff: number[], i: number) => {
    const alpha = coeff[3] ?? 1;
    switch (i) {
      case 0:
        return [...coeff.slice(0, 3).map((v) => v + globals[0]), alpha];
      case 1:
        return [...coeff.slice(0, 3).map((v) => v * globals[1]), alpha];
      case 2:
        return [...coeff.slice(0, 3).map((v) => v * globals[2]), alpha];
      case 3:
        return [...coeff.slice(0, 3).map((v) => v + globals[3]), alpha];
      default:
        return coeff;
    }
  }) as v.InferOutput<typeof coeffsSchema>;
};

/**
 * Apply the inverse of the global modifiers to get the raw coefficient value.
 * This is used when updating individual RGB channels to ensure the raw coefficient
 * values are correctly modified.
 *
 * @param modifierIndex The index of the modifier (0: exposure, 1: contrast, 2: frequency, 3: phase)
 * @param value The value to apply the inverse operation to
 * @param globals The global modifiers array
 * @returns The raw coefficient value after applying the inverse operation
 */
export const applyInverseGlobal = (
  modifierIndex: number,
  value: number,
  globals: [number, number, number, number],
): number => {
  switch (modifierIndex) {
    case 0: // Exposure - subtract the global
      return value - globals[0];
    case 1: // Contrast - divide by the global
      return value / globals[1];
    case 2: // Frequency - divide by the global
      return value / globals[2];
    case 3: // Phase - subtract the global
      return value - globals[3];
    default:
      return value;
  }
};

/**
 * Update a specific RGB channel in a coefficient vector with the inverse global modifier applied
 *
 * @param coeffs The original coefficients array
 * @param modifierIndex The index of the modifier to update
 * @param channelIndex The RGB channel index to update
 * @param value The new value (already affected by globals)
 * @param globals The global modifiers array
 * @returns A new coefficients array with the updated value
 */
export const updateCoeffWithInverseGlobal = (
  coeffs: CosineCoeffs,
  modifierIndex: number,
  channelIndex: number,
  value: number,
  globals: [number, number, number, number],
): CosineCoeffs => {
  const newCoeffs = coeffs.map((vector) => vector.map((val) => val)) as CosineCoeffs;

  // Apply the inverse global modifier to get the raw coefficient value
  newCoeffs[modifierIndex][channelIndex] = applyInverseGlobal(modifierIndex, value, globals);

  return newCoeffs;
};

// export const getRandomCoeffsFromRanges = (ranges: CoeffsRanges, showAlpha: boolean = false) => {
//   return ranges.map((range: Tuple<number, 2>) =>
//     Array.from({ length: showAlpha ? 4 : 3 }).map(
//       () => Math.random() * (range[1] - range[0]) + range[0],
//     ),
//   );
// };

// Constants
const TAU = Math.PI * 2;

/**
 * Cosine gradient generator that directly produces color arrays
 * See https://github.com/thi-ng/umbrella/blob/38ecd7cd02564594ab21dbf0d84a44222fd7e4ef/packages/color/src/cosine-gradients.ts#L246
 *
 * @param numStops Number of color stops to generate
 * @param coeffs Cosine gradient coefficients
 * @returns Array of color arrays (RGB or RGBA)
 */
export function cosineGradient(numStops: number, coeffs: number[][]): number[][] {
  const result: number[][] = [];

  // Use a single array allocation for temporary values
  const tempColor = new Array(coeffs[0].length);
  const offsets = coeffs[0];
  const amplitudes = coeffs[1];
  const frequencies = coeffs[2];
  const phases = coeffs[3];

  // Calculate the colors evenly spaced from 0 to 1
  for (let i = 0; i < numStops; i++) {
    const t = numStops > 1 ? i / (numStops - 1) : 0;

    // Calculate each color channel
    for (let channel = 0; channel < offsets.length; channel++) {
      // Cosine gradient formula: offset + amplitude * cos(2π * (frequency * t + phase))
      const value =
        offsets[channel] +
        amplitudes[channel] * Math.cos(TAU * (frequencies[channel] * t + phases[channel]));

      // Clamp the value between 0 and 1
      tempColor[channel] = Math.max(0, Math.min(1, value));
    }

    result.push([...tempColor]);
  }

  return result;
}

// Define a window by step size and number of steps
export type ModifierWindow = {
  stepSize: number; // Size of each step (e.g., 0.05)
  steps: number; // Number of steps each direction from original
};

// Helper function to generate values within a window around the original value
function generateWindowValues(
  originalValue: number,
  window: ModifierWindow,
  min: number,
  max: number,
): number[] {
  const { stepSize, steps } = window;
  const values = [originalValue];

  for (let i = 1; i <= steps; i++) {
    values.push(Math.min(max, originalValue + stepSize * i));
    values.unshift(Math.max(min, originalValue - stepSize * i));
  }

  return values.map((v) => Number(v.toFixed(COEFF_PRECISION)));
}

function hasDistinctColors(colors: number[][]): boolean {
  if (colors.length <= 1) return false;

  // Compare each color with every other color
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const isDifferent = colors[i].some(
        (component, k) => Math.abs(component - colors[j][k]) > 0.001, // Small threshold for floating point comparison
      );
      if (!isDifferent) return false; // Found identical colors
    }
  }
  return true;
}

// Add this helper function to normalize phase angles
function normalizePhase(phase: number): number {
  // Normalize phase to [-PI, PI]
  phase = phase % (2 * Math.PI);
  if (phase > Math.PI) {
    phase -= 2 * Math.PI;
  } else if (phase < -Math.PI) {
    phase += 2 * Math.PI;
  }
  return phase;
}

function generateModifierVariationsRecursive(
  baseCollection: AppCollection,
  modifierIndex: number,
  name: string,
  min: number,
  max: number,
  window: ModifierWindow,
  attempt: number = 1,
  direction: 'increase' | 'decrease' = 'increase',
  customValueGenerator?: (originalValue: number, stepSize: number, steps: number) => number[],
): AppCollection[] {
  const { coeffs, globals, style, steps } = baseCollection;
  const originalValue = globals[modifierIndex];

  // Adjust step size based on attempt and direction
  const adjustedStepSize =
    direction === 'increase'
      ? window.stepSize * (1 + attempt * 0.5)
      : window.stepSize / (1 + attempt * 0.5);

  // Use custom value generator if provided, otherwise use default
  const values = customValueGenerator
    ? customValueGenerator(originalValue, adjustedStepSize, window.steps)
    : generateWindowValues(originalValue, { ...window, stepSize: adjustedStepSize }, min, max);

  // Generate collections and their colors
  const collections = values.map((value) => {
    const newGlobals = [...globals] as [number, number, number, number];
    newGlobals[modifierIndex] = value;
    const collection = {
      ...baseCollection,
      globals: newGlobals,
      _id: `${name}_${value.toFixed(4)}_${nanoid(6)}` as Id<'collections'>,
    };
    const colors = cosineGradient(steps, applyGlobals(coeffs, newGlobals));
    return { collection, colors };
  });

  // Check if all colors are unique
  const allUnique = collections.every(({ colors }) => hasDistinctColors(colors));

  // If not all unique, try again with adjusted step size
  if (!allUnique) {
    if (attempt >= 10) {
      // If we've tried increasing 10 times, try decreasing instead
      if (direction === 'increase') {
        return generateModifierVariationsRecursive(
          baseCollection,
          modifierIndex,
          name,
          min,
          max,
          window,
          1,
          'decrease',
          customValueGenerator,
        );
      }
      // If we've tried both directions 10 times, return best effort
      return collections.map(({ collection }) => ({
        ...collection,
        seed: serializeCoeffs(collection.coeffs, collection.globals),
        style,
        steps,
        likes: 0,
      }));
    }

    return generateModifierVariationsRecursive(
      baseCollection,
      modifierIndex,
      name,
      min,
      max,
      window,
      attempt + 1,
      direction,
      customValueGenerator,
    );
  }

  return collections.map(({ collection }) => ({
    ...collection,
    seed: serializeCoeffs(collection.coeffs, collection.globals),
    style,
    steps,
    likes: 0,
  }));
}

/**
 * Helper function to generate variations and optionally filter out duplicates
 */
function generateVariations(
  baseCollection: AppCollection,
  modifierIndex: number,
  name: string,
  min: number,
  max: number,
  window: ModifierWindow,
  deduplicate: boolean = false,
  customValueGenerator?: (originalValue: number, stepSize: number, steps: number) => number[],
): AppCollection[] {
  const variations = generateModifierVariationsRecursive(
    baseCollection,
    modifierIndex,
    name,
    min,
    max,
    window,
    1,
    'increase',
    customValueGenerator,
  );

  if (deduplicate) {
    // Filter out duplicates based on the 'seed' property
    const uniqueMap = new Map<string, AppCollection>();
    variations.forEach((collection) => {
      uniqueMap.set(collection.seed, collection);
    });
    return Array.from(uniqueMap.values());
  }

  return variations;
}

export function generateExposureVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateVariations(baseCollection, 0, 'exposure', -1, 1, window, true);
}

export function generateContrastVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateVariations(baseCollection, 1, 'contrast', 0, 2, window);
}

export function generateFrequencyVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateVariations(baseCollection, 2, 'frequency', 0, 2, window);
}

export function generatePhaseVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  // Use a modified version of generateModifierVariationsRecursive that handles phase wrapping
  return generateVariations(
    baseCollection,
    3,
    'phase',
    -PI,
    PI,
    window,
    false,
    // Add a custom value generator for phase
    (originalValue: number, stepSize: number, steps: number) => {
      const values = [originalValue];

      for (let i = 1; i <= steps; i++) {
        // Add values in both directions, normalizing them
        values.push(normalizePhase(originalValue + stepSize * i));
        values.unshift(normalizePhase(originalValue - stepSize * i));
      }

      return values;
    },
  );
}

/**
 * Compares two sets of cosine gradient coefficients and determines if they are equal
 *
 * @param coeffsA - First set of coefficients
 * @param coeffsB - Second set of coefficients
 * @param precision - Number of decimal places to consider (defaults to COEFF_PRECISION)
 * @returns Boolean indicating if the coefficients are equal
 */
export function compareCoeffs(
  coeffsA: CosineCoeffs,
  coeffsB: CosineCoeffs,
  precision: number = COEFF_PRECISION,
): boolean {
  // Compare each coefficient value
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < coeffsA[i].length; j++) {
      // Round to specified precision for comparison
      const roundedA = Number(coeffsA[i][j].toFixed(precision));
      const roundedB = Number(coeffsB[i][j].toFixed(precision));

      if (roundedA !== roundedB) {
        return false; // Early return if not equal
      }
    }
  }

  return true;
}

/**
 * Compares two sets of global modifiers and determines if they are equal
 *
 * @param globalsA - First set of global modifiers [exposure, contrast, frequency, phase]
 * @param globalsB - Second set of global modifiers [exposure, contrast, frequency, phase]
 * @param precision - Number of decimal places to consider (defaults to COEFF_PRECISION)
 * @returns Boolean indicating if the global modifiers are equal
 */
export function compareGlobals(
  globalsA: [number, number, number, number],
  globalsB: [number, number, number, number],
  precision: number = COEFF_PRECISION,
): boolean {
  // Compare each global modifier value
  for (let i = 0; i < 4; i++) {
    // Round to specified precision for comparison
    const roundedA = Number(globalsA[i].toFixed(precision));
    const roundedB = Number(globalsB[i].toFixed(precision));

    if (roundedA !== roundedB) {
      return false; // Early return if not equal
    }
  }

  return true;
}

/**
 * Generates an array of RGBA color vectors from cosine gradient coefficients
 *
 * @param coeffs - The processed cosine gradient coefficients
 * @param steps - The number of color steps to generate
 * @returns An array of RGBA vectors with values in the 0-1 range
 */
export function generateGradientColors(
  coeffs: CosineCoeffs,
  steps: number,
): [number, number, number, number][] {
  // Use the cosineGradient function to generate the colors
  const colors = cosineGradient(steps, coeffs);

  // Ensure all colors have an alpha value of 1
  return colors.map((color) => {
    if (color.length === 3) {
      return [...color, 1] as [number, number, number, number];
    }
    return color as [number, number, number, number];
  });
}
