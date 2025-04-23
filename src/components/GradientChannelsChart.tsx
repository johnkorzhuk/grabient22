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
import { lazy, Suspense } from 'react';
import { observer, use$ } from '@legendapp/state/react';
import { applyGlobals, cosineGradient, getCollectionStyleCSS } from '~/lib/cosineGradient';
import { uiTempStore$ } from '~/stores/ui';
import { useHotkeys, useClipboard, useElementSize, useMediaQuery } from '@mantine/hooks';
import { Copy, Check } from 'lucide-react';
import { deserializeCoeffs } from '~/lib/serialization';
import { rgbChannelConfig } from '~/constants/colors';

interface GradientChannelsChartProps {
  steps: number;
  processedCoeffs: v.InferOutput<typeof coeffsSchema>;
}

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
                style={{ backgroundColor: rgbChannelConfig.red.color }}
              ></span>
              {r}
            </span>
            ,
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-0.5 rounded-sm"
                style={{ backgroundColor: rgbChannelConfig.green.color }}
              ></span>
              {g}
            </span>
            ,
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-0.5 rounded-sm"
                style={{ backgroundColor: rgbChannelConfig.blue.color }}
              ></span>
              {b}
            </span>
            )
          </span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border/30 pt-1.5">
          {[
            { channel: 'red', value: data.red, color: rgbChannelConfig.red.color },
            { channel: 'green', value: data.green, color: rgbChannelConfig.green.color },
            { channel: 'blue', value: data.blue, color: rgbChannelConfig.blue.color },
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
  isVertical?: boolean;
}

function CustomXAxisTick(props: CustomXAxisTickProps) {
  const { y, gradientColors, isVertical = false } = props;
  const barHeight = 25;
  // Position the bar based on vertical/horizontal orientation
  // For horizontal mode with large negative margin, position the bar at the bottom of the visible area
  const barY = isVertical ? y - barHeight - 2 : y - 25; // Adjusted position to account for smaller height

  return (
    <g>
      <foreignObject x={isVertical ? 10 : 16} y={barY} width="calc(100% - 42px)" height={barHeight}>
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

// Custom Y-axis tick component for vertical chart
interface CustomYAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: number;
    coordinate: number;
    index: number;
    offset: number;
  };
  gradientColors: number[][];
  isVertical?: boolean;
}

function CustomYAxisTick(props: CustomYAxisTickProps) {
  const { x, gradientColors, isVertical = true } = props;
  const barWidth = 25; // Reduced width from 40px to 25px
  // Adjust position based on vertical/horizontal orientation
  const barX = isVertical ? x - barWidth + 40 : x - barWidth - 5; // Adjusted position to account for smaller width

  return (
    <g>
      <foreignObject
        x={isVertical ? 0 : barX}
        y={isVertical ? 24 : 18}
        width={barWidth}
        height={`calc(100% - ${isVertical ? 24 : 36}px)`}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            ...getCollectionStyleCSS('linearSwatches', gradientColors, 180), // Changed from 0 to 180 to reverse the order
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
  isVertical?: boolean;
  width?: number;
  height?: number;
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
      isVertical = false,
      width,
      height,
    }: ChartProps) => {
      // For vertical layout, we need to transform the data
      // In vertical layout, the data point's "t" value becomes the y-coordinate
      return (
        <div className="h-full w-full" style={{ height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {isVertical ? (
              // Vertical chart
              <LineChart
                accessibilityLayer
                data={data}
                layout="vertical"
                width={isVertical && width}
                height={isVertical && height ? height - 20 : undefined}
                margin={{
                  left: -56,
                  right: 2,
                  top: -12,
                  bottom: 0,
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
                <CartesianGrid horizontal={false} vertical={true} />
                <YAxis
                  dataKey="t"
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                  tickFormatter={(value) =>
                    value === 0 || value === 1
                      ? value.toString()
                      : `.${String(value).split('.')[1]}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={
                    !isPreview
                      ? (props) => (
                          <CustomYAxisTick
                            {...props}
                            gradientColors={gradientColors}
                            isVertical={isVertical}
                          />
                        )
                      : false
                  }
                  width={55} // Reduced width from 70px to 55px
                />
                <XAxis
                  type="number"
                  domain={[-0.15, 1]}
                  ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                  tickFormatter={(value) => value.toString()}
                  tickLine={false}
                  axisLine={false}
                  orientation="top"
                />
                <Tooltip content={<CustomTooltip copied={copied} />} isAnimationActive={false} />
                <Line
                  dataKey="red"
                  type="linear"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: rgbChannelConfig.red.color }}
                  isAnimationActive={false}
                  animationDuration={200}
                  stroke={rgbChannelConfig.red.color}
                  strokeOpacity={1}
                />
                <Line
                  dataKey="green"
                  type="linear"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: rgbChannelConfig.green.color }}
                  isAnimationActive={false}
                  animationDuration={200}
                  stroke={rgbChannelConfig.green.color}
                  strokeOpacity={1}
                />
                <Line
                  dataKey="blue"
                  type="linear"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: rgbChannelConfig.blue.color }}
                  isAnimationActive={false}
                  animationDuration={200}
                  stroke={rgbChannelConfig.blue.color}
                  strokeOpacity={1}
                />
              </LineChart>
            ) : (
              // Horizontal chart (original implementation)
              <LineChart
                accessibilityLayer
                data={data}
                width={!isVertical && width ? width - 40 : undefined}
                height={!isVertical && height ? height - 40 : undefined}
                margin={{
                  left: 16,
                  right: -36,
                  top: 16,
                  bottom: -40,
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
                  ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                  tickFormatter={(value) =>
                    value === 0 || value === 1
                      ? value.toString()
                      : `.${String(value).split('.')[1]}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={2}
                  tick={
                    !isPreview
                      ? (props) => (
                          <CustomXAxisTick
                            {...props}
                            gradientColors={gradientColors}
                            isVertical={isVertical}
                          />
                        )
                      : false
                  }
                  height={45} // Reduced height from 60px to 45px
                  padding={{ left: 0, right: 0 }}
                />
                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                  domain={[-0.1, 1]} // Reverted back to original domain without negative values
                  ticks={[0.0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                  tickFormatter={(value) => value.toString()}
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
                  activeDot={{ r: 4, strokeWidth: 1, stroke: rgbChannelConfig.red.color }}
                  isAnimationActive={false}
                  animationDuration={200}
                  stroke={rgbChannelConfig.red.color}
                  strokeOpacity={1}
                />
                <Line
                  dataKey="green"
                  type="linear"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: rgbChannelConfig.green.color }}
                  isAnimationActive={false}
                  animationDuration={200}
                  stroke={rgbChannelConfig.green.color}
                  strokeOpacity={1}
                />
                <Line
                  dataKey="blue"
                  type="linear"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: rgbChannelConfig.blue.color }}
                  isAnimationActive={false}
                  animationDuration={200}
                  stroke={rgbChannelConfig.blue.color}
                  strokeOpacity={1}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      );
    },
  }),
);

export const GradientChannelsChart = observer(function GradientChannelsChart({
  processedCoeffs,
  steps,
}: GradientChannelsChartProps) {
  const previewSeed = use$(uiTempStore$.previewSeed);
  const previewData = previewSeed ? deserializeCoeffs(previewSeed) : null;
  const previewCoeffs = previewData
    ? applyGlobals(previewData.coeffs, previewData.globals)
    : processedCoeffs;
  const previewColors = previewSeed ? cosineGradient(steps, previewCoeffs) : undefined;
  const gradientColors = cosineGradient(steps, processedCoeffs);
  const previewChartData = previewColors ? getChartData(previewColors) : [];
  const chartData = getChartData(gradientColors);
  const activeIndex = use$(uiTempStore$.previewColorIndex);
  const clipboard = useClipboard({ timeout: 1500 });
  const { ref, width, height } = useElementSize();
  const is1000px = useMediaQuery('(max-width: 1000px)');

  // Determine if the chart should be rendered vertically based on width and viewport
  // Only render vertically if the viewport is less than 700px AND either:
  // 1. Width is explicitly measured and less than 500, OR
  // 2. The height is at least 1.3x the width (very tall portrait orientation)
  const isVertical = Boolean(
    is1000px && ((width ? width < 500 : false) || (width && height && height > width * 1.3)),
  );

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
    <div className="flex h-full flex-col" style={{ height: '100%' }}>
      <div
        className="relative flex-1 w-full h-full"
        ref={ref}
        style={{ minHeight: '150px', height: '100%' }}
      >
        <ChartContainer
          config={rgbChannelConfig}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.33 }}
        >
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart
              isPreview
              data={previewChartData}
              gradientColors={gradientColors}
              isVertical={isVertical}
              width={width || undefined}
              height={height || undefined}
            />
          </Suspense>
        </ChartContainer>
        <ChartContainer config={rgbChannelConfig} className="absolute inset-0 h-full w-full">
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart
              data={chartData}
              gradientColors={gradientColors}
              onIndexChange={handleChartIndexChange}
              copied={clipboard.copied}
              isVertical={isVertical}
              width={width || undefined}
              height={height || undefined}
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
