import { useLocation, Link } from '@tanstack/react-router';
import type { FileRoutesByFullPath } from '~/routeTree.gen';
import { Command, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Button } from '~/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';

interface NavigationSelectProps {
  className?: string;
  popoverClassName?: string;
}

// Define the navigation item type using the route tree types
export type NavigationItemPath = keyof Pick<
  FileRoutesByFullPath,
  '/' | '/collection' | '/newest' | '/oldest'
>;

type NavigationItem = {
  id: string;
  label: string;
  path: NavigationItemPath;
};

// Base navigation items - newest/oldest will be dynamically added based on current selection
const BASE_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'popular', label: 'Popular', path: '/' },
  { id: 'collection', label: 'Collection', path: '/collection' },
];

// Time-based navigation items that will alternate
const TIME_NAVIGATION_ITEMS: Record<'newest' | 'oldest', NavigationItem> = {
  newest: { id: 'newest', label: 'Newest', path: '/newest' },
  oldest: { id: 'oldest', label: 'Oldest', path: '/oldest' },
};

// Export a properly typed ROUTES object that can be used in other components
export const ROUTES: Record<string, NavigationItem> = {
  ...Object.fromEntries(BASE_NAVIGATION_ITEMS.map((item) => [item.id, item])),
  ...TIME_NAVIGATION_ITEMS,
};

export const NavigationSelect = observer(function NavigationSelect({
  className,
  popoverClassName,
}: NavigationSelectProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const preferredOptions = use$(uiTempStore$.preferredOptions);

  // Get the current path for the select value
  const currentPath = location.pathname === '/' ? 'popular' : location.pathname.substring(1);

  // Determine if we're on a time-based route (newest/oldest)
  const isTimeRoute = currentPath === 'newest' || currentPath === 'oldest';

  // Get the opposite time route to show in the dropdown
  const oppositeTimeRoute =
    currentPath === 'newest' ? TIME_NAVIGATION_ITEMS.oldest : TIME_NAVIGATION_ITEMS.newest;

  // Build the navigation items dynamically
  const navigationItems = [
    // If we're on a time route, show the opposite in the dropdown
    // Otherwise show the newest option by default
    isTimeRoute ? oppositeTimeRoute : TIME_NAVIGATION_ITEMS.newest,
    ...BASE_NAVIGATION_ITEMS,
  ];

  // Find the current navigation item
  const currentItem = isTimeRoute
    ? TIME_NAVIGATION_ITEMS[currentPath as 'newest' | 'oldest']
    : navigationItems.find((item) => item.id === currentPath) || navigationItems[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Navigation"
          className={cn(
            'w-[150px] md:w-[170px] justify-between',
            'font-bold text-sm h-8.5 lg:h-10 px-3',
            'bg-transparent border-input hover:bg-background text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer',
            className,
          )}
        >
          {currentItem.label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground group-hover:text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0 w-[var(--radix-popover-trigger-width)] bg-background/80 backdrop-blur-sm border-border rounded-md',
          popoverClassName,
        )}
      >
        <Command className="border-0 rounded-md w-full bg-transparent [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]]:font-bold [&_[cmdk-item]]:text-sm [&_[cmdk-item][data-selected=true]]:bg-background [&_[cmdk-item][data-selected=true]]:text-foreground [&_[cmdk-item]]:hover:bg-background [&_[cmdk-item]]:hover:text-foreground">
          <CommandList>
            <CommandGroup>
              {navigationItems.map((item) => {
                const path = item.id === 'popular' ? '/' : `/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    to={path}
                    search={preferredOptions}
                    onClick={() => {
                      // Update the UI store with the selected route
                      uiTempStore$.navSelect.set(path as NavigationItemPath);
                      setOpen(false);
                    }}
                    className="block"
                  >
                    <CommandItem
                      value={item.id}
                      aria-label={`Navigate to ${item.label}`}
                      className="cursor-pointer relative h-9 min-h-[2.25rem] text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {item.label}
                    </CommandItem>
                  </Link>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
