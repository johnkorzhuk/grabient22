import { APP_HEADER_HEIGHT } from '~/components/AppHeader';
import { applyGlobals } from '~/lib/cosineGradient';
import type { AppCollection } from '~/types';
import { useHover } from '@mantine/hooks';
import { Separator } from '~/components/ui/serpator';
import { useEffect } from 'react';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { GradientPreview } from './GradientPreview';
import * as v from 'valibot';
import { coeffsSchema } from '~/validators';

export const CollectionRow = observer(function CollectionRow({
  collection,
  rowHeight,
  onAnchorStateChange,
  index,
  isSeedRoute = false,
}: {
  collection: AppCollection;
  rowHeight: number;
  onAnchorStateChange: (
    centerY: number | null,
    index: number,
    element: HTMLDivElement | null,
  ) => void;
  index: number;
  isSeedRoute?: boolean;
}) {
  const { hovered, ref } = useHover<HTMLDivElement>();

  // Process coefficients
  const processedCoeffs = v.parse(
    coeffsSchema,
    applyGlobals(collection.coeffs, collection.globals),
  );

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
      }}
      onMouseEnter={() => {
        uiTempStore$.previewCollection.set(processedCoeffs);
      }}
    >
      <GradientPreview
        initialStyle={collection.style}
        initialSteps={collection.steps}
        initialAngle={collection.angle || 90.0}
        processedCoeffs={processedCoeffs}
        routePrefix={isSeedRoute ? '/_layout/_seedLayout' : '/_layout'}
        className="absolute inset-0"
      />
      <Separator ref={ref} />
    </li>
  );
});
