import { useSearch, Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
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
  const { toggleItem, clearActiveItem, isItemActive } = useItemInteraction();

  // Clear active item when navigating away
  useEffect(() => {
    return () => clearActiveItem();
  }, [clearActiveItem]);

  useEffect(() => {
    collectionStore$.collections.set(initialCollections);
  }, [initialCollections]);

  return (
    <section className="h-full w-full relative mb-20">
      <ol
        className={cn(
          'h-full w-full relative px-5 lg:px-14',
          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-10 gap-y-17 auto-rows-[300px]',
        )}
      >
        {collections.map((collection, index) => {
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

          return (
            <li
              key={collection._id}
              className={cn('relative group', 'w-full')}
              onClick={() => toggleItem(collection._id)}
              onMouseLeave={() => {
                // if (isItemActive(collection._id)) {
                //   toggleItem(collection._id);
                // }
                if (!previewSeed) return;
                uiTempStore$.previewSeed.set(null);
              }}
            >
              {/* Gradient container with fixed height */}
              <div className="relative h-[300px] w-full">
                {/* Hover/active effect - subtle glow that extends beyond boundaries */}
                <div
                  className={cn(
                    'absolute -inset-4 transition-opacity duration-300 z-0 pointer-events-none blur-lg rounded-xl',
                    {
                      'opacity-0 group-hover:opacity-40': !isItemActive(collection._id),
                      'opacity-40': isItemActive(collection._id),
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

                {/* Top-right buttons */}
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <CopyButton
                    cssString={cssString}
                    svgString={svgString}
                    isActive={isItemActive(collection._id)}
                    onOpen={() => {
                      // Always set this item as active, don't toggle
                      if (!isItemActive(collection._id)) {
                        toggleItem(collection._id);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Like button and count moved below the gradient container - always visible */}
              <div className="flex justify-between mt-4">
                <div className="flex items-center">
                  {/* Only render RGBTabs when item is hovered or active */}
                  <div className="relative">
                    {/* Timestamp display - only shown when not hovered */}
                    <div
                      className={cn(
                        'transition-opacity duration-200 text-sm text-muted-foreground',
                        {
                          'opacity-100 group-hover:opacity-0': !isItemActive(collection._id),
                          'opacity-0': isItemActive(collection._id),
                        },
                      )}
                    >
                      {collection._creationTime && (
                        <span>
                          {formatDistanceToNow(new Date(collection._creationTime), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>

                    {/* RGB Tabs - only shown when hovered */}
                    <div
                      className={cn('transition-opacity duration-200 absolute top-0 left-0', {
                        'opacity-0 group-hover:opacity-100': !isItemActive(collection._id),
                        'opacity-100': isItemActive(collection._id),
                      })}
                    >
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
                  </div>
                </div>
                <div className="flex items-center group">
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
