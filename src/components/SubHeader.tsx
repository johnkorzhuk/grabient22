import { cn } from '~/lib/utils';
import { NavigationSelect } from '~/components/NavigationSelect';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import { useSearch, useNavigate, useLocation, useMatches } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { observer, use$ } from '@legendapp/state/react';
import { collectionStore$ } from '~/stores/collection';
import { uiTempStore$ } from '~/stores/ui';

interface SubHeaderProps {
  className?: string;
}

export const SubHeader = observer(function SubHeader({ className }: SubHeaderProps) {
  const search = useSearch({ from: '/_layout' });
  const searchList = [search.style, search.steps, search.angle];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const collections = use$(collectionStore$.collections);
  const activeItemId = use$(uiTempStore$.activeCollectionId);
  const activeCollection = collections.find((collection) => collection._id === activeItemId);
  const anySearchSet = searchList.some((value) => value !== 'auto');
  const allSearchesSet = searchList.every((value) => value !== 'auto');
  const style = search.style === 'auto' ? (activeCollection?.style ?? search.style) : search.style;
  const steps = search.steps === 'auto' ? (activeCollection?.steps ?? search.steps) : search.steps;
  const angle = search.angle === 'auto' ? (activeCollection?.angle ?? search.angle) : search.angle;

  // Clear all search parameters
  const location = useLocation();
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === '/_layout/$seed');

  const from = isSeedRoute
    ? '/$seed'
    : location.pathname === '/random'
      ? '/random'
      : location.pathname === '/collection'
        ? '/collection'
        : '/';

  const navigate = useNavigate({ from });

  const clearSearchParams = () => {
    if (activeItemId) {
      uiTempStore$.activeCollectionId.set(null);
    }
    navigate({
      search: (prev) => ({
        ...prev,
        style: 'auto',
        steps: 'auto',
        angle: 'auto',
      }),
      replace: true,
    });
  };

  const setActiveSearch = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        style,
        steps,
        angle,
      }),
      replace: true,
    });
  };

  // Toggle menu open/closed
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 450) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className={cn(
        'w-full bg-background/90 backdrop-blur-sm py-3 md:border-b md:border-dashed md:border-border/70',
        className,
      )}
    >
      <div className="mx-auto w-full px-5 lg:px-14">
        <div className="flex items-center justify-between">
          <NavigationSelect />

          {/* Desktop view (> 450px) */}
          <div className="hidden sm:flex items-center gap-3 relative">
            {/* Render apply button when activeItemId exists and not all searches are set */}
            {activeItemId && !allSearchesSet && (
              <div
                onClick={setActiveSearch}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer ml-2 sm:mr-2"
              >
                apply
              </div>
            )}
            {/* Render reset button when all searches are set with activeItemId, or when any search is set without activeItemId */}
            {((activeItemId && allSearchesSet) || (!activeItemId && anySearchSet)) && (
              <div
                onClick={clearSearchParams}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer ml-2 sm:mr-2"
              >
                reset
              </div>
            )}
            <StyleSelect value={style} className="w-[190px] h-10" />
            <StepsInput value={steps} className="w-[110px] h-10" />
            <AngleInput value={angle} className="w-[110px] h-10" />
          </div>

          {/* Mobile view (≤ 450px) */}
          <div className="sm:hidden relative flex items-center" ref={menuRef}>
            {activeItemId && !allSearchesSet && isMenuOpen && (
              <div
                onClick={setActiveSearch}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer mr-4 -mt-0.5"
              >
                apply
              </div>
            )}
            {((activeItemId && allSearchesSet) || (!activeItemId && anySearchSet)) &&
              isMenuOpen && (
                <div
                  onClick={clearSearchParams}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer mr-4 -mt-0.5"
                >
                  reset
                </div>
              )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="h-10 w-10 cursor-pointer hover:bg-background hover:border-input"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu - full width row */}
      {isMenuOpen && (
        <div
          ref={menuContentRef}
          className="sm:hidden fixed left-0 right-0 top-[64px] z-50 w-full bg-background/90 backdrop-blur-sm border-b border-dashed border-border/70 shadow-md"
        >
          <div className="px-5 py-3 flex items-center gap-2 w-full overflow-x-auto relative">
            <StyleSelect value={style} className="w-[50%] min-w-[160px] h-10" />
            <StepsInput value={steps} className="w-[25%] min-w-[80px] h-10" />
            <AngleInput value={angle} className="w-[25%] min-w-[80px] h-10" />
          </div>
        </div>
      )}
    </header>
  );
});
