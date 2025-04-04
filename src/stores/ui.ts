import * as v from 'valibot';
import { observable } from '@legendapp/state';

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

export interface UIStore {
  previewStyle: v.InferOutput<typeof collectionStyleValidator> | null;
  previewSteps: v.InferOutput<typeof stepsValidator> | null;
  previewAngle: v.InferOutput<typeof angleValidator> | null;
}

export const INITIAL_UI_STATE: UIStore = {
  previewStyle: null,
  previewSteps: null,
  previewAngle: null,
};

export const uiStore$ = observable<UIStore>(INITIAL_UI_STATE);
