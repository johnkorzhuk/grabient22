import * as v from 'valibot';

export const COLLECTION_STYLES = [
  'linearGradient',
  'linearSwatches',
  'angularGradient',
  'angularSwatches',
] as const;

export const collectionStyleValidator = v.union(COLLECTION_STYLES.map((t) => v.literal(t)));

export const MIN_NUM_STEPS = 2;
export const MAX_NUM_STEPS = 50;
export const stepsValidator = v.pipe(
  v.number(),
  v.minValue(MIN_NUM_STEPS),
  v.maxValue(MAX_NUM_STEPS),
);

export const MIN_ANGLE = 0;
export const MAX_ANGLE = 360;
export const angleValidator = v.pipe(v.number(), v.minValue(MIN_ANGLE), v.maxValue(MAX_ANGLE));
