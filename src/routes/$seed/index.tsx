import {
  createFileRoute,
  useParams,
  useRouteContext,
  useLocation,
  useNavigate,
  stripSearchParams,
} from '@tanstack/react-router';
import { cn } from '~/lib/utils';
import { CollectionSeedDisplay } from '~/components/CollectionSeedDisplay';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import type { AppCollection, CosineCoeffs } from '~/types';
import { deserializeCoeffs, serializeCoeffs } from '~/lib/serialization';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { api } from '../../../convex/_generated/api';
import { applyGlobals } from '~/lib/cosineGradient';
import { GradientChannelsChart } from '~/components/GradientChannelsChart';
import * as v from 'valibot';
import {
  DEFAULT_ANGLE,
  DEFAULT_MODIFIER,
  DEFAULT_STEPS,
  DEFAULT_STYLE,
  MODIFIERS,
  modifierValidator,
} from '~/validators';
import { ModifierSelect, type SelectModifier } from '~/components/ModifierSelect';
import { ModifierSlider } from '~/components/ModifierSlider';
import { rgbChannelConfig } from '~/constants/colors';
import React from 'react';
import { seo } from '~/utils/seo';

export const SEARCH_DEFAULTS = {
  mod: DEFAULT_MODIFIER,
};

export const searchValidatorSchema = v.object({
  mod: v.optional(v.fallback(modifierValidator, SEARCH_DEFAULTS.mod), SEARCH_DEFAULTS.mod),
});

export const Route = createFileRoute('/$seed/')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
  head: ({ params, match }) => {
    const { seed } = params;
    const { style, steps, angle } = match.search;
    const styleToUse = style === 'auto' ? DEFAULT_STYLE : style;
    const stepsToUse = steps === 'auto' ? DEFAULT_STEPS : steps;
    const angleToUse = angle === 'auto' ? DEFAULT_ANGLE : angle;

    // Construct the OG image URL using the Convex HTTP action
    const ogImageUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/og?seed=${seed}&style=${styleToUse}&steps=${stepsToUse}&angle=${angleToUse}`;

    return {
      meta: [
        ...seo({
          title: `Grabient`,
          description: `Check out this Grabient!`,
          image: ogImageUrl,
        }),
      ],
    };
  },
});

function RouteComponent() {
  return <PageContent />;
}

const PageContent = observer(function PageContent() {
  const { seed: encodedSeedData } = useParams({
    from: '/$seed/',
  });
  const { seedData } = useRouteContext({
    from: '/$seed',
  });
  const { href } = useLocation();
  const navigate = Route.useNavigate();
  // Get the search params from the parent route
  const { style, steps, angle } = Route.useSearch();
  const { userId } = useAuth();

  // Get preview values from store
  const previewStyle = use$(uiTempStore$.previewStyle);
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewAngle = use$(uiTempStore$.previewAngle);
  const previewSeed = use$(uiTempStore$.previewSeed);
  const activeCollectionId = use$(uiTempStore$.activeCollectionId);
  const itemActive = activeCollectionId === encodedSeedData;

  const stepsToUse =
    previewSteps !== null ? previewSteps : steps === 'auto' ? seedData.collection.steps : steps;

  // Calculate the final values to use
  const styleToUse =
    previewStyle !== null ? previewStyle : style === 'auto' ? seedData.collection.style : style;
  const angleToUse =
    previewAngle !== null || angle !== 'auto'
      ? (previewAngle ??
        (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : seedData.collection.angle))
      : seedData.collection.angle;
  const previewData = previewSeed ? deserializeCoeffs(previewSeed) : null;

  const previewCollection: AppCollection = {
    ...seedData.collection,
    seed: previewSeed || encodedSeedData,
    coeffs: previewData?.coeffs || seedData.collection.coeffs,
    globals: previewData?.globals || seedData.collection.globals,
  };

  // Apply globals to get processed coefficients for the chart
  const processedCoeffs = applyGlobals(previewCollection.coeffs, previewCollection.globals);

  const { data: userLikedSeed, isPending: isLikedPending } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeed, {
      userId: userId!,
      seed: encodedSeedData,
    }),
    // this doesnt work for whatever reason
    enabled: Boolean(userId),
  });

  const onChannelOrderChange = (newCoeffs: AppCollection['coeffs'], collection: AppCollection) => {
    const newSeed = serializeCoeffs(newCoeffs, collection.globals);
    navigate({
      params: { seed: newSeed },
      search: (search) => search,
    });
    uiTempStore$.activeCollectionId.set(newSeed);
  };

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      <div className="pt-14 lg:pt-20 pb-6 h-full w-full px-5 lg:px-14">
        {/* Responsive container layout */}
        <div className="h-full w-full flex flex-col lg:flex-row">
          {/* Top container (left on lg+) */}
          <div
            className={cn(
              'group relative lg:pr-5 pt-5',
              'h-[calc(100%-280px)] lg:h-full w-full lg:flex-1',
              'font-poppins',
            )}
            onClick={() => {
              if (itemActive) uiTempStore$.activeCollectionId.set(null);
              else uiTempStore$.activeCollectionId.set(encodedSeedData);
            }}
            onMouseLeave={() => {
              // Clear preview seed if set
              if (!previewSeed) return;
              uiTempStore$.previewSeed.set(null);
            }}
            tabIndex={0}
            role="button"
            aria-pressed={itemActive}
            aria-label={`${itemActive ? 'Deselect' : 'Select'} gradient for actions`}
          >
            <CollectionSeedDisplay
              className="h-[calc(100%-56px)] lg:h-[calc(100%-42px)] max-h-[500px]"
              collection={previewCollection}
              index={0}
              style={styleToUse}
              steps={stepsToUse}
              angle={angleToUse}
              href={href}
              onChannelOrderChange={onChannelOrderChange}
              renderChannelTabs
              itemActive={itemActive}
              likedSeeds={userLikedSeed ? { [encodedSeedData]: true } : {}}
              likesPending={isLikedPending}
            />
          </div>

          {/* Bottom container (right on lg+) */}
          <div className="h-[280px] lg:h-full lg:w-[454px] w-full">
            {/* Bottom/Right container with nested split for md-sm */}
            <div className="h-full w-full flex flex-col">
              {/* Main content area */}
              <div className="flex-1 w-full flex flex-row">
                {/* Left panel for sm-md - contains graph */}
                <GradientChannelsChart
                  className="h-full flex-1 hidden sm:block lg:hidden"
                  processedCoeffs={processedCoeffs}
                  steps={stepsToUse}
                  showLabels={true}
                  showGrid={true}
                />

                {/* Right panel content - visible only on xs-md screens */}
                <div className="h-full w-full md:w-[420px] flex-1 lg:hidden">
                  {/* Content for the right panel */}
                  <div className="pt-1 sm:pl-5 h-full w-full">
                    <ModifierSelectWrapper />
                  </div>
                </div>

                {/* Graph for lg+ screens */}
                <GradientChannelsChart
                  className="h-full w-full md:w-[420px] flex-1 hidden lg:block"
                  processedCoeffs={processedCoeffs}
                  steps={stepsToUse}
                  showLabels={true}
                  showGrid={true}
                />
              </div>

              {/* Large screen container at bottom with full width - only visible on lg screens */}
              <div className="hidden lg:block lg:h-[300px] w-full rounded-md mt-4">
                {/* Right panel content moved to bottom container on lg+ */}
                <div className="h-full w-full">
                  <ModifierSelectWrapper className="pl-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function ModifierSelectWrapper({ className }: { className?: string }) {
  const { mod } = Route.useSearch();
  const { seed } = useParams({
    from: '/$seed/',
  });
  const { seedData } = useRouteContext({
    from: '/$seed',
  });
  const navigate = Route.useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);
  // Use type assertion to handle 'global' which is in MODIFIERS but not in GlobalModifierType

  // Get preview values from store
  const previewSeed = use$(uiTempStore$.previewSeed);
  const previewData = previewSeed ? deserializeCoeffs(previewSeed) : null;
  const renderPreviewGlobals = Boolean(previewData);
  const globals = seedData.collection.globals;
  const seedCollection = seedData.collection;

  // Toggle active modifier
  const toggleActiveModifier = (modifier: SelectModifier) => {
    // If clicking the already active modifier, deactivate it
    if (modifier === mod) {
      navigate({
        search: { mod: DEFAULT_MODIFIER },
        replace: true,
      });
    } else {
      navigate({
        search: { mod: modifier },
        replace: true,
      });
    }
  };

  // Handle global modifier changes
  const handleGlobalChange = (modifierIndex: number, value: number) => {
    // Get the current globals
    const currentGlobals = renderPreviewGlobals ? previewData!.globals : globals;

    // Create a new globals array with the updated value
    const newGlobals = [...currentGlobals] as [number, number, number, number];
    newGlobals[modifierIndex] = value;

    // Update the preview data
    const newPreviewData = {
      coeffs: previewData ? previewData.coeffs : seedCollection.coeffs,
      globals: newGlobals,
    };

    // Set the preview seed
    const newSeed = serializeCoeffs(newPreviewData.coeffs, newPreviewData.globals);
    uiTempStore$.previewSeed.set(newSeed);
  };

  // Handle RGB channel changes
  const handleRGBChannelChange = (modifierIndex: number, channelIndex: number, value: number) => {
    // Get the current coefficients
    const currentCoeffs = previewData ? previewData.coeffs : seedCollection.coeffs;

    // Create a new coefficients array with the updated value
    const newCoeffs = currentCoeffs.map((modifierCoeffs, mIdx) =>
      mIdx === modifierIndex
        ? modifierCoeffs.map((coeff, cIdx) => (cIdx === channelIndex ? value : coeff))
        : [...modifierCoeffs],
    ) as CosineCoeffs;

    // Update the preview data
    const newPreviewData = {
      coeffs: newCoeffs,
      globals: renderPreviewGlobals ? previewData!.globals : globals,
    };

    // Set the preview seed
    const newSeed = serializeCoeffs(newPreviewData.coeffs, newPreviewData.globals);
    uiTempStore$.previewSeed.set(newSeed);
  };

  // Handle drag end - update URL
  const handleDragEnd = () => {
    if (!previewSeed) return;

    // Update the URL with the new seed
    navigate({
      params: { seed: previewSeed },
      search: (search) => search,
      replace: false,
    });

    // Clear the preview seed
    uiTempStore$.previewSeed.set(null);

    // Update active collection ID if needed
    if (seed !== previewSeed) {
      uiTempStore$.activeCollectionId.set(previewSeed);
    }
  };

  // Helper function to get min/max values for a modifier
  const getModifierRange = (modifier: string) => {
    switch (modifier) {
      case 'exposure':
        return { min: -1, max: 1 };
      case 'phase':
        return { min: -Math.PI, max: Math.PI };
      default: // contrast, frequency
        return { min: 0, max: 2 };
    }
  };

  // Get the modifier index from its name
  const getModifierIndex = (modifier: string) => {
    const index = MODIFIERS.findIndex((m) => m === modifier);
    if (index === -1) return -1;
    return index - 1; // Subtract 1 to account for 'global'
  };

  // RGB channel configuration
  const rgbChannels = [
    { key: 'red', label: 'Red', color: rgbChannelConfig.red.color },
    { key: 'green', label: 'Green', color: rgbChannelConfig.green.color },
    { key: 'blue', label: 'Blue', color: rgbChannelConfig.blue.color },
  ];

  return (
    <div className={cn('w-full h-full flex flex-col', className)} ref={containerRef}>
      <div className="flex justify-end lg:justify-start mb-4">
        <ModifierSelect value={mod} className="w-[200px]" popoverClassName="w-[200px]" />
      </div>

      <div className="flex flex-col flex-1 relative -bottom-3 lg:-bottom-2">
        {mod !== 'global' ? (
          // Show active modifier + RGB channels
          <div className="h-full flex flex-col justify-between">
            {/* Active global modifier */}
            {(() => {
              const modifierIndex = getModifierIndex(mod);
              if (modifierIndex === -1) return null;

              const modifierValue = renderPreviewGlobals
                ? previewData!.globals[modifierIndex]
                : globals[modifierIndex];

              const { min, max } = getModifierRange(mod);

              return (
                <div className="flex-1 flex flex-col justify-center">
                  <ModifierSlider
                    key={mod}
                    label={mod}
                    value={modifierValue}
                    min={min}
                    max={max}
                    onValueChange={(value) => handleGlobalChange(modifierIndex, value)}
                    onDragEnd={handleDragEnd}
                    onClick={() => toggleActiveModifier(mod)}
                    isActive={true}
                    className="h-full"
                  />
                </div>
              );
            })()}

            {/* RGB Channels for the active modifier */}
            {(() => {
              const modifierIndex = getModifierIndex(mod);
              if (modifierIndex === -1) return null;

              const coeffs = previewData ? previewData.coeffs : seedCollection.coeffs;

              return rgbChannels.map((channel, channelIndex) => {
                const channelValue = coeffs[modifierIndex][channelIndex];

                return (
                  <div key={channel.key} className="flex-1 flex flex-col justify-center">
                    <ModifierSlider
                      label={channel.label}
                      value={channelValue}
                      min={-Math.PI}
                      max={Math.PI}
                      colorBar={channel.color}
                      onValueChange={(value) =>
                        handleRGBChannelChange(modifierIndex, channelIndex, value)
                      }
                      onDragEnd={handleDragEnd}
                      className="h-full"
                    />
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          // Show all global modifiers
          <div className="h-full flex flex-col justify-between">
            {MODIFIERS.filter((modifier) => modifier !== 'global').map((modifier) => {
              const modifierIndex = getModifierIndex(modifier);
              if (modifierIndex === -1) return null;

              const modifierValue = renderPreviewGlobals
                ? previewData!.globals[modifierIndex]
                : globals[modifierIndex];

              const { min, max } = getModifierRange(modifier);

              return (
                <div key={modifier} className="flex-1 flex flex-col justify-center">
                  <ModifierSlider
                    label={modifier}
                    value={modifierValue}
                    min={min}
                    max={max}
                    onValueChange={(value) => handleGlobalChange(modifierIndex, value)}
                    onDragEnd={handleDragEnd}
                    onClick={() => toggleActiveModifier(modifier)}
                    className="h-full"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
