import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import type { AppCollection } from '~/types';
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
  getCollectionStyleCSS,
} from '~/lib/cosineGradient';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { GradientChannelsChart } from '~/components/GradientChannelsChart';
import * as v from 'valibot';
import { coeffsSchema } from '~/validators';

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
  const gradientColors = cosineGradient(seedCollection.steps, processedCoeffs);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel minSize={25} maxSize={60}>
        <CollectionsDisplay collections={collections} isSeedRoute />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={66.7} minSize={50} maxSize={85}>
            <div className="flex h-full flex-col">
              <GradientChannelsChart
                gradientColors={gradientColors}
                processedCoeffs={processedCoeffs}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={33.3} minSize={15} maxSize={50}>
            <div
              className="relative h-full"
              style={{
                ...getCollectionStyleCSS(
                  style === 'auto' ? defaultStyle : style,
                  gradientColors,
                  angle === 'auto' ? defaultAngle : angle,
                ),
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
