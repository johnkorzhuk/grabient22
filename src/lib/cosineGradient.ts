import type { CoeffsRanges, CollectionPreset, CollectionStyle, CosineCoeffs } from '../types';
import type { Tuple } from '@thi.ng/api';
import type { AppCollection } from '../types';
import { nanoid } from 'nanoid';
import { COEFF_PRECISION, PI, coeffsSchema } from '../validators';
import { serializeCoeffs } from './serialization';
import * as v from 'valibot';

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

export const getRandomCoeffsFromRanges = (ranges: CoeffsRanges, showAlpha: boolean = false) => {
  return ranges.map((range: Tuple<number, 2>) =>
    Array.from({ length: showAlpha ? 4 : 3 }).map(
      () => Math.random() * (range[1] - range[0]) + range[0],
    ),
  );
};

export function getCollectionStyleCSS(
  type: CollectionStyle = 'linearGradient',
  processedColors: number[][],
  angle: number = 90,
  activeIndex?: number | null,
): React.CSSProperties {
  // Convert RGB values from 0-1 range to 0-255 range for CSS
  const getRgbString = (color: number[]) =>
    `${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}`;

  // Use the RGB string with alpha
  const getRgbaString = (color: number[], alpha: number = 1) =>
    `rgba(${getRgbString(color)}, ${alpha})`;

  // Alpha value for inactive color stops when activeIndex exists
  const inactiveAlpha = 0.5;

  if (processedColors.length === 0) {
    return {};
  }

  if (processedColors.length === 1) {
    return { background: getRgbaString(processedColors[0]) };
  }

  switch (type) {
    case 'linearGradient': {
      // For linear gradients, create a smooth transition with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;

      // If activeIndex is specified, handle special rendering
      if (
        typeof activeIndex === 'number' &&
        activeIndex >= 0 &&
        activeIndex < processedColors.length
      ) {
        const segmentSize = 100 / processedColors.length;
        const activeStartPos = activeIndex * segmentSize;
        const activeEndPos = (activeIndex + 1) * segmentSize;

        // Create a gradient with a solid color segment for the active index
        if (activeIndex === 0) {
          // If first segment is active
          gradientString += ` ${getRgbaString(processedColors[0])} ${activeEndPos}%,`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = 1; i < processedColors.length; i++) {
            const position = (i / (processedColors.length - 1)) * 100;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
            if (i < processedColors.length - 1) {
              gradientString += ',';
            }
          }
        } else if (activeIndex === processedColors.length - 1) {
          // If last segment is active
          // Start with reduced alpha gradient
          for (let i = 0; i < processedColors.length - 1; i++) {
            const position = (i / (processedColors.length - 1)) * 100;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
            gradientString += ',';
          }

          // Add the active segment
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartPos}%`;
        } else {
          // If middle segment is active
          // Start with reduced alpha gradient up to active segment
          for (let i = 0; i < activeIndex; i++) {
            const position = (i / (processedColors.length - 1)) * 100;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
            gradientString += ',';
          }

          // Add the active segment with hard stops
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeEndPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeEndPos}%`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = activeIndex + 1; i < processedColors.length; i++) {
            const position = (i / (processedColors.length - 1)) * 100;
            gradientString += `,`;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
          }
        }
      } else {
        // Standard gradient rendering
        processedColors.forEach((color, index) => {
          const position = (index / (processedColors.length - 1)) * 100;
          gradientString += ` ${getRgbaString(color)} ${position}%`;
          if (index < processedColors.length - 1) {
            gradientString += ',';
          }
        });
      }

      gradientString += ')';
      return { background: gradientString };
    }

    case 'linearSwatches': {
      // For swatches, create distinct color blocks with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;

      // Calculate the segment size
      const segmentSize = 100 / processedColors.length;

      processedColors.forEach((color, index) => {
        // Calculate start and end positions for this color
        const startPos = index * segmentSize;
        const endPos = (index + 1) * segmentSize;

        // Determine alpha value based on activeIndex
        const alpha =
          typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbaString(color, alpha)} ${startPos}%`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbaString(color, alpha)} ${startPos}%`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbaString(color, alpha)} ${endPos}%`;
        } else {
          // Last color needs its endpoint too
          gradientString += ` ${endPos}%`;
        }
      });

      gradientString += ')';
      return { background: gradientString };
    }

    case 'angularGradient': {
      // For angular gradients, create a smooth transition using conic gradient with configurable starting angle
      let gradientString = `conic-gradient(from ${angle}deg,`;

      // If activeIndex is specified, handle special rendering
      if (
        typeof activeIndex === 'number' &&
        activeIndex >= 0 &&
        activeIndex < processedColors.length
      ) {
        const segmentSize = 360 / processedColors.length;
        const activeStartAngle = activeIndex * segmentSize;
        const activeEndAngle = (activeIndex + 1) * segmentSize;

        // Create a gradient with a solid color segment for the active index
        if (activeIndex === 0) {
          // If first segment is active
          gradientString += ` ${getRgbaString(processedColors[0])} ${activeEndAngle}deg,`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = 1; i < processedColors.length; i++) {
            const anglePos = (i / (processedColors.length - 1)) * 360;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
            if (i < processedColors.length - 1) {
              gradientString += ',';
            }
          }
        } else if (activeIndex === processedColors.length - 1) {
          // If last segment is active
          // Start with reduced alpha gradient
          for (let i = 0; i < processedColors.length - 1; i++) {
            const anglePos = (i / (processedColors.length - 1)) * 360;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
            gradientString += ',';
          }

          // Add the active segment
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartAngle}deg`;
        } else {
          // If middle segment is active
          // Start with reduced alpha gradient up to active segment
          for (let i = 0; i < activeIndex; i++) {
            const anglePos = (i / (processedColors.length - 1)) * 360;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
            gradientString += ',';
          }

          // Add the active segment with hard stops
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeEndAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeEndAngle}deg`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = activeIndex + 1; i < processedColors.length; i++) {
            const anglePos = (i / (processedColors.length - 1)) * 360;
            gradientString += `,`;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
          }
        }
      } else {
        // Standard gradient rendering
        processedColors.forEach((color, index) => {
          const anglePos = (index / (processedColors.length - 1)) * 360;
          gradientString += ` ${getRgbaString(color)} ${anglePos}deg`;
          if (index < processedColors.length - 1) {
            gradientString += ',';
          }
        });
      }

      gradientString += ')';
      return { background: gradientString };
    }

    case 'angularSwatches': {
      // For angular swatches, create distinct angular segments with configurable starting angle
      let gradientString = `conic-gradient(from ${angle}deg,`;

      // Calculate the segment size
      const segmentSize = 360 / processedColors.length;

      processedColors.forEach((color, index) => {
        // Calculate start and end angles for this color
        const startAngle = index * segmentSize;
        const endAngle = (index + 1) * segmentSize;

        // Determine alpha value based on activeIndex
        const alpha =
          typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbaString(color, alpha)} ${startAngle}deg`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbaString(color, alpha)} ${startAngle}deg`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbaString(color, alpha)} ${endAngle}deg`;
        } else {
          // Last color needs its endpoint too
          gradientString += ` ${endAngle}deg`;
        }
      });

      gradientString += ')';
      return { background: gradientString };
    }

    default:
      return {};
  }
}

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
      _id: `${name}_${value.toFixed(4)}_${nanoid(6)}`,
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
        // @ts-ignore-next-line
        seed: serializeCoeffs(collection.coeffs, collection.globals),
        style,
        steps,
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
    // @ts-ignore-next-line
    seed: serializeCoeffs(collection.coeffs, collection.globals),
    style,
    steps,
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
