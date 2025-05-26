import {
  createFileRoute,
  Outlet,
  redirect,
  stripSearchParams,
  useSearch,
  Link,
  useNavigate,
} from '@tanstack/react-router';
import * as v from 'valibot';
import {
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
  DEFAULT_STEPS,
  DEFAULT_STYLE,
  DEFAULT_ANGLE,
} from '~/validators';

import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import { useEffect, useRef } from 'react';
import { AppHeader } from '~/components/header/AppHeader';
import { FooterSection } from '~/components/FooterSection';
import { deserializeCoeffs } from '~/lib/serialization';
import { SubHeader } from '~/components/header/PrimarySubHeader';
import { SEARCH_DEFAULTS } from '../_layout';
import { ViewOptions } from '~/components/header/ViewOptions';
import { StyleSelect } from '~/components/header/StyleSelect';
import { StepsInput } from '~/components/header/StepsInput';
import { AngleInput } from '~/components/header/AngleInput';
import { PrimaryDivider } from '~/components/Divider';
import type { Id } from '../../../convex/_generated/dataModel';
import type { AppCollection } from '~/types';
import { applyGlobals } from '~/lib/cosineGradient';
import { ArrowLeft } from 'lucide-react';
import { Button } from '~/components/ui/button';
import type { NavigationItemPath } from '~/components/header/NavigationSelect';
import { cn } from '~/lib/utils';
import { ActionButton } from '~/components/header/ActionButton';

export const searchValidatorSchema = v.object({
  style: v.optional(
    v.fallback(styleWithAutoValidator, SEARCH_DEFAULTS.style),
    SEARCH_DEFAULTS.style,
  ),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, SEARCH_DEFAULTS.steps),
    SEARCH_DEFAULTS.steps,
  ),
  angle: v.optional(
    v.fallback(angleWithAutoValidator, SEARCH_DEFAULTS.angle),
    SEARCH_DEFAULTS.angle,
  ),
});

export const Route = createFileRoute('/$seed')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },

  beforeLoad: async ({ params, search, context }) => {
    const { seed } = params;
    // let userLikedSeed = false;
    // try {
    //   const { userId } = await fetchClerkAuth();

    //   userLikedSeed = await context.queryClient.fetchQuery({
    //     ...convexQuery(api.likes.checkUserLikedSeed, {
    //       userId: userId!,
    //       seed,
    //     }),
    //     gcTime: 2000,
    //   });
    // } catch (error) {
    //   console.error('Error fetching liked seed:', error);
    // }

    try {
      // Try to deserialize the data - if it fails, redirect to home
      const { coeffs, globals } = deserializeCoeffs(seed);
      const processedCoeffs = applyGlobals(coeffs, globals);

      // Create initial search data reference
      const initialOptions = {
        style: search.style === 'auto' ? DEFAULT_STYLE : search.style,
        steps: search.steps === 'auto' ? DEFAULT_STEPS : search.steps,
        angle: search.angle === 'auto' ? DEFAULT_ANGLE : search.angle,
      };

      // Create the seed collection object
      const collection: AppCollection = {
        coeffs,
        globals,
        style: initialOptions.style,
        steps: initialOptions.steps,
        angle: initialOptions.angle,
        _id: seed as Id<'collections'>,
        seed,
        likes: 0,
        _creationTime: Date.now(),
      };

      // Set the preview seed in the store
      uiTempStore$.previewSeed.set(seed);

      // Return the processed data to be merged into the route context
      return {
        seedData: {
          coeffs,
          globals,
          processedCoeffs,
          collection,
          seed,
        },
      };
    } catch (error) {
      throw redirect({ to: '/', search });
    }
  },
  onLeave: () => {
    uiTempStore$.previewSeed.set(null);
    uiTempStore$.activeCollectionId.set(null);
  },
});

function RouteComponent() {
  return <Layout />;
}

const Layout = observer(function Layout() {
  const { style, steps, angle } = Route.useSearch();
  const { seed } = Route.useParams();
  const navigate = useNavigate({ from: '/$seed' });
  const isDragging = use$(uiTempStore$.isDragging);
  const navSelect = use$(uiTempStore$.navSelect);
  const activeCollectionId = use$(uiTempStore$.activeCollectionId);
  const itemActive = activeCollectionId === seed;
  const preferredOptions = use$(uiTempStore$.preferredOptions);
  const initialSearchDataRef = useRef({
    style: style === 'auto' ? DEFAULT_STYLE : style,
    steps: steps === 'auto' ? DEFAULT_STEPS : steps,
    angle: angle === 'auto' ? DEFAULT_ANGLE : angle,
  });

  const clearSearchParams = () => {
    uiTempStore$.preferredOptions.set({
      style: 'auto',
      steps: 'auto',
      angle: 'auto',
    });
    navigate({
      search: (prev) => ({
        ...prev,
        ...initialSearchDataRef.current,
      }),
      replace: true,
    });
  };

  const renderResetButton =
    style !== initialSearchDataRef.current.style ||
    steps !== initialSearchDataRef.current.steps ||
    angle !== initialSearchDataRef.current.angle;

  return (
    <div
      className={`min-h-screen scrollbar-stable ${isDragging ? 'overflow-hidden' : 'overflow-auto'}`}
    >
      <AppHeader className="sticky top-0 z-40 bg-background" />

      <PrimaryDivider className="absolute top-19 lg:top-22 z-50" />

      <main className="h-[calc(100vh-theme(spacing.16)-8px)] lg:h-[calc(100vh-theme(spacing.24)+8px)] min-h-[600px] relative flex flex-col">
        {/* Link Button that uses the navSelect state and lucid icon navSelect */}
        <Link
          to={navSelect}
          search={(search) => {
            return {
              ...search,
              ...preferredOptions,
            };
          }}
          className="absolute top-4 lg:top-8 left-5 lg:left-14 z-10"
        >
          <Button
            variant="outline"
            size="sm"
            aria-label="Go back"
            className={cn(
              'justify-between',
              'font-bold text-sm h-8.5 lg:h-10 px-3',
              'border-input bg-background/80  hover:bg-background/90 backdrop-blur-sm disable-animation-on-theme-change text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer',
            )}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </Link>

        <div className="flex items-center gap-3 absolute top-4 lg:top-8 right-5 lg:right-14 z-10">
          <div className="mr-2 relative">
            {renderResetButton && <ActionButton onClick={clearSearchParams}>reset</ActionButton>}
          </div>

          <StyleSelect
            value={style}
            className="w-[175px] lg:w-[190px] h-8.5 lg:h-10 bg-background/80 backdrop-blur-sm disable-animation-on-theme-change"
          />
          <StepsInput
            value={steps}
            className="w-[90px] lg:w-[110px] h-8.5 lg:h-10 bg-background/80 backdrop-blur-sm disable-animation-on-theme-change"
          />
          <AngleInput
            value={angle}
            className="w-[90px] lg:w-[110px] h-8.5 lg:h-10 bg-background/80 backdrop-blur-sm disable-animation-on-theme-change"
          />
        </div>
        <Outlet />
      </main>
      <FooterSection />
    </div>
  );
});
