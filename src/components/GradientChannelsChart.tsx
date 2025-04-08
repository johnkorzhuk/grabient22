import { ChartContainer } from '~/components/ui/chart';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { COEFF_PRECISION, coeffsSchema } from '~/validators';
import * as v from 'valibot';
import { useState, useRef } from 'react';
import { Button } from '~/components/ui/button';
import { Calculator } from 'lucide-react';
import { TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { usePrevious, useHotkeys } from '@mantine/hooks';

interface GradientChannelsChartProps {
  gradientColors: number[][];
  processedCoeffs: v.InferOutput<typeof coeffsSchema>;
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

export function GradientChannelsChart({
  gradientColors,
  processedCoeffs,
}: GradientChannelsChartProps) {
  const [offsets, amplitudes, frequencies, phases] = processedCoeffs;
  const [showDetailed, setShowDetailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    t: number;
    rgb: string;
    red: number;
    green: number;
    blue: number;
  } | null>(null);

  const previousTooltipData = usePrevious(tooltipData);
  // Only use previous tooltip data if we're still hovering or showing details
  const activeTooltipData = tooltipData || (isHovering ? previousTooltipData : null);

  useHotkeys([
    [
      'Escape',
      () => {
        setIsHovering(false);
        setTooltipData(null);
        setShowDetailed(false);
      },
    ],
  ]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-hidden relative"
        onMouseLeave={(e: React.MouseEvent) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsHovering(false);
            setTooltipData(null);
          }
        }}
      >
        {(isHovering || showDetailed) && (tooltipData || previousTooltipData) ? (
          <div
            ref={tooltipRef}
            className="absolute left-3 top-1 z-10 pointer-events-auto"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div
              className={cn(
                'rounded-lg border border-border/50 bg-background/85 shadow-xl',
                showDetailed ? 'min-w-[16rem]' : '',
              )}
            >
              <div className="flex items-center justify-between p-2 gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-sm border border-border/50"
                    style={{ backgroundColor: (activeTooltipData || previousTooltipData)!.rgb }}
                  />
                  <span className="font-mono text-[13px]">
                    {(activeTooltipData || previousTooltipData)!.rgb}
                  </span>
                </div>
                <Button
                  variant={showDetailed ? 'secondary' : 'ghost'}
                  size="icon"
                  className={cn(
                    'h-7 w-7',
                    showDetailed
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      : 'hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailed(!showDetailed);
                  }}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
              {showDetailed && (
                <div className="border-t border-border/50 p-2.5 grid gap-2">
                  <div className="text-[11px] text-muted-foreground italic pb-1">
                    <a
                      href="https://iquilezles.org/articles/palettes/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      color(t) = a + b · cos(2π · (c·t + d))
                    </a>
                  </div>
                  {(['red', 'green', 'blue'] as const)
                    .map((channel) => ({
                      channel,
                      value: (activeTooltipData || previousTooltipData)![channel],
                      i: ['red', 'green', 'blue'].indexOf(channel),
                    }))
                    .sort((a, b) => b.value - a.value)
                    .map(({ channel, value, i }) => (
                      <div key={channel} className="grid gap-1">
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
                        <div className="font-mono text-[11px] text-muted-foreground pl-4 tracking-tight">
                          {offsets[i].toFixed(COEFF_PRECISION)} +{' '}
                          {amplitudes[i].toFixed(COEFF_PRECISION)} · cos(2π · (
                          {frequencies[i].toFixed(COEFF_PRECISION)} ·{' '}
                          {(activeTooltipData || previousTooltipData)!.t.toFixed(COEFF_PRECISION)} +{' '}
                          {phases[i].toFixed(COEFF_PRECISION)}))
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute left-3 top-2.5 z-10">
            <div className="flex items-center gap-2 p-2">
              <span className="font-mono text-[13px]">Gradient Composition</span>
            </div>
          </div>
        )}
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              accessibilityLayer
              data={gradientColors.map((color, i) => ({
                t: i / (gradientColors.length - 1),
                red: color[0],
                green: color[1],
                blue: color[2],
                rgb: `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`,
              }))}
              margin={{
                left: 18,
                right: -28,
                top: 56,
                bottom: 12,
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseMove={(e) => {
                if (e.activePayload) {
                  setTooltipData(e.activePayload[0].payload);
                  setIsHovering(true);
                }
              }}
              onMouseLeave={() => {
                setIsHovering(false);
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} tick={false} />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={0}
                domain={[0, 1]}
                ticks={[0, 0.25, 0.5, 0.75, 1]}
              />
              <Tooltip content={() => null} />
              <Line
                dataKey="red"
                type="linear"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={200}
                stroke={chartConfig.red.color}
              />
              <Line
                dataKey="green"
                type="linear"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={200}
                stroke={chartConfig.green.color}
              />
              <Line
                dataKey="blue"
                type="linear"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={200}
                stroke={chartConfig.blue.color}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
