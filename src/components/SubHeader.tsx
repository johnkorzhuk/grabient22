import { cn } from '~/lib/utils';
import { NavigationSelect } from '~/components/NavigationSelect';

interface SubHeaderProps {
  className?: string;
  fixed?: boolean;
}

export function SubHeader({ className, fixed = false }: SubHeaderProps) {
  return (
    <header
      className={cn(
        'w-full bg-background/90 backdrop-blur-sm py-3 border-b border-dashed border-border/70',
        fixed ? 'sticky top-16 z-40' : '',
        className,
      )}
    >
      <div className="mx-auto w-full px-5 lg:px-14">
        <div className="flex items-center justify-between">
          <NavigationSelect />
        </div>
      </div>
    </header>
  );
}
