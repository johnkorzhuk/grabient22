import { createFileRoute, Outlet, stripSearchParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import * as v from 'valibot';
import { AppHeader } from '~/components/header/AppHeader';
import { Carousel, CarouselContent, CarouselItem } from '~/components/ui/carousel';
import { ScrollToTop } from '~/components/ScrollToTop';
import { FooterSection } from '~/components/FooterSection';
import { uiTempStore$ } from '~/stores/ui';
import {
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
  tagsValidator,
} from '~/validators';
import { observer, use$ } from '@legendapp/state/react';
import { SubHeader } from '~/components/header/PrimarySubHeader';
import useScrollThreshold from '~/hooks/useScrollThreshold';
import { useLocation } from '@tanstack/react-router';
import { ROUTES } from '~/components/header/NavigationSelect';
import { TAGS, type Tag } from '../../tags';

export const SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
  tags: [] as Tag[],
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
  tags: tagsValidator,
});

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  validateSearch: searchValidatorSchema,
  search: {
    middlewares: [stripSearchParams(SEARCH_DEFAULTS)],
  },
  headers: () => ({
    // Browser: Cache for 30 minutes, allow stale for 1 hour
    'cache-control': 'public, max-age=1800, stale-while-revalidate=3600',
    // Cloudflare: Cache for 1 hour, stale-while-revalidate for 2 hours
    'cdn-cache-control': 'max-age=3600, stale-while-revalidate=7200, durable',
  }),
});

function RouteComponent() {
  const location = useLocation();

  useEffect(() => {
    const route = Object.values(ROUTES).find((route) => route.path === location.pathname);
    if (route) {
      uiTempStore$.navSelect.set(route.path);
    }
  }, [location.pathname]);

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

      {/* Tags section with responsive layout */}
      <div className="w-full bg-background/90 backdrop-blur-sm flex justify-center">
        {/* pt-2 pb-6 lg:pb-8 */}
        <div className="w-full md:max-w-[700px] lg:max-w-[900px] xl:max-w-[1000px] 2xl:max-w-[1200px] font-poppins pb-2 px-5 lg:px-14 md:flex md:justify-center">
          {/* Mobile: Single row carousel */}
          {/* <div className="md:hidden">
            <Carousel
              opts={{
                align: 'start',
                loop: false,
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 pl-4">
                {TAGS.map((tag, index) => (
                  <CarouselItem
                    key={tag}
                    className={`pl-2 basis-auto ${index === 0 ? 'pl-4' : ''}`}
                  >
                    <button
                      className="disable-animation-on-theme-change cursor-pointer font-poppins font-medium bg-background/20 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm px-3 py-1 rounded-sm border border-border select-none z-10 whitespace-nowrap inline-flex justify-center items-center h-8"
                      onClick={() => {
                        console.log(`Tag clicked: ${tag}`);
                      }}
                    >
                      {tag}
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div> */}

          {/* md-lg: 2 rows with carousel */}
          {/* <div className="hidden md:flex lg:hidden flex-col gap-2 w-full justify-center">
            {Array.from({ length: 2 }).map((_, rowIndex) => {
              const tagsPerRow = Math.ceil(TAGS.length / 2);
              const startIndex = rowIndex * tagsPerRow;
              const endIndex = Math.min(startIndex + tagsPerRow, TAGS.length);

              return (
                <Carousel
                  key={`md-row-${rowIndex}`}
                  opts={{
                    align: 'start',
                    loop: false,
                    dragFree: true,
                    containScroll: 'trimSnaps',
                  }}
                  className="w-full"
                >
                  <CarouselContent className={`-ml-2 md:-ml-4 ${rowIndex === 1 ? 'pl-4' : ''}`}>
                    {TAGS.slice(startIndex, endIndex).map((tag) => (
                      <CarouselItem key={tag} className="pl-2 md:pl-4 basis-auto">
                        <button
                          className="disable-animation-on-theme-change cursor-pointer font-poppins font-medium bg-background/20 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm px-3 py-1 rounded-sm border border-border select-none z-10 whitespace-nowrap inline-flex justify-center items-center h-8"
                          onClick={() => {
                            console.log(`Tag clicked: ${tag}`);
                          }}
                        >
                          {tag}
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              );
            })}
          </div> */}

          {/* lg+: 3 rows with carousel */}
          {/* <div className="hidden lg:flex flex-col gap-2 w-full justify-center">
            {Array.from({ length: 3 }).map((_, rowIndex) => {
              const tagsPerRow = Math.ceil(TAGS.length / 3);
              const startIndex = rowIndex * tagsPerRow;
              const endIndex = Math.min(startIndex + tagsPerRow, TAGS.length);

              return (
                <Carousel
                  key={`lg-row-${rowIndex}`}
                  opts={{
                    align: 'start',
                    loop: false,
                    dragFree: true,
                    containScroll: 'trimSnaps',
                  }}
                  className="w-full"
                >
                  <CarouselContent
                    className={`-ml-4 md:-ml-6 ${rowIndex === 0 || rowIndex === 2 ? 'pl-6' : ''}`}
                  >
                    {TAGS.slice(startIndex, endIndex).map((tag) => (
                      <CarouselItem key={tag} className="pl-2 md:pl-6 basis-auto">
                        <button
                          className="disable-animation-on-theme-change cursor-pointer font-poppins font-medium bg-background/20 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm px-3 py-1 rounded-sm border border-border select-none z-10 whitespace-nowrap inline-flex justify-center items-center h-8"
                          onClick={() => {
                            console.log(`Tag clicked: ${tag}`);
                          }}
                        >
                          {tag}
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              );
            })}
          </div> */}
        </div>
      </div>

      <SubHeader className="sticky top-17.5 lg:top-21.5 z-50" isHeroVisible={isHeroVisible} />

      <div className="pt-10">
        <main className="relative pb-13">
          <Outlet />
        </main>
        <FooterSection className="mt-13" />
        <ScrollToTop />
      </div>
    </div>
  );
});
