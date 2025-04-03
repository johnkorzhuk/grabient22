import { observer, use$ } from '@legendapp/state/react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { COLLECTION_STYLES, uiStore$ } from '~/stores/ui';
import type { CollectionStyle } from '~/types';

const STYLE_LABELS: Record<CollectionStyle, string> = {
  linearGradient: 'Linear Gradient',
  linearSwatches: 'Linear Swatches',
  angularGradient: 'Angular Gradient',
  angularSwatches: 'Angular Swatches',
};

export const StyleSelect = observer(function TypeSelect({
  value,
  onValueChange,
}: {
  onValueChange: (value: CollectionStyle) => void;
  value: CollectionStyle;
}) {
  const previewValue = use$(uiStore$.previewStyle);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>{STYLE_LABELS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent
        onMouseLeave={() => {
          if (previewValue) {
            uiStore$.previewStyle.set(null);
          }
        }}
      >
        {COLLECTION_STYLES.map((type) => (
          <SelectItem
            key={type}
            value={type}
            onMouseEnter={() => {
              uiStore$.previewStyle.set(type);
            }}
          >
            {STYLE_LABELS[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
