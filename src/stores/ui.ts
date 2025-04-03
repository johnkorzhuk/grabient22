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

export interface UIStore {
  previewStyle: v.InferOutput<typeof collectionStyleValidator> | null;
  previewSteps: v.InferOutput<typeof stepsValidator> | null;
}

export const INITIAL_UI_STATE: UIStore = {
  previewStyle: null,
  previewSteps: null,
};

export const uiStore$ = observable<UIStore>(INITIAL_UI_STATE);
