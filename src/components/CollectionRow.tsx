import { APP_HEADER_HEIGHT } from '~/components/AppHeader';
import { applyGlobals } from '~/lib/cosineGradient';
import type { AppCollection } from '~/types';
import { Separator } from '~/components/ui/serpator';
import { uiTempStore$ } from '~/stores/ui';
import { observer } from '@legendapp/state/react';
import { GradientPreview } from './GradientPreview';
import * as v from 'valibot';
import { coeffsSchema } from '~/validators';
import { cn } from '~/lib/utils';
import { serializeCoeffs } from '~/lib/serialization';

export const CollectionRow = observer(function CollectionRow({
  collection,
  rowHeight,
  className = '',
}: {
  collection: AppCollection;
  rowHeight: number;
  className?: string;
}) {
  // Process coefficients
  const processedCoeffs = v.parse(
    coeffsSchema,
    applyGlobals(collection.coeffs, collection.globals),
  );

  return (
    <div
      className={cn('relative', className)}
      style={{
        height: `calc((100vh - ${APP_HEADER_HEIGHT}px) * ${rowHeight} / 100)`,
      }}
      onMouseEnter={() => {
        uiTempStore$.previewSeed.set(serializeCoeffs(collection.coeffs, collection.globals));
      }}
    >
      <GradientPreview
        initialStyle={collection.style}
        initialSteps={collection.steps}
        initialAngle={collection.angle || 90.0}
        processedCoeffs={processedCoeffs}
        className="absolute inset-0"
      />
      <Separator />
    </div>
  );
});
