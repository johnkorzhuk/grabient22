import { observer, use$ } from '@legendapp/state/react';
import { useNavigate, useMatches } from '@tanstack/react-router';
import * as v from 'valibot';
import { useState } from 'react';
import { Command, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Button } from '~/components/ui/button';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import { uiTempStore$ } from '~/stores/ui';
import { COLLECTION_STYLES, styleWithAutoValidator } from '~/validators';
import type { CollectionStyle } from '~/types';

type SelectCollectionStyle = v.InferOutput<typeof styleWithAutoValidator>;

const STYLE_LABELS: Record<CollectionStyle, string> = {
  linearGradient: 'Linear Gradient',
  linearSwatches: 'Linear Swatches',
  angularGradient: 'Angular Gradient',
  angularSwatches: 'Angular Swatches',
};

type StyleSelectProps = {
  value: SelectCollectionStyle;
  className?: string;
  popoverClassName?: string;
};

export const StyleSelect = observer(function StyleSelect({
  value,
  className,
  popoverClassName,
}: StyleSelectProps) {
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === '/$seed/');
  const navSelect = use$(uiTempStore$.navSelect);
  const [open, setOpen] = useState(false);

  // Determine the source route for navigation
  // If we're on a seed route, use that, otherwise use the preferred navigation route
  const from = isSeedRoute ? '/$seed' : navSelect === '/' ? '/' : navSelect;
  const navigate = useNavigate({ from });
  const previewValue = use$(uiTempStore$.previewStyle);

  const handleValueClick = (clickedStyle: SelectCollectionStyle) => {
    // If clicking the already selected style, toggle to auto
    if (clickedStyle === value) {
      navigate({
        search: (prev) => ({
          ...prev,
          style: 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.style.set('auto');
      uiTempStore$.previewStyle.set(null);
    } else {
      // Otherwise set to the new style
      navigate({
        search: (prev) => ({
          ...prev,
          style: clickedStyle,
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.style.set(clickedStyle);
    }
    
    // Close the popover after selection
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={false}
          aria-label="Select gradient style"
          className={cn(
            'w-full justify-between',
            'font-bold text-sm h-10 px-3',
            'bg-transparent border-input hover:bg-background text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer',
            className,
          )}
        >
          {value === 'auto' ? (
            <span className="text-muted-foreground">
              {previewValue ? STYLE_LABELS[previewValue] || 'style' : 'style'}
            </span>
          ) : (
            STYLE_LABELS[value]
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground group-hover:text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0 w-[var(--radix-popover-trigger-width)] bg-background/80 backdrop-blur-sm border-border rounded-md',
          popoverClassName,
        )}
        onMouseLeave={() => {
          if (previewValue) {
            uiTempStore$.previewStyle.set(null);
          }
        }}
      >
        <Command className="border-0 rounded-md w-full bg-transparent [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]]:font-bold [&_[cmdk-item]]:text-sm [&_[cmdk-item][data-selected=true]]:bg-background [&_[cmdk-item][data-selected=true]]:text-foreground [&_[cmdk-item]]:hover:bg-background [&_[cmdk-item]]:hover:text-foreground">
          <CommandList>
            <CommandGroup>
              {COLLECTION_STYLES.map((style) => (
                <CommandItem
                  key={style}
                  value={style}
                  onSelect={() => handleValueClick(style)}
                  onMouseEnter={() => {
                    uiTempStore$.previewStyle.set(style);
                  }}
                  className="cursor-pointer relative h-9 min-h-[2.25rem] text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {STYLE_LABELS[style]}
                  <CheckIcon
                    className={cn(
                      'mr-2 h-3 w-3 absolute right-0',
                      value === style ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
