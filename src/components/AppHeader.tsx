import { ThemeToggle } from './theme/ThemeToggle';
import { forwardRef } from 'react';

export const AppHeader = forwardRef<HTMLElement>((_, ref) => {
  return (
    <header
      ref={ref}
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background px-4 py-3"
    >
      <div className="mx-auto flex w-full items-center justify-between">
        <h1 className="text-xl font-bold">Grabient</h1>
        <ThemeToggle />
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
