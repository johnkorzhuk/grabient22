import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { usePrevious, useThrottledCallback } from '@mantine/hooks';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { validateRowHeight } from '~/lib/utils';
import { CollectionRow } from '~/components/CollectionRow';
import type { AppCollection } from '~/types';
import { APP_HEADER_HEIGHT } from '~/components/AppHeader';
import {
  MIN_ITEM_HEIGHT as SEED_MIN_ITEM_HEIGHT,
  MAX_ITEM_HEIGHT as SEED_MAX_ITEM_HEIGHT,
} from '~/routes/_layout/_seedLayout';
import {
  MIN_ITEM_HEIGHT as ROOT_MIN_ITEM_HEIGHT,
  MAX_ITEM_HEIGHT as ROOT_MAX_ITEM_HEIGHT,
} from '~/routes/_layout/index';

type CollectionsDisplayProps = {
  collections: AppCollection[];
  isSeedRoute?: boolean;
};

export function CollectionsDisplay({ collections, isSeedRoute = false }: CollectionsDisplayProps) {
  const navigate = useNavigate({ from: isSeedRoute ? '/$seed' : '/' });
  const { style, steps, angle, rowHeight } = useSearch({
    from: isSeedRoute ? '/_layout/_seedLayout' : '/_layout/',
  });

  const [resizeAnchorYPos, setResizeAnchorYPos] = useState<null | number>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<null | number>(null);
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const activeElementRef = useRef<HTMLDivElement | null>(null);
  const resizeInProgressRef = useRef<boolean>(false);
  const activeItemPositionRef = useRef<{
    // Position of the element relative to the top of the viewport
    viewportRelativePosition: number;
    // The item's index
    itemIndex: number;
    // The scroll position at the time of capture
    scrollTop: number;
    // The total scroll height at time of capture
    totalHeight: number;
    // Viewport height at time of capture
    viewportHeight: number;
  } | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const resizeRequestIdRef = useRef<number | null>(null);
  const minHeight = isSeedRoute ? SEED_MIN_ITEM_HEIGHT : ROOT_MIN_ITEM_HEIGHT;
  const maxHeight = isSeedRoute ? SEED_MAX_ITEM_HEIGHT : ROOT_MAX_ITEM_HEIGHT;

  // Add local state for immediate updates
  // Initialize with URL state as source of truth
  const [localRowHeight, setLocalRowHeight] = useState<number>(rowHeight);
  const prevRowHeight = usePrevious(localRowHeight);
  const viewPortHeight = typeof window !== 'undefined' ? window.innerHeight - APP_HEADER_HEIGHT : 0;
  const rowHeightPx = viewPortHeight * (localRowHeight / 100);

  // Calculate the dynamic top position using localRowHeight
  let resizableContainerTop = 0;
  if (resizeAnchorYPos !== null && viewPortHeight > 0) {
    resizableContainerTop = resizeAnchorYPos - APP_HEADER_HEIGHT - rowHeightPx;
  }

  // Effect to sync URL state to local state when URL changes
  useEffect(() => {
    setLocalRowHeight(rowHeight);
  }, [rowHeight]);

  const handleAnchorStateChange = (
    centerY: number | null,
    index: number,
    element: HTMLDivElement | null,
  ) => {
    if (centerY !== null) {
      setResizeAnchorYPos(centerY);
      setActiveItemIndex(index);
      activeElementRef.current = element;

      // If we're not already in a resize operation, capture the position immediately
      // This ensures we have the most up-to-date position when resize starts
      if (!resizeInProgressRef.current && !isScrollingRef.current) {
        // Reset these refs when a new item is hovered to ensure fresh position data
        activeItemPositionRef.current = null;
        captureItemPosition();
      }
    }
  };

  // This function captures the precise position data we need
  const captureItemPosition = () => {
    if (!scrollContainerRef.current || !activeElementRef.current || activeItemIndex === null) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const element = activeElementRef.current;
    const viewportHeight = window.innerHeight - APP_HEADER_HEIGHT;
    const oldRowHeightPx = viewportHeight * (localRowHeight / 100);

    // Get the element's position relative to the viewport
    const elementRect = element.getBoundingClientRect();
    const scrollContainerRect = scrollContainer.getBoundingClientRect();

    // Calculate the element's position relative to the top of the viewport
    const viewportRelativePosition = elementRect.top - scrollContainerRect.top;

    // Calculate the total scroll height
    const totalHeight = collections.length * oldRowHeightPx;

    // Store all the measurements we'll need for accurate repositioning
    activeItemPositionRef.current = {
      viewportRelativePosition,
      itemIndex: activeItemIndex,
      scrollTop: scrollContainer.scrollTop,
      totalHeight,
      viewportHeight,
    };
  };

  const handleResize = (newHeight: number) => {
    const truncatedValue = Number(newHeight.toFixed(1));
    const finalHeight = validateRowHeight(minHeight, maxHeight)(truncatedValue);

    // Mark resize as in progress
    resizeInProgressRef.current = true;

    // Only capture position once at the start of resize
    if (!isScrollingRef.current) {
      captureItemPosition();
      isScrollingRef.current = true;
    }

    // Update local state immediately for responsive UI
    setLocalRowHeight(finalHeight);

    // Debounced update to URL
    throttledUpdateURL(finalHeight);
  };

  // Function to adjust scroll position on resize
  const adjustScrollPosition = () => {
    if (
      !scrollContainerRef.current ||
      !activeItemPositionRef.current ||
      prevRowHeight === localRowHeight ||
      activeItemIndex === null
    ) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const positionData = activeItemPositionRef.current;
    const viewportHeight = window.innerHeight - APP_HEADER_HEIGHT;
    const newRowHeightPx = viewportHeight * (localRowHeight / 100);

    // Calculate the new total height
    const newTotalHeight = collections.length * newRowHeightPx;

    // Calculate where the item should be positioned in the new layout
    const newItemTopPosition = positionData.itemIndex * newRowHeightPx;
    // Calculate target scroll position without the extra newRowHeightPx
    const targetScrollPosition = newItemTopPosition - positionData.viewportRelativePosition;

    // Calculate bounds for scrolling
    const maxScroll = Math.max(0, newTotalHeight - scrollContainer.clientHeight);

    if (resizeRequestIdRef.current) {
      cancelAnimationFrame(resizeRequestIdRef.current);
    }

    resizeRequestIdRef.current = requestAnimationFrame(() => {
      scrollContainer.scrollTop = Math.max(0, Math.min(targetScrollPosition, maxScroll));
      resizeRequestIdRef.current = null;
    });
  };

  const throttledUpdateURL = useThrottledCallback((height: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        rowHeight: height,
      }),
      replace: true,
    });

    setTimeout(() => {
      resizeInProgressRef.current = false;
    }, 100);
  }, 150);

  // Use layout effect to apply scroll adjustments after render but before paint
  useLayoutEffect(() => {
    if (resizeInProgressRef.current) {
      adjustScrollPosition();
    }
  }, [localRowHeight, collections.length]);

  // Reset scrolling state when resize is complete
  useEffect(() => {
    if (!resizeInProgressRef.current && isScrollingRef.current) {
      const resetTimer = setTimeout(() => {
        isScrollingRef.current = false;
        activeItemPositionRef.current = null;
      }, 100);

      return () => clearTimeout(resetTimer);
    }
  }, [resizeInProgressRef.current]);

  return (
    <ul className="h-full w-full overflow-auto" ref={scrollContainerRef}>
      {collections.map((collection, index) => (
        <Link
          key={collection._id}
          to="/$seed"
          params={{
            seed: collection.seed,
          }}
          search={(s) => {
            return {
              ...s,
              angle: angle === 'auto' ? collection.angle : angle,
              steps: steps === 'auto' ? collection.steps : steps,
              style: style === 'auto' ? collection.style : style,
            };
          }}
          replace={isSeedRoute}
        >
          <CollectionRow
            collection={collection}
            rowHeight={localRowHeight}
            onAnchorStateChange={handleAnchorStateChange}
            index={index}
            isSeedRoute={isSeedRoute}
          />
        </Link>
      ))}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          top: `${resizableContainerTop}px`,
          left: 0,
          right: 0,
          height: `calc(100vh - ${APP_HEADER_HEIGHT}px)`,
          overflow: 'hidden',
        }}
      >
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel
            defaultSize={localRowHeight}
            minSize={minHeight}
            maxSize={maxHeight}
            onResize={handleResize}
            className="pointer-events-none"
          >
            <div className="h-full relative"></div>
          </ResizablePanel>

          <ResizableHandle className="cursor-ns-resize h-2 pointer-events-auto invisible" />

          <ResizablePanel
            defaultSize={100 - localRowHeight}
            minSize={minHeight}
            maxSize={maxHeight}
            className="pointer-events-none"
          >
            <div className="h-full"></div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ul>
  );
}
