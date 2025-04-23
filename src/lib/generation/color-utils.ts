/**
 * Color Utilities
 * Core functions for color conversion and analysis
 * With improved basic color assignment
 */

import type { CosineCoeffs, HSVVector, RGBAVector } from '~/types';
import type {
  BasicColorName,
  BasicColorResult,
  BasicColor,
  PaletteGenerationOptions,
} from './types';
import { BasicColors, PaletteCategories } from './color-constants';

// Lowered threshold to catch more edge cases
const DEFAULT_MIN_BASIC_COLOR_CONFIDENCE = 0.6; // Was 0.7
const TAU = Math.PI * 2;

/**
 * Calculate perceptual distance between two RGB colors
 * Uses a weighted Euclidean distance in RGB space
 */
export function perceptualColorDistance(color1: RGBAVector, color2: RGBAVector): number {
  // Red is perceived as brighter than blue, so we weight the channels
  const rWeight = 0.299;
  const gWeight = 0.587;
  const bWeight = 0.114;

  const dr = (color1[0] - color2[0]) * rWeight;
  const dg = (color1[1] - color2[1]) * gWeight;
  const db = (color1[2] - color2[2]) * bWeight;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Convert RGB to HSV color space
 */
export function rgbToHsv(rgb: RGBAVector): HSVVector {
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate HSV
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta === 0) {
    h = 0; // Achromatic (gray)
  } else {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      // max === b
      h = (r - g) / delta + 4;
    }

    h *= 60; // Convert to degrees

    if (h < 0) {
      h += 360;
    }
  }

  // Normalize h to 0-1 range
  h /= 360;

  return [h, s, v];
}

/**
 * Convert HSV to RGB color space
 */
export function hsvToRgb(hsv: HSVVector): RGBAVector {
  const [h, s, v] = hsv;
  let r, g, b;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      r = 0;
      g = 0;
      b = 0;
  }

  return [r, g, b, 1];
}

/**
 * Convert RGB to Lab color space for perceptual calculations
 */
export function rgbToLab(rgb: RGBAVector): [number, number, number] {
  // Step 1: Convert RGB to XYZ
  // First, convert RGB to linear RGB (removing gamma correction)
  let rVal = rgb[0],
    gVal = rgb[1],
    bVal = rgb[2];

  // Convert sRGB to linear RGB
  rVal = rVal > 0.04045 ? Math.pow((rVal + 0.055) / 1.055, 2.4) : rVal / 12.92;
  gVal = gVal > 0.04045 ? Math.pow((gVal + 0.055) / 1.055, 2.4) : gVal / 12.92;
  bVal = bVal > 0.04045 ? Math.pow((bVal + 0.055) / 1.055, 2.4) : bVal / 12.92;

  // Convert linear RGB to XYZ using the standard matrix
  // Using D65 standard illuminant
  let x = rVal * 0.4124564 + gVal * 0.3575761 + bVal * 0.1804375;
  let y = rVal * 0.2126729 + gVal * 0.7151522 + bVal * 0.072175;
  let z = rVal * 0.0193339 + gVal * 0.119192 + bVal * 0.9503041;

  // Step 2: Convert XYZ to Lab
  // Using D65 reference white
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  // XYZ to Lab function
  const epsilon = 0.008856; // Intent is 216/24389
  const kappa = 903.3; // Intent is 24389/27

  // Scale XYZ values relative to reference white
  x = x / xn;
  y = y / yn;
  z = z / zn;

  // Apply the LAB transform
  const fx = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

  // Calculate LAB components
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [L, a, b];
}

/**
 * Calculate perceptual color difference (Delta E)
 */
export function deltaE(lab1: [number, number, number], lab2: [number, number, number]): number {
  const deltaL = lab1[0] - lab2[0];
  const deltaA = lab1[1] - lab2[1];
  const deltaB = lab1[2] - lab2[2];

  // Weighted Euclidean distance for better perceptual uniformity
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Calculate hue distance between two hues, accounting for color wheel wrapping
 */
export function hueDistance(hue1: number, hue2: number): number {
  const dist = Math.abs(hue1 - hue2);
  return dist > 0.5 ? 1 - dist : dist;
}

/**
 * Get the brightness/luminance of a color
 */
export function getBrightness(color: RGBAVector): number {
  return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
}

/**
 * Get the saturation of a color
 */
export function getSaturation(color: RGBAVector): number {
  const hsv = rgbToHsv(color);
  return hsv[1];
}

/**
 * Get the value (brightness in HSV) of a color
 */
export function getValue(color: RGBAVector): number {
  const hsv = rgbToHsv(color);
  return hsv[2];
}

/**
 * Determine if a color is warm (reds, oranges, yellows, red-purples)
 */
export function isWarmColor(color: RGBAVector | HSVVector): boolean {
  const hsv =
    Array.isArray(color) && color.length === 3
      ? (color as HSVVector)
      : rgbToHsv(color as RGBAVector);

  // If the saturation is too low, it's considered neutral
  if (hsv[1] < 0.15) return false;

  // Warm colors include:
  // - Reds (0.95-1.0 and 0.0-0.05)
  // - Oranges (0.05-0.11)
  // - Yellows (0.11-0.17)
  // - Yellow-greens (0.17-0.2)
  // - Red-purples/magentas (0.8-0.95)
  return (hsv[0] >= 0.95 || hsv[0] <= 0.2) || (hsv[0] >= 0.8 && hsv[0] < 0.95);
}

/**
 * Determine if a color is cool (greens, blues, blue-purples)
 */
export function isCoolColor(color: RGBAVector | HSVVector): boolean {
  const hsv =
    Array.isArray(color) && color.length === 3
      ? (color as HSVVector)
      : rgbToHsv(color as RGBAVector);

  // If the saturation is too low, it's considered neutral
  if (hsv[1] < 0.15) return false;

  // Cool colors include:
  // - Greens (0.3-0.4)
  // - Teals and Cyans (0.4-0.55)
  // - Blues (0.55-0.7)
  // - Blue-purples (0.7-0.8)
  return hsv[0] >= 0.3 && hsv[0] <= 0.8;
}

/**
 * Helper function to check if a hue is within a specified range,
 * handling wrap-around cases (where min > max).
 */
export function isInHueRange(hue: number, range: [number, number] | null): boolean {
  if (!range) return true; // null range means any hue is valid

  // Handle wrap-around case (e.g., Red [0.97, 0.03])
  if (range[0] > range[1]) {
    return hue >= range[0] || hue <= range[1];
  }

  // Normal case
  return hue >= range[0] && hue <= range[1];
}

/**
 * Enhanced color categorization function with special case handling
 * Fixed detection for maroon vs dark purple/gray issues
 */
export function categorizeColor(color: RGBAVector): { name: BasicColorName; confidence: number } {
  const hsv = rgbToHsv(color);
  const [h, s, v] = hsv;

  // Special cases handling for problematic colors

  // 1. Dark purplish/grayish colors that might be mistaken for maroon
  if (v < 0.25 && s < 0.3 && ((h > 0.7 && h < 0.9) || h > 0.95 || h < 0.05)) {
    // These are dark grayish colors with purple or red tint
    // They should be classified as gray, not maroon
    return { name: 'Gray', confidence: 0.8 };
  }

  // 2. True maroon validation
  if ((h > 0.95 || h < 0.05) && s > 0.6 && v >= 0.15 && v <= 0.5) {
    // Only classify as maroon if it's truly a saturated, dark red
    return { name: 'Maroon', confidence: 0.9 };
  }

  // 3. Dark purple recognition
  if (h >= 0.7 && h <= 0.85 && s > 0.3 && v < 0.4) {
    return { name: 'Purple', confidence: 0.85 };
  }

  // Standard method - check against all basic colors
  let bestMatch: BasicColorName = 'Gray'; // Default
  let bestConfidence = 0;

  // Iterate through all basic colors to find the best match
  for (const [name, definition] of Object.entries(BasicColors)) {
    const confidence = calculateColorMatchConfidence(hsv, definition);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = name as BasicColorName;
    }
  }

  // If no good match was found, find the nearest basic color
  if (bestConfidence < DEFAULT_MIN_BASIC_COLOR_CONFIDENCE) {
    return findNearestBasicColor(hsv);
  }

  return { name: bestMatch, confidence: bestConfidence };
}

/**
 * Find the nearest basic color for edge cases
 * Ensures every color gets assigned to something reasonable
 */
export function findNearestBasicColor(hsv: HSVVector): {
  name: BasicColorName;
  confidence: number;
} {
  const [h, s, v] = hsv;

  // Handle very low saturation separately (achromatic colors)
  if (s < 0.1) {
    if (v > 0.9) return { name: 'White', confidence: 0.9 };
    if (v < 0.15) return { name: 'Black', confidence: 0.9 };
    return { name: 'Gray', confidence: 0.8 };
  }

  // For chromatic colors, find the closest match based on HSV distance
  let bestMatch: BasicColorName = 'Gray'; // Default
  let minDistance = Number.MAX_VALUE;

  // Reference points for main colors in HSV space [hue, saturation, value]
  const referenceColors: [BasicColorName, number, number, number][] = [
    ['Red', 0.0, 0.8, 0.7],
    ['Maroon', 0.0, 0.8, 0.4],
    ['Pink', 0.95, 0.5, 0.8],
    ['Orange', 0.07, 0.8, 0.8],
    ['Brown', 0.07, 0.6, 0.4],
    ['Yellow', 0.15, 0.8, 0.8],
    ['Olive', 0.15, 0.5, 0.4],
    ['Green', 0.33, 0.8, 0.6],
    ['Teal', 0.5, 0.8, 0.5],
    ['Cyan', 0.5, 0.8, 0.8],
    ['Blue', 0.67, 0.8, 0.6],
    ['Navy', 0.67, 0.8, 0.2],
    ['Purple', 0.75, 0.8, 0.5],
    ['Magenta', 0.85, 0.8, 0.6],
  ];

  for (const [name, refH, refS, refV] of referenceColors) {
    // Calculate hue distance accounting for color wheel wrap-around
    const hueDist = Math.min(Math.abs(h - refH), 1 - Math.abs(h - refH));

    // Calculate weighted distance, hue being most important
    const dist = hueDist * 5 + Math.abs(s - refS) * 3 + Math.abs(v - refV) * 2;

    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = name;
    }
  }

  // Calculate confidence inversely proportional to distance
  const confidence = Math.max(0.5, 1 - minDistance / 5);

  return { name: bestMatch, confidence };
}

/**
 * Calculate how well a color matches a basic color definition.
 * Enhanced to better handle edge cases
 */
export function calculateColorMatchConfidence(hsv: HSVVector, basicColor: BasicColor): number {
  const [h, s, v] = hsv;

  // Check if color is within the hue range
  if (!isInHueRange(h, basicColor.hueRange)) return 0;

  // Check saturation constraints
  if (s < basicColor.satThresholds.min) return 0;
  if (basicColor.satThresholds.max !== undefined && s > basicColor.satThresholds.max) return 0;

  // Check value constraints
  if (v < basicColor.valueThresholds.min) return 0;
  if (basicColor.valueThresholds.max !== undefined && v > basicColor.valueThresholds.max) return 0;

  // Calculate confidence based on how centered the color is in the ranges

  // Hue confidence calculation
  let hueConfidence = 1.0;
  if (basicColor.hueRange) {
    // For hue, calculate distance from center of range
    let hueCenter;
    if (basicColor.hueRange[0] > basicColor.hueRange[1]) {
      // Wrap-around case (e.g., Red [0.97, 0.03])
      hueCenter = (basicColor.hueRange[0] + basicColor.hueRange[1] + 1) / 2;
      if (hueCenter > 1) hueCenter -= 1;
    } else {
      hueCenter = (basicColor.hueRange[0] + basicColor.hueRange[1]) / 2;
    }

    // Calculate normalized distance from center (accounting for wrap-around)
    let hueDist = Math.abs(h - hueCenter);
    if (hueDist > 0.5) hueDist = 1 - hueDist;

    // Calculate hue range size, accounting for wrap-around
    const hueRange =
      basicColor.hueRange[0] > basicColor.hueRange[1]
        ? 1 - basicColor.hueRange[0] + basicColor.hueRange[1]
        : basicColor.hueRange[1] - basicColor.hueRange[0];

    // Convert to confidence (1 at center, decreasing toward edges)
    hueConfidence = 1 - hueDist / (hueRange / 2);
    hueConfidence = Math.max(0, Math.min(1, hueConfidence)); // Clamp to [0,1]
  }

  // Saturation confidence calculation
  let satConfidence = 1.0;
  if (basicColor.satThresholds.max !== undefined) {
    const satCenter = (basicColor.satThresholds.min + basicColor.satThresholds.max) / 2;
    const satRange = basicColor.satThresholds.max - basicColor.satThresholds.min;
    const satDist = Math.abs(s - satCenter);
    satConfidence = 1 - satDist / (satRange / 2);
    satConfidence = Math.max(0, Math.min(1, satConfidence)); // Clamp to [0,1]
  } else {
    // For open-ended ranges, confidence decreases as we get closer to min
    satConfidence = Math.min(1, (s - basicColor.satThresholds.min) / 0.3 + 0.7);
  }

  // Value/brightness confidence calculation
  let valConfidence = 1.0;
  if (basicColor.valueThresholds.max !== undefined) {
    const valCenter = (basicColor.valueThresholds.min + basicColor.valueThresholds.max) / 2;
    const valRange = basicColor.valueThresholds.max - basicColor.valueThresholds.min;
    const valDist = Math.abs(v - valCenter);
    valConfidence = 1 - valDist / (valRange / 2);
    valConfidence = Math.max(0, Math.min(1, valConfidence)); // Clamp to [0,1]
  } else {
    // For open-ended ranges, confidence decreases as we get closer to min
    valConfidence = Math.min(1, (v - basicColor.valueThresholds.min) / 0.3 + 0.7);
  }

  // Special case weighting for problematic categories
  if (basicColor.name === 'Maroon') {
    // For maroon, require high confidence in all aspects
    return Math.min(hueConfidence, satConfidence, valConfidence);
  }

  if (basicColor.name === 'Purple' && v < 0.3) {
    // For dark purples, prioritize hue confidence
    return hueConfidence * 0.7 + satConfidence * 0.2 + valConfidence * 0.1;
  }

  // Standard weighting based on color type
  const isAchromatic = basicColor.hueRange === null;

  if (isAchromatic) {
    // For achromatic colors, saturation and value are most important
    return satConfidence * 0.5 + valConfidence * 0.5;
  } else {
    // For chromatic colors, hue is most important
    return hueConfidence * 0.6 + satConfidence * 0.2 + valConfidence * 0.2;
  }
}

/**
 * Analyze which basic colors are present in a palette
 * Enhanced to handle edge cases better
 */
export function analyzeBasicColors(colors: RGBAVector[]): BasicColorResult[] {
  const results: BasicColorResult[] = [];
  const colorsByCategory: Record<BasicColorName, { color: RGBAVector; confidence: number }[]> =
    {} as any;

  // Initialize the color categories
  Object.keys(BasicColors).forEach((name) => {
    colorsByCategory[name as BasicColorName] = [];
  });

  // Categorize each color
  for (const color of colors) {
    const { name, confidence } = categorizeColor(color);
    colorsByCategory[name].push({ color, confidence });
  }

  // Process detected categories
  for (const [name, matches] of Object.entries(colorsByCategory)) {
    if (matches.length === 0) continue;

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // Add to results
    results.push({
      name: name as BasicColorName,
      confidence: matches[0].confidence, // Use highest confidence match
      prevalence: matches.length / colors.length,
      exampleColor: matches[0].color, // Best example
    });
  }

  // Sort by prevalence
  return results.sort((a, b) => b.prevalence - a.prevalence);
}

/**
 * Convert RGB to hex color format
 */
export function rgbToHex(color: RGBAVector): string {
  const r = Math.round(color[0] * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(color[1] * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(color[2] * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Convert hex to RGB color format with improved validation
 */
export function hexToRgb(hex: string): RGBAVector {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle short hex format (e.g., #ABC)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return [0, 0, 0, 1];
  }

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return [r, g, b, 1];
}

/**
 * Generate random RGB vector
 */
export function generateRandomRGB(): RGBAVector {
  return [Math.random(), Math.random(), Math.random(), 1];
}

/**
 * Create coefficients that can generate the given colors
 */
export function createCoeffsFromColors(colors: RGBAVector[]): CosineCoeffs {
  // Get the average color
  const avgColor: [number, number, number, number] = [0, 0, 0, 1];
  for (const color of colors) {
    avgColor[0] += color[0] / colors.length;
    avgColor[1] += color[1] / colors.length;
    avgColor[2] += color[2] / colors.length;
  }

  // Get the color spread (max distance from average)
  let maxDist = 0;
  for (const color of colors) {
    const dist = Math.sqrt(
      Math.pow(color[0] - avgColor[0], 2) +
        Math.pow(color[1] - avgColor[1], 2) +
        Math.pow(color[2] - avgColor[2], 2),
    );
    maxDist = Math.max(maxDist, dist);
  }

  // Create simple coefficients
  return [
    // a: offset vector - average color
    [avgColor[0], avgColor[1], avgColor[2], 1],

    // b: amplitude vector - based on color spread
    [maxDist, maxDist, maxDist, 1],

    // c: frequency vector - moderate value for smooth transitions
    [1.0, 1.0, 1.0, 1],

    // d: phase vector - different phases for variation
    [0, Math.PI / 3, (2 * Math.PI) / 3, 1],
  ];
}

/**
 * Generates random cosine coefficients for palette creation
 */
export function generateRandomCoeffs(): CosineCoeffs {
  // Define reasonable ranges for each parameter
  const offsetRange: [number, number] = [0.3, 0.7]; // a: base color
  const amplitudeRange: [number, number] = [0.1, 0.5]; // b: color range
  const frequencyRange: [number, number] = [0.5, 2.0]; // c: cycles
  const phaseRange: [number, number] = [0, TAU]; // d: shift

  // Helper to get random value in range
  const randomInRange = (range: [number, number]): number =>
    range[0] + Math.random() * (range[1] - range[0]);

  return [
    // a: offset vector (base color)
    [randomInRange(offsetRange), randomInRange(offsetRange), randomInRange(offsetRange), 1],
    // b: amplitude vector (color range)
    [
      randomInRange(amplitudeRange),
      randomInRange(amplitudeRange),
      randomInRange(amplitudeRange),
      1,
    ],
    // c: frequency vector (color cycles)
    [
      randomInRange(frequencyRange),
      randomInRange(frequencyRange),
      randomInRange(frequencyRange),
      1,
    ],
    // d: phase vector (color shift)
    [randomInRange(phaseRange), randomInRange(phaseRange), randomInRange(phaseRange), 1],
  ];
}

/**
 * Checks if a palette has sufficient diversity to be worth generating
 * IMPROVED: Now respects boundary cases without category-specific logic
 */
export function isPaletteValid(
  colors: RGBAVector[],
  options: PaletteGenerationOptions = {},
): boolean {
  // Default threshold for color distance
  const minColorDistance = options.minColorDistance || 5;

  // Check color diversity using perceptual distance
  const labColors = colors.map(rgbToLab);
  let hasDistinctColors = false;

  for (let i = 0; i < labColors.length; i++) {
    for (let j = i + 1; j < labColors.length; j++) {
      if (deltaE(labColors[i], labColors[j]) > minColorDistance) {
        hasDistinctColors = true;
        break;
      }
    }
    if (hasDistinctColors) break;
  }

  if (!hasDistinctColors) return false;

  // Skip brightness and saturation checks when using initialGlobals
  // as these parameters are already controlled by the global modifiers
  if (options.initialGlobals) {
    // Check if we're near category bounds by examining the initialGlobals values
    const globals = options.initialGlobals;

    // If we're using global modifiers near boundaries, be more lenient
    if (globals) {
      // Check if we're near the boundary for any global parameter
      const boundaryThreshold = 0.1; // How close to boundary we need to be for leniency
      let isNearBoundary = false;

      // Global min/max bounds (across all categories)
      const globalMin = {
        exposure: -1,
        contrast: 0,
        frequency: 0,
      };

      const globalMax = {
        exposure: 1,
        contrast: 2,
        frequency: 2,
      };

      // Check if we're near any absolute boundaries
      if (globals.exposure !== undefined) {
        if (
          globals.exposure <= globalMin.exposure + boundaryThreshold ||
          globals.exposure >= globalMax.exposure - boundaryThreshold
        ) {
          isNearBoundary = true;
        }
      }

      if (globals.contrast !== undefined) {
        if (
          globals.contrast <= globalMin.contrast + boundaryThreshold ||
          globals.contrast >= globalMax.contrast - boundaryThreshold
        ) {
          isNearBoundary = true;
        }
      }

      if (globals.frequency !== undefined) {
        if (
          globals.frequency <= globalMin.frequency + boundaryThreshold ||
          globals.frequency >= globalMax.frequency - boundaryThreshold
        ) {
          isNearBoundary = true;
        }
      }

      // If near a boundary, be more lenient with validation
      if (isNearBoundary) {
        return true; // Skip remaining checks if near a boundary
      }
    }

    return true; // Regular case - skip remaining checks with initialGlobals
  }

  // For backward compatibility, use the old checks when initialGlobals aren't provided
  // Use more adaptive thresholds based on the nature of the colors
  let minBrightness = 0.15;
  let maxBrightness = 0.85;
  let minSaturation = 0.2;

  // Calculate brightness and saturation
  const brightnesses = colors.map(getBrightness);
  const minFound = Math.min(...brightnesses);
  const maxFound = Math.max(...brightnesses);
  const brightnessDynamic = maxFound - minFound;

  const saturations = colors.map(getSaturation);
  const avgSaturation = saturations.reduce((sum, s) => sum + s, 0) / saturations.length;

  // Adjust thresholds for high-contrast or low-exposure palettes
  // If we have a high contrast between darkest and lightest colors,
  // be more lenient with the absolute brightness bounds
  if (brightnessDynamic > 0.4) {
    minBrightness = 0.1; // Allow darker colors in high-contrast palettes
    maxBrightness = 0.9; // Allow brighter highlights
  }

  // Compensate for low-saturation palettes with higher contrast
  if (brightnessDynamic > 0.5 && avgSaturation < minSaturation) {
    minSaturation = 0.15; // Reduce required saturation for high-contrast palettes
  }

  // Special case: if we have very low brightness but good saturation, it might be intentional
  if (minFound < minBrightness && avgSaturation > 0.4) {
    minBrightness = 0.05; // Allow darker colors for richly saturated palettes
  }

  // Now apply the adjusted thresholds
  if (minFound < minBrightness || maxFound > maxBrightness) return false;

  if (avgSaturation < minSaturation) return false;

  return true;
}
