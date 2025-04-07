import { createFileRoute, stripSearchParams, useParams, useSearch } from '@tanstack/react-router';
import type { AppCollection } from '~/types';
import { useRef } from 'react';
import { COMMON_SEARCH_DEFAULTS, searchValidatorSchema } from '~/validators';
import { deserializeCoeffs } from '~/lib/serialization';
import { redirect } from '@tanstack/react-router';
import { defaultSteps } from '~/components/StepsInput';
import { defaultStyle } from '~/components/StyleSelect';
import { defaultAngle } from '~/components/AngleInput';
import { CollectionsDisplay } from '~/components/CollectionsDisplay';

export const Route = createFileRoute('/_layout/$seed')({
  component: Home,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(COMMON_SEARCH_DEFAULTS)],
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

  // // We know this will succeed because we validated it in beforeLoad
  const { coeffs, globals } = deserializeCoeffs(encodedSeedData);
  const collections = [
    {
      coeffs,
      globals,
      style: style === 'auto' ? initialSearchDataRef.current.style : style,
      steps: steps === 'auto' ? initialSearchDataRef.current.steps : steps,
      angle: angle === 'auto' ? initialSearchDataRef.current.angle : angle,
      _id: 'param',
      seed: encodedSeedData,
    },
  ] as AppCollection[];

  return <CollectionsDisplay collections={collections} isDataRoute />;
}
