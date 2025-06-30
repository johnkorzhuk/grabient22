import { useSearch, Link, useLocation } from '@tanstack/react-router';
import { SquarePen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { collectionStore$ } from '~/stores/collection';
import { CollectionSeedDisplay } from './CollectionSeedDisplay';
import { serializeCoeffs } from '~/lib/serialization';
import { DEFAULT_COLLECTION_PAGE_SIZE } from '~/routes/_layout';
import { useEffect, useRef } from 'react';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  likedSeeds?: Record<string, boolean>;
  likesPending: boolean;
  isLoading?: boolean;
};

export const CollectionsDisplay = observer(function CollectionsDisplay({
  collections: initialCollections,
  likedSeeds,
  likesPending,
  isLoading = false,
}: CollectionsDisplayProps) {
  const { style, steps, angle } = useSearch({ from: '/_layout' });

  const storeCollections = use$(collectionStore$.collections);
  const hasUserModifiedStore = useRef(false);

  // Only update store when not loading AND when the data has actually changed
  useEffect(() => {
    if (!isLoading) {
      // Reset the modification flag when we get fresh data
      hasUserModifiedStore.current = false;
      collectionStore$.collections.set(initialCollections);
    }
  }, [initialCollections, isLoading]);

  // Use initialCollections unless the user has made modifications
  // This prevents the jarring transition during loading
  const collections =
    hasUserModifiedStore.current && storeCollections.length > 0
      ? storeCollections
      : initialCollections;

  const onChannelOrderChange = (newCoeffs: AppCollection['coeffs'], collection: AppCollection) => {
    // Generate new seed from the updated coefficients
    const newSeed = serializeCoeffs(newCoeffs, collection.globals);

    // Find the collection in the current collections array
    const collectionIndex = collections.findIndex((c) => String(c._id) === String(collection._id));
    const initialCollection = collections.find((c) => String(c._id) === String(collection._id));

    if (collectionIndex !== -1) {
      // Create a new array with the updated collection
      const updatedCollections = [...collections];
      updatedCollections[collectionIndex] = {
        ...collections[collectionIndex],
        coeffs: newCoeffs,
        seed: newSeed,
        // Reset likes to 0 since this is now a different gradient
        likes: newSeed !== initialCollection?.seed ? 0 : initialCollection?.likes || 0,
      };

      // Mark that the user has modified the store
      hasUserModifiedStore.current = true;

      // Update the store for reactivity
      collectionStore$.collections.set(updatedCollections);
    }
  };

  return (
    <section className="h-full w-full relative">
      <ol
        className={cn(
          'h-full w-full relative px-5 lg:px-14',
          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-10 gap-y-20 auto-rows-[300px]',
        )}
      >
        {/* Always render existing collections first */}
        {collections.map((collection, index) => {
          const activeCollectionId = use$(uiTempStore$.activeCollectionId);
          const itemActive = activeCollectionId === collection._id;

          // Calculate values needed for action buttons
          const previewStyle = use$(uiTempStore$.previewStyle);
          const previewSteps = use$(uiTempStore$.previewSteps);
          const previewAngle = use$(uiTempStore$.previewAngle);
          const previewSeed = use$(uiTempStore$.previewSeed);

          const stepsToUse =
            previewSteps !== null ? previewSteps : steps === 'auto' ? collection.steps : steps;

          const styleToUse =
            previewStyle !== null ? previewStyle : style === 'auto' ? collection.style : style;
          const angleToUse =
            previewAngle !== null || angle !== 'auto'
              ? (previewAngle ??
                (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : collection.angle))
              : collection.angle;

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
                steps={stepsToUse}
                angle={angleToUse}
                onChannelOrderChange={onChannelOrderChange}
                itemActive={itemActive}
                likesPending={likesPending}
              >
                {/* Top-left Details button */}
                <div
                  className={cn('absolute top-3.5 left-3.5 z-10 transition-opacity', {
                    'opacity-0 group-hover:opacity-100': !itemActive,
                    'opacity-100': itemActive,
                  })}
                >
                  <Link
                    to="/$seed"
                    params={{
                      seed: collection.seed,
                    }}
                    search={(search) => {
                      return {
                        ...search,
                        angle: angle === 'auto' ? collection.angle : search.angle,
                        style: style === 'auto' ? collection.style : search.style,
                        steps: steps === 'auto' ? collection.steps : search.steps,
                      };
                    }}
                    className="block text-foreground/80 hover:text-foreground transition-colors"
                    aria-label={`View details for gradient ${index + 1}`}
                  >
                    <div className="bg-background/20 backdrop-blur-sm rounded-md transition-all flex items-center justify-center px-0.5 z-10 h-8 w-9 hover:bg-background/40">
                      <div className="p-1.5 rounded-full transition-colors cursor-pointer hover:text-foreground">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SquarePen className="w-5 h-5 text-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>Edit Palette</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </Link>
                </div>
              </CollectionSeedDisplay>
            </li>
          );
        })}

        {/* Render placeholder items when loading more */}
        {isLoading && (
          <>
            {Array.from({ length: DEFAULT_COLLECTION_PAGE_SIZE }).map((_, index) => (
              <li key={`placeholder-${index}`} className="w-full relative">
                {/* Gradient placeholder with border and animation */}
                <div className="h-[300px] w-full rounded-lg border-2 border-muted animate-pulse">
                  {/* Empty div with just a border and animation */}
                </div>

                {/* Like button placeholder */}
                <div className="flex justify-between pt-4 relative">
                  <div className="flex items-center">{/* Empty space for RGB tabs */}</div>
                  <div className="flex items-center min-h-[28px]">
                    {/* Non-interactive like button */}
                    <div className="relative text-muted-foreground">
                      <div className="rounded-full cursor-not-allowed opacity-50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5.5 h-5.5"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </>
        )}
      </ol>
    </section>
  );
});
