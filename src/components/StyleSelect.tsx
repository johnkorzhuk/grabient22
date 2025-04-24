import { observer, use$ } from '@legendapp/state/react';
import { useNavigate, useMatches, useLocation } from '@tanstack/react-router';
import * as v from 'valibot';
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
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={false}
          aria-label="Select gradient style"
          className={cn("w-full justify-between disable-animation-on-theme-change group", className)}
        >
          {value === 'auto' ? (
            <span className="text-muted-foreground text-opacity-75">
              {previewValue ? STYLE_LABELS[previewValue] || 'auto' : 'auto'}
            </span>
          ) : (
            STYLE_LABELS[value]
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground group-hover:text-foreground cursor-pointer" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-[var(--radix-popover-trigger-width)]", popoverClassName)}
        onMouseLeave={() => {
          if (previewValue) {
            uiTempStore$.previewStyle.set(null);
          }
        }}
      >
        <Command className="text-xs">
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
                  className="cursor-pointer pl-3 relative h-7 min-h-[1.75rem] py-1"
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
