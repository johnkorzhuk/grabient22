import { observer, use$ } from '@legendapp/state/react';
import { useNavigate } from '@tanstack/react-router';
import { Command, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { usePrevious } from '@mantine/hooks';
import { uiTempStore$ } from '~/stores/ui';
import { MAX_STEPS, MIN_STEPS, stepsWithAutoValidator } from '~/validators';
import * as v from 'valibot';

// Default values
export const defaultSteps = 7;
const presets = [3, 5, 8, 13, 21, 34];
const step = 1;

export const StepsInput = observer(function NumberInputWithPresets({
  value,
  isSeedRoute = false,
}: {
  value: v.InferOutput<typeof stepsWithAutoValidator>;
  isSeedRoute: boolean;
}) {
  const navigate = useNavigate({ from: isSeedRoute ? '/$seed' : '/' });
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

    if (newValue === '' || newValue === 'auto') {
      navigate({
        search: (prev) => ({
          ...prev,
          steps: 'auto',
        }),
        replace: true,
      });
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
    } else if (!validateNumber(numValue)) {
      // Number out of range, revert to previous value
      navigate({
        search: (prev) => ({
          ...prev,
          steps: previousValue || 'auto',
        }),
        replace: true,
      });
    }
    // If valid, no need to change anything
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();

      let currentValue = value === 'auto' ? defaultSteps : Number(value);
      if (isNaN(currentValue)) currentValue = defaultSteps;

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
            steps: defaultSteps,
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
    }
  };

  // Determine the display value
  const displayValue = () => {
    if (isFocused) {
      return value === 'auto' ? defaultSteps.toString() : value.toString();
    } else {
      if (value === 'auto') {
        return previewValue !== null ? previewValue.toString() : 'auto';
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
          className="flex items-center w-[90px] relative border border-input rounded-md h-9 bg-background hover:bg-accent hover:text-accent-foreground transition-colors disable-animation-on-theme-change shadow-sm"
          onClick={(e) => {
            // If clicking on the input area but not the button, don't toggle
            if (e.target !== buttonRef.current && !buttonRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={displayValue()}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className={cn(
              'h-full px-3 py-2 text-sm rounded-md w-full',
              'bg-transparent',
              'focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'pr-10',
              value === 'auto' && !isFocused && !previewValue ? 'text-muted-foreground' : '',
              'disable-animation-on-theme-change',
              'border-0',
              'font-medium',
            )}
          />
          <div
            ref={buttonRef}
            className={cn(
              'absolute inset-y-0 right-0 flex items-center justify-center',
              'text-muted-foreground hover:text-foreground',
              'focus:outline-none',
              'ml-2 pr-3',
            )}
            onClick={handleButtonClick}
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90px] p-0"
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
        <Command className="border-0 rounded-none w-full">
          <CommandList className="max-h-[220px] w-full">
            <CommandGroup className="w-full">
              {presets.map((preset) => (
                <CommandItem
                  key={preset}
                  value={preset.toString()}
                  onSelect={() => handleValueClick(preset)}
                  onMouseEnter={() => {
                    uiTempStore$.previewSteps.set(preset);
                  }}
                  className="cursor-pointer pl-3 relative w-full"
                >
                  {preset.toString()}
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4 absolute right-0',
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
