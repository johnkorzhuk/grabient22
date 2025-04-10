import { useNavigate, useParams, useSearch, Link } from '@tanstack/react-router';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useThrottledCallback } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import { CollectionRow } from '~/components/CollectionRow';
import type { AppCollection } from '~/types';
import { APP_HEADER_HEIGHT } from '~/components/AppHeader';

import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { MAX_ITEM_HEIGHT, MIN_ITEM_HEIGHT, validateRowHeight } from '~/validators';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  isSeedRoute?: boolean;
};

export const CollectionsDisplay = observer(function CollectionsDisplay({
  collections,
  isSeedRoute,
}: CollectionsDisplayProps) {
  const paramsResult = useParams({
    from: isSeedRoute ? '/_layout/$seed' : '/_layout/',
  });
  const { seed } = paramsResult && 'seed' in paramsResult ? paramsResult : { seed: undefined };
  const navigate = useNavigate({ from: isSeedRoute ? '/$seed' : '/' });
  const { rowHeight } = useSearch({
    from: '/_layout',
  });

  const scrollContainerRef = useRef<HTMLUListElement>(null);

  const previewCollection = use$(uiTempStore$.previewCollection);
  const [localRowHeight, setLocalRowHeight] = useState<number>(rowHeight);

  // Effect to sync URL state to local state when URL changes
  useEffect(() => {
    setLocalRowHeight(rowHeight);
  }, [rowHeight]);

  const handleResize = (newHeight: number) => {
    const truncatedValue = Number(newHeight.toFixed(1));
    const finalHeight = validateRowHeight(MIN_ITEM_HEIGHT, MAX_ITEM_HEIGHT)(truncatedValue);

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
    <ul
      className="h-full w-full overflow-auto relative"
      ref={scrollContainerRef}
      onMouseLeave={() => {
        if (!previewCollection) return;
        uiTempStore$.previewCollection.set(null);
      }}
    >
      {collections.map((collection, index) => {
        const isCurrentSeed = seed !== undefined && collection.seed === seed;

        if (isCurrentSeed) {
          return (
            <CollectionRow
              key={collection._id}
              collection={collection}
              rowHeight={localRowHeight}
            />
          );
        }

        return (
          <li key={collection._id} className="contents" style={{ display: 'contents' }}>
            <Link
              to="/$seed"
              params={{
                seed: collection.seed,
              }}
              search={(search) => {
                return search;
              }}
              replace={isSeedRoute}
              aria-label={`Gradient ${index + 1}`}
              className="block"
            >
              <CollectionRow collection={collection} rowHeight={localRowHeight} />
            </Link>
          </li>
        );
      })}

      {/* Resizable panel overlay - only affects the first item */}
      {collections.length > 0 && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: `calc(100vh - ${APP_HEADER_HEIGHT}px)`,
            overflow: 'hidden',
          }}
        >
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel
              defaultSize={localRowHeight}
              minSize={MIN_ITEM_HEIGHT}
              maxSize={MAX_ITEM_HEIGHT}
              onResize={handleResize}
              className="pointer-events-none"
            >
              <div className="h-full relative"></div>
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
    </ul>
  );
});
