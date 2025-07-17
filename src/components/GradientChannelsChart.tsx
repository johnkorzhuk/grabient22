import { ChartContainer } from '~/components/ui/chart'
import { Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts'
import { coeffsSchema } from '~/validators'
import * as v from 'valibot'
import { lazy, Suspense } from 'react'
import { observer, use$ } from '@legendapp/state/react'
import { applyGlobals, cosineGradient } from '~/lib/cosineGradient'
import { uiTempStore$ } from '~/stores/ui'
import {
  useHotkeys,
  useClipboard,
  useMediaQuery,
  useElementSize,
} from '@mantine/hooks'
import { Copy, Check } from 'lucide-react'
import { deserializeCoeffs } from '~/lib/serialization'
import { rgbChannelConfig } from '~/constants/colors'
import { cn } from '~/lib/utils'

interface GradientChannelsChartProps {
  steps: number
  processedCoeffs: v.InferOutput<typeof coeffsSchema>
  className?: string
  showLabels?: boolean
  showGrid?: boolean
}

// Define proper types for the tooltip props
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      t: number
      red: number
      green: number
      blue: number
      rgb: string
      hex: string
    }
  }>
  label?: string
  copied?: boolean
}

// Custom tooltip component for the chart
const CustomTooltip = ({
  active,
  payload,
  copied = false,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const r = Math.round(data.red * 255)
  const g = Math.round(data.green * 255)
  const b = Math.round(data.blue * 255)
  const rgbColor = `rgb(${r}, ${g}, ${b})`
  const hexColor = data.hex

  return (
    <div className="rounded-lg border border-border/50 bg-background/20 backdrop-blur-sm shadow-xl p-2 z-20">
      <div className="flex flex-col gap-2.5 font-poppins">
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 rounded-sm"
            style={{ backgroundColor: rgbColor }}
          ></div>
          <span className="font-mono text-xs">{hexColor}</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>cmd + c</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs flex items-center">
            rgb(
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-1 rounded-sm"
                style={{ backgroundColor: rgbChannelConfig.red.color }}
              ></span>
              {r}
            </span>
            ,
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-1 rounded-sm"
                style={{ backgroundColor: rgbChannelConfig.green.color }}
              ></span>
              {g}
            </span>
            ,
            <span className="inline-flex items-center">
              <span
                className="h-2 w-2 mx-1 rounded-sm"
                style={{ backgroundColor: rgbChannelConfig.blue.color }}
              ></span>
              {b}
            </span>
            )
          </span>
        </div>
        {/* <div className="flex flex-col gap-1 border-t border-border/30 pt-1.5">
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
        </div> */}
      </div>
    </div>
  )
}

interface ChartProps {
  data: Array<{
    t: number
    red: number
    green: number
    blue: number
    rgb: string
    hex: string
  }>
  isPreview?: boolean
  onIndexChange?: (index: number | null) => void
  copied?: boolean
  width?: number
  height?: number
}

const Chart = lazy(() =>
  Promise.resolve({
    default: ({
      data,
      isPreview = false,
      onIndexChange,
      copied = false,
      width,
      height,
    }: ChartProps) => {
      const isLargeScreen = useMediaQuery('(min-width: 1024px)')

      const margins = {
        left: isLargeScreen ? 20 : 0,
        right: isLargeScreen ? 0 : 20,
        top: isLargeScreen ? 28 : 16,
        bottom: isLargeScreen ? 16 : 4,
      }

      // If we have valid dimensions from useElementSize, use them directly
      if (width && height && width > 0 && height > 0) {
        return (
          <div className="h-full w-full">
            <LineChart
              accessibilityLayer
              data={data}
              width={width}
              height={height}
              margin={margins}
              onMouseMove={(state) => {
                if (
                  !isPreview &&
                  onIndexChange &&
                  state?.activeTooltipIndex !== undefined
                ) {
                  onIndexChange(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => {
                if (!isPreview && onIndexChange) {
                  onIndexChange(null)
                }
              }}
            >
              {/* Force exact domain to match GraphBG */}
              <XAxis
                dataKey="t"
                hide={true}
                domain={[0, 1]}
                type="number"
                scale="linear"
              />

              {/* Force exact Y domain and disable automatic scaling */}
              <YAxis
                hide={true}
                domain={[0, 1]}
                type="number"
                scale="linear"
                allowDataOverflow={false}
              />

              <Tooltip
                content={<CustomTooltip copied={copied} />}
                isAnimationActive={false}
              />

              <Line
                dataKey="red"
                type="linear"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: rgbChannelConfig.red.color,
                }}
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
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: rgbChannelConfig.green.color,
                }}
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
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: rgbChannelConfig.blue.color,
                }}
                isAnimationActive={false}
                animationDuration={200}
                stroke={rgbChannelConfig.blue.color}
                strokeOpacity={1}
              />
            </LineChart>
          </div>
        )
      }

      // Fallback: show a loading state while dimensions are being measured
      return (
        <div className="h-full w-full flex items-center justify-center"></div>
      )
    },
  }),
)

/**
 * GraphBG component provides a styled background for gradient charts
 * with optional grid lines and Y-axis labels
 */
const GraphBG: React.FC<{
  className?: string
  showLabels?: boolean
  showGrid?: boolean
}> = ({ className = '', showLabels = true, showGrid = true }) => {
  // Y-axis values from 0 to 1.0 in increments of 0.2
  const yAxisValues = [1, 0.8, 0.6, 0.4, 0.2, 0]

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-md overflow-hidden',
        className,
      )}
    >
      {/* Graph area container */}
      <div className="relative w-full h-full">
        {/* Horizontal grid lines */}
        {showGrid &&
          yAxisValues.map((value) => {
            // Calculate position from top (0% for 1.0, 100% for 0)
            const topPercent = (1 - value) * 100

            return (
              <div
                key={`line-${value}`}
                className="absolute inset-x-0 w-full dark:opacity-60"
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
            )
          })}

        {/* Floating Y-axis labels */}
        {showLabels &&
          yAxisValues.map((value) => {
            // Calculate position from top (0% for 1.0, 100% for 0)
            const topPercent = (1 - value) * 100

            return (
              <div
                key={`label-${value}`}
                className="disable-animation-on-theme-change absolute font-semibold right-4 bg-background/20 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-xs font-mono px-1.5 py-0.5 rounded-sm border border-border select-none z-10 whitespace-nowrap inline-flex justify-center items-center"
                style={{
                  top: `${topPercent}%`,
                  transform: 'translateY(-50%)',
                }}
              >
                {value.toFixed(value === 1 || value === 0 ? 0 : 1)}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export const GradientChannelsChart = observer(function GradientChannelsChart({
  processedCoeffs,
  steps,
  className = '',
  showLabels = true,
  showGrid = true,
}: GradientChannelsChartProps) {
  const previewSeed = use$(uiTempStore$.previewSeed)
  const previewData = previewSeed ? deserializeCoeffs(previewSeed) : null
  const previewCoeffs = previewData
    ? applyGlobals(previewData.coeffs, previewData.globals)
    : processedCoeffs
  const previewColors = previewSeed
    ? cosineGradient(steps, previewCoeffs)
    : undefined
  const gradientColors = cosineGradient(steps, processedCoeffs)
  const previewChartData = previewColors ? getChartData(previewColors) : []
  const chartData = getChartData(gradientColors)
  const activeIndex = use$(uiTempStore$.previewColorIndex)
  const clipboard = useClipboard({ timeout: 1500 })
  const { ref, width, height } = useElementSize()

  const handleChartIndexChange = (index: number | null) => {
    if (index !== undefined) {
      uiTempStore$.previewColorIndex.set(index)
    } else {
      uiTempStore$.previewColorIndex.set(null)
    }
  }

  useHotkeys([
    [
      'mod+c',
      () => {
        if (typeof activeIndex !== 'number') return

        const hexColor = chartData[activeIndex]?.hex
        if (hexColor) {
          clipboard.copy(hexColor)
        }
      },
    ],
  ])

  return (
    <figure
      className={cn('flex h-full flex-col relative', className)}
      role="img"
      ref={ref}
      aria-labelledby="palette-graph-title"
      aria-describedby="palette-graph-description"
    >
      {/* GraphBG provides the background grid and labels */}
      <GraphBG
        className="absolute inset-0 w-full h-full pt-4 lg:pt-7 lg:pl-5 pr-5 lg:pr-0 pb-1 lg:pb-4"
        showLabels={showLabels}
        showGrid={showGrid}
      />

      {/* Chart layers on top of GraphBG */}
      <div
        className="relative flex-1 w-full h-full"
        style={{ minHeight: '150px', height: '100%' }}
      >
        {/* Preview chart layer with reduced opacity */}
        <ChartContainer
          config={rgbChannelConfig}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.33 }}
        >
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart
              isPreview
              data={previewChartData}
              width={width || undefined}
              height={height || undefined}
            />
          </Suspense>
        </ChartContainer>

        {/* Main chart layer */}
        <ChartContainer
          config={rgbChannelConfig}
          className="absolute inset-0 h-full w-full"
        >
          <Suspense fallback={<div className="w-full h-full" />}>
            <Chart
              data={chartData}
              onIndexChange={handleChartIndexChange}
              copied={clipboard.copied}
              width={width || undefined}
              height={height || undefined}
            />
          </Suspense>
        </ChartContainer>
      </div>

      {/* Accessibility labels */}
      <div id="palette-graph-title" className="sr-only">
        RGB Color Palette Visualization
      </div>

      <div id="palette-graph-description" className="sr-only">
        Interactive graph showing red, green, and blue color channel curves
        generated. X- axis is color(t). Y-axis is 0 to 1.
      </div>
    </figure>
  )
})

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function getChartData(colors: number[][]) {
  return colors.map((color, i) => ({
    t: i / (colors.length - 1),
    red: color[0],
    green: color[1],
    blue: color[2],
    rgb: `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`,
    hex: rgbToHex(color[0], color[1], color[2]),
  }))
}
