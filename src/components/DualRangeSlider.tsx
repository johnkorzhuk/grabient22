import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '~/lib/utils';

interface DualRangeSliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'defaultValue' | 'onValueChange'> {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: [number, number];
  value?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  className?: string;
}

const DualRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeSliderProps
>(
  (
    { className, min = 0, max = 100, step = 1, value, defaultValue, onValueChange, ...props },
    ref,
  ) => {
    // Ensure we have a valid value array with two elements
    const currentValue = value || defaultValue || [min, max];
    
    // Check if the thumbs are stacked on top of each other (or very close)
    const thumbsAreStacked = Math.abs(currentValue[0] - currentValue[1]) < step * 2;
    
    return (
      <SliderPrimitive.Root
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={currentValue}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        minStepsBetweenThumbs={0}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-[2px] w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <SliderPrimitive.Range className="absolute h-full bg-gray-700 dark:bg-gray-300" />
        </SliderPrimitive.Track>
        
        {/* First thumb */}
        <SliderPrimitive.Thumb
          className={cn(
            "block h-[8px] w-[8px] rounded-full border border-gray-700 dark:border-gray-300 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-10",
            thumbsAreStacked ? "bg-background" : "bg-gray-700 dark:bg-gray-300"
          )}
        />
        
        {/* Second thumb */}
        <SliderPrimitive.Thumb
          className={cn(
            "block h-[8px] w-[8px] rounded-full border border-gray-700 dark:border-gray-300 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-10",
            thumbsAreStacked ? "bg-background" : "bg-gray-700 dark:bg-gray-300"
          )}
        />
      </SliderPrimitive.Root>
    );
  },
);

DualRangeSlider.displayName = 'DualRangeSlider';

export { DualRangeSlider };
