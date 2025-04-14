import * as v from 'valibot';
import LZString from 'lz-string';
import { coeffsSchema, globalsSchema, COEFF_PRECISION } from '../validators';

// Default values for global modifiers [exposure, contrast, frequency, phase]
const DEFAULT_GLOBALS = [0, 1, 1, 0] as const;

type CosineCoeffs = v.InferOutput<typeof coeffsSchema>;
type GlobalModifiers = v.InferOutput<typeof globalsSchema>;

/**
 * Formats a number to string with minimal characters by removing leading zeros
 * Maintains consistent decimal precision based on COEFF_PRECISION
 */
function formatNumber(num: number): string {
  // Format to specified precision
  const formattedStr = num.toFixed(COEFF_PRECISION);

  // If it's a decimal starting with 0, remove the leading zero
  if (num > -1 && num < 1 && num !== 0) {
    return formattedStr.replace(/^0\./, '.');
  } else if (num === 0) {
    // Special case for zero to avoid ".0000"
    return '0';
  }

  return formattedStr;
}

/**
 * Serializes coefficient data to a URL-friendly string using Valibot validation and LZ-String compression
 */
export function serializeCoeffs(coeffs: CosineCoeffs, globals: GlobalModifiers): string {
  const validatedCoeffs = v.parse(coeffsSchema, coeffs);
  const validatedGlobals = v.parse(globalsSchema, globals);
  
  // Check if globals are at default values
  const useDefaultGlobals = validatedGlobals.every((val, index) => val === DEFAULT_GLOBALS[index]);

  // Combine coeffs (dropping alpha) and globals if non-default
  const data = [
    ...validatedCoeffs.map((vec) => [vec[0], vec[1], vec[2]]).flat(),
    ...(useDefaultGlobals ? [] : validatedGlobals),
  ];

  // Convert to minimal string format with commas
  const packed = data.map(formatNumber).join(',');

  // Compress the resulting string
  return LZString.compressToEncodedURIComponent(packed);
}

/**
 * Parse a number from the minimal string format
 */
function parseNumber(str: string): number {
  // If it starts with a dot, add a leading zero
  if (str.startsWith('.')) {
    return parseFloat('0' + str);
  }
  return parseFloat(str);
}

/**
 * Deserializes a URL string back to coefficient vectors
 */
export function deserializeCoeffs(seed: string) {
  const decompressed = LZString.decompressFromEncodedURIComponent(seed);

  // Split by commas and parse numbers
  const numbers = decompressed.split(',').map(parseNumber);

  // Check if we have just coeffs data (12 values) or coeffs + globals (16 values)
  if (numbers.length !== 12 && numbers.length !== 16) {
    throw new Error(`Expected 12 or 16 values, got ${numbers.length}`);
  }

  // First 12 numbers are always coeffs (4 vectors × 3 values)
  const coeffsData = numbers.slice(0, 12);
  // If we have more than 12 values, those are globals, otherwise use defaults
  const globalsData = numbers.length > 12 ? numbers.slice(12, 16) : DEFAULT_GLOBALS;

  // Reconstruct coeffs with alpha channel
  const coeffsWithAlpha = [];
  for (let i = 0; i < 12; i += 3) {
    coeffsWithAlpha.push([coeffsData[i], coeffsData[i + 1], coeffsData[i + 2], 1]);
  }

  return {
    coeffs: v.parse(coeffsSchema, coeffsWithAlpha),
    globals: v.parse(globalsSchema, globalsData),
  };
}
