import { cn } from '~/lib/utils';
import { CollectionModifierRangeInput } from './CollectionModifierRangeInput';
import { COEFF_PRECISION } from '~/validators';

interface ModifierSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  colorBar?: string;
  onValueChange: (value: number) => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function ModifierSlider({
  label,
  value,
  min,
  max,
  step = 0.001,
  colorBar,
  onValueChange,
  onDragEnd,
  onClick,
  isActive = false,
  className,
}: ModifierSliderProps) {
  return (
    <div className={cn('flex flex-col group', className)}>
      <div
        className={cn(
          'flex justify-between items-center relative mb-4',
          'bg-transparent',
          'transition-colors duration-200',
          onClick ? 'cursor-pointer' : '',
        )}
        onClick={onClick}
      >
        <div className="flex items-center relative">
          {colorBar && (
            <div
              className="absolute -left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-sm"
              style={{ backgroundColor: colorBar }}
            />
          )}
          <span
            className={cn(
              'font-sm capitalize font-poppins',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:text-foreground transition-colors duration-200',
            )}
          >
            {label}
          </span>
        </div>
        <span
          className={cn(
            'text-sm font-mono',
            isActive
              ? 'text-foreground'
              : 'text-muted-foreground group-hover:text-foreground transition-colors duration-200',
          )}
        >
          {value.toFixed(COEFF_PRECISION)}
        </span>
      </div>
      
      <CollectionModifierRangeInput
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onValueChange?.(values[0])}
        className={cn(
          isActive ? '' : 'opacity-80 group-hover:opacity-100 transition-opacity duration-200'
        )}
        onMouseUp={onDragEnd}
        onKeyUp={onDragEnd}
        onPointerUp={onDragEnd}
        ariaLabel={`${label} slider, value ${value.toFixed(3)}`}
      />
    </div>
  );
}
