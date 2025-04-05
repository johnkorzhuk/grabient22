import type { CosineCoeffs } from '~/types';
import { coeffsSchema } from './cosineGradient';
import SuperJSON from 'superjson';
import * as v from 'valibot';

/**
 * Serializes coefficient data to a URL-friendly string
 */
export function serializeCoeffs(coeffs: CosineCoeffs): string {
  const result = v.parse(coeffsSchema, coeffs);

  // Convert to SuperJSON and encode to base64
  const jsonString = SuperJSON.stringify(result);
  return btoa(jsonString)
    .replace(/\+/g, '-') // Make URL-safe
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Remove padding
}

/**
 * Deserializes a URL string back to coefficient vectors
 */
export function deserializeCoeffs(serialized: string): CosineCoeffs | null {
  try {
    // Restore URL-safe characters
    const base64 = serialized.replace(/-/g, '+').replace(/_/g, '/');

    // Add back padding if needed
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const paddedBase64 = base64 + padding;

    // Decode and parse with SuperJSON
    const jsonString = atob(paddedBase64);
    const parsedData = SuperJSON.parse(jsonString);

    // Validate and transform
    return v.parse(coeffsSchema, parsedData);
  } catch (error) {
    console.error('Failed to deserialize coefficients:', error);
    return null;
  }
}
