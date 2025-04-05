import { coeffsSchema } from './cosineGradient';
import * as v from 'valibot';
import LZString from 'lz-string';

type CosineCoeffs = v.InferOutput<typeof coeffsSchema>;
/**
 * Serializes coefficient data to a URL-friendly string using Valibot validation
 */
export function serializeCoeffs(
  coeffs: CosineCoeffs,
  globals: [number, number, number, number],
): string {
  const result = v.parse(coeffsSchema, coeffs);

  // Format to 4 decimals and combine coeffs (dropping alpha) and globals
  const format = (n: number) => Number(n.toFixed(4));
  const data = [...result.map((vec) => [vec[0], vec[1], vec[2]]).flat(), ...globals];

  // Convert to string and compress
  const compressed = data.map(format).join(',');
  return LZString.compressToEncodedURIComponent(compressed);
}

/**
 * Deserializes a URL string back to coefficient vectors
 */
export function deserializeCoeffs(
  serialized: string,
): { coeffs: CosineCoeffs; globals: [number, number, number, number] } | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(serialized);
    const numbers = decompressed.split(',').map(Number);

    // First 12 numbers are coeffs (4 vectors × 3 values), rest are globals
    const coeffsData = numbers.slice(0, 12);
    const globalsData = numbers.slice(12, 16) as [number, number, number, number];

    // Reconstruct coeffs with alpha channel
    const coeffsWithAlpha = [];
    for (let i = 0; i < 12; i += 3) {
      coeffsWithAlpha.push([coeffsData[i], coeffsData[i + 1], coeffsData[i + 2], 1]);
    }

    return {
      coeffs: v.parse(coeffsSchema, coeffsWithAlpha),
      globals: globalsData,
    };
  } catch (error) {
    console.error('Failed to deserialize coefficients:', error);
    return null;
  }
}
