// app/stores/ui.ts
import * as v from 'valibot';
import { observable } from '@legendapp/state';
import { collectionStyleValidator, stepsValidator, angleValidator } from '~/validators';
import type { GlobalModifierType } from '~/types';
import type { NavigationItemPath } from '~/components/header/NavigationSelect';

export interface UITempStore {
  previewStyle: v.InferOutput<typeof collectionStyleValidator> | null;
  previewSteps: v.InferOutput<typeof stepsValidator> | null;
  previewAngle: v.InferOutput<typeof angleValidator> | null;
  previewSeed: string | null;
  previewColorIndex: number | null;
  activeModifier: GlobalModifierType;
  isGeneratingPalettes: boolean;
  preferredOptions: {
    style: v.InferOutput<typeof collectionStyleValidator> | 'auto';
    steps: v.InferOutput<typeof stepsValidator> | 'auto';
    angle: v.InferOutput<typeof angleValidator> | 'auto';
  };
  isDragging: boolean;
  activeCollectionId: string | null;
  navSelect: NavigationItemPath;
}

export const INITIAL_UI_TEMP_STATE: UITempStore = {
  previewStyle: null,
  previewSteps: null,
  previewAngle: null,
  previewSeed: null,
  previewColorIndex: null,
  activeModifier: null,
  isGeneratingPalettes: false,
  preferredOptions: {
    style: 'auto',
    steps: 'auto',
    angle: 'auto',
  },
  isDragging: false,
  activeCollectionId: null,
  navSelect: '/',
};

export const uiTempStore$ = observable<UITempStore>(INITIAL_UI_TEMP_STATE);
