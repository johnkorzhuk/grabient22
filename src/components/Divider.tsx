import { cn } from '~/lib/utils';
import { useTheme } from './theme/ThemeProvider';

export function PrimaryDivider({ className }: { className?: string }) {
  const { resolved: theme } = useTheme();
  return (
    <div
      className={cn('block w-full px-5 lg:px-14 absolute top-0', className, {
        'opacity-50': theme === 'dark',
        'opacity-80': theme === 'light',
      })}
    >
      <div
        className="h-[1px] w-full"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--ring) 0%, var(--ring) 2px, transparent 2px, transparent 12px)',
          backgroundSize: '6px 1px',
        }}
      ></div>
    </div>
  );
}
