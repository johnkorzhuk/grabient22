import React from 'react';
import { cn } from '~/lib/utils';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import * as v from 'valibot';
import { styleWithAutoValidator, angleWithAutoValidator } from '~/validators';

export interface ViewOptionsProps {
  style: v.InferOutput<typeof styleWithAutoValidator>;
  steps: number | 'auto';
  angle: v.InferOutput<typeof angleWithAutoValidator>;
  className?: string;
  variant?: 'fixed' | 'full';
}

export const ViewOptions: React.FC<ViewOptionsProps> = ({
  style,
  steps,
  angle,
  className,
  variant = 'fixed',
}) => {
  if (variant === 'fixed') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <StyleSelect value={style} className="w-[170px] lg:w-[190px] h-10" />
        <StepsInput value={steps} className="w-[90px] lg:w-[110px] h-10" />
        <AngleInput value={angle} className="w-[90px] lg:w-[110px] h-10" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 w-full overflow-x-auto', className)}>
      <StyleSelect value={style} className="w-[50%] min-w-[160px] h-10" />
      <StepsInput value={steps} className="w-[25%] min-w-[80px] h-10" />
      <AngleInput value={angle} className="w-[25%] min-w-[80px] h-10" />
    </div>
  );
};
