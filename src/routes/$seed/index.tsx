import {
  createFileRoute,
  useParams,
  useRouteContext,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { cn } from '~/lib/utils';
import { CollectionSeedDisplay } from '~/components/CollectionSeedDisplay';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import type { AppCollection } from '~/types';
import { deserializeCoeffs, serializeCoeffs } from '~/lib/serialization';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { api } from '../../../convex/_generated/api';
import { applyGlobals } from '~/lib/cosineGradient';
import { GradientChannelsChart } from '~/components/GradientChannelsChart';

export const Route = createFileRoute('/$seed/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <PageContent />;
}

const PageContent = observer(function PageContent() {
  const { seed: encodedSeedData } = useParams({
    from: '/$seed/',
  });
  const { seedData } = useRouteContext({
    from: '/$seed',
  });
  const { href } = useLocation();
  const navigate = Route.useNavigate();
  // Get the search params from the parent route
  const { style, steps, angle } = Route.useSearch();
  const { userId } = useAuth();

  // Get preview values from store
  const previewStyle = use$(uiTempStore$.previewStyle);
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewAngle = use$(uiTempStore$.previewAngle);
  const previewSeed = use$(uiTempStore$.previewSeed);
  const activeCollectionId = use$(uiTempStore$.activeCollectionId);
  const itemActive = activeCollectionId === encodedSeedData;

  // Calculate the final values to use
  const stepsToUse =
    previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : seedData.collection.steps;
  const styleToUse =
    previewStyle !== null ? previewStyle : style === 'auto' ? seedData.collection.style : style;
  const angleToUse =
    previewAngle !== null || angle !== 'auto'
      ? (previewAngle ??
        (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : seedData.collection.angle))
      : seedData.collection.angle;
  const numStops = steps === 'auto' ? seedData.collection.steps : (stepsToUse as number);
  const previewData = previewSeed ? deserializeCoeffs(previewSeed) : null;

  const previewCollection: AppCollection = {
    ...seedData.collection,
    seed: previewSeed || encodedSeedData,
    coeffs: previewData?.coeffs || seedData.collection.coeffs,
    globals: previewData?.globals || seedData.collection.globals,
  };

  // Apply globals to get processed coefficients for the chart
  const processedCoeffs = applyGlobals(previewCollection.coeffs, previewCollection.globals);

  const { data: userLikedSeed, isPending: isLikedPending } = useQuery({
    ...convexQuery(api.likes.checkUserLikedSeed, {
      userId: userId!,
      seed: encodedSeedData,
    }),
    // this doesnt work for whatever reason
    enabled: Boolean(userId),
  });

  const onChannelOrderChange = (newCoeffs: AppCollection['coeffs'], collection: AppCollection) => {
    const newSeed = serializeCoeffs(newCoeffs, collection.globals);
    navigate({
      params: { seed: newSeed },
      search: (search) => search,
    });
    uiTempStore$.activeCollectionId.set(newSeed);
  };

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      <div className="pt-14 pb-6 h-full w-full px-5 lg:px-14">
        {/* Responsive container layout */}
        <div className="h-full w-full flex flex-col lg:flex-row">
          {/* Top container (left on lg+) */}
          <div
            className={cn(
              'group relative lg:pr-5 pt-5',
              'h-[calc(100%-320px)] lg:h-full w-full lg:flex-1',
              'font-poppins',
            )}
            onClick={() => {
              if (itemActive) uiTempStore$.activeCollectionId.set(null);
              else uiTempStore$.activeCollectionId.set(encodedSeedData);
            }}
            onMouseLeave={() => {
              // Clear preview seed if set
              if (!previewSeed) return;
              uiTempStore$.previewSeed.set(null);
            }}
            tabIndex={0}
            role="button"
            aria-pressed={itemActive}
            aria-label={`${itemActive ? 'Deselect' : 'Select'} gradient for actions`}
          >
            <CollectionSeedDisplay
              className="h-[calc(100%-56px)] lg:h-[calc(100%-42px)] max-h-[500px]"
              collection={previewCollection}
              index={0}
              style={styleToUse}
              steps={numStops}
              angle={angleToUse}
              href={href}
              onChannelOrderChange={onChannelOrderChange}
              renderChannelTabs
              itemActive={itemActive}
              likedSeeds={userLikedSeed ? { [encodedSeedData]: true } : {}}
              likesPending={isLikedPending}
            />
          </div>

          {/* Bottom container (right on lg+) */}
          <div className="h-[320px] lg:h-full lg:w-[454px] xl:w-[520px] 2xl:w-[600px] w-full">
            {/* Bottom/Right container with nested split for md-sm */}
            <div className="h-full w-full flex flex-col">
              {/* Main content area */}
              <div className="flex-1 w-full flex flex-row">
                {/* Left panel for sm-md - contains graph */}
                <GradientChannelsChart
                  className="h-full flex-1 md:border-r hidden sm:block lg:hidden"
                  processedCoeffs={processedCoeffs}
                  steps={numStops}
                  showLabels={true}
                  showGrid={true}
                />

                {/* Right panel content - visible only on xs-md screens */}
                <div className="h-full w-full md:w-[420px] flex-1 lg:hidden">
                  {/* Content for the right panel */}
                  <div className="pt-3 sm:pl-5 h-full w-full">Right panel content</div>
                </div>

                {/* Graph for lg+ screens */}
                <GradientChannelsChart
                  className="h-full w-full md:w-[420px] flex-1 hidden lg:block"
                  processedCoeffs={processedCoeffs}
                  steps={numStops}
                  showLabels={true}
                  showGrid={true}
                />
              </div>

              {/* Large screen container at bottom with full width - only visible on lg screens */}
              <div className="hidden lg:block lg:h-[320px] w-full border border-gray-300 rounded-md mt-4">
                {/* Right panel content moved to bottom container on lg+ */}
                <div className="h-full w-full">Right panel content</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
