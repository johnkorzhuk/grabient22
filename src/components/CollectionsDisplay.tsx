import { useNavigate, useParams, useSearch, Link } from '@tanstack/react-router';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useClipboard, useThrottledCallback } from '@mantine/hooks';
import { useState, useRef } from 'react';
import type { AppCollection } from '~/types';
import { cn } from '~/lib/utils';
import { Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

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

          // Create a ref to store the current CSS for this gradient
          const gradientCssRef = useRef<React.CSSProperties | null>(null);

          return (
            <li
              key={collection._id}
              className={cn(
                'relative group',
                isGridLayout ? 'w-full h-full' : 'h-[var(--row-height)] w-full',
              )}
              onMouseLeave={() => {
                if (!previewSeed) return;
                uiTempStore$.previewSeed.set(null);
              }}
            >
              <GradientPreview
                processedCoeffs={processedCoeffs}
                initialStyle={collection.style}
                initialAngle={collection.angle}
                initialSteps={collection.steps}
                onCssGenerated={(css) => {
                  gradientCssRef.current = css;
                }}
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
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                {/* Like button container - preserving original styling */}
                <div className="bg-background/20 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {Boolean(collection.likes) && (
                    <span className="font-medium relative bottom-[5.5px] pl-2 pr-2 select-none">
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

                <CopyButton gradientCssRef={gradientCssRef} />
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

interface CopyButtonProps {
  gradientCssRef: React.RefObject<React.CSSProperties | null>;
}

function CopyButton({ gradientCssRef }: CopyButtonProps) {
  const clipboard = useClipboard({ timeout: 1000 });

  const handleCopy = () => {
    if (gradientCssRef.current && gradientCssRef.current.background) {
      const cssString = `background: ${gradientCssRef.current.background};`;
      clipboard.copy(cssString);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <div className="bg-background/20 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center px-0.5">
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className="p-1 cursor-pointer"
              aria-label="Copy gradient CSS"
            >
              {clipboard.copied ? (
                <Check
                  className="w-5 h-5 transition-colors hover:text-foreground focus:text-foreground active:text-foreground"
                  style={{ transition: 'color 0.2s' }}
                />
              ) : (
                <Copy
                  className="w-5 h-5 transition-colors hover:text-foreground focus:text-foreground active:text-foreground"
                  style={{ transition: 'color 0.2s' }}
                />
              )}
            </button>
          </TooltipTrigger>
        </div>
        <TooltipContent>
          <p>{clipboard.copied ? 'Copied!' : 'Copy CSS'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
