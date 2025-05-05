import { cn } from '~/lib/utils';

export function GradientPreview({
  cssProps,
  className,
}: {
  cssProps: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={cn('relative h-full w-full', className)}
      style={{
        ...cssProps,
      }}
    />
  );
}
