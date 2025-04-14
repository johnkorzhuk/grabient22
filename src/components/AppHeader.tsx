import { ThemeToggle } from './theme/ThemeToggle';
import { forwardRef } from 'react';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import { Link, useSearch } from '@tanstack/react-router';

/** be sure to update this if content is changed in AppHeader
 * using the ref for the height doesnt work with SSR
 */
export const APP_HEADER_HEIGHT = 60.67;

type AppHeaderProps = {
  isSeedRoute?: boolean;
};

export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(({ isSeedRoute = false }, ref) => {
  const { style, steps, angle } = useSearch({
    from: '/_layout',
  });

  return (
    <header
      ref={ref}
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background px-4 py-3"
    >
      <div className="mx-auto flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            search={(search) => {
              return search;
            }}
          >
            <h1 className="text-xl font-bold">Grabient</h1>
          </Link>
          <div className="w-[160px]">
            <StyleSelect value={style} isSeedRoute={isSeedRoute} />
          </div>
          <div className="w-[80px]">
            <StepsInput value={steps} isSeedRoute={isSeedRoute} />
          </div>
          <div className="w-[80px]">
            <AngleInput value={angle} isSeedRoute={isSeedRoute} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://iquilezles.org/articles/palettes/"
            target="_blank"
            rel="noopener noreferrer external"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            aria-label="About color palettes by Inigo Quilez (opens in a new window)"
          >
            About
            <span className="sr-only">(opens in a new window)</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-external-link"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
