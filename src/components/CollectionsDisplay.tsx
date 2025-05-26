import { useSearch, Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { collectionStore$ } from '~/stores/collection';
import { CollectionSeedDisplay } from './CollectionSeedDisplay';
import { serializeCoeffs } from '~/lib/serialization';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  likedSeeds?: Record<string, boolean>;
  likesPending: boolean;
};

export const CollectionsDisplay = observer(function CollectionsDisplay({
  collections: initialCollections,
  likedSeeds,
  likesPending,
}: CollectionsDisplayProps) {
  const { href } = useLocation();
  const { style, steps, angle } = useSearch({ from: '/_layout' });

  let collections = use$(collectionStore$.collections);
  if (!collections.length) {
    collections = initialCollections;
  }

  useEffect(() => {
    collectionStore$.collections.set(initialCollections);
  }, [initialCollections]);

  const onChannelOrderChange = (newCoeffs: AppCollection['coeffs'], collection: AppCollection) => {
    // Generate new seed from the updated coefficients
    const newSeed = serializeCoeffs(newCoeffs, collection.globals);

    // Find the collection in the store and update it
    // Get the current collections array
    const collectionIndex = collections.findIndex((c) => String(c._id) === String(collection._id));
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
        likes: newSeed !== initalCollection?.seed ? 0 : initalCollection?.likes || 0,
      };

      // Update the entire collections array
      collectionStore$.collections.set(updatedCollections);
    }
  };

  return (
    <section className="h-full w-full relative">
      <ol
        className={cn(
          'h-full w-full relative px-5 lg:px-14',
          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-10 gap-y-17 auto-rows-[300px]',
        )}
      >
        {collections.map((collection, index) => {
          const activeCollectionId = use$(uiTempStore$.activeCollectionId);
          const itemActive = activeCollectionId === collection._id;

          // Calculate values needed for action buttons
          const previewStyle = use$(uiTempStore$.previewStyle);
          const previewSteps = use$(uiTempStore$.previewSteps);
          const previewAngle = use$(uiTempStore$.previewAngle);
          const previewSeed = use$(uiTempStore$.previewSeed);

          const stepsToUse =
            previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : collection.steps;
          const styleToUse =
            previewStyle !== null ? previewStyle : style === 'auto' ? collection.style : style;
          const angleToUse =
            previewAngle !== null || angle !== 'auto'
              ? (previewAngle ??
                (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : collection.angle))
              : collection.angle;

          const numStops = steps === 'auto' ? collection.steps : (stepsToUse as number);

          return (
            <li
              key={collection._id}
              className={cn('relative group', 'w-full font-poppins')}
              onClick={() => {
                if (itemActive) uiTempStore$.activeCollectionId.set(null);
                else uiTempStore$.activeCollectionId.set(collection._id);
              }}
              onMouseLeave={() => {
                // Clear preview seed if set
                if (!previewSeed) return;
                uiTempStore$.previewSeed.set(null);
              }}
              tabIndex={0}
              role="button"
              aria-pressed={itemActive}
              aria-label={`${itemActive ? 'Deselect' : 'Select'} gradient ${index + 1} for actions`}
            >
              <CollectionSeedDisplay
                collection={collection}
                index={index}
                likedSeeds={likedSeeds}
                style={styleToUse}
                steps={numStops}
                angle={angleToUse}
                href={href}
                onChannelOrderChange={onChannelOrderChange}
                itemActive={itemActive}
                likesPending={likesPending}
              >
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
                    <span className="relative font-medium">Details</span>
                  </Link>
                </div>
              </CollectionSeedDisplay>
            </li>
          );
        })}
      </ol>
    </section>
  );
});
