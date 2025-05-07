import { useParams, useSearch, Link, useLocation } from '@tanstack/react-router';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { applyGlobals, cosineGradient } from '~/lib/cosineGradient';
import { GradientPreview } from './GradientPreview';
import { LikeButton } from './LikeButton';
import { getCollectionStyleSVG } from '~/lib/getCollectionStyleSVG';
import { getCollectionStyleCSS } from '~/lib/getCollectionStyleCSS';
import { CopyButton } from './CopyButton';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  likedSeeds?: Record<string, boolean>;
};

export const FixedCollectionDisplay = observer(function CollectionsDisplay({
  collections,
  likedSeeds,
}: CollectionsDisplayProps) {
  const { seed } = useParams({ from: '/_layout/$seed' });
  const { href } = useLocation();
  const { style, steps, angle } = useSearch({ from: '/_layout' });
  const previewSeed = use$(uiTempStore$.previewSeed);
  const previewStyle = 'linearSwatches';
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewAngle = 90;

  return (
    <section className="h-full w-full overflow-auto relative">
      <ul className={cn('h-full w-full relative')}>
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
              <li key={collection._id} className={cn('relative', 'h-[44px] w-full')}>
                <div className="relative h-full w-full overflow-hidden">
                  <GradientPreview cssProps={styles} />
                </div>
              </li>
            );
          }

          return (
            <li
              key={collection._id}
              className={cn('relative group', 'h-[44px] w-full')}
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
              <div className="absolute top-2 left-2 z-10 bg-background/20 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
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
              <div className="absolute top-1.5 right-2 z-10 flex gap-2">
                {/* Like button container - preserving original styling */}
                <div className="bg-background/20 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {Boolean(collection.likes) && (
                    <span className="font-medium relative bottom-[5px] pl-2 pr-2 select-none">
                      {collection.likes}
                    </span>
                  )}
                  <LikeButton
                    className="relative -bottom-[1px]"
                    seed={collection.seed}
                    isLiked={Boolean(likedSeeds?.[collection.seed])}
                    pending={false}
                    collectionSteps={collection.steps}
                    collectionStyle={collection.style}
                    collectionAngle={collection.angle}
                  />
                </div>

                <CopyButton cssString={cssString} svgString={svgString} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
