import { cn } from '~/lib/utils';
import { useEffect, useState } from 'react';
import { wrap } from 'comlink';
import type { RGBAVector } from '~/types';
import type { WorkerApi, PaletteAnalyzerResult } from '~/workers/palette-analyzer.worker';
import { CategoryBadge } from './CategoryBadge';

interface PaletteCategorySidebarProps {
  colors: RGBAVector[];
  className?: string;
}

export function PaletteCategorySidebar({ colors, className }: PaletteCategorySidebarProps) {
  const [analysisResult, setAnalysisResult] = useState<PaletteAnalyzerResult | null>(null);

  useEffect(() => {
    if (!colors || colors.length === 0) return;

    const analyzePalette = async () => {
      try {
        // Create worker and wrap with comlink
        const worker = new Worker(
          new URL('../workers/palette-analyzer.worker.ts', import.meta.url),
          { type: 'module' },
        );
        const workerApi = wrap<WorkerApi>(worker);

        // Analyze the palette
        const result = await workerApi.analyzePalette(colors);
        setAnalysisResult(result);

        // Clean up worker
        worker.terminate();
      } catch (err) {
        console.error('Error analyzing palette:', err);
      }
    };

    analyzePalette();
  }, [colors]);

  if (!analysisResult || analysisResult.categories.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-1', className)}>
      <h3 className="text-xs font-medium text-muted-foreground mb-3 mt-1">Categories</h3>
      <div className="flex flex-wrap gap-1">
        {analysisResult.categories.map((category) => (
          <CategoryBadge key={category} category={category} variant="secondary" />
        ))}
      </div>
    </div>
  );
}
