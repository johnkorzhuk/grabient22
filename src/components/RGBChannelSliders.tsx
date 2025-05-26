import { CollectionModifierRangeInput } from './CollectionModifierRangeInput';
import { cn } from '~/lib/utils';
import type { CosineCoeffs, GlobalModifierType } from '~/types';
import { useState, useEffect } from 'react';
import { COEFF_PRECISION, PI } from '~/validators';
import { applyGlobals } from '~/lib/cosineGradient';
import { rgbChannelConfig } from '~/constants/colors';

interface RGBChannelSlidersProps {
  activeModifier: GlobalModifierType;
  coeffs: CosineCoeffs;
  globals: [number, number, number, number];
  onValueChange?: (modifierIndex: number, channelIndex: number, value: number) => void;
  onDragEnd?: () => void;
}

export function RGBChannelSliders({
  activeModifier,
  coeffs,
  globals,
  onValueChange,
  onDragEnd,
}: RGBChannelSlidersProps) {
  // Skip rendering if activeModifier is null
  if (!activeModifier) return null;

  // Get the index of the active modifier
  const getModifierIndex = (type: GlobalModifierType) => {
    switch (type) {
      case 'exposure':
        return 0;
      case 'contrast':
        return 1;
      case 'frequency':
        return 2;
      case 'phase':
        return 3;
      default:
        return 0;
    }
  };

  const modifierIndex = getModifierIndex(activeModifier);

  // All RGB channel inputs use the same range: [-PI, PI]
  const min = -PI;
  const max = PI;

  // Get the applied coefficients (with globals applied)
  const appliedCoeffs = applyGlobals(coeffs, globals);

  // Get the RGB values for the selected modifier from applied coefficients
  // Each coefficient vector contains [R, G, B, A] values
  const appliedRgbValues: [number, number, number] = [
    appliedCoeffs[modifierIndex][0],
    appliedCoeffs[modifierIndex][1],
    appliedCoeffs[modifierIndex][2],
  ];

  // Local state to track current values during dragging
  const [localValues, setLocalValues] = useState(appliedRgbValues);

  // Update local values when coeffs, globals, or activeModifier changes
  useEffect(() => {
    setLocalValues(appliedRgbValues);
  }, [coeffs, globals, activeModifier, modifierIndex]);

  // Handle RGB channel value changes
  const handleChannelChange = (channelIndex: number, value: number) => {
    // Update local state
    const newValues = [...localValues] as [number, number, number];
    newValues[channelIndex] = value;
    setLocalValues(newValues);

    // Call parent handler
    if (onValueChange) {
      onValueChange(modifierIndex, channelIndex, value);
    }
  };

  // Channel configuration with values
  const channels = [
    {
      key: 'red',
      name: rgbChannelConfig.red.label,
      color: rgbChannelConfig.red.color,
      value: localValues[0],
    },
    {
      key: 'green',
      name: rgbChannelConfig.green.label,
      color: rgbChannelConfig.green.color,
      value: localValues[1],
    },
    {
      key: 'blue',
      name: rgbChannelConfig.blue.label,
      color: rgbChannelConfig.blue.color,
      value: localValues[2],
    },
  ];

  return (
    <div className={cn('flex flex-col', 'gap-4')}>
      <div className={cn('flex flex-col', 'gap-4')}>
        {channels.map((channel, channelIndex) => (
          <div
            key={channel.key}
            className={cn(
              'flex flex-col relative group',
              'rounded',
              'gap-2 p-2 border border-input shadow-sm bg-background/80 backdrop-blur-sm',
              'transition-colors duration-200'
            )}
          >
            <div
              className={cn('absolute left-0 top-0 bottom-0', 'w-1', 'rounded-full')}
              style={{ backgroundColor: channel.color }}
            />

            <div className={cn('flex justify-between pl-2')}>
              <label className={cn('font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200')}>{channel.name}</label>
              <span className={cn('text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200')}>
                {channel.value.toFixed(COEFF_PRECISION)}
              </span>
            </div>

            <CollectionModifierRangeInput
              min={min}
              max={max}
              step={0.001}
              value={[channel.value]}
              onValueChange={(values) => handleChannelChange(channelIndex, values[0])}
              onMouseUp={onDragEnd}
              onKeyUp={onDragEnd}
              onPointerUp={onDragEnd}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
