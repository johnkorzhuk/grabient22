import * as v from 'valibot';

export const COLLECTION_STYLES = [
  'linearGradient',
  'linearSwatches',
  'angularGradient',
  'angularSwatches',
] as const;

export const collectionStyleValidator = v.union(COLLECTION_STYLES.map((t) => v.literal(t)));
export const styleWithAutoValidator = v.union([v.literal('auto'), collectionStyleValidator]);

export const MIN_STEPS = 2;
export const MAX_STEPS = 50;
export const stepsValidator = v.pipe(v.number(), v.minValue(MIN_STEPS), v.maxValue(MAX_STEPS));
export const stepsWithAutoValidator = v.union([v.literal('auto'), stepsValidator]);

export const MIN_ANGLE = 0;
export const MAX_ANGLE = 360;
export const angleValidator = v.pipe(v.number(), v.minValue(MIN_ANGLE), v.maxValue(MAX_ANGLE));
export const angleWithAutoValidator = v.union([v.literal('auto'), angleValidator]);

export const MIN_ITEM_HEIGHT = 10;
export const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;
export const rowHeightValidator = v.pipe(
  v.number(),
  v.minValue(MIN_ITEM_HEIGHT),
  v.maxValue(MAX_ITEM_HEIGHT),
);

export const PI = Math.PI;
export const COEFF_PRECISION = 4;

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
  v.minValue(-PI),
  v.maxValue(PI),
  v.transform((input) => Number(input.toFixed(COEFF_PRECISION))),
);

export const globalsSchema = v.tuple([
  globalExposureSchema, // exposure [-1, 1]
  globalContrastSchema, // contrast [0, 2]
  globalFrequencySchema, // frequency [0, 2]
  globalPhaseSchema, // phase [-π, π]
]);

export const SEARCH_DEFAULTS = {
  rowHeight: 25,
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
};

export const rowHeightSearchValidatorSchema = v.optional(
  v.fallback(rowHeightValidator, SEARCH_DEFAULTS.rowHeight),
  SEARCH_DEFAULTS.rowHeight,
);

export const searchValidatorSchema = v.object({
  rowHeight: rowHeightSearchValidatorSchema,
  style: v.optional(
    v.fallback(styleWithAutoValidator, SEARCH_DEFAULTS.style),
    SEARCH_DEFAULTS.style,
  ),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, SEARCH_DEFAULTS.steps),
    SEARCH_DEFAULTS.steps,
  ),
  angle: v.optional(
    v.fallback(angleWithAutoValidator, SEARCH_DEFAULTS.angle),
    SEARCH_DEFAULTS.angle,
  ),
});

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
