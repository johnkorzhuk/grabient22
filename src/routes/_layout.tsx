import {
  createFileRoute,
  Outlet,
  stripSearchParams,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import * as v from 'valibot'
import { AppHeader } from '~/components/header/AppHeader'
import { TagsCarousel } from '~/components/TagsCarousel'
import { ScrollToTop } from '~/components/ScrollToTop'
import { FooterSection } from '~/components/FooterSection'
import { uiTempStore$ } from '~/stores/ui'
import {
  styleWithAutoValidator,
  stepsWithAutoValidator,
  angleWithAutoValidator,
  tagsValidator,
} from '~/validators'
import { observer, use$ } from '@legendapp/state/react'
import { SubHeader } from '~/components/header/PrimarySubHeader'
import useScrollThreshold from '~/hooks/useScrollThreshold'
import { useLocation } from '@tanstack/react-router'
import { ROUTES } from '~/components/header/NavigationSelect'
import { type Tag } from '../../tags'

export const DEFAULT_COLLECTION_PAGE_SIZE = 24 as const

export const SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
  tags: [] as Tag[],
}

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
})

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
})

function RouteComponent() {
  const location = useLocation()

  useEffect(() => {
    const route = Object.values(ROUTES).find(
      (route) => route.path === location.pathname,
    )
    if (route) {
      uiTempStore$.navSelect.set(route.path)
    }
  }, [location.pathname])

  return <Layout />
}

const Layout = observer(function Layout() {
  const location = useLocation()
  const isDragging = use$(uiTempStore$.isDragging)
  const { scrollContainerRef, isVisible: isHeroVisible } =
    useScrollThreshold(50)
  const isCollection = location.pathname === '/collection'
  const isContactPage = location.pathname === '/contact'

  useEffect(() => {
    return () => {
      uiTempStore$.activeCollectionId.set(null)
    }
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      className={`h-screen scrollbar-stable ${isDragging ? 'overflow-hidden' : 'overflow-auto'}`}
    >
      <AppHeader className="sticky top-0 z-40 bg-background" />

      {/* Tags section with responsive layout */}
      {!isCollection && !isContactPage && <TagsCarousel />}

      <SubHeader
        className="sticky top-17.5 lg:top-21.5 z-50"
        isHeroVisible={isHeroVisible}
      />

      <div className="pt-10">
        <main className="relative pb-12 min-h-[calc(100vh-8rem)]">
          <Outlet />
        </main>
        <FooterSection />
        <ScrollToTop />
      </div>
    </div>
  )
})
