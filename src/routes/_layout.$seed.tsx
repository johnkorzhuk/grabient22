import {
  createFileRoute,
  retainSearchParams,
  stripSearchParams,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import type { AppCollection } from '~/types';
import { useRef } from 'react';
import { COMMON_SEARCH_DEFAULTS, searchValidatorSchema } from '~/validators';
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

export const Route = createFileRoute('/_layout/$seed')({
  component: Home,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(COMMON_SEARCH_DEFAULTS), retainSearchParams(['rowHeight'])],
  },
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
  const { style, steps, angle } = useSearch({ from: '/_layout/$seed' });

  const { seed: encodedSeedData } = useParams({
    from: '/_layout/$seed',
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
    _id: 'seed',
    seed: encodedSeedData,
  };

  // Generate variations for each modifier separately
  const collections = [
    ...generateExposureVariations(baseCollection, { stepSize: 0.5, steps: 6 }),
    ...generateContrastVariations(baseCollection, { stepSize: 0.15, steps: 6 }),
    ...generateFrequencyVariations(baseCollection, { stepSize: 0.15, steps: 6 }),
    ...generatePhaseVariations(baseCollection, { stepSize: 0.05, steps: 6 }),
  ];

  return <CollectionsDisplay collections={collections} isDataRoute />;
}
