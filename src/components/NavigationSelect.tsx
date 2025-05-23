import { useLocation, useNavigate } from '@tanstack/react-router';
import { Command, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Button } from '~/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '~/lib/utils';

interface NavigationSelectProps {
  className?: string;
  popoverClassName?: string;
}

// Base navigation items - newest/oldest will be dynamically added based on current selection
const BASE_NAVIGATION_ITEMS = [
  { id: 'popular', label: 'Popular', path: '/' },
  { id: 'collection', label: 'Collection', path: '/collection' },
];

// Time-based navigation items that will alternate
const TIME_NAVIGATION_ITEMS = {
  newest: { id: 'newest', label: 'Newest', path: '/newest' },
  oldest: { id: 'oldest', label: 'Oldest', path: '/oldest' },
};

export const ROUTES = {
  ...BASE_NAVIGATION_ITEMS,
  ...TIME_NAVIGATION_ITEMS,
};

export function NavigationSelect({ className, popoverClassName }: NavigationSelectProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Get the current path for the select value
  const currentPath = location.pathname === '/' ? 'popular' : location.pathname.substring(1);

  const handleSelect = (value: string) => {
    const path = value === 'popular' ? '/' : `/${value}`;
    navigate({ to: path, search: (search) => search });
  };

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
            'font-bold text-sm h-10 px-3',
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
              {navigationItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item.id)}
                  className="cursor-pointer relative h-9 min-h-[2.25rem] text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
