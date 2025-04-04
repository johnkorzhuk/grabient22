import {
  createFileRoute,
  stripSearchParams,
  useLoaderData,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { AppHeader, APP_HEADER_HEIGHT } from '~/components/AppHeader';
import {
  applyGlobals,
  getCoeffs,
  getCollectionStyleCSS,
  cosineGradient,
} from '~/lib/cosineGradient';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection, CollectionStyle } from '~/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useHover, usePrevious, useThrottledCallback } from '@mantine/hooks';
import * as v from 'valibot';
import { Separator } from '~/components/ui/serpator';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { validateRowHeight } from '~/lib/utils';
import { collectionStyleValidator, uiStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';

const SEARCH_DEFAULTS = {
  rowHeight: 25,
  style: 'auto' as const,
  steps: 'auto' as const,
};

export const MIN_STEPS = 2;
export const MAX_STEPS = 50;
export const stepsValidator = v.pipe(v.number(), v.minValue(MIN_STEPS), v.maxValue(MAX_STEPS));
export const stepsWithAutoValidator = v.union([v.literal('auto'), stepsValidator]);

export const MIN_ITEM_HEIGHT = 10;
export const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;
export const rowHeightValidator = v.pipe(
  v.number(),
  v.minValue(MIN_ITEM_HEIGHT),
  v.maxValue(MAX_ITEM_HEIGHT),
);

// Updated validator that accepts 'auto' or a CollectionStyle
export const styleValidator = v.union([v.literal('auto'), collectionStyleValidator]);

const searchValidatorSchema = v.object({
  rowHeight: v.optional(
    v.fallback(rowHeightValidator, SEARCH_DEFAULTS.rowHeight),
    SEARCH_DEFAULTS.rowHeight,
  ),
  style: v.optional(v.fallback(styleValidator, SEARCH_DEFAULTS.style), SEARCH_DEFAULTS.style),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, SEARCH_DEFAULTS.steps),
    SEARCH_DEFAULTS.steps,
  ),
});

// Route definition
export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
  loader: async () => {
    const data = await fetchCollections();
    return data;
    // return data.slice(0, 5);
  },
  headers: () => {
    return {
      'cache-control': 'public, max-age=3600, must-revalidate', // 1 hour
      'cdn-cache-control': 'public, max-age=3600, stale-while-revalidate=1800, durable', // 1 hour + 30min stale
      // from https://github.com/TanStack/tanstack.com/blob/5ee97b505d0f9ef3fdbff12a5f70cfaad60a795a/app/routes/%24libraryId/%24version.docs.tsx#L37
      // 'cache-control': 'public, max-age=0, must-revalidate',
      // 'cdn-cache-control': 'max-age=300, stale-while-revalidate=300, durable',
    };
  },
});

const CollectionRow = observer(function CollectionRow({
  collection,
  rowHeight,
  onAnchorStateChange,
  index,
}: {
  collection: AppCollection;
  rowHeight: number;
  onAnchorStateChange: (
    centerY: number | null,
    index: number,
    element: HTMLDivElement | null,
  ) => void;
  index: number;
}) {
  const searchData = useSearch({ from: '/' });
  const { hovered, ref } = useHover<HTMLDivElement>();
  const previewStyle = use$(uiStore$.previewStyle);
  const previewSteps = use$(uiStore$.previewSteps);

  // Process coefficients
  const processedCoeffs = applyGlobals(getCoeffs(collection.coeffs), collection.globals);

  // Determine steps to use (collection's native steps or from URL/preview)
  const stepsToUse =
    previewSteps !== null || searchData.steps !== 'auto'
      ? (previewSteps ?? searchData.steps)
      : collection.steps;

  // Use our custom gradient generator with the determined number of steps
  const numStops = stepsToUse === 'auto' ? collection.steps : stepsToUse;
  const gradientColors = cosineGradient(numStops, processedCoeffs);

  // Effect for hover state
  useEffect(() => {
    if (hovered && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      onAnchorStateChange(centerY, index, ref.current);
    } else if (!hovered) {
      onAnchorStateChange(null, index, null);
    }
  }, [hovered, index, onAnchorStateChange]);

  return (
    <li
      className="relative"
      style={{
        height: `calc((100vh - ${APP_HEADER_HEIGHT}px) * ${rowHeight} / 100)`,
        ...getCollectionStyleCSS(
          // If preview style is 'auto', use the collection's native style
          // Otherwise use the selected style (preview or from search data)
          (previewStyle || searchData.style) === 'auto'
            ? collection.style // Use collection's style with fallback
            : previewStyle || (searchData.style as CollectionStyle),
          gradientColors,
        ),
      }}
    >
      <Separator ref={ref} />
    </li>
  );
});

function CollectionsDisplay() {
  const collections = useLoaderData({ from: '/' }) as AppCollection[];
  const searchData = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
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

  // Add local state for immediate updates
  // Initialize with URL state as source of truth
  const [localRowHeight, setLocalRowHeight] = useState<number>(searchData.rowHeight);
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
    setLocalRowHeight(searchData.rowHeight);
  }, [searchData.rowHeight]);

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
    const finalHeight = validateRowHeight(MIN_ITEM_HEIGHT, MAX_ITEM_HEIGHT)(truncatedValue);

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
    <>
      <AppHeader />
      <main
        className="mx-auto w-full relative overflow-hidden"
        style={{
          marginTop: `${APP_HEADER_HEIGHT}px`,
          height: `calc(100vh - ${APP_HEADER_HEIGHT}px)`,
        }}
      >
        <ul className="h-full w-full overflow-auto" ref={scrollContainerRef}>
          {collections.map((collection, index) => (
            <CollectionRow
              key={collection._id}
              collection={collection}
              rowHeight={localRowHeight}
              onAnchorStateChange={handleAnchorStateChange}
              index={index}
            />
          ))}
        </ul>

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
              minSize={MIN_ITEM_HEIGHT}
              maxSize={MAX_ITEM_HEIGHT}
              onResize={handleResize}
              className="pointer-events-none"
            >
              <div className="h-full relative"></div>
            </ResizablePanel>

            <ResizableHandle className="cursor-ns-resize h-2 pointer-events-auto invisible" />

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
      </main>
    </>
  );
}

function Home() {
  return <CollectionsDisplay />;
}
