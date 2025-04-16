/**
 * Core types for the palette generation system
 */
import type { CosineCoeffs, RGBAVector } from '~/types';

/**
 * All valid palette category keys
 * These represent different color harmony and attribute patterns
 * that can be generated for a color palette
 */
export type PaletteCategoryKey = 'Monochromatic' | 'Earthy' | 'Pastel' | 'Random';
//   | 'Analogous'
//   | 'Complementary'
//   | 'Split-Complementary'
//   | 'Triadic'
//   | 'Tetradic'
//   | 'Hexadic'
//   | 'Warm-Dominant'
//   | 'Cool-Dominant'
//   | 'Temperature-Balanced'
//   | 'Neutral'
//   | 'High-Value'
//   | 'Low-Value'
//   | 'Jewel-Tones'
//   | 'Neon';

/**
 * Basic color names for simplified color approximation
 */
export type BasicColorName =
  | 'Red'
  | 'Orange'
  | 'Yellow'
  | 'Chartreuse'
  | 'Green'
  | 'Mint'
  | 'Cyan'
  | 'Azure'
  | 'Blue'
  | 'Purple'
  | 'Magenta'
  | 'Pink'
  | 'Brown'
  | 'Olive'
  | 'Gold'
  | 'Lavender'
  | 'Teal'
  | 'Navy'
  | 'Maroon'
  | 'Peach'
  | 'Beige'
  | 'Gray'
  | 'Black'
  | 'White';

/**
 * Bounds for global modifier parameters used during palette generation
 * Each tuple represents [min, max] allowed values
 * Use null to indicate a modifier should be disabled for this category
 */
export type GlobalModifierBounds = {
  /** Bounds for exposure (a offset) - null if disabled */
  exposure: [number, number] | null;
  /** Bounds for contrast (b multiplier) - null if disabled */
  contrast: [number, number] | null;
  /** Bounds for frequency (c multiplier) - null if disabled */
  frequency: [number, number] | null;
};

/**
 * Defines a palette category and its properties
 */
export interface PaletteCategory {
  /** Unique identifier for this category */
  key: PaletteCategoryKey;

  /** Human-readable description of what this category represents */
  description: string;

  /** The optimal number of color stops needed for this category */
  recommendedColorStops: number;

  /** Bounds for initial global modifiers used during palette generation */
  initialGlobalsBounds: GlobalModifierBounds;

  /** Keys of categories that cannot coexist with this category */
  exclusiveWith: PaletteCategoryKey[];
}

/**
 * Result of a generated basic color in a palette
 */
export interface BasicColorResult {
  /** Name of the detected basic color */
  name: BasicColorName;

  /** Confidence score between 0-1, where 1 indicates a perfect match */
  confidence: number;

  /** Proportion of this color in the palette (0-1) */
  prevalence: number;

  /** Representative color from the palette that best exemplifies this basic color */
  exampleColor: RGBAVector;
}

/**
 * Complete result of palette generation
 */
export interface PaletteGenerationResult {
  /** The primary category that was generated */
  category: PaletteCategoryKey;

  /** All categories applied to this palette (including primary) */
  appliedCategories: PaletteCategoryKey[];

  /** Basic color analysis results */
  basicColors: BasicColorResult[];

  /** The generated palette colors */
  colors: RGBAVector[];

  /** Global modifiers applied to the coefficients */
  globals: [number, number, number, number];

  /** Cosine coefficients used to generate the palette */
  coeffs: CosineCoeffs;

  /** Number of attempts taken to generate this palette */
  attemptsTaken: number;
}

/**
 * Function type for category-specific validation
 */
export type CategoryValidator = (colors: RGBAVector[]) => boolean;

/**
 * Configuration options for palette generation
 */
export interface PaletteGenerationOptions {
  /** Maximum attempts to try before giving up */
  maxAttempts?: number;

  /** Minimum perceptual distance between colors */
  minColorDistance?: number;

  /** Initial global modifiers to use for generation */
  initialGlobals?: {
    exposure?: number;
    contrast?: number;
    frequency?: number;
    phase?: number;
  };

  /** Additional categories to combine with the primary category */
  additionalCategories?: PaletteCategoryKey[];
}

/**
 * Definition of a basic color with its HSV characteristics
 */
export interface BasicColor {
  /** Name of this basic color */
  name: BasicColorName;

  /**
   * Range of hues that define this color, normalized to 0-1
   * null indicates an achromatic color (black, white, gray)
   * For wrap-around ranges (e.g. red), min > max indicates wrapping around the color wheel
   */
  hueRange: [number, number] | null;

  /**
   * Saturation thresholds that define this color
   * min: minimum saturation required
   * max: optional maximum saturation allowed
   */
  satThresholds: {
    min: number;
    max?: number;
  };

  /**
   * Value/brightness thresholds that define this color
   * min: minimum value required
   * max: optional maximum value allowed
   */
  valueThresholds: {
    min: number;
    max?: number;
  };
}
