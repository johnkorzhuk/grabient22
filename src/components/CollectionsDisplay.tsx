import { useSearch, Link, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { formatDistanceToNow } from 'date-fns';
import { observer, use$ } from '@legendapp/state/react';
import { applyGlobals, cosineGradient } from '~/lib/cosineGradient';
import { GradientPreview } from './GradientPreview';
import { LikeButton } from './LikeButton';
import { getCollectionStyleSVG } from '~/lib/getCollectionStyleSVG';
import { getCollectionStyleCSS } from '~/lib/getCollectionStyleCSS';
import { CopyButton } from './CopyButton';
import { RGBTabs } from './RGBTabs';
import { useItemInteraction } from '~/hooks/useTouchInteraction';
import { collectionStore$ } from '~/stores/collection';
import { serializeCoeffs } from '~/lib/serialization';
import { useHover } from '@mantine/hooks';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  likedSeeds?: Record<string, boolean>;
};

export const CollectionsDisplay = observer(function CollectionsDisplay({
  collections: initialCollections,
  likedSeeds,
}: CollectionsDisplayProps) {
  const { href } = useLocation();
  const { style, steps, angle } = useSearch({ from: '/_layout' });
  const previewSeed = use$(uiTempStore$.previewSeed);
  const previewStyle = use$(uiTempStore$.previewStyle);
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewAngle = use$(uiTempStore$.previewAngle);
  let collections = use$(collectionStore$.collections);
  if (!collections.length) {
    collections = initialCollections;
  }

  // Add item interaction hook for both mobile and desktop
  const { toggleItem, clearActiveItem, isItemActive, activeItemId } = useItemInteraction();

  // Track which items have visible RGB tabs
  const [visibleRGBTabs, setVisibleRGBTabs] = useState<Record<string, boolean>>({});

  // Clear active item when navigating away
  useEffect(() => {
    return () => clearActiveItem();
  }, [clearActiveItem]);

  useEffect(() => {
    collectionStore$.collections.set(initialCollections);
  }, [initialCollections]);

  // Set preview values when an active item is selected, but only for 'auto' parameters
  useEffect(() => {
    if (activeItemId) {
      // Find the active collection
      const activeCollection = collections.find((collection) => collection._id === activeItemId);

      if (activeCollection) {
        // Only set preview values for parameters that are set to 'auto'
        if (style === 'auto') {
          uiTempStore$.previewStyle.set(activeCollection.style);
        }

        if (steps === 'auto') {
          uiTempStore$.previewSteps.set(activeCollection.steps);
        }

        if (angle === 'auto') {
          uiTempStore$.previewAngle.set(activeCollection.angle);
        }
      }
    } else {
      // Clear preview values when no item is active
      uiTempStore$.previewStyle.set(null);
      uiTempStore$.previewSteps.set(null);
      uiTempStore$.previewAngle.set(null);
    }
  }, [activeItemId, collections, style, steps, angle]);

  return (
    <section className="h-full w-full relative mb-20">
      <ol
        className={cn(
          'h-full w-full relative px-5 lg:px-14',
          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-10 gap-y-17 auto-rows-[300px]',
        )}
      >
        {collections.map((collection, index) => {
          const itemActive = isItemActive(collection._id);
          const { hovered, ref } = useHover();
          const processedCoeffs = applyGlobals(collection.coeffs, collection.globals);
          let stepsToUse =
            previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : collection.steps;
          let styleToUse =
            previewStyle !== null ? previewStyle : style === 'auto' ? collection.style : style;
          let angleToUse =
            previewAngle !== null || angle !== 'auto'
              ? (previewAngle ??
                (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : collection.angle))
              : collection.angle;

          stepsToUse = hovered && !itemActive && steps === 'auto' ? collection.steps : stepsToUse;
          styleToUse = hovered && !itemActive && style === 'auto' ? collection.style : styleToUse;
          angleToUse = hovered && !itemActive && angle === 'auto' ? collection.angle : angleToUse;

          // Use our custom gradient generator with the determined number of steps
          const numStops = stepsToUse === 'auto' ? collection.steps : stepsToUse;
          const gradientColors = cosineGradient(numStops, processedCoeffs);

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

          return (
            <li
              ref={ref}
              key={collection._id}
              className={cn('relative group', 'w-full')}
              onClick={() => toggleItem(collection._id)}
              onMouseEnter={() => {
                setVisibleRGBTabs((prev) => ({
                  ...prev,
                  [collection._id]: true,
                }));
              }}
              onMouseLeave={() => {
                // Hide RGB tabs when mouse leaves unless item is active
                if (!itemActive) {
                  setVisibleRGBTabs((prev) => ({
                    ...prev,
                    [collection._id]: false,
                  }));
                }

                // Clear preview seed if set
                if (!previewSeed) return;
                uiTempStore$.previewSeed.set(null);
              }}
            >
              {/* Gradient container with fixed height */}
              <div className="relative h-[300px] w-full">
                {/* Hover/active effect - subtle glow that extends beyond boundaries */}
                <div
                  className={cn(
                    'absolute -inset-3 transition-opacity duration-300 z-0 pointer-events-none blur-lg rounded-xl',
                    {
                      'opacity-0 group-hover:opacity-40': !itemActive,
                      'opacity-40': itemActive,
                    },
                  )}
                >
                  <GradientPreview cssProps={styles} className="rounded-xl" />
                </div>
                {/* Main gradient preview */}
                <div className="relative z-10 h-full w-full overflow-hidden rounded-xl border border-gray-500/10">
                  <GradientPreview cssProps={styles} className="rounded-xl" />
                </div>

                {/* Top-left Details button */}
                <div
                  className={cn(
                    'absolute top-3.5 left-3.5 z-10 bg-background/20 backdrop-blur-sm rounded-md transition-opacity',
                    {
                      'opacity-0 group-hover:opacity-100': !itemActive,
                      'opacity-100': itemActive,
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

                {/* Top-right buttons */}
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <CopyButton
                    cssString={cssString}
                    svgString={svgString}
                    isActive={itemActive}
                    onOpen={() => {
                      // Always set this item as active, don't toggle
                      if (!itemActive) {
                        toggleItem(collection._id);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Like button and count moved below the gradient container - always visible */}
              <div className="flex justify-between pt-4">
                <div className="flex items-center">
                  {/* Only render RGBTabs when item is hovered or active */}
                  <div className="relative">
                    {/* Timestamp display - only shown when not hovered */}
                    <div
                      className={cn(
                        'transition-opacity duration-200 text-sm text-muted-foreground',
                        {
                          'opacity-100 group-hover:opacity-0': !itemActive,
                          'opacity-0': itemActive,
                        },
                      )}
                    >
                      {collection._creationTime && (
                        <span>
                          {formatDistanceToNow(new Date(collection._creationTime), {
                            addSuffix: false,
                          }).replace('about', '')}
                        </span>
                      )}
                    </div>

                    {/* RGB Tabs - only shown when hovered or active */}
                    {(itemActive || visibleRGBTabs[collection._id]) && (
                      <div className="absolute top-0 left-0">
                        <RGBTabs
                          collection={collection}
                          onOrderChange={(newCoeffs) => {
                            // Generate new seed from the updated coefficients
                            const newSeed = serializeCoeffs(newCoeffs, collection.globals);

                            // Find the collection in the store and update it
                            // Get the current collections array
                            const collections = collectionStore$.collections.get();
                            const collectionIndex = collections.findIndex(
                              (c) => String(c._id) === String(collection._id),
                            );
                            const initalCollection = initialCollections.find(
                              (c) => String(c._id) === String(collection._id),
                            );

                            if (collectionIndex !== -1) {
                              // Create a new array with the updated collection
                              const updatedCollections = [...collections];
                              updatedCollections[collectionIndex] = {
                                ...collections[collectionIndex],
                                coeffs: newCoeffs,
                                seed: newSeed,
                                // Reset likes to 0 since this is now a different gradient
                                likes:
                                  newSeed !== initalCollection?.seed
                                    ? 0
                                    : initalCollection?.likes || 0,
                              };

                              // Update the entire collections array
                              collectionStore$.collections.set(updatedCollections);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center group min-h-[28px]">
                  {Boolean(collection.likes) && (
                    <span className="font-medium pr-4 select-none text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                      {collection.likes}
                    </span>
                  )}
                  <LikeButton
                    className="relative -bottom-[1px] text-muted-foreground group-hover:text-foreground transition-colors duration-200"
                    seed={collection.seed}
                    isLiked={Boolean(likedSeeds?.[collection.seed])}
                    pending={false}
                    collectionSteps={collection.steps}
                    collectionStyle={collection.style}
                    collectionAngle={collection.angle}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
});
