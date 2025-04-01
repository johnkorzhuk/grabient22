import {
  createFileRoute,
  stripSearchParams,
  useLoaderData,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { AppHeader } from '~/components/AppHeader';
import { applyGlobals, getCoeffs } from '~/lib/cosineGradient';
import { fetchCollections } from '~/lib/fetchCollections';
import type { AppCollection } from '~/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useDebouncedCallback, useElementSize } from '@mantine/hooks';
import * as v from 'valibot';

const searchDefaults = {
  itemHeight: 25,
};

const minItemHeight = 20;

const itemHeightValidator = v.pipe(v.number(), v.minValue(minItemHeight), v.maxValue(100));

const searchValidatorSchema = v.object({
  itemHeight: v.optional(
    v.fallback(itemHeightValidator, searchDefaults.itemHeight),
    searchDefaults.itemHeight,
  ),
});

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(searchDefaults)],
  },
  loader: async () => {
    const data = await fetchCollections();

    return data;
  },
});

function GradientSwatch({ collection }: { collection: AppCollection }) {
  const processedCoeffs = applyGlobals(getCoeffs(collection.coeffs, false), collection.globals);

  const gradientStyle = {
    background: `linear-gradient(90deg, 
      rgb(${processedCoeffs[0][0] * 255}, ${processedCoeffs[0][1] * 255}, ${processedCoeffs[0][2] * 255}),
      rgb(${processedCoeffs[1][0] * 255}, ${processedCoeffs[1][1] * 255}, ${processedCoeffs[1][2] * 255})
    )`,
  };

  return (
    <div className="flex min-h-[200px] flex-col gap-4 transition-all hover:shadow-md">
      <div className="flex-1 rounded-md" style={gradientStyle} />
    </div>
  );
}
function CollectionsDisplay() {
  const loaderData = useLoaderData({
    from: '/',
  }) as AppCollection[];
  const { ref, height: headerHeight } = useElementSize();
  const searchData = useSearch({
    from: '/',
  });

  const navigate = useNavigate({
    from: '/',
  });

  const handlePanelResize = useDebouncedCallback(([_itemHeight]: number[]) => {
    // Truncate to 2 decimal places by using toFixed and converting back to number
    const truncatedValue = Number(Number(_itemHeight).toFixed(1));

    const parsed = v.safeParse(itemHeightValidator, truncatedValue);
    let itemHeight = truncatedValue;

    if (!parsed.success && parsed.issues && parsed.issues.length > 0) {
      // Find the first range issue (min_value or max_value)
      const rangeIssue = parsed.issues.find(
        (issue) => issue.type === 'min_value' || issue.type === 'max_value',
      );

      // If a range issue is found, use its requirement value
      if (rangeIssue) {
        itemHeight = rangeIssue.requirement;
      }
    }

    navigate({
      search: (prev) => ({
        ...prev,
        itemHeight,
      }),
      replace: true,
    });
  }, 100);

  // Calculate the total available height (viewport height minus header height)
  const availableHeight = headerHeight ? `calc(100vh - ${headerHeight}px)` : '100vh';

  return (
    <div className="min-h-screen">
      <AppHeader ref={ref} />
      <main className="mx-auto w-full">
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-screen"
          style={{
            height: availableHeight,
          }}
          onLayout={handlePanelResize}
        >
          <ResizablePanel defaultSize={searchData.itemHeight} minSize={minItemHeight}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Header</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={100 - searchData.itemHeight}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Content</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

function Home() {
  return <CollectionsDisplay />;
}
