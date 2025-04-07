import * as v from 'valibot';
import { observable } from '@legendapp/state';
import { collectionStyleValidator, stepsValidator, angleValidator } from '~/validators';

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
