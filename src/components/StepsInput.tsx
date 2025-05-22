import { observer, use$ } from '@legendapp/state/react';
import { useNavigate, useMatches, useLocation } from '@tanstack/react-router';
import { Command, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { usePrevious } from '@mantine/hooks';
import { uiTempStore$ } from '~/stores/ui';
import { DEFAULT_STEPS, MAX_STEPS, MIN_STEPS } from '~/validators';

const presets = [3, 5, 8, 13, 21, 34];
const step = 1;

type StepsInputProps = {
  value: number | 'auto';
  className?: string;
  popoverClassName?: string;
};

export const StepsInput = observer(function NumberInputWithPresets({
  value,
  className,
  popoverClassName,
}: StepsInputProps) {
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
  const previousValue = usePrevious(value);
  const previewValue = use$(uiTempStore$.previewSteps);

  // UI state
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Validate number value
  const validateNumber = (num: number): boolean => {
    return num >= MIN_STEPS && num <= MAX_STEPS;
  };

  // Effect to handle open state based on focus
  useEffect(() => {
    if (isInputFocused && open) {
      setOpen(false);
    }
  }, [isInputFocused, open]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue === '' || newValue === 'auto' || newValue === 'steps') {
      navigate({
        search: (prev) => ({
          ...prev,
          steps: 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set('auto');
    } else {
      const numValue = Number.parseFloat(newValue);
      if (!isNaN(numValue)) {
        // Only apply if valid
        if (validateNumber(numValue)) {
          navigate({
            search: (prev) => ({
              ...prev,
              steps: numValue,
            }),
            replace: true,
          });
          uiTempStore$.preferredOptions.steps.set(numValue);
        }
      }
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true);
    setIsInputFocused(true);
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsFocused(false);
    setIsInputFocused(false);

    // Get the current input value
    const currentInputValue = inputRef.current?.value || '';

    // Check if input is empty or "auto"
    if (
      currentInputValue === '' ||
      currentInputValue.trim() === '' ||
      currentInputValue === 'auto'
    ) {
      navigate({
        search: (prev) => ({
          ...prev,
          steps: 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set('auto');
      return;
    }

    // Try to parse the input value
    const numValue = Number.parseFloat(currentInputValue);

    if (isNaN(numValue)) {
      // Not a valid number, revert to previous value
      navigate({
        search: (prev) => ({
          ...prev,
          steps: previousValue || 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set(previousValue || 'auto');
    } else if (!validateNumber(numValue)) {
      // Number out of range, revert to previous value
      navigate({
        search: (prev) => ({
          ...prev,
          steps: previousValue || 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set(previousValue || 'auto');
    }
    // If valid, no need to change anything
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();

      let currentValue = value === 'auto' ? DEFAULT_STEPS : Number(value);
      if (isNaN(currentValue)) currentValue = DEFAULT_STEPS;

      const newValue = e.key === 'ArrowUp' ? currentValue + step : currentValue - step;

      // Only apply if valid
      if (validateNumber(newValue)) {
        navigate({
          search: (prev) => ({
            ...prev,
            steps: newValue,
          }),
          replace: true,
        });
      }
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();

      // If we're in auto mode, set the value to the defaultNumber
      if (value === 'auto') {
        navigate({
          search: (prev) => ({
            ...prev,
            steps: DEFAULT_STEPS,
          }),
          replace: true,
        });
      } else {
        // For non-auto, validate current input
        const currentInputValue = inputRef.current?.value || '';
        const numValue = Number.parseFloat(currentInputValue);

        if (isNaN(numValue) || !validateNumber(numValue)) {
          // Invalid value, revert to previous value
          navigate({
            search: (prev) => ({
              ...prev,
              steps: previousValue || 'auto',
            }),
            replace: true,
          });
        }
      }

      inputRef.current?.blur();
    }

    // Handle Escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      // Revert to previous value
      navigate({
        search: (prev) => ({
          ...prev,
          steps: previousValue || 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set(previousValue || 'auto');
      inputRef.current?.blur();
    }
  };

  // Handle button click
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only toggle if we're clicking the button, not the input
    if (!isInputFocused) {
      setOpen(!open);
    }
  };

  // Handle value selection from dropdown
  const handleValueClick = (clickedValue: number) => {
    // If clicking the already selected value, toggle to auto
    if (clickedValue === value) {
      navigate({
        search: (prev) => ({
          ...prev,
          steps: 'auto',
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set('auto');
      uiTempStore$.previewSteps.set(null);
    } else {
      // Otherwise set to the new value
      navigate({
        search: (prev) => ({
          ...prev,
          steps: clickedValue,
        }),
        replace: true,
      });
      uiTempStore$.preferredOptions.steps.set(clickedValue);
    }
  };

  // Determine the display value
  const displayValue = () => {
    // Handle undefined or null value
    if (value === undefined || value === null) {
      return DEFAULT_STEPS.toString();
    }

    if (isFocused) {
      return value === 'auto' ? DEFAULT_STEPS.toString() : value.toString();
    } else {
      if (value === 'auto') {
        return previewValue !== null ? previewValue.toString() : 'steps';
      }
      return value.toString();
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        // Only open if we're not focused on the input
        if (newOpen && isInputFocused) return;
        setOpen(newOpen);
      }}
    >
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex items-center relative border border-input rounded-md',
            'bg-transparent hover:bg-background hover:text-foreground transition-colors w-full',
            'font-medium text-base h-10',
            className,
          )}
          onClick={(e) => {
            // If clicking on the input area but not the button, don't toggle
            if (e.target !== buttonRef.current && !buttonRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Steps input"
        >
          <input
            ref={inputRef}
            type="text"
            value={displayValue()}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            aria-label="Steps value"
            className={cn(
              'h-full px-3 rounded-md w-full',
              'bg-transparent',
              'focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'pr-10',
              value === 'auto' && !isFocused && !previewValue ? 'text-muted-foreground' : '',
              'disable-animation-on-theme-change',
              'border-0',
              'font-medium text-base',
              'py-2',
            )}
          />
          <div
            ref={buttonRef}
            className={cn(
              'absolute inset-y-0 right-0 flex items-center justify-center',
              'text-muted-foreground hover:text-foreground cursor-pointer',
              'focus:outline-none',
              'ml-2 pr-3',
            )}
            onClick={handleButtonClick}
            aria-label="Toggle steps presets"
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0 w-[var(--radix-popover-trigger-width)] bg-background/80 backdrop-blur-sm border-border rounded-md',
          popoverClassName,
        )}
        align="start"
        side="bottom"
        sideOffset={0}
        alignOffset={0}
        avoidCollisions={false}
        onMouseLeave={() => {
          if (previewValue !== null) {
            uiTempStore$.previewSteps.set(null);
          }
        }}
      >
        <Command className="border-0 rounded-md w-full bg-transparent [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]]:font-medium [&_[cmdk-item]]:text-base [&_[cmdk-item][data-selected=true]]:bg-background [&_[cmdk-item][data-selected=true]]:text-foreground [&_[cmdk-item]]:hover:bg-background [&_[cmdk-item]]:hover:text-foreground">
          <CommandList className="max-h-[240px] w-full">
            <CommandGroup className="w-full">
              {presets.map((preset) => (
                <CommandItem
                  key={preset}
                  value={preset.toString()}
                  onSelect={() => handleValueClick(preset)}
                  onMouseEnter={() => {
                    uiTempStore$.previewSteps.set(preset);
                  }}
                  className="cursor-pointer relative w-full h-9 min-h-[2.25rem]"
                >
                  {preset.toString()}
                  <CheckIcon
                    className={cn(
                      'mr-2 h-3 w-3 absolute right-0',
                      value === preset ? 'opacity-100' : 'opacity-0',
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
