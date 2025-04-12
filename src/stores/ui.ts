import * as v from 'valibot';
import { observable } from '@legendapp/state';
import {
  collectionStyleValidator,
  stepsValidator,
  angleValidator,
  coeffsSchema,
} from '~/validators';

export type GlobalModifierType = 'exposure' | 'contrast' | 'frequency' | 'phase' | null;

export interface UITempStore {
  previewStyle: v.InferOutput<typeof collectionStyleValidator> | null;
  previewSteps: v.InferOutput<typeof stepsValidator> | null;
  previewAngle: v.InferOutput<typeof angleValidator> | null;
  previewCollection: v.InferOutput<typeof coeffsSchema> | null;
  previewColorIndex: number | null;
  activeModifier: GlobalModifierType;
}

export const INITIAL_UI_TEMP_STATE: UITempStore = {
  previewStyle: null,
  previewSteps: null,
  previewAngle: null,
  previewCollection: null,
  previewColorIndex: null,
  activeModifier: null,
};

export const uiTempStore$ = observable<UITempStore>(INITIAL_UI_TEMP_STATE);
