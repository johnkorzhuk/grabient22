import { cn } from '~/lib/utils'
import { NavigationSelect, ROUTES } from '~/components/header/NavigationSelect'
import { ViewOptions } from './ViewOptions'
import {
  useSearch,
  useNavigate,
  useLocation,
  useMatches,
} from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useState, useEffect, useRef } from 'react'
import { observer, use$ } from '@legendapp/state/react'
import { collectionStore$ } from '~/stores/collection'
import { uiTempStore$ } from '~/stores/ui'
import { PrimaryDivider } from '../Divider'
import { ActionButton } from './ActionButton'

interface SubHeaderProps {
  className?: string
  isHeroVisible?: boolean
}

export const SubHeader = observer(function SubHeader({
  className,
  isHeroVisible = true,
}: SubHeaderProps) {
  const matches = useMatches()
  const isSeedRoute = matches.some((match) => match.routeId === '/$seed/')
  const search = useSearch({ from: isSeedRoute ? '/$seed' : '/_layout' })
  const searchList = [search.style, search.steps, search.angle]
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuContentRef = useRef<HTMLDivElement>(null)
  const collections = use$(collectionStore$.collections)
  const activeItemId = use$(uiTempStore$.activeCollectionId)
  const activeCollection = collections.find(
    (collection) => collection._id === activeItemId,
  )
  const anySearchSet = searchList.some((value) => value !== 'auto')
  const allSearchSet = searchList.every((value) => value !== 'auto')
  const style =
    search.style === 'auto'
      ? (activeCollection?.style ?? search.style)
      : search.style
  const steps =
    search.steps === 'auto'
      ? (activeCollection?.steps ?? search.steps)
      : search.steps
  const angle =
    search.angle === 'auto'
      ? (activeCollection?.angle ?? search.angle)
      : search.angle
  const location = useLocation()
  const navSelect = use$(uiTempStore$.navSelect)
  // Determine the source route for navigation
  // If we're on a seed route, use that, otherwise use the preferred navigation route
  const from = isSeedRoute ? '/$seed' : navSelect === '/' ? '/' : navSelect

  const navigate = useNavigate({ from })

  const clearSearchParams = () => {
    if (activeItemId) {
      uiTempStore$.activeCollectionId.set(null)
    }
    uiTempStore$.preferredOptions.set({
      style: 'auto',
      steps: 'auto',
      angle: 'auto',
    })
    navigate({
      search: (prev) => ({
        ...prev,
        style: 'auto',
        steps: 'auto',
        angle: 'auto',
      }),
      replace: true,
    })
  }

  const setActiveSearch = () => {
    uiTempStore$.preferredOptions.set({
      style,
      steps,
      angle,
    })

    navigate({
      search: (prev) => ({
        ...prev,
        style,
        steps,
        angle,
      }),
      replace: true,
    })
  }

  // Toggle menu open/closed
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 450) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderResetButton = Boolean(
    (activeItemId && allSearchSet) || (!activeItemId && anySearchSet),
  )
  const renderApplyButton = Boolean(activeItemId && !allSearchSet)

  return (
    <header
      className={cn(
        'w-full bg-background/90 backdrop-blur-sm py-3 relative',
        className,
      )}
    >
      <PrimaryDivider />
      <div
        className={cn(
          'mx-auto w-full px-5 lg:px-14 transition-[margin-top] duration-100 ease-in-out transform-gpu',
          {
            'mt-3': isHeroVisible,
            'lg:mt-5': isHeroVisible,
            'mt-0': !isHeroVisible,
          },
        )}
      >
        <div className="flex items-center justify-between">
          {/* Left side - only render NavigationSelect if current path is in ROUTES */}
          <div className="flex-1">
            {Object.values(ROUTES).some(
              (route) => route.path === location.pathname,
            ) && <NavigationSelect />}
          </div>

          {/* Desktop view (> 450px) */}
          <div className="hidden sm:flex items-center relative">
            <div className="mr-2 relative">
              {/* Render apply button when activeItemId exists and not all searches are set */}
              {renderApplyButton && (
                <ActionButton onClick={setActiveSearch}>apply</ActionButton>
              )}
              {/* Render reset button when all searches are set with activeItemId, or when any search is set without activeItemId */}
              {renderResetButton && (
                <ActionButton onClick={clearSearchParams}>reset</ActionButton>
              )}
            </div>
            <ViewOptions
              style={style}
              steps={steps}
              angle={angle}
              variant="fixed"
            />
          </div>

          {/* Mobile view (≤ 450px) */}
          <div className="sm:hidden relative flex items-center" ref={menuRef}>
            <div className="mr-4 relative -top-0.5">
              {renderApplyButton && isMenuOpen && (
                <ActionButton onClick={setActiveSearch}>apply</ActionButton>
              )}
              {renderResetButton && isMenuOpen && (
                <ActionButton onClick={clearSearchParams}>reset</ActionButton>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="h-8 w-8 cursor-pointer hover:bg-background hover:border-input"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu - full width row */}
      {isMenuOpen && (
        <div
          ref={menuContentRef}
          className={cn(
            'sm:hidden fixed left-0 right-0 z-50 w-full bg-background/90 backdrop-blur-sm border-b border-dashed border-border/70 shadow-md transition-[top] duration-200 ease-in-out transform-gpu',
            {
              'top-14': !isHeroVisible,
              'top-16': isHeroVisible,
              'lg:top-16': !isHeroVisible,
              'lg:top-20': isHeroVisible,
              'bg-background/100': isHeroVisible,
            },
          )}
        >
          <div className="px-5 py-3 relative">
            <ViewOptions
              style={style}
              steps={steps}
              angle={angle}
              variant="full"
            />
          </div>
        </div>
      )}
    </header>
  )
})
