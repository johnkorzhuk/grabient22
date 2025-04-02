import { ThemeToggle } from './theme/ThemeToggle';
import { forwardRef } from 'react';

/** be sure to update this if content is changed in AppHeader */
export const APP_HEADER_HEIGHT = 60.67;

export const AppHeader = forwardRef<HTMLElement>((_, ref) => {
  return (
    <header
      ref={ref}
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background px-4 py-3"
    >
      <div className="mx-auto flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Grabient</h1>
          <a
            href="https://iquilezles.org/articles/palettes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground ml-4"
          >
            About
          </a>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
