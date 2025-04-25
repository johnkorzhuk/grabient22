import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { rgbChannelConfig } from '../constants/colors';
import type { CollectionPreset, CosineCoeffs } from '../types';
import { applyGlobals, cosineGradient } from '../lib/cosineGradient';

type RGBTab = {
  id: string;
  label: string;
  color: string;
  value: number;
  originalIndex: number;
};

interface SortableTabProps {
  id: string;
  color: string;
  label: string;
}

interface RGBTabsProps {
  collection: CollectionPreset;
  onOrderChange: (coeffs: CollectionPreset['coeffs']) => void;
}

function SortableTab({ id, color, label }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges: () => false, // Prevent items from animating when order changes
  });

  // Only apply transform, no opacity or other style changes during drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: color,
    zIndex: isDragging ? 1 : 0, // Minimal z-index change to handle layering
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-10 h-5 rounded-md shadow-sm flex items-center justify-start pl-1.5 cursor-grab"
      title={label} // Add tooltip with the color label
      suppressHydrationWarning
      {...attributes}
      {...listeners}
    >
      <GripVertical size={10} className="text-white/80" />
    </div>
  );
}

export function RGBTabs({ collection, onOrderChange }: RGBTabsProps) {
  // Get processed coefficients - this is what's displayed in the graph
  const processedCoeffs = applyGlobals(collection.coeffs, collection.globals);

  // Generate a sample of colors to calculate dominance
  // Using a reasonable number of steps (e.g., 10) to match the graph visualization
  const gradientSteps = 10;
  const colors = cosineGradient(gradientSteps, processedCoeffs);

  // Calculate the dominance of each RGB channel by summing across all gradient steps
  // This is the same approach used in the GradientChannelsChart
  const channelTotals = colors.reduce(
    (totals, color) => [
      totals[0] + color[0], // Red
      totals[1] + color[1], // Green
      totals[2] + color[2], // Blue
    ],
    [0, 0, 0],
  );

  // Create tab objects with IDs and values
  const unsortedTabs: RGBTab[] = [
    {
      id: 'red',
      color: rgbChannelConfig.red.color,
      label: rgbChannelConfig.red.label,
      value: channelTotals[0],
      originalIndex: 0,
    },
    {
      id: 'green',
      color: rgbChannelConfig.green.color,
      label: rgbChannelConfig.green.label,
      value: channelTotals[1],
      originalIndex: 1,
    },
    {
      id: 'blue',
      color: rgbChannelConfig.blue.color,
      label: rgbChannelConfig.blue.label,
      value: channelTotals[2],
      originalIndex: 2,
    },
  ];

  // Sort by channel value (highest first)
  // Create a new array to ensure stable sorting
  const sortedTabs = [...unsortedTabs].sort((a, b) => b.value - a.value);

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Handle drag end to update order
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find positions in the current array
      const oldIndex = sortedTabs.findIndex((item) => item.id === active.id);
      const newIndex = sortedTabs.findIndex((item) => item.id === over.id);

      // Get tabs being swapped
      const sourceTab = sortedTabs[oldIndex];
      const targetTab = sortedTabs[newIndex];

      // Create new coefficients by swapping RGB values
      const newCoeffs = collection.coeffs.map((coeff) => {
        const [r, g, b, a = 1] = coeff;
        const newCoeff = [r, g, b, a];

        // Swap the values for the channels being reordered
        const temp = newCoeff[sourceTab.originalIndex];
        newCoeff[sourceTab.originalIndex] = newCoeff[targetTab.originalIndex];
        newCoeff[targetTab.originalIndex] = temp;

        return newCoeff;
      }) as CosineCoeffs;

      // Notify parent of the change
      onOrderChange(newCoeffs);
    }
  };

  // Force complete re-render when tab order changes with a key
  const tabOrderKey = sortedTabs.map((tab) => tab.id).join('-');

  return (
    <DndContext
      key={tabOrderKey}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis]}
    >
      <SortableContext
        items={sortedTabs.map((tab) => tab.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="inline-flex gap-1">
          {sortedTabs.map((tab) => (
            <SortableTab
              key={tab.id}
              id={tab.id}
              color={tab.color}
              label={`${tab.label} Channel`}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
