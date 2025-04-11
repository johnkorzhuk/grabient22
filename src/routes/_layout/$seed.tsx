import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import type { AppCollection, CosineCoeffs } from '~/types';
import { useRef } from 'react';
import { deserializeCoeffs } from '~/lib/serialization';
import { redirect } from '@tanstack/react-router';

import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import {
  generateExposureVariations,
  generateContrastVariations,
  generateFrequencyVariations,
  generatePhaseVariations,
  applyGlobals,
} from '~/lib/cosineGradient';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { GradientChannelsChart } from '~/components/GradientChannelsChart';
import * as v from 'valibot';
import { coeffsSchema, DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import { GradientPreview } from '~/components/GradientPreview';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';

export const Route = createFileRoute('/_layout/$seed')({
  component: Home,
  beforeLoad: ({ params, search }) => {
    try {
      // Try to deserialize the data - if it fails, redirect to home
      const collection = deserializeCoeffs(params.seed);
      const coeffs = applyGlobals(collection.coeffs, collection.globals);
      uiTempStore$.previewCollection.set(coeffs);
    } catch (error) {
      throw redirect({ to: '/', search });
    }
  },
});

function Home() {
  const { style, steps, angle } = useSearch({ from: '/_layout' });

  const { seed: encodedSeedData } = useParams({
    from: '/_layout/$seed',
  });

  // TODO: we should do something similar in StepsInput, AngleInput instead of hard coded defaults
  // so the value rendered in the input is the actual default value when select === 'auto'
  const initialSearchDataRef = useRef({
    style: style === 'auto' ? DEFAULT_STYLE : style,
    steps: steps === 'auto' ? DEFAULT_STEPS : steps,
    angle: angle === 'auto' ? DEFAULT_ANGLE : angle,
  });

  // We know this will succeed because we validated it in beforeLoad
  const { coeffs, globals } = deserializeCoeffs(encodedSeedData);

  const seedCollection: AppCollection = {
    coeffs,
    globals,
    style: style === 'auto' ? initialSearchDataRef.current.style : style,
    steps: steps === 'auto' ? initialSearchDataRef.current.steps : steps,
    angle: angle === 'auto' ? initialSearchDataRef.current.angle : angle,
    _id: 'seed-_tN8YaBv4LmFsqR2',
    seed: encodedSeedData,
  };

  // Generate variations
  const collections = [
    ...generateExposureVariations(seedCollection, { stepSize: 0.5, steps: 5 }).reverse(),
    ...generateContrastVariations(seedCollection, { stepSize: 0.15, steps: 5 }).reverse(),
    ...generateFrequencyVariations(seedCollection, { stepSize: 0.15, steps: 5 }).reverse(),
    ...generatePhaseVariations(seedCollection, { stepSize: 0.02, steps: 5 }).reverse(),
  ];

  // redundant validation. w/e fixes a ts error
  const processedCoeffs = v.parse(
    coeffsSchema,
    applyGlobals(seedCollection.coeffs, seedCollection.globals),
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel minSize={40} maxSize={60}>
        <CollectionsDisplay collections={collections} isSeedRoute />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <SeedChartAndPreviewPanel
          seedCollection={seedCollection}
          processedCoeffs={processedCoeffs}
          steps={steps} // Pass the URL search param
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

const SeedChartAndPreviewPanel = observer(function SeedChartAndPreviewPanel({
  seedCollection,
  processedCoeffs,
  steps,
}: {
  seedCollection: AppCollection;
  processedCoeffs: CosineCoeffs;
  steps: number | 'auto';
}) {
  // Get preview steps from store
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewCoeffs = use$(uiTempStore$.previewCollection);
  const previewColorIndex = use$(uiTempStore$.previewColorIndex);

  // Determine steps to use (preview -> URL -> initial)
  const stepsToUse =
    previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : seedCollection.steps;

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={60}>
        <div className="relative w-full h-full">
          <GradientChannelsChart
            processedCoeffs={processedCoeffs}
            steps={stepsToUse === 'auto' ? DEFAULT_STEPS : stepsToUse}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={15} maxSize={60}>
        <GradientPreview
          initialStyle={seedCollection.style}
          initialSteps={seedCollection.steps}
          initialAngle={seedCollection.angle}
          processedCoeffs={previewCoeffs || processedCoeffs}
          activeIndex={previewColorIndex}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
});
