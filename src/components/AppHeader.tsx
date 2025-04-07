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
  isDataRoute?: boolean;
};

export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(({ isDataRoute = false }, ref) => {
  const layoutSearch = useSearch({
    from: '/_layout',
  });
  const { style, steps, angle } = useSearch({ from: isDataRoute ? '/_layout/$seed' : '/_layout/' });

  return (
    <header
      ref={ref}
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background px-4 py-3"
    >
      <div className="mx-auto flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            search={(search) => ({
              ...search,
              ...layoutSearch,
            })}
          >
            <h1 className="text-xl font-bold">Grabient</h1>
          </Link>
          <a
            href="https://iquilezles.org/articles/palettes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            About
          </a>

          <StyleSelect value={style} isDataRoute={isDataRoute} />
          <StepsInput value={steps} isDataRoute={isDataRoute} />
          <AngleInput value={angle} isDataRoute={isDataRoute} />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
