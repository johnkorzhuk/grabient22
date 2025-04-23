import { useNavigate, useParams, useSearch, Link } from '@tanstack/react-router';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useThrottledCallback } from '@mantine/hooks';
import { useState } from 'react';
import type { AppCollection } from '~/types';

import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { MAX_ITEM_HEIGHT, MIN_ITEM_HEIGHT, validatePanelValue } from '~/validators';
import { applyGlobals } from '~/lib/cosineGradient';
import { GradientPreview } from './GradientPreview';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  isSeedRoute?: boolean;
  isRandomRoute?: boolean;
};

export const CollectionsDisplay = observer(function CollectionsDisplay({
  collections,
  isSeedRoute,
  isRandomRoute,
}: CollectionsDisplayProps) {
  const paramsResult = useParams({
    from: isRandomRoute ? '/_layout/random' : isSeedRoute ? '/_layout/$seed' : '/_layout/',
  });
  const { seed } = paramsResult && 'seed' in paramsResult ? paramsResult : { seed: undefined };
  const navigate = useNavigate({ from: isSeedRoute ? '/$seed' : isRandomRoute ? '/random' : '/' });
  const { rowHeight } = useSearch({
    from: '/_layout',
  });

  const previewSeed = use$(uiTempStore$.previewSeed);
  const [localRowHeight, setLocalRowHeight] = useState(rowHeight);

  const handleResize = (newHeight: number) => {
    const truncatedValue = Number(newHeight.toFixed(1));
    const finalHeight = validatePanelValue(MIN_ITEM_HEIGHT, MAX_ITEM_HEIGHT)(truncatedValue);

    // Update local state immediately for responsive UI
    setLocalRowHeight(finalHeight);

    // Throttled update to URL and persisted store
    throttledUpdateURL(finalHeight);
  };

  const throttledUpdateURL = useThrottledCallback((height: number) => {
    // Update URL
    navigate({
      search: (prev) => ({
        ...prev,
        rowHeight: height,
      }),
      replace: true,
    });
  }, 150);

  return (
    <section
      className="h-full w-full overflow-auto relative"
      onMouseLeave={() => {
        if (!previewSeed) return;
        uiTempStore$.previewSeed.set(null);
      }}
    >
      <ul
        className="h-full w-full relative"
        style={
          {
            '--row-height': `${localRowHeight}%`,
          } as React.CSSProperties
        }
      >
        {collections.map((collection, index) => {
          const isCurrentSeed = seed !== undefined && collection.seed === seed;
          // Make sure coeffs and globals exist before applying
          const processedCoeffs = collection.coeffs && collection.globals ? 
            applyGlobals(collection.coeffs, collection.globals) : 
            null;
            
          if (!processedCoeffs) {
            return null; // Skip rendering this item
          }

          if (isCurrentSeed) {
            return (
              <li key={collection._id} className="h-[var(--row-height)] w-full">
                <GradientPreview
                  processedCoeffs={processedCoeffs}
                  initialStyle={collection.style}
                  initialAngle={collection.angle}
                  initialSteps={collection.steps}
                />
              </li>
            );
          }

          return (
            <li key={collection._id} className="h-[var(--row-height)] w-full">
              <Link
                to="/$seed"
                params={{
                  seed: collection.seed,
                }}
                search={({ categories, ...search }) => {
                  return search;
                }}
                replace={isSeedRoute}
                aria-label={`Gradient ${index + 1}`}
              >
                <GradientPreview
                  processedCoeffs={processedCoeffs}
                  initialStyle={collection.style}
                  initialAngle={collection.angle}
                  initialSteps={collection.steps}
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {collections.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel
              defaultSize={localRowHeight}
              minSize={MIN_ITEM_HEIGHT}
              maxSize={MAX_ITEM_HEIGHT}
              onResize={handleResize}
              className="pointer-events-none"
            >
              <div className="h-full"></div>
            </ResizablePanel>

            <ResizableHandle className="cursor-ns-resize pointer-events-auto z-10" withHandle />

            <ResizablePanel
              defaultSize={100 - localRowHeight}
              minSize={MIN_ITEM_HEIGHT}
              maxSize={MAX_ITEM_HEIGHT}
              className="pointer-events-none"
            >
              <div className="h-full"></div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </section>
  );
});
