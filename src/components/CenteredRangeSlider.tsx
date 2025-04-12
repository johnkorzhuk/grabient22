import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '~/lib/utils';

interface CenteredRangeSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number[];
  value?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
}

const CenteredRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  CenteredRangeSliderProps
>(
  (
    { className, min = 0, max = 100, step = 1, value, defaultValue, onValueChange, ...props },
    ref,
  ) => {
    // We need to ensure we're working with the correct value, whether controlled or uncontrolled
    const currentValue = value || defaultValue || [0];
    const middle = (min + max) / 2;
    const valueIsMiddle = Number(currentValue[0].toFixed(2)) === Number(middle.toFixed(2));
    const range = max - min;

    // Calculate the percentage positions
    const middlePercent = ((middle - min) / range) * 100;
    const valuePercent = ((currentValue[0] - min) / range) * 100;

    // Calculate bar width and position based on whether the value is less than or greater than the middle
    let barWidth = 0;
    let barStart = 0;

    if (currentValue[0] < middle) {
      barWidth = middlePercent - valuePercent;
      barStart = valuePercent;
    } else if (currentValue[0] > middle) {
      barWidth = valuePercent - middlePercent;
      barStart = middlePercent;
    }

    return (
      <SliderPrimitive.Root
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        className={cn(
          'relative flex items-center',
          'w-full',
          'touch-none select-none',
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track 
          className={cn(
            'relative overflow-hidden',
            'h-[2px] w-full grow',
            'rounded-full bg-gray-200 dark:bg-gray-800'
          )}
        >
          {/* Filled track - only show when not at middle */}
          {!valueIsMiddle && (
            <div
              className={cn(
                'absolute',
                'h-full',
                'bg-gray-700 dark:bg-gray-300'
              )}
              style={{
                left: `${barStart}%`,
                width: `${barWidth}%`,
              }}
            />
          )}
        </SliderPrimitive.Track>

        {/* Middle mark */}
        <div
          className={cn(
            'absolute -translate-x-[1px]',
            'h-[8px] w-[2px]',
            'bg-gray-700 dark:bg-gray-300',
            valueIsMiddle ? 'hidden' : 'block'
          )}
          style={{
            left: `${middlePercent}%`,
          }}
        />

        <SliderPrimitive.Thumb
          className={cn(
            'block',
            'h-[8px] w-[8px]',
            'rounded-full border shadow-sm',
            'border-gray-700 dark:border-gray-300',
            valueIsMiddle ? 'bg-background' : 'bg-gray-700 dark:bg-gray-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'transition-colors'
          )}
        />
      </SliderPrimitive.Root>
    );
  },
);

CenteredRangeSlider.displayName = 'CenteredRangeSlider';

export { CenteredRangeSlider };
