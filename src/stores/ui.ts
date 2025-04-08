import * as v from 'valibot';
import { observable } from '@legendapp/state';
import { collectionStyleValidator, stepsValidator, angleValidator } from '~/validators';

export interface UITempStore {
  previewStyle: v.InferOutput<typeof collectionStyleValidator> | null;
  previewSteps: v.InferOutput<typeof stepsValidator> | null;
  previewAngle: v.InferOutput<typeof angleValidator> | null;
}

export const INITIAL_UI_TEMP_STATE: UITempStore = {
  previewStyle: null,
  previewSteps: null,
  previewAngle: null,
};

export const uiTempStore$ = observable<UITempStore>(INITIAL_UI_TEMP_STATE);
