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
import { useDebouncedCallback } from '@mantine/hooks';
import * as v from 'valibot';

const searchDefaults = {
  itemHeight: 33,
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

function Gradient({ collection }: { collection: AppCollection }) {
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

  const searchData = useSearch({
    from: '/',
  });

  const navigate = useNavigate({
    from: '/',
  });

  const handlePanelReHeight = useDebouncedCallback(([_itemHeight]: number[]) => {
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

    if (parsed.success) {
      navigate({
        search: (prev) => ({
          ...prev,
          itemHeight,
        }),
        replace: true,
      });
    }
  }, 100);

  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full"
        style={{
          marginTop: `${APP_HEADER_HEIGHT}px`,
          height: `calc(100vh - ${APP_HEADER_HEIGHT}px)`,
        }}
      >
        <ResizablePanelGroup direction="vertical" className="h-full" onLayout={handlePanelReHeight}>
          <ResizablePanel defaultSize={searchData.itemHeight} minSize={minItemHeight}>
            <div className="flex h-full items-center justify-center">
              <span className="font-semibold">Primary swatches</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={100 - searchData.itemHeight} minSize={minItemHeight}>
            <div className="flex h-full items-center justify-center">
              <span className="font-semibold">Rest of swatches</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </>
  );
}

function Home() {
  return <CollectionsDisplay />;
}
