// app/workers/palette-generator.worker.ts
import { generatePalettes } from '../lib/generation';
import type { PaletteGenerationOptions, PaletteGenerationResult } from '../lib/generation/types';
import { expose } from 'comlink';
import type { PaletteCategoryKey } from '../validators';

export interface WorkerApi {
  generatePalettes: (
    count: number,
    mainCategory: PaletteCategoryKey,
    options: PaletteGenerationOptions,
  ) => PaletteGenerationResult[];
}

const workerApi: WorkerApi = {
  generatePalettes(
    count: number,
    mainCategory: PaletteCategoryKey,
    options: PaletteGenerationOptions,
  ) {
    return generatePalettes(count, mainCategory, options);
  },
};

expose(workerApi);
