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
import { useRef, lazy, Suspense } from 'react';
import { observer, use$ } from '@legendapp/state/react';
import { cosineGradient, getCollectionStyleCSS } from '~/lib/cosineGradient';
import { uiTempStore$ } from '~/stores/ui';
import { useHotkeys, useClipboard } from '@mantine/hooks';
import { Copy, Check } from 'lucide-react';

interface GradientChannelsChartProps {
  steps: number;
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

// Define proper types for the tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      t: number;
      red: number;
      green: number;
      blue: number;
      rgb: string;
      hex: string;
    };
  }>;
  label?: string;
  copied?: boolean;
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, copied = false }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const r = Math.round(data.red * 255);
  const g = Math.round(data.green * 255);
  const b = Math.round(data.blue * 255);
  const rgbColor = `rgb(${r}, ${g}, ${b})`;
  const hexColor = data.hex;

  return (
    <div className="rounded-lg border border-border/50 bg-background/85 shadow-xl p-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm" style={{ backgroundColor: rgbColor }}></div>
          <span className="font-mono text-xs">{hexColor}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>cmd + c</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs flex items-center">
            rgb(
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-0.5 rounded-sm"
                style={{ backgroundColor: chartConfig.red.color }}
              ></span>
              {r}
            </span>
            ,
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-0.5 rounded-sm"
                style={{ backgroundColor: chartConfig.green.color }}
              ></span>
              {g}
            </span>
            ,
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-0.5 rounded-sm"
                style={{ backgroundColor: chartConfig.blue.color }}
              ></span>
              {b}
            </span>
            )
          </span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border/30 pt-1.5">
          {[
            { channel: 'red', value: data.red, color: chartConfig.red.color },
            { channel: 'green', value: data.green, color: chartConfig.green.color },
            { channel: 'blue', value: data.blue, color: chartConfig.blue.color },
          ]
            .sort((a, b) => b.value - a.value)
            .map(({ channel, value, color }) => (
              <div key={channel} className="flex items-center">
                <span
                  className="h-2 w-2 mr-1.5 rounded-sm"
                  style={{ backgroundColor: color }}
                ></span>
                <span className="font-mono text-xs">{value.toFixed(3)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Custom X-axis tick component that renders a gradient color bar
interface CustomXAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: number;
    coordinate: number;
    index: number;
    offset: number;
  };
  gradientColors: number[][];
}

function CustomXAxisTick(props: CustomXAxisTickProps) {
  const { y, gradientColors } = props;
  const barHeight = 25;
  const barY = y - barHeight - 16; // Position the bar above the axis line, within the chart area

  return (
    <g>
      <foreignObject x={18} y={barY} width="calc(100% - 52px)" height={barHeight}>
        <div
          style={{
            width: '100%',
            height: '100%',
            ...getCollectionStyleCSS('linearSwatches', gradientColors, 90),
          }}
        />
      </foreignObject>
    </g>
  );
}

interface ChartProps {
  data: Array<{
    t: number;
    red: number;
    green: number;
    blue: number;
    rgb: string;
    hex: string;
  }>;

  isPreview?: boolean;
  gradientColors: number[][];
  onIndexChange?: (index: number | null) => void;
  copied?: boolean;
}

// Client-side only chart component
const Chart = lazy(() =>
  Promise.resolve({
    default: ({
      data,
      isPreview = false,
      gradientColors,
      onIndexChange,
      copied = false,
    }: ChartProps) => (
      <ResponsiveContainer style={{ opacity: isPreview ? 0.25 : 1 }}>
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: 18,
            right: -26,
            top: 0,
            bottom: 40,
          }}
          onMouseMove={(state) => {
            if (!isPreview && onIndexChange && state?.activeTooltipIndex !== undefined) {
              onIndexChange(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => {
            if (!isPreview && onIndexChange) {
              onIndexChange(null);
            }
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={
              !isPreview
                ? (props) => <CustomXAxisTick {...props} gradientColors={gradientColors} />
                : false
            }
            height={30}
            padding={{ left: 0, right: 0 }}
          />

          <YAxis
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={0}
            domain={[-0.15, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
          />
          <Tooltip
            content={<CustomTooltip copied={copied} />}
            // Keep the tooltip active even when not directly hovering over the chart
            // This allows the cursor to remain visible when hovering over the X-axis
            isAnimationActive={false}
          />
          <Line
            dataKey="red"
            type="linear"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 1, stroke: chartConfig.red.color }}
            isAnimationActive={isPreview ? false : true}
            animationDuration={200}
            stroke={chartConfig.red.color}
            strokeOpacity={1}
          />
          <Line
            dataKey="green"
            type="linear"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 1, stroke: chartConfig.green.color }}
            isAnimationActive={isPreview ? false : true}
            animationDuration={200}
            stroke={chartConfig.green.color}
            strokeOpacity={1}
          />
          <Line
            dataKey="blue"
            type="linear"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 1, stroke: chartConfig.blue.color }}
            isAnimationActive={isPreview ? false : true}
            animationDuration={200}
            stroke={chartConfig.blue.color}
            strokeOpacity={1}
          />
        </LineChart>
      </ResponsiveContainer>
    ),
  }),
);

export const GradientChannelsChart = observer(function GradientChannelsChart({
  processedCoeffs,
  steps,
}: GradientChannelsChartProps) {
  const previewCoeffs = use$(uiTempStore$.previewCollection);
  const previewColors = previewCoeffs ? cosineGradient(steps, previewCoeffs) : undefined;
  const gradientColors = cosineGradient(steps, processedCoeffs);
  const previewChartData = previewColors ? getChartData(previewColors) : [];
  const chartData = getChartData(gradientColors);
  const activeIndex = use$(uiTempStore$.previewColorIndex);
  const clipboard = useClipboard({ timeout: 1500 });

  const handleChartIndexChange = (index: number | null) => {
    if (index !== undefined) {
      uiTempStore$.previewColorIndex.set(index);
    } else {
      uiTempStore$.previewColorIndex.set(null);
    }
  };

  useHotkeys([
    [
      'mod+c',
      () => {
        if (typeof activeIndex !== 'number') return;

        const hexColor = chartData[activeIndex]?.hex;
        if (hexColor) {
          clipboard.copy(hexColor);
        }
      },
    ],
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 w-full">
        <ChartContainer config={chartConfig} className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart isPreview data={previewChartData} gradientColors={gradientColors} />
          </Suspense>
        </ChartContainer>
        <ChartContainer config={chartConfig} className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart
              data={chartData}
              gradientColors={gradientColors}
              onIndexChange={handleChartIndexChange}
              copied={clipboard.copied}
            />
          </Suspense>
        </ChartContainer>
      </div>
    </div>
  );
});

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getChartData(colors: number[][]) {
  return colors.map((color, i) => ({
    t: i / (colors.length - 1),
    red: color[0],
    green: color[1],
    blue: color[2],
    rgb: `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`,
    hex: rgbToHex(color[0], color[1], color[2]),
  }));
}
