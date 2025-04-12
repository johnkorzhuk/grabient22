import { createFileRoute, useLocation, useParams, useSearch } from '@tanstack/react-router';
import type { AppCollection, CosineCoeffs } from '~/types';
import { useRef, useState, useEffect } from 'react';
import { deserializeCoeffs, serializeCoeffs } from '~/lib/serialization';
import { redirect, useNavigate } from '@tanstack/react-router';
import { useThrottledCallback } from '@mantine/hooks';

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
import { coeffsSchema, DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE, PI } from '~/validators';
import { GradientPreview } from '~/components/GradientPreview';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import { CollectionModifierRangeInput } from '~/components/CollectionModifierRangeInput';
import type { GlobalModifierType } from '~/stores/ui';
import { cn } from '~/lib/utils';

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
  activeModifier: GlobalModifierType;
  onModifierClick: (modifier: GlobalModifierType) => void;
  onValueChange: (value: number) => void;
  onDragEnd: () => void;
  onFocus: (modifier: GlobalModifierType) => void;
}

const GlobalModifierItem = ({
  name,
  label,
  value,
  min,
  max,
  step,
  activeModifier,
  onModifierClick,
  onValueChange,
  onDragEnd,
  onFocus,
}: GlobalModifierItemProps) => {
  return (
    <div
      className={cn(
        'flex flex-col relative',
        'rounded',
        'cursor-pointer',
        'hover:bg-gray-50 dark:hover:bg-gray-900/30',
        activeModifier === name && 'bg-gray-50 dark:bg-gray-900/30',
        'transition-all',
        'gap-4 p-2 pl-4 -ml-4',
      )}
      onClick={() => onModifierClick(name)}
    >
      {activeModifier === name && (
        <div
          className={cn('absolute left-0 top-0 bottom-0', 'w-1.5', 'rounded-full', 'bg-foreground')}
          style={{ left: '-8px' }}
        />
      )}
      <div className={cn('flex justify-between')}>
        <label className={cn('text-sm font-medium')}>{label}</label>
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
        onFocus={() => onFocus(name)}
      />
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
  const previewCoeffs = use$(uiTempStore$.previewCollection);
  const previewColorIndex = use$(uiTempStore$.previewColorIndex);
  const activeModifier = use$(uiTempStore$.activeModifier);
  const navigate = useNavigate({ from: '/$seed' });
  const location = useLocation();

  // Track if we're currently dragging a slider
  const [isDragging, setIsDragging] = useState(false);

  // State for global modifiers - explicitly type as a tuple with 4 numbers
  const [globals, setGlobals] = useState<[number, number, number, number]>(
    seedCollection.globals as [number, number, number, number],
  );

  // Update globals when seedCollection changes (e.g., URL state changes)
  useEffect(() => {
    setGlobals(seedCollection.globals as [number, number, number, number]);
  }, [seedCollection]);

  // Sync active modifier with URL hash on component mount
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash && ['exposure', 'contrast', 'frequency', 'phase'].includes(hash)) {
      uiTempStore$.activeModifier.set(hash as GlobalModifierType);
    }
  }, [location.hash]);

  // Determine steps to use (preview -> URL -> initial)
  const stepsToUse =
    previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : seedCollection.steps;

  // Throttled function to update URL with new seed
  const updateUrlWithSeed = useThrottledCallback((newGlobals: [number, number, number, number]) => {
    // Reserialize the coeffs with the new globals to create a new seed
    const newSeed = serializeCoeffs(seedCollection.coeffs, newGlobals);

    // Update the URL with the new seed, preserving the hash
    navigate({
      params: { seed: newSeed },
      search,
      hash: activeModifier || undefined, // Preserve active modifier in hash
    });
  }, 300); // 300ms throttle

  // Handle global modifier changes during dragging
  const handleGlobalChange = (index: number, value: number) => {
    setIsDragging(true);
    const newGlobals: [number, number, number, number] = [...globals] as [
      number,
      number,
      number,
      number,
    ];
    newGlobals[index] = value;
    setGlobals(newGlobals);

    // Update the preview with new globals
    const updatedCoeffs = applyGlobals(seedCollection.coeffs, newGlobals);
    uiTempStore$.previewCollection.set(updatedCoeffs);
  };

  // Handle the end of dragging - update the URL
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);

      // Use the throttled function to update the URL
      updateUrlWithSeed(globals);
    }
  };

  // Set active modifier and update URL hash
  const setActiveModifier = (modifier: GlobalModifierType) => {
    uiTempStore$.activeModifier.set(modifier);

    // Update URL hash
    navigate({
      search,
      hash: modifier || undefined,
    });
  };

  // Handle click on a modifier container
  const handleModifierClick = (modifier: GlobalModifierType) => {
    setActiveModifier(modifier);
  };

  // Configuration for the global modifiers
  const modifierConfig = [
    { name: 'exposure' as GlobalModifierType, label: 'Exposure', min: -1, max: 1, index: 0 },
    { name: 'contrast' as GlobalModifierType, label: 'Contrast', min: 0, max: 2, index: 1 },
    { name: 'frequency' as GlobalModifierType, label: 'Frequency', min: 0, max: 2, index: 2 },
    { name: 'phase' as GlobalModifierType, label: 'Phase', min: -PI, max: PI, index: 3 },
  ];

  return (
    <div className="flex flex-col w-full h-full">
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
      <div
        className={cn(
          'w-full',
          'border-y border-gray-200 dark:border-gray-800',
          'p-6',
          '@container',
        )}
      >
        <div className={cn('flex flex-col @[600px]:flex-row', 'gap-6 pb-4')}>
          <div className={cn('flex flex-col', 'w-full @[600px]:w-1/2', 'gap-6')}>
            <h3 className={cn('text-lg font-medium')}>Global Modifiers</h3>

            <div
              className={cn(
                'grid grid-cols-1 @[600px]:grid-cols-1 md:@[600px]:grid-cols-1 md:grid-cols-2',
                'gap-6',
              )}
            >
              {modifierConfig.map((config) => (
                <GlobalModifierItem
                  key={config.name}
                  name={config.name}
                  label={config.label}
                  value={globals[config.index]}
                  min={config.min}
                  max={config.max}
                  step={0.001}
                  activeModifier={activeModifier}
                  onModifierClick={handleModifierClick}
                  onValueChange={(value) => handleGlobalChange(config.index, value)}
                  onDragEnd={handleDragEnd}
                  onFocus={setActiveModifier}
                />
              ))}
            </div>
          </div>

          {/* Reserved space for future RGB channel modifiers */}
          <div className={cn('hidden @[600px]:block', 'w-1/2')}>
            {/* RGB channel modifiers will be added here in the future */}
          </div>
        </div>
      </div>
    </div>
  );
});
