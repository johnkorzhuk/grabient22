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
import { coeffsSchema } from '~/validators';
import * as v from 'valibot';
import { useState, useRef, lazy, Suspense } from 'react';
import { Button } from '~/components/ui/button';
import { Copy } from 'lucide-react';
import { cn } from '~/lib/utils';
import { usePrevious, useHotkeys } from '@mantine/hooks';
import { observer } from '@legendapp/state/react';

interface GradientChannelsChartProps {
  gradientColors: number[][];
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

interface ChartProps {
  data: Array<{
    t: number;
    red: number;
    green: number;
    blue: number;
    rgb: string;
  }>;
  previewData?: v.InferOutput<typeof coeffsSchema>;
  onHover: () => void;
  onMove: (e: any) => void;
  onLeave: () => void;
}

// Client-side only chart component
const Chart = lazy(() =>
  Promise.resolve({
    default: ({ data, onHover, onLeave, onMove }: ChartProps) => (
      <ResponsiveContainer>
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: 18,
            right: -28,
            top: 56,
            bottom: 12,
          }}
          onMouseEnter={onHover}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
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
    ),
  }),
);

export const GradientChannelsChart = observer(function GradientChannelsChart({
  gradientColors,
}: GradientChannelsChartProps) {
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
  const activeTooltipData = tooltipData || (isHovering ? previousTooltipData : null);

  const copyColorToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  useHotkeys([
    [
      'Escape',
      () => {
        setIsHovering(false);
        setTooltipData(null);
      },
    ],
  ]);

  const chartData = gradientColors.map((color, i) => ({
    t: i / (gradientColors.length - 1),
    red: color[0],
    green: color[1],
    blue: color[2],
    rgb: `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`,
  }));

  return (
    <div className="flex h-full flex-col">
      <div
        ref={containerRef}
        className="relative flex-1 w-full"
        onMouseLeave={(e: React.MouseEvent) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsHovering(false);
            setTooltipData(null);
          }
        }}
      >
        {isHovering && (tooltipData || previousTooltipData) ? (
          <div
            ref={tooltipRef}
            className="absolute left-3 top-1 z-10 pointer-events-auto"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="rounded-lg border border-border/50 bg-background/85 shadow-xl">
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
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7',
                    'cursor-pointer',
                    'hover:bg-accent hover:text-accent-foreground',
                    'active:bg-accent/80',
                    'transition-colors duration-200',
                  )}
                  onClick={async () => {
                    await copyColorToClipboard((activeTooltipData || previousTooltipData)!.rgb);
                    const button = document.activeElement as HTMLButtonElement;
                    button.classList.add('bg-green-500/20');
                    setTimeout(() => button.classList.remove('bg-green-500/20'), 200);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute left-3 top-2.5 z-10">
            <div className="flex items-center gap-2 p-2">
              <span className="font-mono text-[13px]">Gradient Composition</span>
            </div>
          </div>
        )}
        <ChartContainer config={chartConfig} className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart
              data={chartData}
              onHover={() => setIsHovering(true)}
              onMove={(e: any) => {
                if (e.activePayload) {
                  setTooltipData(e.activePayload[0].payload);
                  setIsHovering(true);
                }
              }}
              onLeave={() => setIsHovering(false)}
            />
          </Suspense>
        </ChartContainer>
      </div>
    </div>
  );
});
