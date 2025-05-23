import { useNavigate, useParams, useSearch, Link, useLocation } from '@tanstack/react-router';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useThrottledCallback, useElementSize } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { MAX_ITEM_HEIGHT, MIN_ITEM_HEIGHT, validatePanelValue } from '~/validators';
import { applyGlobals, cosineGradient } from '~/lib/cosineGradient';
import { serializeCoeffs } from '~/lib/serialization';
import { GradientPreview } from './GradientPreview';
import { LikeButton } from './LikeButton';
import { getCollectionStyleSVG } from '~/lib/getCollectionStyleSVG';
import { getCollectionStyleCSS } from '~/lib/getCollectionStyleCSS';
import { CopyButton } from './CopyButton';
import { RGBTabs } from './RGBTabs';
import { useItemInteraction } from '~/hooks/useTouchInteraction';

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
  const { href, pathname } = useLocation();
  const isGenerateRoute = pathname === '/generate';

  if (isSeedRoute) {
    const params = useParams({ from: '/_layout/$seed' });
    seed = params.seed;
    navigate = useNavigate({ from: '/$seed' });
  } else if (isRandomRoute) {
    navigate = useNavigate({ from: '/random' });
  } else if (isCollectionRoute) {
    navigate = useNavigate({ from: '/collection' });
  } else if (isGenerateRoute) {
    navigate = useNavigate({ from: '/generate' });
  } else {
    // Default to the root route
    navigate = useNavigate({ from: '/' });
  }

  const { rowHeight, layout = 'row', style, steps, angle } = useSearch({ from: '/_layout' });
  const previewSeed = use$(uiTempStore$.previewSeed);
  const [localRowHeight, setLocalRowHeight] = useState(rowHeight);
  const previewStyle = use$(uiTempStore$.previewStyle);
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewAngle = use$(uiTempStore$.previewAngle);

  // Add item interaction hook for both mobile and desktop
  const { toggleItem, clearActiveItem, isItemActive } = useItemInteraction();

  // Clear active item when navigating away
  useEffect(() => {
    return () => clearActiveItem();
  }, [clearActiveItem]);

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
    <section className="h-full w-full overflow-auto relative">
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
          // Determine steps to use (collection's native steps or from URL/preview)
          const stepsToUse =
            previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : collection.steps;

          // Use our custom gradient generator with the determined number of steps
          const numStops = stepsToUse === 'auto' ? collection.steps : stepsToUse;
          const gradientColors = cosineGradient(numStops, processedCoeffs);

          // Determine style to use (from URL/preview or default)
          const styleToUse =
            previewStyle !== null ? previewStyle : style === 'auto' ? collection.style : style;

          // Determine angle to use (from URL/preview or default)
          const angleToUse =
            previewAngle !== null || angle !== 'auto'
              ? (previewAngle ??
                (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : collection.angle))
              : collection.angle;

          // Generate the CSS once and store it
          const { styles, cssString } = getCollectionStyleCSS(
            styleToUse,
            gradientColors,
            angleToUse,
            {
              seed: collection.seed,
              href,
            },
          );

          // SVG string will be generated with the measured dimensions once available
          const svgString = getCollectionStyleSVG(
            styleToUse,
            gradientColors,
            angleToUse,
            {
              seed: collection.seed,
              href,
            },
            null,
          );

          if (isCurrentSeed) {
            return (
              <li
                key={collection._id}
                className={cn(
                  'relative',
                  isGridLayout ? 'w-full h-full' : 'h-[var(--row-height)] w-full',
                )}
              >
                <div className="relative h-full w-full overflow-hidden">
                  <GradientPreview cssProps={styles} />
                </div>
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
              onClick={() => toggleItem(collection._id)}
              onMouseLeave={() => {
                if (!previewSeed) return;
                uiTempStore$.previewSeed.set(null);
              }}
            >
              <div className="group relative h-full w-full overflow-hidden">
                <GradientPreview cssProps={styles} />
              </div>
              {/* <div className="absolute bottom-2 left-2 z-10 bg-background/20 backdrop-blur-sm rounded-md p-1">
                <RGBTabs
                  collection={collection}
                  onOrderChange={(newCoeffs) => {
                    const newSeed = serializeCoeffs(newCoeffs, collection.globals);
                    navigate({
                      params: { seed: newSeed },
                      search: (prev) => prev,
                    });
                  }}
                />
              </div> */}
              <div
                className={cn(
                  'absolute top-2.5 left-2 z-10 bg-background/20 backdrop-blur-sm rounded-md transition-opacity',
                  {
                    'opacity-0 group-hover:opacity-100': !isItemActive(collection._id),
                    'opacity-100': isItemActive(collection._id),
                  },
                )}
              >
                <Link
                  to="/$seed"
                  params={{
                    seed: collection.seed,
                  }}
                  search={({ categories, ...search }) => {
                    return {
                      ...search,
                      angle: angle === 'auto' ? collection.angle : search.angle,
                      style: style === 'auto' ? collection.style : search.style,
                      steps: steps === 'auto' ? collection.steps : search.steps,
                    };
                  }}
                  className="block px-2 py-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                  aria-label={`View details for gradient ${index + 1}`}
                >
                  <span className="relative bottom-[1px] font-medium">Details</span>
                </Link>
              </div>
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                {/* Like button container - preserving original styling */}
                <div
                  className={cn('bg-background/20 backdrop-blur-sm rounded-md transition-opacity', {
                    'opacity-0 group-hover:opacity-100': !isItemActive(collection._id),
                    'opacity-100': isItemActive(collection._id),
                  })}
                >
                  {Boolean(collection.likes) && (
                    <span className="font-medium relative bottom-[5px] pl-2 pr-2 select-none">
                      {collection.likes}
                    </span>
                  )}
                  {!isSeedRoute && (
                    <LikeButton
                      className="relative -bottom-[1px]"
                      seed={collection.seed}
                      isLiked={Boolean(likedSeeds?.[collection.seed])}
                      pending={false}
                      collectionSteps={collection.steps}
                      collectionStyle={collection.style}
                      collectionAngle={collection.angle}
                    />
                  )}
                </div>

                <CopyButton
                  cssString={cssString}
                  svgString={svgString}
                  isActive={isItemActive(collection._id)}
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
              <div className="h-full w-full"></div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </section>
  );
});
