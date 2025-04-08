import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import type { AppCollection, CollectionStyle, CosineCoeffs } from '~/types';
import { useRef } from 'react';
import { deserializeCoeffs } from '~/lib/serialization';
import { redirect } from '@tanstack/react-router';
import { defaultSteps } from '~/components/StepsInput';
import { defaultStyle } from '~/components/StyleSelect';
import { defaultAngle } from '~/components/AngleInput';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import {
  generateExposureVariations,
  generateContrastVariations,
  generateFrequencyVariations,
  generatePhaseVariations,
  applyGlobals,
  cosineGradient,
} from '~/lib/cosineGradient';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { GradientChannelsChart } from '~/components/GradientChannelsChart';
import * as v from 'valibot';
import { coeffsSchema } from '~/validators';
import { GradientPreview } from '~/components/GradientPreview';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';

export const Route = createFileRoute('/_layout/_seedLayout/$seed')({
  component: Home,
  beforeLoad: ({ params, search }) => {
    try {
      // Try to deserialize the data - if it fails, redirect to home
      deserializeCoeffs(params.seed);
    } catch (error) {
      throw redirect({ to: '/', search });
    }
  },
});

function Home() {
  const { style, steps, angle } = useSearch({ from: '/_layout/_seedLayout' });

  const { seed: encodedSeedData } = useParams({
    from: '/_layout/_seedLayout/$seed',
  });

  // TODO: we should do something similar in StepsInput, AngleInput instead of hard coded defaults
  // so the value rendered in the input is the actual default value when select === 'auto'
  const initialSearchDataRef = useRef({
    style: style === 'auto' ? defaultStyle : style,
    steps: steps === 'auto' ? defaultSteps : steps,
    angle: angle === 'auto' ? defaultAngle : angle,
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
  const allVariations = [
    ...generateExposureVariations(seedCollection, { stepSize: 0.5, steps: 5 }).reverse(),
    ...generateContrastVariations(seedCollection, { stepSize: 0.15, steps: 5 }).reverse(),
    ...generateFrequencyVariations(seedCollection, { stepSize: 0.15, steps: 5 }).reverse(),
    ...generatePhaseVariations(seedCollection, { stepSize: 0.02, steps: 5 }).reverse(),
  ];
  
  const collections = allVariations;

  // redundant validation. w/e fixes a ts error
  const processedCoeffs = v.parse(
    coeffsSchema,
    applyGlobals(seedCollection.coeffs, seedCollection.globals),
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel minSize={25} maxSize={60}>
        <CollectionsDisplay collections={collections} isSeedRoute />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <SeedChartAndPreviewPanel
        seedCollection={seedCollection}
        processedCoeffs={processedCoeffs}
        stepsSearchParam={steps} // Pass the URL search param
      />
    </ResizablePanelGroup>
  );
}

const SeedChartAndPreviewPanel = observer(function SeedChartAndPreviewPanel({
  seedCollection,
  processedCoeffs,
  stepsSearchParam,
}: {
  seedCollection: AppCollection;
  processedCoeffs: CosineCoeffs;
  stepsSearchParam: number | 'auto';
}) {
  // Get preview steps from store
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewCoeffs = use$(uiTempStore$.previewCollection);

  // Determine steps to use (preview -> URL -> initial)
  const stepsToUse =
    previewSteps !== null || stepsSearchParam !== 'auto'
      ? (previewSteps ?? stepsSearchParam)
      : seedCollection.steps;
  const numStops = stepsToUse === 'auto' ? seedCollection.steps : stepsToUse;

  // Generate gradient colors using the correct number of stops
  const gradientColors = cosineGradient(numStops, processedCoeffs);

  return (
    <ResizablePanel>
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={66.7} minSize={50} maxSize={85}>
          <div className="relative w-full h-full">
            {/* Base chart with regular data */}
            <div className="absolute inset-0 z-10">
              <GradientChannelsChart gradientColors={gradientColors} />
            </div>

            {/* Preview chart with reduced opacity - only render if previewCoeffs exists */}
            {previewCoeffs && (
              <div className="absolute inset-0 z-20 opacity-40">
                <GradientChannelsChart gradientColors={cosineGradient(numStops, previewCoeffs)} />
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={33.3} minSize={15}>
          {/* SeedGradientPreview already handles its own state observation */}
          <SeedGradientPreview
            initialStyle={seedCollection.style}
            initialSteps={seedCollection.steps}
            initialAngle={seedCollection.angle}
            processedCoeffs={processedCoeffs}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizablePanel>
  );
});

const SeedGradientPreview = observer(function SeedGradientPreview({
  initialStyle,
  initialSteps,
  initialAngle,
  processedCoeffs,
}: {
  initialStyle: CollectionStyle;
  initialSteps: number;
  initialAngle: number;
  processedCoeffs: CosineCoeffs;
}) {
  const previewCoeffs = use$(uiTempStore$.previewCollection);

  return (
    <GradientPreview
      initialStyle={initialStyle}
      initialSteps={initialSteps}
      initialAngle={initialAngle}
      processedCoeffs={previewCoeffs || processedCoeffs}
      routePrefix="/_layout/_seedLayout"
    />
  );
});
