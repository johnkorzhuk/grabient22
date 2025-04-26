import { observer, use$ } from '@legendapp/state/react';
import { useSearch } from '@tanstack/react-router';
import { getCollectionStyleCSS, cosineGradient } from '~/lib/cosineGradient';
import type { CollectionStyle } from '~/types';
import * as v from 'valibot';
import { coeffsSchema } from '~/validators';
import { uiTempStore$ } from '~/stores/ui';
import { useEffect } from 'react';

export const GradientPreview = observer(function GradientPreview({
  initialStyle,
  initialSteps,
  initialAngle,
  processedCoeffs,
  activeIndex,
  onCssGenerated,
}: {
  initialStyle: CollectionStyle;
  initialSteps: number;
  initialAngle: number;
  processedCoeffs: v.InferOutput<typeof coeffsSchema>;
  className?: string;
  activeIndex?: number | null;
  onCssGenerated?: (css: React.CSSProperties) => void;
}) {
  const { style, steps, angle } = useSearch({
    from: '/_layout',
  });
  const previewStyle = use$(uiTempStore$.previewStyle);
  const previewSteps = use$(uiTempStore$.previewSteps);
  const previewAngle = use$(uiTempStore$.previewAngle);

  // Determine steps to use (collection's native steps or from URL/preview)
  const stepsToUse =
    previewSteps !== null || steps !== 'auto' ? (previewSteps ?? steps) : initialSteps;

  // Use our custom gradient generator with the determined number of steps
  const numStops = stepsToUse === 'auto' ? initialSteps : stepsToUse;
  const gradientColors = cosineGradient(numStops, processedCoeffs);

  // Determine style to use (from URL/preview or default)
  const styleToUse = (
    previewStyle !== null ? previewStyle : style === 'auto' ? initialStyle : style
  ) as CollectionStyle;

  // Determine angle to use (from URL/preview or default)
  const angleToUse =
    previewAngle !== null || angle !== 'auto'
      ? (previewAngle ?? (typeof angle === 'number' ? parseFloat(angle.toFixed(1)) : initialAngle))
      : initialAngle;

  // Generate the CSS once and store it
  const cssProps = getCollectionStyleCSS(styleToUse, gradientColors, angleToUse, activeIndex);
  
  // Call the callback with the generated CSS if provided
  useEffect(() => {
    if (onCssGenerated) {
      onCssGenerated(cssProps);
    }
  }, [cssProps, onCssGenerated]);

  return (
    <div
      className="relative h-full w-full"
      style={{
        ...cssProps,
      }}
    />
  );
});
