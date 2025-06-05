import type { ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { observer, use$ } from '@legendapp/state/react';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { applyGlobals, cosineGradient } from '~/lib/cosineGradient';
import { GradientPreview } from './GradientPreview';
import { LikeButton } from './LikeButton';
import { getCollectionStyleCSS } from '~/lib/getCollectionStyleCSS';
import { getCollectionStyleSVG } from '~/lib/getCollectionStyleSVG';
import { CopyButton } from './CopyButton';
import { RGBTabs } from './RGBTabs';
import type { collectionStyleValidator, stepsValidator, angleValidator } from '~/validators';
import * as v from 'valibot';

type CollectionSeedDisplayProps = {
  collection: AppCollection;
  index: number;
  likedSeeds?: Record<string, boolean>;
  style: v.InferOutput<typeof collectionStyleValidator>;
  steps: v.InferOutput<typeof stepsValidator>;
  angle: v.InferOutput<typeof angleValidator>;
  href: string;
  children?: ReactNode;
  onChannelOrderChange: (coeffs: AppCollection['coeffs'], collection: AppCollection) => void;
  renderChannelTabs?: boolean;
  itemActive: boolean;
  className?: string;
  likesPending: boolean;
};

export const CollectionSeedDisplay = observer(function CollectionSeedDisplay({
  collection,
  likedSeeds,
  onChannelOrderChange,
  style,
  steps,
  angle,
  href,
  children,
  index,
  renderChannelTabs = false,
  itemActive,
  className,
  likesPending = true,
}: CollectionSeedDisplayProps) {
  const previewColorIndex = use$(uiTempStore$.previewColorIndex);
  const processedCoeffs = applyGlobals(collection.coeffs, collection.globals);
  const gradientColors = cosineGradient(steps, processedCoeffs);
  
  // If the seed exists as a key in likedSeeds, we can assume it's in the original order
  const isOriginalOrder = likedSeeds ? Object.hasOwn(likedSeeds, collection.seed) : false;
  const { styles, cssString } = getCollectionStyleCSS(
    style,
    gradientColors,
    angle,
    {
      seed: collection.seed,
      href,
    },
    previewColorIndex,
  );

  const svgString = getCollectionStyleSVG(style, gradientColors, angle, {
    seed: collection.seed,
    href,
  });

  return (
    <>
      {/* Gradient container with fixed height */}
      <div
        className={cn('relative h-[300px] w-full group', className)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (itemActive) uiTempStore$.activeCollectionId.set(null);
            else uiTempStore$.activeCollectionId.set(collection._id);
          }
        }}
      >
        {/* Hover/active effect - subtle glow that extends beyond boundaries */}
        <div
          className={cn(
            'absolute -inset-3 transition-opacity duration-300 z-0 pointer-events-none blur-lg rounded-xl',
            {
              'opacity-0 group-hover:opacity-40': !itemActive,
              'opacity-40': itemActive,
            },
          )}
          aria-hidden="true"
        >
          <GradientPreview cssProps={styles} className="rounded-xl" />
        </div>

        {/* Main gradient preview */}
        <figure
          className="relative z-10 h-full w-full overflow-hidden rounded-xl border border-gray-500/10"
          role="img"
          aria-label={`Gradient preview with ${gradientColors.length} color stops using gradient ${index + 1}`}
        >
          <GradientPreview cssProps={styles} className="rounded-xl" />
          <figcaption className="sr-only">
            Gradient preview for gradient ${index + 1}, created{' '}
            {collection._creationTime &&
              formatDistanceToNow(new Date(collection._creationTime), { addSuffix: true })}
          </figcaption>
        </figure>

        {/* Action buttons passed from parent */}
        {children}

        {/* Top-right buttons */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <CopyButton
            cssString={cssString}
            svgString={svgString}
            isActive={itemActive}
            onOpen={() => {
              // Always set this item as active, don't toggle
              if (!itemActive) {
                uiTempStore$.activeCollectionId.set(collection._id);
              }
            }}
          />
        </div>

        {/* Bottom tag matches - only show if seed is in likedSeeds */}
        {collection.tagMatches && collection.tagMatches.length > 0 && isOriginalOrder && (
          <div
            className={cn('absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 transition-opacity group/tags', {
              'opacity-0 group-hover:opacity-100': !itemActive,
              'opacity-100': itemActive,
            })}
          >
            {collection.tagMatches.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs font-medium text-foreground select-none lowercase rounded-md bg-background/20 backdrop-blur-sm group-hover/tags:bg-background/40 transition-colors duration-200 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Like button and count moved below the gradient container - always visible */}
      <div className="flex justify-between pt-4 relative">
        <div className="flex items-center">
          {/* RGB Tabs with better positioning using Tailwind */}
          <div
            className={cn(
              'transition-all duration-200 z-10',
              renderChannelTabs || itemActive
                ? 'visible opacity-100'
                : 'invisible opacity-0 group-hover:visible group-hover:opacity-100',
            )}
            aria-label="Color channel controls"
          >
            <RGBTabs collection={collection} onOrderChange={onChannelOrderChange} />
          </div>

          {/* Timestamp as absolute text that only shows when needed */}
          {!renderChannelTabs && collection._creationTime && (
            <span
              className={cn(
                'text-sm text-muted-foreground transition-all duration-50 absolute left-0',
                itemActive ? 'invisible' : 'visible group-hover:invisible',
              )}
            >
              {formatDistanceToNow(new Date(collection._creationTime), {
                addSuffix: false,
              }).replace('about', '')}
            </span>
          )}
        </div>
        <div
          className="flex items-center group min-h-[28px]"
          aria-label={`${Boolean(likedSeeds?.[collection.seed]) ? 'Unlike' : 'Like'} gradient ${collection.seed}. Currently has ${collection.likes || 0} likes`}
        >
          {Boolean(collection.likes) && (
            <span className="font-medium pr-4 select-none text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {collection.likes}
            </span>
          )}
          <LikeButton
            className="relative text-muted-foreground group-hover:text-foreground transition-colors duration-200"
            seed={collection.seed}
            isLiked={Boolean(likedSeeds?.[collection.seed])}
            pending={likesPending}
            collectionSteps={collection.steps}
            collectionStyle={collection.style}
            collectionAngle={collection.angle}
          />
        </div>
      </div>
    </>
  );
});
