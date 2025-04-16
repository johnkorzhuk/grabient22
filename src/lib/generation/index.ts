/**
 * Harmonious Palette Generation System
 * Main entry point for generating color palettes based on color theory principles
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

// Export constants
export { PaletteCategories, HueRanges, BasicColors } from './color-constants';

// Export main generator functions
export { generatePalette, generatePalettes, PaletteGeneratorFactory } from './factory';

// Export base generator class
export { BasePaletteGenerator } from './base-generator';

// Export specific generators if needed directly
export { EarthyGenerator } from './generators/earthy';
export { MonochromaticGenerator } from './generators/monochromatic';
export { PastelGenerator } from './generators/pastel';

// export { AnalogousGenerator } from './generators/analogous';
// export { ComplementaryGenerator } from './generators/complementary';
// export { SplitComplementaryGenerator } from './generators/split-complementary';
// export { TriadicGenerator } from './generators/triadic';
// export { TetradicGenerator } from './generators/tetradic';
// export { HexadicGenerator } from './generators/hexadic';
// export { WarmDominantGenerator } from './generators/warm-dominant';
// export { CoolDominantGenerator } from './generators/cool-dominant';
// export { TemperatureBalancedGenerator } from './generators/temperature-balanced';
// export { NeutralGenerator } from './generators/neutral';
// export { HighValueGenerator } from './generators/high-value';
// export { LowValueGenerator } from './generators/low-value';
// export { JewelTonesGenerator } from './generators/jewel-tones';
// export { NeonGenerator } from './generators/neon';
// export { RandomGenerator } from './generators/random';
