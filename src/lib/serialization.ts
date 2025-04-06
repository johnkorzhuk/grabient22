import * as v from 'valibot';
import LZString from 'lz-string';
import { coeffsSchema, globalsSchema } from '../validators';

type CosineCoeffs = v.InferOutput<typeof coeffsSchema>;
type GlobalModifiers = v.InferOutput<typeof globalsSchema>;

/**
 * Serializes coefficient data to a URL-friendly string using Valibot validation
 */
export function serializeCoeffs(coeffs: CosineCoeffs, globals: GlobalModifiers): string {
  const validatedCoeffs = v.parse(coeffsSchema, coeffs);
  const validatedGlobals = v.parse(globalsSchema, globals);

  // Combine coeffs (dropping alpha) and globals
  const data = [
    ...validatedCoeffs.map((vec) => [vec[0], vec[1], vec[2]]).flat(),
    ...validatedGlobals,
  ];

  // Convert to string and compress
  return LZString.compressToEncodedURIComponent(data.join(','));
}

/**
 * Deserializes a URL string back to coefficient vectors
 */
export function deserializeCoeffs(
  serialized: string,
): { coeffs: CosineCoeffs; globals: GlobalModifiers } | null {
  const decompressed = LZString.decompressFromEncodedURIComponent(serialized);
  const numbers = decompressed.split(',').map(Number);

  // First 12 numbers are coeffs (4 vectors × 3 values), rest are globals
  const coeffsData = numbers.slice(0, 12);
  const globalsData = numbers.slice(12, 16);

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
