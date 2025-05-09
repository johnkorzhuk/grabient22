import * as v from 'valibot';

/**
 * All valid palette category keys
 * These represent different color harmony and attribute patterns
 * that can be generated for a color palette
 */
export type PaletteCategoryKey =
  | 'Warm'
  | 'Cool'
  | 'Neon'
  | 'Dark'
  | 'Pastel'
  | 'Earthy'
  | 'Bright'
  | 'Random'
  // | 'Neutral'
  | 'Monochromatic'
  | 'Analogous'
  | 'Complementary'
  | 'SplitComplementary'
  | 'Tetradic';

export const COLLECTION_STYLES = [
  'linearGradient',
  'linearSwatches',
  'angularGradient',
  'angularSwatches',
] as const;

export const DEFAULT_STYLE: (typeof COLLECTION_STYLES)[number] = 'linearGradient';
export const collectionStyleValidator = v.union(COLLECTION_STYLES.map((t) => v.literal(t)));
export const styleWithAutoValidator = v.union([v.literal('auto'), collectionStyleValidator]);

export const DEFAULT_STEPS = 7;
export const MIN_STEPS = 2;
export const MAX_STEPS = 50;
export const stepsValidator = v.pipe(v.number(), v.minValue(MIN_STEPS), v.maxValue(MAX_STEPS));
export const stepsWithAutoValidator = v.union([v.literal('auto'), stepsValidator]);

export const DEFAULT_ANGLE = 90.0;
export const MIN_ANGLE = 0;
export const MAX_ANGLE = 360;
export const angleValidator = v.pipe(v.number(), v.minValue(MIN_ANGLE), v.maxValue(MAX_ANGLE));
export const angleWithAutoValidator = v.union([v.literal('auto'), angleValidator]);

// Define display layout options
export const COLLECTION_LAYOUTS = ['row', 'grid'] as const;
export const DEFAULT_LAYOUT = 'grid' as const;
export const layoutValidator = v.union(COLLECTION_LAYOUTS.map((l) => v.literal(l)));

export const DEFAULT_ITEM_HEIGHT_ROW = 20;
export const DEFAULT_ITEM_HEIGHT_GRID = 35;
export const MIN_ITEM_HEIGHT = 6;
export const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;
// Create row height validator with the provided min/max constraints
export const rowHeightValidator = v.pipe(
  v.number(),
  v.minValue(MIN_ITEM_HEIGHT),
  v.maxValue(MAX_ITEM_HEIGHT),
  v.transform((input) => Number(input.toFixed(1))),
);

export const PI = Math.PI;
/**
 * Very important constant here.
 * I think 3 is a sweet spot where the seed generated isnt too long
 * and grainular enough to guarantee uniqueness
 */
export const COEFF_PRECISION = 3 as const;

/**
 * Cosine gradient formula: color(t) = a + b * cos(2π * (c*t + d))
 * All components maintain COEFF_PRECISION decimal places but can be any number
 */
export const componentSchema = v.pipe(
  v.number(),
  v.transform((input) => Number(input.toFixed(COEFF_PRECISION))),
);

export const vectorSchema = v.tuple([
  componentSchema, // R component
  componentSchema, // G component
  componentSchema, // B component
  v.literal(1), // A component
]);

export const coeffsSchema = v.tuple([
  vectorSchema, // a: offset vector (base color)
  vectorSchema, // b: amplitude vector (color range)
  vectorSchema, // c: frequency vector (color cycles)
  vectorSchema, // d: phase vector (color shift)
]);

// Global modifiers with value constraints
export const globalExposureSchema = v.pipe(
  v.number(),
  v.minValue(-1),
  v.maxValue(1),
  v.transform((input) => Number(input.toFixed(COEFF_PRECISION))),
);

export const globalContrastSchema = v.pipe(
  v.number(),
  v.minValue(0),
  v.maxValue(2),
  v.transform((input) => Number(input.toFixed(COEFF_PRECISION))),
);

export const globalFrequencySchema = v.pipe(
  v.number(),
  v.minValue(0),
  v.maxValue(2),
  v.transform((input) => Number(input.toFixed(COEFF_PRECISION))),
);

export const globalPhaseSchema = v.pipe(
  v.number(),
  // Add a small buffer to prevent validation errors at min/max positions
  v.minValue(-PI - Math.pow(10, -COEFF_PRECISION)),
  v.maxValue(PI + Math.pow(10, -COEFF_PRECISION)),
  v.transform((input) => Number(input.toFixed(COEFF_PRECISION))),
);

export const globalsSchema = v.tuple([
  globalExposureSchema, // exposure [-1, 1]
  globalContrastSchema, // contrast [0, 2]
  globalFrequencySchema, // frequency [0, 2]
  globalPhaseSchema, // phase [-π, π]
]);

// Default values for global modifiers [exposure, contrast, frequency, phase]
export const DEFAULT_GLOBALS = [0, 1, 1, 0] as v.InferOutput<typeof globalsSchema>;

/**
 * Cosine gradient collection validator
 * Validates the complete structure of a gradient collection
 */
export const collectionSchema = v.object({
  coeffs: coeffsSchema,
  globals: globalsSchema,
  steps: stepsValidator,
  style: collectionStyleValidator,
  angle: angleValidator,
});

export const validatePanelValue = (min: number, max: number) => (input: number) => {
  const result = v.safeParse(v.pipe(v.number(), v.minValue(min), v.maxValue(max)), input);

  if (!result.success && result.issues && result.issues.length > 0) {
    const rangeIssue = result.issues.find(
      (issue) => issue.type === 'min_value' || issue.type === 'max_value',
    );

    if (rangeIssue) {
      return rangeIssue.requirement;
    }
  }

  return input;
};

/**
 * Palette category definitions
 * These are the available categories for palette generation
 */
export const PALETTE_CATEGORIES: PaletteCategoryKey[] = [
  'Random',
  'Warm',
  'Cool',
  'Neon',
  'Dark',
  'Pastel',
  'Earthy',
  'Bright',
  // 'Neutral',
  'Monochromatic',
  'Analogous',
  'Complementary',
  'SplitComplementary',
  'Tetradic',
];

/**
 * Helper function to get display name for a category
 * With the simplified category names, this now just returns the category as-is
 */
export const getCategoryDisplayName = (category: PaletteCategoryKey): string => {
  return category;
};

/**
 * Valibot schema for category validation
 */
export const categoryValidator = v.union(PALETTE_CATEGORIES.map((category) => v.literal(category)));

export const categoriesValidator = v.optional(v.array(categoryValidator), ['Random']);
