/**
 * Base Palette Generator
 * Provides a foundation for all category-specific generators
 * With support for multi-category validation
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { cosineGradient } from '../cosineGradient';
import { analyzeBasicColors, isPaletteValid } from './color-utils';
import type {
  PaletteCategoryKey,
  PaletteGenerationOptions,
  PaletteGenerationResult,
  BasicColorResult,
} from './types';
import { PaletteCategories } from './color-constants';
import { getCategoryValidator, validateMultiCategoryPalette } from './category-validators';

/**
 * Default constants for generator
 */
export const DEFAULT_MAX_ATTEMPTS = 10000;
export const DEFAULT_STEPS = 7;

/**
 * Base class for all palette generators
 */
export abstract class BasePaletteGenerator {
  protected category: PaletteCategoryKey;
  protected steps: number;
  protected maxAttempts: number;
  protected options: PaletteGenerationOptions;
  protected lastGeneratedCoeffs: CosineCoeffs;
  protected globals: [number, number, number, number] = [0, 1, 1, 0]; // Default globals: [exposure, contrast, frequency, phase]

  // Multi-category support
  protected appliedCategories: PaletteCategoryKey[] = [];

  /**
   * Constructor for base palette generator
   */
  constructor(
    category: PaletteCategoryKey,
    steps?: number,
    options: PaletteGenerationOptions = {},
  ) {
    this.category = category;
    this.steps = steps || DEFAULT_STEPS;
    this.maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
    this.options = options;

    // Setup categories for multi-category support
    this.appliedCategories = [category];
    if (options.additionalCategories && options.additionalCategories.length > 0) {
      this.appliedCategories = this.appliedCategories.concat(options.additionalCategories);
    }

    // Initialize with default coeffs
    this.lastGeneratedCoeffs = [
      [0.5, 0.5, 0.5, 1] as [number, number, number, 1],
      [0.25, 0.25, 0.25, 1] as [number, number, number, 1],
      [0.5, 0.5, 0.5, 1] as [number, number, number, 1],
      [0, Math.PI / 3, (2 * Math.PI) / 3, 1] as [number, number, number, 1],
    ];

    // Initialize globals with options
    this.initializeGlobals(options);
  }

  /**
   * Initialize globals based on options and category bounds
   */
  private initializeGlobals(options: PaletteGenerationOptions): void {
    const categoryBounds = PaletteCategories[this.category].initialGlobalsBounds;

    // If no initialGlobals provided and we have category bounds,
    // always generate values within the bounds
    if (!options.initialGlobals && categoryBounds) {
      // 1. Exposure (globals[0])
      if (categoryBounds.exposure !== null) {
        const [min, max] = categoryBounds.exposure;
        this.globals[0] = min + Math.random() * (max - min);
      }

      // 2. Contrast (globals[1])
      if (categoryBounds.contrast !== null) {
        const [min, max] = categoryBounds.contrast;
        this.globals[1] = min + Math.random() * (max - min);
      }

      // 3. Frequency (globals[2])
      if (categoryBounds.frequency !== null) {
        const [min, max] = categoryBounds.frequency;
        this.globals[2] = min + Math.random() * (max - min);
      }
    }
    // If initialGlobals are provided, use them but validate against bounds
    else if (options.initialGlobals) {
      // 1. Exposure (globals[0])
      if (options.initialGlobals.exposure !== undefined) {
        this.globals[0] = options.initialGlobals.exposure;
      } else if (categoryBounds?.exposure) {
        const [min, max] = categoryBounds.exposure;
        this.globals[0] = min + Math.random() * (max - min);
      }

      // 2. Contrast (globals[1])
      if (options.initialGlobals.contrast !== undefined) {
        this.globals[1] = options.initialGlobals.contrast;
      } else if (categoryBounds?.contrast) {
        const [min, max] = categoryBounds.contrast;
        this.globals[1] = min + Math.random() * (max - min);
      }

      // 3. Frequency (globals[2])
      if (options.initialGlobals.frequency !== undefined) {
        this.globals[2] = options.initialGlobals.frequency;
      } else if (categoryBounds?.frequency) {
        const [min, max] = categoryBounds.frequency;
        this.globals[2] = min + Math.random() * (max - min);
      }

      // 4. Phase (globals[3])
      if (options.initialGlobals.phase !== undefined) {
        this.globals[3] = options.initialGlobals.phase;
      }
    }

    // Round all values to 3 decimal places for consistency
    this.globals = this.globals.map((value) => Number(value.toFixed(3))) as [
      number,
      number,
      number,
      number,
    ];
  }

  /**
   * Generate a palette for the specific category
   */
  public generate(): PaletteGenerationResult | null {
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      attempt++;

      // Generate candidate coefficients
      const coeffs = this.generateCandidateCoeffs();
      this.lastGeneratedCoeffs = coeffs;

      // Apply globals to get the actual colors
      const colors = this.generateColorsFromCoeffs(coeffs);

      // Create validation options with current global values
      const validationOptions = {
        ...this.options,
        // Add current global values to help with boundary validation
        initialGlobals: {
          exposure: this.globals[0],
          contrast: this.globals[1],
          frequency: this.globals[2],
          phase: this.globals[3],
          ...(this.options.initialGlobals || {}),
        },
      };

      // Two-phase validation:
      // 1. General palette validation (common across all categories)
      // 2. Category-specific validation (now supports multiple categories)
      if (
        isPaletteValid(colors, validationOptions) &&
        validateMultiCategoryPalette(colors, this.appliedCategories)
      ) {
        // Analyze the colors to determine basic color names
        const rawBasicColors = analyzeBasicColors(colors);

        // Process the colors to deduplicate and prioritize
        const basicColors = this.processBasicColorResults(rawBasicColors);

        return {
          category: this.category,
          appliedCategories: this.appliedCategories,
          colors,
          coeffs,
          globals: this.globals,
          basicColors,
          attemptsTaken: attempt,
        };
      }
    }

    // Could not generate a valid palette with the given constraints
    console.warn(`Failed to generate ${this.category} palette after ${this.maxAttempts} attempts.`);

    return null;
  }

  /**
   * Process basic color results to deduplicate and prioritize effectively
   * This ensures we don't get too many similar colors in the final result
   */
  protected processBasicColorResults(basicColors: BasicColorResult[]): BasicColorResult[] {
    // First, ensure we have at least one result per color in the palette
    if (basicColors.length === 0) {
      return []; // Fallback for extreme edge cases
    }

    // Filter out low-confidence results
    let filtered = basicColors.filter((color) => color.confidence > 0.6);

    // If we filtered out everything, return at least the top result
    if (filtered.length === 0) {
      filtered = [basicColors[0]];
    }

    // Group by color name and keep only the highest confidence result for each color
    const colorMap = new Map<string, BasicColorResult>();

    for (const color of filtered) {
      if (!colorMap.has(color.name) || colorMap.get(color.name)!.confidence < color.confidence) {
        colorMap.set(color.name, color);
      }
    }

    // Convert back to array and sort by prevalence
    const dedupedColors = Array.from(colorMap.values());
    dedupedColors.sort((a, b) => b.prevalence - a.prevalence);

    return dedupedColors;
  }

  /**
   * Generate candidate coefficients for this category
   * Each subclass must implement this method
   */
  protected abstract generateCandidateCoeffs(): CosineCoeffs;

  /**
   * Generate colors from coefficients with globals applied
   */
  protected generateColorsFromCoeffs(coeffs: CosineCoeffs): RGBAVector[] {
    // Apply globals to coefficients before generating colors
    const transformedCoeffs = this.applyGlobals(coeffs, this.globals);

    // Generate colors using the transformed coefficients
    return cosineGradient(this.steps, transformedCoeffs) as RGBAVector[];
  }

  /**
   * Apply globals to coefficients (similar to the original applyGlobals function)
   */
  private applyGlobals(
    coeffs: CosineCoeffs,
    globals: [number, number, number, number],
  ): CosineCoeffs {
    return coeffs.map((coeff, i) => {
      const alpha = coeff[3];
      switch (i) {
        case 0:
          return [...coeff.slice(0, 3).map((v) => v + globals[0]), alpha] as [
            number,
            number,
            number,
            number,
          ];
        case 1:
          return [...coeff.slice(0, 3).map((v) => v * globals[1]), alpha] as [
            number,
            number,
            number,
            number,
          ];
        case 2:
          return [...coeff.slice(0, 3).map((v) => v * globals[2]), alpha] as [
            number,
            number,
            number,
            number,
          ];
        case 3:
          return [...coeff.slice(0, 3).map((v) => v + globals[3]), alpha] as [
            number,
            number,
            number,
            number,
          ];
        default:
          return coeff;
      }
    }) as CosineCoeffs;
  }
}
