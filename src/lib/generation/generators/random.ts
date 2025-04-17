/**
 * Random Palette Generator
 * Creates completely random palettes with diverse colors
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { generateRandomCoeffs, isPaletteValid } from '../color-utils';

/**
 * Export the generate function for use in other contexts
 */
export { generateRandomCoeffs } from '../color-utils';

export class RandomGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Random', steps, options);
  }

  /**
   * Generate candidate coefficients for a random palette
   * Uses the utility function for completely random generation
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateRandomCoeffs();
  }

  /**
   * For random palettes, we just need to ensure they're valid
   * No specific category constraints beyond basic validity
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    // We use a more permissive set of criteria for random palettes
    // Just check if the palette has reasonable diversity

    // Random palettes still need to have distinct colors
    const options = {
      ...this.options,
      // Lower the minimum color distance threshold for more variety
      minColorDistance: (this.options.minColorDistance || 5) * 0.8,
    };

    return isPaletteValid(colors, options);
  }
}
