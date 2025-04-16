/**
 * Color Constants and Definitions
 * Contains category definitions and basic color mappings with broader ranges
 * to ensure complete coverage of the color space
 */

import type { PaletteCategory, PaletteCategoryKey, BasicColor, BasicColorName } from './types';

/**
 * Predefined palette categories with their properties
 */
export const PaletteCategories: Record<PaletteCategoryKey, PaletteCategory> = {
  Monochromatic: {
    key: 'Monochromatic',
    description: 'Single hue with variations in saturation and brightness.',
    recommendedColorStops: 5,
    initialGlobalsBounds: {
      exposure: [-0.5, 0.5],
      contrast: [0.8, 1.2],
      frequency: null,
    },
  },
  Pastel: {
    key: 'Pastel',
    description: 'High brightness, low saturation colors.',
    recommendedColorStops: 6,
    initialGlobalsBounds: {
      exposure: null,
      contrast: null,
      frequency: [0.75, 1.25],
    },
  },
  Earthy: {
    key: 'Earthy',
    description: 'Natural colors like browns, tans, olive greens.',
    recommendedColorStops: 7,
    initialGlobalsBounds: {
      exposure: [-0.2, 0.1],
      contrast: [0.6, 0.9],
      frequency: [0.5, 1.2],
    },
  },
  Random: {
    key: 'Random',
    description: 'Randomly generated color palette.',
    recommendedColorStops: 7,
    initialGlobalsBounds: {
      exposure: [-0.6, 0.6], // Full range for randomness
      contrast: [0.5, 1.5], // Full range for randomness
      frequency: [0.5, 1], // Full range for randomness
    },
  },

  //   Analogous: {
  //     key: 'Analogous',
  //     description: 'Adjacent colors on the color wheel (within 30-60°).',
  //     recommendedColorStops: 6,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   Complementary: {
  //     key: 'Complementary',
  //     description: 'Colors opposite on the color wheel (180° apart).',
  //     recommendedColorStops: 6,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   'Split-Complementary': {
  //     key: 'Split-Complementary',
  //     description: 'Primary color plus two colors adjacent to its complement.',
  //     recommendedColorStops: 7,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   Triadic: {
  //     key: 'Triadic',
  //     description: 'Three colors evenly spaced (120°) around the color wheel.',
  //     recommendedColorStops: 6,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   Tetradic: {
  //     key: 'Tetradic',
  //     description: 'Two complementary pairs forming a rectangle.',
  //     recommendedColorStops: 8,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   Hexadic: {
  //     key: 'Hexadic',
  //     description: 'Six colors evenly spaced around the color wheel.',
  //     recommendedColorStops: 12,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   'Warm-Dominant': {
  //     key: 'Warm-Dominant',
  //     description: 'Palette primarily consisting of reds, oranges, yellows.',
  //     recommendedColorStops: 7,
  //     initialGlobalsBounds: {
  //       exposure: [-0.1, 0.3], // Allow more positive exposure for warm colors
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   'Cool-Dominant': {
  //     key: 'Cool-Dominant',
  //     description: 'Palette primarily consisting of blues, greens, purples.',
  //     recommendedColorStops: 7,
  //     initialGlobalsBounds: {
  //       exposure: [-0.3, 0.1], // Allow more negative exposure for cool colors
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   'Temperature-Balanced': {
  //     key: 'Temperature-Balanced',
  //     description: 'Even mix of warm and cool colors.',
  //     recommendedColorStops: 8,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.2],
  //       contrast: [0.8, 1.2],
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   Neutral: {
  //     key: 'Neutral',
  //     description: 'Colors with very low saturation, not quite grayscale.',
  //     recommendedColorStops: 5,
  //     initialGlobalsBounds: {
  //       exposure: [-0.1, 0.1], // Narrow range to maintain neutrality
  //       contrast: [0.4, 0.8], // Lower contrast to reduce saturation
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   'High-Value': {
  //     key: 'High-Value',
  //     description: 'Predominantly light colors.',
  //     recommendedColorStops: 5,
  //     initialGlobalsBounds: {
  //       exposure: [0.1, 0.4], // Higher exposure for brighter colors
  //       contrast: [0.6, 1.0], // Lower contrast to maintain high value
  //       frequency: [0.5, 1.5],
  //     },
  //   },
  //   'Low-Value': {
  //     key: 'Low-Value',
  //     description: 'Predominantly dark colors.',
  //     recommendedColorStops: 5,
  //     initialGlobalsBounds: {
  //       exposure: [-0.4, -0.1], // Lower exposure for darker colors
  //       contrast: [0.6, 1.0], // Lower contrast to maintain low value
  //       frequency: [0.5, 1.5],
  //     },
  //   },

  //   'Jewel-Tones': {
  //     key: 'Jewel-Tones',
  //     description: 'Rich, deep colors with medium-high saturation.',
  //     recommendedColorStops: 6,
  //     initialGlobalsBounds: {
  //       exposure: [-0.2, 0.1], // Slight negative exposure for richness
  //       contrast: [1.0, 1.5], // Higher contrast for vibrancy
  //       frequency: [0.5, 1.5],
  //     },
  //   },

  //   Neon: {
  //     key: 'Neon',
  //     description: 'Very bright, highly saturated colors.',
  //     recommendedColorStops: 5,
  //     initialGlobalsBounds: {
  //       exposure: [0.1, 0.3], // Higher exposure for brightness
  //       contrast: [1.2, 2.0], // Higher contrast for intensity
  //       frequency: [0.7, 1.8], // Higher frequency for vibrance
  //     },
  //   },
};

/**
 * Common hue ranges for color harmony generation
 */
export const HueRanges = {
  // Warm colors
  WARM_HUES: [
    [0.95, 1.0], // Reds
    [0.0, 0.05], // Reds (wrapping around)
    [0.05, 0.11], // Oranges
    [0.11, 0.17], // Yellows
    [0.17, 0.2], // Yellow-greens
  ],

  // Cool colors
  COOL_HUES: [
    [0.3, 0.4], // Greens
    [0.4, 0.55], // Teals and Cyans
    [0.55, 0.7], // Blues
    [0.7, 0.85], // Purples
  ],

  // Earth tones
  EARTHY_HUES: [
    [0.02, 0.12], // Browns/Oranges/Terracotta
    [0.1, 0.15], // Tans/Khaki
    [0.26, 0.4], // Olive/Forest greens
  ],

  // Jewel tones
  JEWEL_HUES: [
    [0.0, 0.03], // Ruby red
    [0.05, 0.08], // Garnet red-orange
    [0.12, 0.15], // Amber
    [0.33, 0.36], // Emerald
    [0.5, 0.53], // Sapphire
    [0.6, 0.63], // Blue topaz
    [0.75, 0.78], // Amethyst
    [0.85, 0.88], // Fuchsia/magenta
  ],

  // Neon hues
  NEON_HUES: [
    [0.0, 0.03], // Neon red
    [0.07, 0.1], // Neon orange
    [0.17, 0.2], // Neon yellow
    [0.33, 0.36], // Neon green
    [0.5, 0.53], // Neon blue
    [0.67, 0.7], // Neon indigo
    [0.83, 0.86], // Neon purple
    [0.92, 0.95], // Neon pink
  ],
};

/**
 * Definitions for the basic colors with their HSV characteristics
 * Colors are listed in detection priority order - more specific colors
 * should be checked before more general ones when there are overlaps.
 *
 * UPDATED: Broadened ranges to ensure full color space coverage
 */
export const BasicColors: Record<BasicColorName, BasicColor> = {
  // Achromatic colors - checked first
  White: {
    name: 'White',
    hueRange: null,
    satThresholds: { min: 0, max: 0.15 }, // Increased max from 0.1
    valueThresholds: { min: 0.85 }, // Lowered from 0.9
  },
  Black: {
    name: 'Black',
    hueRange: null,
    satThresholds: { min: 0, max: 0.4 }, // Increased max from 0.3
    valueThresholds: { min: 0, max: 0.2 }, // Increased max from 0.15
  },
  Gray: {
    name: 'Gray',
    hueRange: null,
    satThresholds: { min: 0, max: 0.25 }, // Increased max from 0.2
    valueThresholds: { min: 0.2, max: 0.85 }, // Adjusted from 0.15-0.9
  },

  // Reds and pinks (hue near 0/1 boundary)
  Red: {
    name: 'Red',
    hueRange: [0.95, 0.05], // Widened from [0.97, 0.03]
    satThresholds: { min: 0.5 }, // Lowered from 0.6
    valueThresholds: { min: 0.3, max: 0.95 }, // Widened from 0.4-0.9
  },
  Maroon: {
    name: 'Maroon',
    hueRange: [0.93, 0.07], // Widened from [0.95, 0.05]
    satThresholds: { min: 0.4 }, // Lowered from 0.5
    valueThresholds: { min: 0.05, max: 0.45 }, // Widened from 0.1-0.4
  },
  Pink: {
    name: 'Pink',
    hueRange: [0.9, 0.99], // Widened from [0.93, 0.97]
    satThresholds: { min: 0.2, max: 0.9 }, // Widened from 0.3-0.8
    valueThresholds: { min: 0.65 }, // Lowered from 0.7
  },

  // Oranges and browns (hue 0.03-0.12)
  Brown: {
    name: 'Brown',
    hueRange: [0.01, 0.11], // Widened from [0.02, 0.09]
    satThresholds: { min: 0.3, max: 0.9 }, // Widened from 0.4-0.8
    valueThresholds: { min: 0.15, max: 0.65 }, // Widened from 0.2-0.6
  },
  Orange: {
    name: 'Orange',
    hueRange: [0.02, 0.12], // Widened from [0.03, 0.1]
    satThresholds: { min: 0.5 }, // Lowered from 0.6
    valueThresholds: { min: 0.5 }, // Lowered from 0.6
  },
  Peach: {
    name: 'Peach',
    hueRange: [0.03, 0.12], // Widened from [0.05, 0.1]
    satThresholds: { min: 0.15, max: 0.6 }, // Widened from 0.2-0.5
    valueThresholds: { min: 0.65 }, // Lowered from 0.7
  },
  Beige: {
    name: 'Beige',
    hueRange: [0.06, 0.14], // Widened from [0.08, 0.12]
    satThresholds: { min: 0.05, max: 0.35 }, // Widened from 0.1-0.3
    valueThresholds: { min: 0.65 }, // Lowered from 0.7
  },

  // Yellows and golds (hue 0.1-0.18)
  Yellow: {
    name: 'Yellow',
    hueRange: [0.08, 0.2], // Widened from [0.1, 0.18]
    satThresholds: { min: 0.4 }, // Lowered from 0.5
    valueThresholds: { min: 0.7 }, // Lowered from 0.8
  },
  Gold: {
    name: 'Gold',
    hueRange: [0.08, 0.16], // Widened from [0.1, 0.14]
    satThresholds: { min: 0.6 }, // Lowered from 0.7
    valueThresholds: { min: 0.5, max: 0.95 }, // Widened from 0.6-0.9
  },
  Olive: {
    name: 'Olive',
    hueRange: [0.1, 0.23], // Widened from [0.12, 0.2]
    satThresholds: { min: 0.2, max: 0.8 }, // Widened from 0.3-0.7
    valueThresholds: { min: 0.15, max: 0.7 }, // Widened from 0.2-0.6
  },

  // Yellow-greens to greens (hue 0.18-0.43)
  Chartreuse: {
    name: 'Chartreuse',
    hueRange: [0.16, 0.28], // Widened from [0.18, 0.26]
    satThresholds: { min: 0.4 }, // Lowered from 0.5
    valueThresholds: { min: 0.4 }, // Lowered from 0.5
  },
  Green: {
    name: 'Green',
    hueRange: [0.23, 0.43], // Widened from [0.26, 0.4]
    satThresholds: { min: 0.3 }, // Lowered from 0.4
    valueThresholds: { min: 0.15 }, // Lowered from 0.2
  },

  // Green-blues (hue 0.40-0.56)
  Mint: {
    name: 'Mint',
    hueRange: [0.37, 0.5], // Widened from [0.4, 0.47]
    satThresholds: { min: 0.15, max: 0.6 }, // Widened from 0.2-0.5
    valueThresholds: { min: 0.65 }, // Lowered from 0.7
  },
  Teal: {
    name: 'Teal',
    hueRange: [0.44, 0.55], // Widened from [0.47, 0.52]
    satThresholds: { min: 0.3 }, // Lowered from 0.4
    valueThresholds: { min: 0.15, max: 0.7 }, // Widened from 0.2-0.6
  },
  Cyan: {
    name: 'Cyan',
    hueRange: [0.47, 0.59], // Widened from [0.5, 0.56]
    satThresholds: { min: 0.3 }, // Lowered from 0.4
    valueThresholds: { min: 0.4 }, // Lowered from 0.5
  },

  // Blues (hue 0.56-0.73)
  Azure: {
    name: 'Azure',
    hueRange: [0.54, 0.64], // Widened from [0.56, 0.62]
    satThresholds: { min: 0.2 }, // Lowered from 0.3
    valueThresholds: { min: 0.5 }, // Lowered from 0.6
  },
  Blue: {
    name: 'Blue',
    hueRange: [0.57, 0.75], // Widened from [0.62, 0.73]
    satThresholds: { min: 0.3 }, // Lowered from 0.4
    valueThresholds: { min: 0.2 }, // Lowered from 0.3
  },
  Navy: {
    name: 'Navy',
    hueRange: [0.57, 0.7], // Widened from [0.6, 0.67]
    satThresholds: { min: 0.3 }, // Lowered from 0.4
    valueThresholds: { min: 0.05, max: 0.35 }, // Widened from 0.1-0.3
  },

  // Purples and magentas (hue 0.73-0.93)
  Purple: {
    name: 'Purple',
    hueRange: [0.7, 0.83], // Widened from [0.73, 0.81]
    satThresholds: { min: 0.3 }, // Lowered from 0.4
    valueThresholds: { min: 0.15 }, // Lowered from 0.2
  },
  Lavender: {
    name: 'Lavender',
    hueRange: [0.67, 0.83], // Widened from [0.7, 0.8]
    satThresholds: { min: 0.05, max: 0.45 }, // Widened from 0.1-0.4
    valueThresholds: { min: 0.65 }, // Lowered from 0.7
  },
  Magenta: {
    name: 'Magenta',
    hueRange: [0.79, 0.95], // Widened from [0.81, 0.93]
    satThresholds: { min: 0.4 }, // Lowered from 0.5
    valueThresholds: { min: 0.2 }, // Lowered from 0.3
  },
};
