import { Calculator } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { COEFF_PRECISION } from '~/validators';
import { useState } from 'react';

interface GradientGraphHeaderProps {
  hoveredData: {
    t: number;
    rgb: string;
    red: number;
    green: number;
    blue: number;
  } | null;
  position: { x: number; y: number } | null;
  processedCoeffs: [number[], number[], number[], number[]];
}

const chartConfig = {
  red: {
    label: 'Red',
    color: '#ef4444',
  },
  green: {
    label: 'Green',
    color: '#22c55e',
  },
  blue: {
    label: 'Blue',
    color: '#3b82f6',
  },
} as const;

export function GradientGraphHeader({
  hoveredData,
  position,
  processedCoeffs,
}: GradientGraphHeaderProps) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [offsets, amplitudes, frequencies, phases] = processedCoeffs;

  if (!hoveredData || !position) return null;

  // Get viewport dimensions and determine if we're too close to edges
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const isNearRightEdge = position.x && viewportWidth - position.x < 300;
  const isNearBottomEdge = position.y && viewportHeight - position.y < 200;

  // Get all channels
  const channels = ['red', 'green', 'blue'] as const;
  const values = channels.map((channel) => ({
    channel,
    value: hoveredData[channel],
    i: channels.indexOf(channel),
  }));

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${position.x + 12}px`,
        top: 0,
        transform: isNearRightEdge ? 'translateX(-100%)' : 'none',
      }}
    >
      <div
        className={cn(
          'grid rounded-lg border border-border/50 bg-background/85 shadow-xl',
          showDetailed ? 'min-w-[16rem] gap-3 p-2.5 text-xs' : 'p-2 text-[11px]',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-2',
            showDetailed && 'border-b border-border/50 pb-2',
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-sm border border-border/50"
              style={{ backgroundColor: hoveredData.rgb }}
            />
            <span className="font-mono text-[13px]">{hoveredData.rgb}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showDetailed ? 'secondary' : 'ghost'}
                size="icon"
                className={cn(
                  'h-7 w-7 ml-4 cursor-pointer',
                  showDetailed
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
                onClick={() => setShowDetailed(!showDetailed)}
              >
                <Calculator className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {showDetailed ? 'Hide formula details' : 'Show formula details'}
            </TooltipContent>
          </Tooltip>
        </div>
        {showDetailed && (
          <>
            <div className="text-[11px] text-muted-foreground italic">
              <a
                href="https://iquilezles.org/articles/palettes/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                color(t) = a + b · cos(2π · (c·t + d))
              </a>
            </div>
            {values
              .sort((a, b) => b.value - a.value)
              .map(({ channel, value, i }) => (
                <div key={channel} className="grid gap-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: chartConfig[channel].color }}
                    />
                    <span className="font-medium">{chartConfig[channel].label}</span>
                    <span className="font-mono">{value.toFixed(COEFF_PRECISION)}</span>
                    <span className="font-mono text-muted-foreground">
                      ({Math.round(value * 255)})
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground pl-4 tracking-wide">
                    {offsets[i].toFixed(COEFF_PRECISION)} + {amplitudes[i].toFixed(COEFF_PRECISION)}{' '}
                    · cos(2π · ({frequencies[i].toFixed(COEFF_PRECISION)} ·{' '}
                    {hoveredData.t.toFixed(COEFF_PRECISION)} + {phases[i].toFixed(COEFF_PRECISION)}
                    ))
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
