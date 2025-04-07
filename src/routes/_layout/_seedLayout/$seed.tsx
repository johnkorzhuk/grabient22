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
} from '~/lib/cosineGradient';

export const Route = createFileRoute('/_layout/_seedLayout/$seed')({
  component: Home,
  beforeLoad: ({ params }) => {
    try {
      // Try to deserialize the data - if it fails, redirect to home
      deserializeCoeffs(params.seed);
    } catch (error) {
      throw redirect({ to: '/' });
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

  // Create base collection
  const baseCollection: AppCollection = {
    coeffs,
    globals,
    style: style === 'auto' ? initialSearchDataRef.current.style : style,
    steps: steps === 'auto' ? initialSearchDataRef.current.steps : steps,
    angle: angle === 'auto' ? initialSearchDataRef.current.angle : angle,
    _id: 'seed-_tN8YaBv4LmFsqR2',
    seed: encodedSeedData,
  };

  // Generate variations for each modifier separately
  const collections = [
    ...generateExposureVariations(baseCollection, { stepSize: 0.5, steps: 6 }),
    ...generateContrastVariations(baseCollection, { stepSize: 0.15, steps: 6 }),
    ...generateFrequencyVariations(baseCollection, { stepSize: 0.15, steps: 6 }),
    ...generatePhaseVariations(baseCollection, { stepSize: 0.05, steps: 6 }),
  ];

  return <CollectionsDisplay collections={collections} isSeedRoute />;
}
