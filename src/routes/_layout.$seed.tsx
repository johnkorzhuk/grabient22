import {
  createFileRoute,
  retainSearchParams,
  stripSearchParams,
  useLoaderData,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { AppHeader, APP_HEADER_HEIGHT } from '~/components/AppHeader';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection } from '~/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { usePrevious, useThrottledCallback } from '@mantine/hooks';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { validateRowHeight } from '~/lib/utils';
import { MAX_ITEM_HEIGHT, MIN_ITEM_HEIGHT, searchValidatorSchema } from '~/validators';
import { CollectionRow } from '~/components/CollectionRow';
import { SEARCH_DEFAULTS } from '~/constants';
import { deserializeCoeffs } from '~/lib/serialization';
import { redirect } from '@tanstack/react-router';
import { defaultSteps } from '~/components/StepsInput';
import { defaultStyle } from '~/components/StyleSelect';
import { defaultAngle } from '~/components/AngleInput';

export const Route = createFileRoute('/_layout/$seed')({
  component: Home,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
  beforeLoad: ({ params, search }) => {
    try {
      // Try to deserialize the data - if it fails, redirect to home
      deserializeCoeffs(params.seed);
    } catch (error) {
      throw redirect({ to: '/', search });
    }
  },
});

function CollectionsDisplay() {
  const { style, steps, angle } = useSearch({ from: '/_layout/$seed' });

  const { rowHeight } = useSearch({ from: '/_layout' });
  const { seed: encodedSeedData } = useParams({
    from: '/_layout/$seed',
  });

  // TODO: we should do something similar in StepsInput, AngleInput instead of hard coded defaults
  // so the value rendered in the input is the actual default value when select === 'auto'
  const initialSearchDataRef = useRef({
    style: style === 'auto' ? defaultStyle : style,
    steps: steps === 'auto' ? defaultSteps : steps,
    angle: angle === 'auto' ? defaultAngle : angle,
  });

  // // We know this will succeed because we validated it in beforeLoad
  const { coeffs, globals } = deserializeCoeffs(encodedSeedData);
  const collections = [
    {
      coeffs,
      globals,
      style: style === 'auto' ? initialSearchDataRef.current.style : style,
      steps: steps === 'auto' ? initialSearchDataRef.current.steps : steps,
      angle: angle === 'auto' ? initialSearchDataRef.current.angle : angle,
      _id: 'param',
      seed: encodedSeedData,
    },
  ] as AppCollection[];

  const navigate = useNavigate({ from: '/$seed' });
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
      <AppHeader style={style} steps={steps} angle={angle} isDataRoute />
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
              searchParams={{ style, steps, angle }}
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
