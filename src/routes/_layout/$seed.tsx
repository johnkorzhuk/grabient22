import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import type { AppCollection, CosineCoeffs } from '~/types';
import { useRef, useState, useEffect } from 'react';
import { deserializeCoeffs, serializeCoeffs } from '~/lib/serialization';
import { redirect, useNavigate } from '@tanstack/react-router';
import { useThrottledCallback } from '@mantine/hooks';

import { CollectionsDisplay } from '~/components/CollectionsDisplay';
import {
  applyGlobals,
  compareGlobals,
  generateExposureVariations,
  generateContrastVariations,
  generateFrequencyVariations,
  generatePhaseVariations,
  updateCoeffWithInverseGlobal,
} from '~/lib/cosineGradient';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { GradientChannelsChart } from '~/components/GradientChannelsChart';
import { RGBChannelSliders } from '~/components/RGBChannelSliders';
import * as v from 'valibot';
import { coeffsSchema, DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE, PI } from '~/validators';
import { GradientPreview } from '~/components/GradientPreview';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import { CollectionModifierRangeInput } from '~/components/CollectionModifierRangeInput';
import type { GlobalModifierType } from '~/stores/ui';
import { cn } from '~/lib/utils';
import { useElementSize } from '@mantine/hooks';

export const Route = createFileRoute('/_layout/$seed')({
  component: Home,
  beforeLoad: ({ params, search }) => {
    try {
      // Try to deserialize the data - if it fails, redirect to home
      deserializeCoeffs(params.seed);
      uiTempStore$.previewSeed.set(params.seed);
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
    ...generateExposureVariations(seedCollection, { stepSize: 0.05, steps: 5 }).reverse(),
    ...generateContrastVariations(seedCollection, { stepSize: 0.05, steps: 5 }).reverse(),
    ...generateFrequencyVariations(seedCollection, { stepSize: 0.05, steps: 5 }).reverse(),
    ...generatePhaseVariations(seedCollection, { stepSize: 0.02, steps: 5 }).reverse(),
  ];

  // redundant validation. w/e fixes a ts error
  const processedCoeffs = v.parse(
    coeffsSchema,
    applyGlobals(seedCollection.coeffs, seedCollection.globals),
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel minSize={20} maxSize={60}>
        <CollectionsDisplay collections={collections} isSeedRoute />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <SeedChartAndPreviewPanel
          seedCollection={seedCollection}
          processedCoeffs={processedCoeffs}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// Reusable component for global modifier sliders
interface GlobalModifierItemProps {
  name: GlobalModifierType;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  activeModifier: GlobalModifierType | null;
  containerWidth: number;
  onModifierClick: (name: GlobalModifierType) => void;
  onValueChange: (value: number) => void;
  onDragEnd: () => void;
}

const GlobalModifierItem = ({
  name,
  label,
  value,
  min,
  max,
  step,
  activeModifier,
  containerWidth,
  onModifierClick,
  onValueChange,
  onDragEnd,
}: GlobalModifierItemProps) => {
  return (
    <div
      className={cn(
        'flex flex-col relative',
        'rounded',
        'hover:bg-gray-50 dark:hover:bg-gray-900/30',
        activeModifier === name && 'bg-gray-50 dark:bg-gray-900/30',
        'transition-all',
        'gap-4 p-2 pl-4 -ml-4',
      )}
    >
      {activeModifier === name && (
        <div
          className={cn('absolute left-0 top-0 bottom-0', 'w-1', 'rounded-full', 'bg-foreground')}
          style={{ left: '-1px' }}
        />
      )}
      <div
        className={cn('flex justify-between cursor-pointer')}
        onClick={() => onModifierClick(name)}
      >
        <label className={cn('text-sm font-medium')}>
          {activeModifier && containerWidth <= 450 ? `Global ${label}` : label}
        </label>
        <span className={cn('text-sm', 'text-gray-500')}>{value.toFixed(3)}</span>
      </div>
      <CollectionModifierRangeInput
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onValueChange(values[0])}
        onMouseUp={onDragEnd}
        onKeyUp={onDragEnd}
        onPointerUp={onDragEnd}
      />
    </div>
  );
};

// Configuration for the global modifiers
const modifierConfig = [
  { name: 'exposure' as GlobalModifierType, label: 'Exposure', min: -1, max: 1, index: 0 },
  { name: 'contrast' as GlobalModifierType, label: 'Contrast', min: 0, max: 2, index: 1 },
  { name: 'frequency' as GlobalModifierType, label: 'Frequency', min: 0, max: 2, index: 2 },
  { name: 'phase' as GlobalModifierType, label: 'Phase', min: -PI, max: PI, index: 3 },
];

// Global modifiers grid component to fix scroll position issues during navigation
interface GlobalModifiersGridProps {
  globals: [number, number, number, number];
  activeModifier: GlobalModifierType | null;
  onModifierClick: (modifier: GlobalModifierType) => void;
  onValueChange: (index: number, value: number) => void;
  onDragEnd: () => void;
  containerWidth: number;
}

const GlobalModifiersGrid = ({
  globals,
  activeModifier,
  onModifierClick,
  onValueChange,
  onDragEnd,
  containerWidth,
}: GlobalModifiersGridProps) => {
  // Filter modifiers based on activeModifier and container width
  // Only filter in narrow layout when an active modifier is selected
  const filteredModifiers =
    activeModifier && containerWidth <= 450
      ? modifierConfig.filter((config) => config.name === activeModifier)
      : modifierConfig;

  return (
    <div
      className={cn(
        'grid grid-cols-1',
        'gap-5',
        activeModifier && containerWidth <= 450 ? 'w-full px-0' : '',
      )}
    >
      {filteredModifiers.map((config) => (
        <GlobalModifierItem
          key={config.name}
          name={config.name}
          label={config.label}
          value={globals[config.index]}
          min={config.min}
          max={config.max}
          step={0.001}
          activeModifier={activeModifier}
          containerWidth={containerWidth}
          onModifierClick={onModifierClick}
          onValueChange={(value) => onValueChange(config.index, value)}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
};

const SeedChartAndPreviewPanel = observer(function SeedChartAndPreviewPanel({
  seedCollection,
  processedCoeffs,
}: {
  seedCollection: AppCollection;
  processedCoeffs: CosineCoeffs;
}) {
  const search = useSearch({ from: '/_layout' });
  const { steps } = search;
  // Get preview steps from store
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewSeed = use$(uiTempStore$.previewSeed);
  const previewColorIndex = use$(uiTempStore$.previewColorIndex);
  const activeModifier = use$(uiTempStore$.activeModifier);
  const navigate = useNavigate({ from: '/$seed' });
  const previewData = previewSeed ? deserializeCoeffs(previewSeed) : null;
  const previewCoeffs = previewData
    ? applyGlobals(previewData.coeffs, previewData.globals)
    : processedCoeffs;

  // Track container width to determine if we have room for RGB controls
  const { ref: containerRef, width: containerWidth } = useElementSize();

  // State for global modifiers - explicitly type as a tuple with 4 numbers
  const [globals, setGlobals] = useState(seedCollection.globals);

  // Update globals when seedCollection changes (e.g., URL state changes)
  useEffect(() => {
    setGlobals(seedCollection.globals);
  }, [seedCollection]);

  // Set default active modifier on component mount if none is set
  useEffect(() => {
    // Only set a default if we have enough screen space and no modifier is active
    if (!activeModifier && containerWidth > 450) {
      uiTempStore$.activeModifier.set('exposure');
    }
  }, [containerWidth, activeModifier]);

  // Determine steps to use (preview -> URL -> initial)
  const stepsToUse =
    previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : seedCollection.steps;

  // Throttled function to update URL with new seed
  const updateUrlWithSeed = useThrottledCallback((newGlobals) => {
    // Reserialize the coeffs with the new globals to create a new seed
    const newSeed = serializeCoeffs(seedCollection.coeffs, newGlobals);

    // Update the URL with the new seed
    navigate({
      params: { seed: newSeed },
      search,
    });
  }, 300); // 300ms throttle

  // Store temporary coefficients when modifying RGB channels
  const [tempCoeffs, setTempCoeffs] = useState<CosineCoeffs | null>(null);

  // Handle global modifier changes during dragging
  const handleGlobalChange = (index: number, value: number) => {
    const newGlobals = [...globals] as [number, number, number, number];
    newGlobals[index] = value;
    setGlobals(newGlobals);

    uiTempStore$.previewSeed.set(serializeCoeffs(seedCollection.coeffs, newGlobals));
  };

  // Handle RGB channel value changes
  const handleRGBChannelChange = (modifierIndex: number, channelIndex: number, value: number) => {
    // Apply the inverse of the global modifier to get the raw coefficient value
    // This is crucial because the displayed values are already modified by globals
    const updatedCoeffs = updateCoeffWithInverseGlobal(
      seedCollection.coeffs,
      modifierIndex,
      channelIndex,
      value,
      globals,
    );

    // Update the preview
    const newSeed = serializeCoeffs(updatedCoeffs, globals);
    uiTempStore$.previewSeed.set(newSeed);

    // Store the updated coefficients so they can be used in handleDragEnd
    setTempCoeffs(updatedCoeffs);
  };

  // Handle the end of dragging - update the URL
  const handleDragEnd = () => {
    if (tempCoeffs) {
      // If we have temporary coefficients from RGB channel modifications, use those
      const newSeed = serializeCoeffs(tempCoeffs, globals);

      // Update the URL with the new seed
      navigate({
        params: { seed: newSeed },
        search,
      });

      // Reset temporary coefficients
      setTempCoeffs(null);
    } else {
      // Otherwise, use the throttled function to update the URL with global changes
      updateUrlWithSeed(globals);
    }
  };

  // Toggle active modifier
  const toggleActiveModifier = (modifier: GlobalModifierType) => {
    // If clicking the same modifier that's already active, set to null (toggle off)
    if (modifier === activeModifier) {
      uiTempStore$.activeModifier.set(null);
    } else {
      // Set the new active modifier (toggle on)
      uiTempStore$.activeModifier.set(modifier);
    }
  };

  const renderPreviewGlobals = Boolean(
    previewData && !compareGlobals(previewData.globals, globals),
  );

  return (
    <div className="flex flex-col w-full h-full relative" ref={containerRef}>
      {/* Graph section - fixed at 35% */}
      <div className="relative w-full h-[35%]">
        <GradientChannelsChart
          processedCoeffs={processedCoeffs}
          steps={stepsToUse === 'auto' ? DEFAULT_STEPS : stepsToUse}
        />
      </div>

      {/* GradientPreview - remaining height */}
      <div className="w-full flex-grow mt-4">
        <GradientPreview
          initialStyle={seedCollection.style}
          initialSteps={seedCollection.steps}
          initialAngle={seedCollection.angle}
          processedCoeffs={previewCoeffs || processedCoeffs}
          activeIndex={previewColorIndex}
        />
      </div>

      {/* Inputs section - auto height */}
      <div className={cn('w-full', 'border-y border-gray-200 dark:border-gray-800', 'p-6')}>
        {/* Mobile layout (≤ 450px) */}
        {containerWidth <= 450 && (
          <div className={cn('flex flex-col gap-4')}>
            {/* Header with back button for mobile layout */}
            <div className="flex items-center mb-1">
              {activeModifier ? (
                <>
                  <button
                    onClick={() => uiTempStore$.activeModifier.set(null)}
                    className="absolute left-2 flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <h3 className="w-full text-left text-lg font-medium pl-8">
                    {activeModifier.charAt(0).toUpperCase() + activeModifier.slice(1)} Modifiers
                  </h3>
                </>
              ) : (
                <h3 className="text-lg font-medium">Global Modifiers</h3>
              )}
            </div>

            {/* Container with fixed height for consistent layout */}
            <div className="flex flex-col">
              {/* Mobile: Show only active modifier or all modifiers */}
              <div className="flex-grow" style={{ minHeight: activeModifier ? '66px' : '272px' }}>
                <GlobalModifiersGrid
                  globals={renderPreviewGlobals ? previewData!.globals : globals}
                  activeModifier={activeModifier}
                  onModifierClick={toggleActiveModifier}
                  onValueChange={handleGlobalChange}
                  onDragEnd={handleDragEnd}
                  containerWidth={containerWidth}
                />
              </div>

              {/* Mobile: RGB channels below active modifier */}
              {activeModifier && (
                <div className="mt-4">
                  <RGBChannelSliders
                    coeffs={seedCollection.coeffs}
                    globals={globals}
                    activeModifier={activeModifier}
                    onValueChange={handleRGBChannelChange}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop layout (> 450px) */}
        {containerWidth > 450 && (
          <div className="flex flex-row gap-6">
            {/* Desktop: Global modifiers column */}
            <div className="flex flex-col gap-6 w-1/2">
              <h3 className="text-lg font-medium">
                {activeModifier
                  ? `${activeModifier.charAt(0).toUpperCase() + activeModifier.slice(1)} Modifiers`
                  : 'Global Modifiers'}
              </h3>
              <GlobalModifiersGrid
                globals={renderPreviewGlobals ? previewData!.globals : globals}
                activeModifier={activeModifier}
                onModifierClick={toggleActiveModifier}
                onValueChange={handleGlobalChange}
                onDragEnd={handleDragEnd}
                containerWidth={containerWidth}
              />
            </div>

            {/* Desktop: RGB channels column */}
            <div className="w-1/2 mt-15 pl-2">
              {activeModifier && (
                <RGBChannelSliders
                  coeffs={seedCollection.coeffs}
                  globals={globals}
                  activeModifier={activeModifier}
                  onValueChange={handleRGBChannelChange}
                  onDragEnd={handleDragEnd}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
