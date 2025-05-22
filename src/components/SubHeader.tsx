import { cn } from '~/lib/utils';
import { NavigationSelect } from '~/components/NavigationSelect';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import { useSearch } from '@tanstack/react-router';

interface SubHeaderProps {
  className?: string;
}

export function SubHeader({ className }: SubHeaderProps) {
  const { steps, angle, style } = useSearch({ from: '/_layout' });
  return (
    <header
      className={cn(
        'w-full bg-background/90 backdrop-blur-sm py-3 border-b border-dashed border-border/70',

        className,
      )}
    >
      <div className="mx-auto w-full px-5 lg:px-14">
        <div className="flex items-center justify-between">
          <NavigationSelect />
          <div className="flex items-center gap-3 ">
            <StyleSelect value={style} className="w-[190px] h-10" />
            <div className="flex gap-3">
              <StepsInput value={steps} className="w-[110px] h-10" />
              <AngleInput value={angle} className="w-[110px] h-10" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
