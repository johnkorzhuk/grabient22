import type { CoeffsRanges, CollectionPreset, CollectionStyle } from '../types';
import type { Tuple } from '@thi.ng/api';
import type { AppCollection } from '../types';
import { nanoid } from 'nanoid';
import { COEFF_PRECISION, PI } from '../validators';
import { serializeCoeffs } from './serialization';

export const getCoeffs = (coeffs: CollectionPreset['coeffs'], withAlpha: boolean = false) => {
  return withAlpha ? coeffs : coeffs.map((channels: number[]) => channels.slice(0, 3));
};

export const applyGlobals = (
  cosCoeffs: CollectionPreset['coeffs'],
  globals: CollectionPreset['globals'],
) => {
  return cosCoeffs.map((coeff: number[], i: number) => {
    switch (i) {
      case 0:
        return coeff.map((v: number) => v + globals[0]!);
      case 1:
        return coeff.map((v: number) => v * globals[1]!);
      case 2:
        return coeff.map((v: number) => v * globals[2]!);
      case 3:
        return coeff.map((v: number) => v + globals[3]!);
      default:
        return coeff;
    }
  });
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
): React.CSSProperties {
  // Convert RGB values from 0-1 range to 0-255 range for CSS
  const getRgbString = (color: number[]) =>
    `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`;

  if (processedColors.length === 0) {
    return {};
  }

  if (processedColors.length === 1) {
    return { background: getRgbString(processedColors[0]) };
  }

  switch (type) {
    case 'linearGradient': {
      // For linear gradients, create a smooth transition with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;
      processedColors.forEach((color, index) => {
        const position = (index / (processedColors.length - 1)) * 100;
        gradientString += ` ${getRgbString(color)} ${position}%`;
        if (index < processedColors.length - 1) {
          gradientString += ',';
        }
      });
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

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbString(color)} ${startPos}%`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbString(color)} ${startPos}%`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbString(color)} ${endPos}%`;
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
      processedColors.forEach((color, index) => {
        const anglePos = (index / (processedColors.length - 1)) * 360;
        gradientString += ` ${getRgbString(color)} ${anglePos}deg`;
        if (index < processedColors.length - 1) {
          gradientString += ',';
        }
      });
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

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbString(color)} ${startAngle}deg`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbString(color)} ${startAngle}deg`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbString(color)} ${endAngle}deg`;
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

function generateModifierVariationsRecursive(
  baseCollection: AppCollection,
  modifierIndex: number,
  name: string,
  min: number,
  max: number,
  window: ModifierWindow,
  attempt: number = 1,
  direction: 'increase' | 'decrease' = 'increase',
): AppCollection[] {
  const { coeffs, globals, style, steps } = baseCollection;
  const originalValue = globals[modifierIndex];

  // Adjust step size based on attempt and direction
  const adjustedStepSize =
    direction === 'increase'
      ? window.stepSize * (1 + attempt * 0.5) // Increase by 50% each attempt
      : window.stepSize / (1 + attempt * 0.5); // Decrease by similar ratio

  const values = generateWindowValues(
    originalValue,
    { ...window, stepSize: adjustedStepSize },
    min,
    max,
  );

  // Generate collections and their colors
  const collections = values.map((value) => {
    const newGlobals = [...globals];
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

export function generateExposureVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateModifierVariationsRecursive(baseCollection, 0, 'exposure', -1, 1, window);
}

export function generateContrastVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateModifierVariationsRecursive(baseCollection, 1, 'contrast', 0, 2, window);
}

export function generateFrequencyVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateModifierVariationsRecursive(baseCollection, 2, 'frequency', 0, 2, window);
}

export function generatePhaseVariations(
  baseCollection: AppCollection,
  window: ModifierWindow,
): AppCollection[] {
  return generateModifierVariationsRecursive(baseCollection, 3, 'phase', -PI, PI, window);
}
