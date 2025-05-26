import React from 'react';
import { cn } from '~/lib/utils';

interface GraphBGProps {
  className?: string;
  showLabels?: boolean;
  showGrid?: boolean;
}

/**
 * GraphBG component provides a styled background for gradient charts
 * with optional grid lines and Y-axis labels
 */
const GraphBG: React.FC<GraphBGProps> = ({
  className = '',
  showLabels = true,
  showGrid = true,
}) => {
  // Y-axis values from 0 to 1.0 in increments of 0.2
  const yAxisValues = [1, 0.8, 0.6, 0.4, 0.2, 0];

  return (
    <div className={cn('relative w-full h-full rounded-md overflow-hidden', className)}>
      {/* Graph area container */}
      <div className="relative w-full h-full">
        {/* Horizontal grid lines */}
        {showGrid &&
          yAxisValues.map((value) => {
            // Calculate position from top (0% for 1.0, 100% for 0)
            const topPercent = (1 - value) * 100;

            return (
              <div
                key={`line-${value}`}
                className="absolute inset-x-0 w-full"
                style={{
                  top: `${topPercent}%`,
                  height: '1px',
                  backgroundImage:
                    'linear-gradient(to right, var(--ring) 0%, var(--ring) 2px, transparent 2px, transparent 4px)',
                  backgroundSize: '6px 1px',
                  backgroundRepeat: 'repeat-x',
                  width: '100%',
                }}
              />
            );
          })}

        {/* Floating Y-axis labels */}
        {showLabels &&
          yAxisValues.map((value) => {
            // Calculate position from top (0% for 1.0, 100% for 0)
            const topPercent = (1 - value) * 100;

            return (
              <div
                key={`label-${value}`}
                className="absolute right-4 bg-background/90 text-muted-foreground text-xs font-mono px-1.5 py-0.5 rounded-sm border border-border select-none z-10 whitespace-nowrap inline-flex justify-center items-center"
                style={{
                  top: `${topPercent}%`,
                  transform: 'translateY(-50%)',
                }}
              >
                {value.toFixed(value === 1 || value === 0 ? 0 : 1)}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default GraphBG;
