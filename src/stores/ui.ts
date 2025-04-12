import * as v from 'valibot';
import { observable } from '@legendapp/state';
import { collectionStyleValidator, stepsValidator, angleValidator } from '~/validators';

export type GlobalModifierType = 'exposure' | 'contrast' | 'frequency' | 'phase' | null;

export interface UITempStore {
  previewStyle: v.InferOutput<typeof collectionStyleValidator> | null;
  previewSteps: v.InferOutput<typeof stepsValidator> | null;
  previewAngle: v.InferOutput<typeof angleValidator> | null;
  // using the seed here isntead of the coeffs / globals might be a mistake
  // we have to serialize/deserialize reading from this state
  previewSeed: string | null;
  previewColorIndex: number | null;
  activeModifier: GlobalModifierType;
}

export const INITIAL_UI_TEMP_STATE: UITempStore = {
  previewStyle: null,
  previewSteps: null,
  previewAngle: null,
  previewSeed: null,
  previewColorIndex: null,
  activeModifier: null,
};

export const uiTempStore$ = observable<UITempStore>(INITIAL_UI_TEMP_STATE);
