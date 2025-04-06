import { useSearch } from '@tanstack/react-router';
import { APP_HEADER_HEIGHT } from '~/components/AppHeader';
import {
  applyGlobals,
  getCoeffs,
  getCollectionStyleCSS,
  cosineGradient,
} from '~/lib/cosineGradient';
import type { AppCollection, CollectionStyle } from '~/types';
import { useHover } from '@mantine/hooks';
import { Separator } from '~/components/ui/serpator';
import { useEffect } from 'react';
import { uiStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';

export const CollectionRow = observer(function CollectionRow({
  collection,
  rowHeight,
  onAnchorStateChange,
  index,
}: {
  collection: AppCollection;
  rowHeight: number;
  onAnchorStateChange: (
    centerY: number | null,
    index: number,
    element: HTMLDivElement | null,
  ) => void;
  index: number;
}) {
  const searchData = useSearch({ from: '/' });
  const { hovered, ref } = useHover<HTMLDivElement>();
  const previewStyle = use$(uiStore$.previewStyle);
  const previewSteps = use$(uiStore$.previewSteps);
  const previewAngle = use$(uiStore$.previewAngle);

  // Process coefficients
  const processedCoeffs = applyGlobals(getCoeffs(collection.coeffs), collection.globals);

  // Determine steps to use (collection's native steps or from URL/preview)
  const stepsToUse =
    previewSteps !== null || searchData.steps !== 'auto'
      ? (previewSteps ?? searchData.steps)
      : collection.steps;

  // Use our custom gradient generator with the determined number of steps
  const numStops = stepsToUse === 'auto' ? collection.steps : stepsToUse;
  const gradientColors = cosineGradient(numStops, processedCoeffs);

  // Determine angle to use (collection's native angle or from URL/preview)
  const angleToUse =
    previewAngle !== null || searchData.angle !== 'auto'
      ? (previewAngle ??
        (typeof searchData.angle === 'number'
          ? parseFloat(searchData.angle.toFixed(1))
          : collection.angle || 90.0))
      : collection.angle || 90.0; // Fallback to 90.0 if collection doesn't have angle

  // Effect for hover state
  useEffect(() => {
    if (hovered && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      onAnchorStateChange(centerY, index, ref.current);
    } else if (!hovered) {
      onAnchorStateChange(null, index, null);
    }
  }, [hovered, index, onAnchorStateChange]);

  return (
    <li
      className="relative"
      style={{
        height: `calc((100vh - ${APP_HEADER_HEIGHT}px) * ${rowHeight} / 100)`,
        ...getCollectionStyleCSS(
          // If preview style is 'auto', use the collection's native style
          // Otherwise use the selected style (preview or from search data)
          (previewStyle || searchData.style) === 'auto'
            ? collection.style // Use collection's style with fallback
            : previewStyle || (searchData.style as CollectionStyle),
          gradientColors,
          angleToUse, // Pass the angle to the gradient CSS generator
        ),
      }}
    >
      <Separator ref={ref} />
    </li>
  );
});
