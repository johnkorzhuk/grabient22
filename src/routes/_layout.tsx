import { createFileRoute, Outlet, stripSearchParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import * as v from 'valibot';
import { AppHeader } from '~/components/AppHeader';
import { ScrollToTop } from '~/components/ScrollToTop';
import { FooterSection } from '~/components/FooterSection';
import { uiTempStore$ } from '~/stores/ui';
import {
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
} from '~/validators';
import { Route as SeedRoute } from './_layout/$seed';
import { observer, use$ } from '@legendapp/state/react';
import { SubHeader } from '~/components/SubHeader';
import useScrollThreshold from '~/hooks/useScrollThreshold';

export const SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
};

export const searchValidatorSchema = v.object({
  style: v.optional(
    v.fallback(styleWithAutoValidator, SEARCH_DEFAULTS.style),
    SEARCH_DEFAULTS.style,
  ),
  steps: v.optional(
    v.fallback(stepsWithAutoValidator, SEARCH_DEFAULTS.steps),
    SEARCH_DEFAULTS.steps,
  ),
  angle: v.optional(
    v.fallback(angleWithAutoValidator, SEARCH_DEFAULTS.angle),
    SEARCH_DEFAULTS.angle,
  ),
});

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
});

function RouteComponent() {
  // const matches = useMatches();
  // const isSeedRoute = matches.some((match) => match.routeId === SeedRoute.id);

  return <Layout />;
}

const Layout = observer(function Layout() {
  const isDragging = use$(uiTempStore$.isDragging);
  const { scrollContainerRef, isVisible: isHeroVisible } = useScrollThreshold(50);

  useEffect(() => {
    return () => {
      uiTempStore$.activeCollectionId.set(null);
    };
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={`h-screen scrollbar-stable ${isDragging ? 'overflow-hidden' : 'overflow-auto'}`}
    >
      <AppHeader className="sticky top-0 z-40 bg-background" />
      <div className="w-full bg-background/90 backdrop-blur-sm">
        {/* <div className="mx-auto font-poppins">
          Hero content that gets scrolled out of view and is never sticky
        </div> */}
      </div>

      <SubHeader className="sticky top-17.5 lg:top-21.5 z-50" isHeroVisible={isHeroVisible} />

      <div className="pt-10">
        {/* <div className="hidden md:block">
    <Sidebar isSeedRoute={isSeedRoute} />
  </div> */}

        <main className="relative pb-13">
          <Outlet />
        </main>
        <FooterSection className="mt-13" />
        <ScrollToTop />
      </div>
      {/* Mobile navigation footer - only visible on small screens */}
      {/* <MobileNavigation /> */}
    </div>
  );
});
