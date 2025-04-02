import {
  createFileRoute,
  stripSearchParams,
  useLoaderData,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { AppHeader, APP_HEADER_HEIGHT } from '~/components/AppHeader';
import { applyGlobals, getCoeffs } from '~/lib/cosineGradient';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection } from '~/types';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useDebouncedCallback, useHover, usePrevious } from '@mantine/hooks';
import * as v from 'valibot';
import { Separator } from '~/components/ui/serpator';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Constants
const SEARCH_DEFAULTS = {
  itemHeight: 25,
};

const MIN_ITEM_HEIGHT = 20;
const MAX_ITEM_HEIGHT = 100 - MIN_ITEM_HEIGHT;

// Validators
const itemHeightValidator = v.pipe(
  v.number(),
  v.minValue(MIN_ITEM_HEIGHT),
  v.maxValue(MAX_ITEM_HEIGHT),
);

const searchValidatorSchema = v.object({
  itemHeight: v.optional(
    v.fallback(itemHeightValidator, SEARCH_DEFAULTS.itemHeight),
    SEARCH_DEFAULTS.itemHeight,
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
    return await fetchCollections();
  },
});

// Gradient Item component
function GradientItem({
  collection,
  itemHeight,
  onAnchorStateChange,
  index,
}: {
  collection: AppCollection;
  itemHeight: number;
  onAnchorStateChange: (
    centerY: number | null,
    index: number,
    element: HTMLDivElement | null,
  ) => void;
  index: number;
}) {
  const processedCoeffs = applyGlobals(getCoeffs(collection.coeffs), collection.globals);
  const { hovered, ref } = useHover<HTMLDivElement>();

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
    <li className="relative" data-id={collection._id}>
      <div
        style={{
          height: `calc((100vh - ${APP_HEADER_HEIGHT}px) * ${itemHeight} / 100)`,
          background: `linear-gradient(90deg, 
            rgb(${processedCoeffs[0][0] * 255}, ${processedCoeffs[0][1] * 255}, ${processedCoeffs[0][2] * 255}),
            rgb(${processedCoeffs[1][0] * 255}, ${processedCoeffs[1][1] * 255}, ${processedCoeffs[1][2] * 255})
          )`,
        }}
      ></div>
      <Separator ref={ref} />
    </li>
  );
}

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
  const [localItemHeight, setLocalItemHeight] = useState<number>(searchData.itemHeight);
  const prevItemHeight = usePrevious(localItemHeight);
  const viewPortHeight = typeof window !== 'undefined' ? window.innerHeight - APP_HEADER_HEIGHT : 0;
  const itemHeightPx = viewPortHeight * (localItemHeight / 100);

  // Calculate the dynamic top position using localItemHeight
  let resizableContainerTop = 0;
  if (resizeAnchorYPos !== null && viewPortHeight > 0) {
    resizableContainerTop = resizeAnchorYPos - APP_HEADER_HEIGHT - itemHeightPx;
  }

  // Effect to sync URL state to local state when URL changes
  useEffect(() => {
    setLocalItemHeight(searchData.itemHeight);
  }, [searchData.itemHeight]);

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
    const oldItemHeightPx = viewportHeight * (localItemHeight / 100);

    // Get the element's position relative to the viewport
    const elementRect = element.getBoundingClientRect();
    const scrollContainerRect = scrollContainer.getBoundingClientRect();

    // Calculate the element's position relative to the top of the viewport
    const viewportRelativePosition = elementRect.top - scrollContainerRect.top;

    // Calculate the total scroll height
    const totalHeight = collections.length * oldItemHeightPx;

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
    const parsed = v.safeParse(itemHeightValidator, truncatedValue);

    let finalHeight = truncatedValue;

    if (!parsed.success && parsed.issues && parsed.issues.length > 0) {
      const rangeIssue = parsed.issues.find(
        (issue) => issue.type === 'min_value' || issue.type === 'max_value',
      );

      if (rangeIssue) {
        finalHeight = rangeIssue.requirement;
      }
    }

    // Mark resize as in progress
    resizeInProgressRef.current = true;

    // Only capture position once at the start of resize
    if (!isScrollingRef.current) {
      captureItemPosition();
      isScrollingRef.current = true;
    }

    // Update local state immediately for responsive UI
    setLocalItemHeight(finalHeight);

    // Debounced update to URL
    debouncedUpdateURL(finalHeight);
  };

  // Function to adjust scroll position on resize
  const adjustScrollPosition = () => {
    if (
      !scrollContainerRef.current ||
      !activeItemPositionRef.current ||
      prevItemHeight === localItemHeight ||
      activeItemIndex === null
    ) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const positionData = activeItemPositionRef.current;
    const viewportHeight = window.innerHeight - APP_HEADER_HEIGHT;
    // const oldItemHeightPx = (viewportHeight * (prevItemHeight || localItemHeight)) / 100;
    const newItemHeightPx = viewportHeight * (localItemHeight / 100);

    // Calculate the new total height
    const newTotalHeight = collections.length * newItemHeightPx;

    // Calculate where the item should be positioned in the new layout
    const newItemTopPosition = positionData.itemIndex * newItemHeightPx;

    // Add one newItemHeightPx to the target scroll position
    const targetScrollPosition =
      newItemTopPosition - positionData.viewportRelativePosition + newItemHeightPx;

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

  // Use layout effect to apply scroll adjustments after render but before paint
  useLayoutEffect(() => {
    if (resizeInProgressRef.current) {
      adjustScrollPosition();
    }
  }, [localItemHeight, collections.length]);

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

  // Debounced function to update URL state
  const debouncedUpdateURL = useDebouncedCallback((height: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        itemHeight: height,
      }),
      replace: true,
    });

    setTimeout(() => {
      resizeInProgressRef.current = false;
    }, 100);
  }, 150);

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
            <GradientItem
              key={collection._id}
              collection={collection}
              itemHeight={localItemHeight}
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
              defaultSize={localItemHeight}
              minSize={MIN_ITEM_HEIGHT}
              maxSize={MAX_ITEM_HEIGHT}
              onResize={handleResize}
              className="pointer-events-none"
            >
              <div className="h-full relative"></div>
            </ResizablePanel>

            <ResizableHandle className="cursor-ns-resize h-2 pointer-events-auto invisible" />

            <ResizablePanel
              defaultSize={100 - localItemHeight}
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
