import { observer, use$ } from '@legendapp/state/react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { COLLECTION_TYPES, uiStore$, type CollectionType } from '~/stores/ui';

const TYPE_LABELS: Record<CollectionType, string> = {
  linearGradient: 'Linear Gradient',
  linearSwatches: 'Linear Swatches',
  angularGradient: 'Angular Gradient',
  angularSwatches: 'Angular Swatches',
};

export const TypeSelect = observer(function TypeSelect({
  value,
  onValueChange,
}: {
  onValueChange: (value: CollectionType) => void;
  value: CollectionType;
}) {
  const previewValue = use$(uiStore$.previewType);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>{TYPE_LABELS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent
        onMouseLeave={() => {
          if (previewValue) {
            uiStore$.previewType.set(null);
          }
        }}
      >
        {COLLECTION_TYPES.map((type) => (
          <SelectItem
            key={type}
            value={type}
            onMouseEnter={() => {
              uiStore$.previewType.set(type);
            }}
          >
            {TYPE_LABELS[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
