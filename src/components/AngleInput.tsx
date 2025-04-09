import { observer, use$ } from '@legendapp/state/react';
import { useNavigate } from '@tanstack/react-router';
import { Command, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { usePrevious } from '@mantine/hooks';
import { uiTempStore$ } from '~/stores/ui';
import { MIN_ANGLE, MAX_ANGLE, angleWithAutoValidator } from '~/validators';
import * as v from 'valibot';

// Default values
export const defaultAngle = 90.0;
const presets = [0.0, 45.0, 90.0, 135.0, 180.0, 225.0, 270.0, 315.0];
const step = 1.0; // Increment/decrement step for arrow keys

export const AngleInput = observer(function AngleInput({
  value,
  isSeedRoute = false,
}: {
  value: v.InferOutput<typeof angleWithAutoValidator>;
  isSeedRoute: boolean;
}) {
  const navigate = useNavigate({ from: isSeedRoute ? '/$seed' : '/' });
  const previousValue = usePrevious(value);
  const previewAngle = use$(uiTempStore$.previewAngle);

  // UI state
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Validate angle value
  const validateAngle = (num: number): boolean => {
    return num >= MIN_ANGLE && num <= MAX_ANGLE;
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
          angle: 'auto',
        }),
        replace: true,
      });
    } else {
      const numValue = Number.parseFloat(newValue);
      if (!isNaN(numValue)) {
        // Only apply if valid
        if (validateAngle(numValue)) {
          // Format to exactly one decimal place
          const formattedAngle = parseFloat(numValue.toFixed(1));
          uiTempStore$.previewAngle.set(formattedAngle);
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
          angle: 'auto',
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
          angle: previousValue || 'auto',
        }),
        replace: true,
      });
    } else if (!validateAngle(numValue)) {
      // Number out of range, revert to previous value
      navigate({
        search: (prev) => ({
          ...prev,
          angle: previousValue || 'auto',
        }),
        replace: true,
      });
    }
    // If valid, no need to change anything

    // Clear the preview
    uiTempStore$.previewAngle.set(null);
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();

      let currentValue = value === 'auto' ? defaultAngle : Number(value);
      if (isNaN(currentValue)) currentValue = defaultAngle;

      const newValue = e.key === 'ArrowUp' ? currentValue + step : currentValue - step;

      // Only apply if valid
      if (validateAngle(newValue)) {
        // Format to one decimal place
        const formattedAngle = parseFloat(newValue.toFixed(1));

        navigate({
          search: (prev) => ({
            ...prev,
            angle: formattedAngle,
          }),
          replace: true,
        });
      }
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();

      // If we're in auto mode, set the value to the defaultAngle
      if (value === 'auto') {
        navigate({
          search: (prev) => ({
            ...prev,
            angle: defaultAngle,
          }),
          replace: true,
        });
      } else {
        // For non-auto, validate current input
        const currentInputValue = inputRef.current?.value || '';
        const numValue = Number.parseFloat(currentInputValue);

        if (isNaN(numValue) || !validateAngle(numValue)) {
          // Invalid value, revert to previous value
          navigate({
            search: (prev) => ({
              ...prev,
              angle: previousValue || 'auto',
            }),
            replace: true,
          });
        } else {
          // Format to one decimal place
          const formattedAngle = parseFloat(numValue.toFixed(1));

          navigate({
            search: (prev) => ({
              ...prev,
              angle: formattedAngle,
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
          angle: previousValue || 'auto',
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
  const handleValueClick = (clickedAngle: number) => {
    // If clicking the already selected angle, toggle to auto
    if (clickedAngle === value) {
      navigate({
        search: (prev) => ({
          ...prev,
          angle: 'auto',
        }),
        replace: true,
      });
      uiTempStore$.previewAngle.set(null);
    } else {
      // Otherwise set to the new value
      navigate({
        search: (prev) => ({
          ...prev,
          angle: clickedAngle,
        }),
        replace: true,
      });
    }
  };

  // Determine the display value
  const displayValue = () => {
    if (isFocused) {
      return value === 'auto' ? defaultAngle.toString() : value.toString();
    } else {
      if (value === 'auto') {
        return previewAngle !== null ? previewAngle.toString() : 'auto';
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
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Angle input"
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
            aria-label="Angle value"
            className={cn(
              'h-full px-3 py-2 text-sm rounded-md w-full',
              'bg-transparent',
              'focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'pr-10', // Space for the dropdown icon
              value === 'auto' && !isFocused && !previewAngle ? 'text-muted-foreground' : '',
              'disable-animation-on-theme-change',
              'border-0', // Remove input border since we're using a parent border
              'font-medium', // Match StyleSelect's text weight
            )}
          />
          <div
            ref={buttonRef}
            className={cn(
              'absolute inset-y-0 right-0 flex items-center justify-center',
              'text-muted-foreground hover:text-foreground',
              'focus:outline-none',
              'ml-2 pr-3', // Match StyleSelect's icon spacing
            )}
            onClick={handleButtonClick}
            aria-label="Toggle angle presets"
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
          if (previewAngle !== null) {
            uiTempStore$.previewAngle.set(null);
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
                    uiTempStore$.previewAngle.set(preset);
                  }}
                  className="cursor-pointer pl-3 relative w-full"
                >
                  {`${preset}°`}
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
