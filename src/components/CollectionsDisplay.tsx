import { useNavigate, useParams, useSearch, Link } from '@tanstack/react-router';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useThrottledCallback } from '@mantine/hooks';
import { useState } from 'react';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';

import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { MAX_ITEM_HEIGHT, MIN_ITEM_HEIGHT, validatePanelValue } from '~/validators';
import { applyGlobals } from '~/lib/cosineGradient';
import { GradientPreview } from './GradientPreview';
import { LikeButton } from './LikeButton';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  isSeedRoute?: boolean;
  isRandomRoute?: boolean;
  isCollectionRoute?: boolean;
  likedSeeds?: Record<string, boolean>;
};

export const CollectionsDisplay = observer(function CollectionsDisplay({
  collections,
  isSeedRoute,
  isRandomRoute,
  isCollectionRoute,
  likedSeeds,
}: CollectionsDisplayProps) {
  // We need to handle each case separately to satisfy TypeScript's type checking
  let seed: string | undefined = undefined;
  let navigate;

  if (isSeedRoute) {
    const params = useParams({ from: '/_layout/$seed' });
    seed = params.seed;
    navigate = useNavigate({ from: '/$seed' });
  } else if (isRandomRoute) {
    navigate = useNavigate({ from: '/random' });
  } else if (isCollectionRoute) {
    navigate = useNavigate({ from: '/collection' });
  } else {
    // Default to the root route
    navigate = useNavigate({ from: '/' });
  }

  const { rowHeight, layout = 'row' } = useSearch({ from: '/_layout' });
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

  // Determine if we should use grid or row layout
  const isGridLayout = layout === 'grid';

  return (
    <section
      className="h-full w-full overflow-auto relative"
      onMouseLeave={() => {
        if (!previewSeed) return;
        uiTempStore$.previewSeed.set(null);
      }}
    >
      <ul
        className={cn(
          'h-full w-full relative',
          isSeedRoute
            ? isGridLayout &&
                `grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 auto-rows-[var(--row-height)]`
            : isGridLayout &&
                `grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-[var(--row-height)]`,
        )}
        style={
          {
            '--row-height': `${localRowHeight}%`,
          } as React.CSSProperties
        }
      >
        {collections.map((collection, index) => {
          const isCurrentSeed = seed !== undefined && collection.seed === seed;
          // Make sure coeffs and globals exist before applying
          const processedCoeffs = applyGlobals(collection.coeffs, collection.globals);

          if (isCurrentSeed) {
            return (
              <li
                key={collection._id}
                className={cn(
                  'relative',
                  isGridLayout ? 'w-full h-full' : 'h-[var(--row-height)] w-full',
                )}
              >
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
            <li
              key={collection._id}
              className={cn(
                'relative group',
                isGridLayout ? 'w-full h-full' : 'h-[var(--row-height)] w-full',
              )}
            >
              <GradientPreview
                processedCoeffs={processedCoeffs}
                initialStyle={collection.style}
                initialAngle={collection.angle}
                initialSteps={collection.steps}
              />
              <div className="absolute top-2.5 left-2 z-10 bg-background/20 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  to="/$seed"
                  params={{
                    seed: collection.seed,
                  }}
                  search={({ categories, ...search }) => {
                    return search;
                  }}
                  className="block px-2 py-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                  aria-label={`View details for gradient ${index + 1}`}
                >
                  <span className="relative bottom-[1px] font-medium">Details</span>
                </Link>
              </div>
              <div className="absolute top-2 right-2 z-10 bg-background/20 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                {Boolean(collection.likes) && (
                  <span className="font-medium relative bottom-[5.5px] pl-2 pr-2">
                    {collection.likes}
                  </span>
                )}
                <LikeButton
                  className="relative -bottom-[1px]"
                  seed={collection.seed}
                  isLiked={Boolean(likedSeeds?.[collection.seed])}
                  pending={false}
                />
              </div>
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
