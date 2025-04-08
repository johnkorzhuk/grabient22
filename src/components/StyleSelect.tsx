import { observer, use$ } from '@legendapp/state/react';
import { useNavigate } from '@tanstack/react-router';
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

export const defaultStyle: CollectionStyle = 'linearGradient';

export const StyleSelect = observer(function TypeSelect({
  value,
  isSeedRoute = false,
}: {
  value: SelectCollectionStyle;
  isSeedRoute: boolean;
}) {
  const navigate = useNavigate({ from: isSeedRoute ? '/$seed' : '/' });
  // const { style: value } = useSearch({ from: !isRootRoute ? '/_layout/$data' : '/_layout/' });
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
          role="combobox"
          className="w-[180px] justify-between disable-animation-on-theme-change group"
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
        className="w-[180px] p-0"
        onMouseLeave={() => {
          if (previewValue) {
            uiTempStore$.previewStyle.set(null);
          }
        }}
      >
        <Command>
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
                  className="cursor-pointer pl-3 relative"
                >
                  {STYLE_LABELS[style]}
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4 absolute right-0',
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
