import * as v from 'valibot';
import { observable } from '@legendapp/state';

export const COLLECTION_TYPES = [
  'linearGradient',
  'linearSwatches',
  'angularGradient',
  'angularSwatches',
] as const;

export const collectionTypeValidator = v.union(COLLECTION_TYPES.map((t) => v.literal(t)));

export type CollectionType = v.InferOutput<typeof collectionTypeValidator>;

export interface UIStore {
  previewType: v.InferOutput<typeof collectionTypeValidator> | null;
}

const INITIAL_UI_STATE: UIStore = {
  previewType: null,
};

export const uiStore$ = observable<UIStore>(INITIAL_UI_STATE);
