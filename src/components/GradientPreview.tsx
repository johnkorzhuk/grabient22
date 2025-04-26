export function GradientPreview({ cssProps }: { cssProps: React.CSSProperties }) {
  return (
    <div
      className="relative h-full w-full"
      style={{
        ...cssProps,
      }}
    />
  );
}
