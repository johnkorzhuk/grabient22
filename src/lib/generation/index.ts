/**
 * Harmonious Palette Generation System
 * Main entry point for generating color palettes based on color theory principles
 * With support for multi-category palette generation
 */

// Export types
export * from './types';

// Export color utilities
export {
  rgbToHsv,
  hsvToRgb,
  rgbToLab,
  deltaE,
  getBrightness,
  getSaturation,
  getValue,
  isWarmColor,
  isCoolColor,
  categorizeColor,
  analyzeBasicColors,
  rgbToHex,
  hexToRgb,
} from './color-utils';

// Export constants and helper functions
export {
  PaletteCategories,
  HueRanges,
  BasicColors,
  mergeGlobalsBounds,
  getRecommendedStops,
} from './color-constants';

// Export validator utilities
export {
  getCategoryValidator,
  validateMultiCategoryPalette,
  CATEGORY_VALIDATORS,
} from './category-validators';

// Export main generator functions
export {
  generatePalette,
  generatePalettes,
  PaletteGeneratorFactory,
  getGlobalBoundsForCategory,
  getGlobalBoundsForCategories,
  validateCategorySet,
  getIncompatibleCategories,
} from './factory';

// Export base generator class
export { BasePaletteGenerator } from './base-generator';

// Export specific generators if needed directly
export { EarthyGenerator } from './generators/earthy';
export { MonochromaticGenerator } from './generators/monochromatic';
export { PastelGenerator } from './generators/pastel';
export { ComplementaryGenerator } from './generators/complementary';
export { WarmDominantGenerator } from './generators/warm-dominant';
export { CoolDominantGenerator } from './generators/cool-dominant';
export { RandomGenerator } from './generators/random';
export { SplitComplementaryGenerator } from './generators/split-complementary';
export { TetradicGenerator } from './generators/tetradic';
export { NeonGenerator } from './generators/neon';
export { AnalogousGenerator } from './generators/analogous';
export { NeutralGenerator } from './generators/neutral';
export { HighValueGenerator } from './generators/high-value';
export { LowValueGenerator } from './generators/low-value';
