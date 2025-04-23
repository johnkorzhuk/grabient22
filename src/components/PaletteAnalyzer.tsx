import { useEffect, useState } from 'react';
import { wrap } from 'comlink';
import type { RGBAVector } from '~/types';
import type { PaletteCategoryKey } from '~/validators';
import type { WorkerApi, PaletteAnalyzerResult } from '~/workers/palette-analyzer.worker';
import { Badge } from './ui/badge';
import { cn } from '~/lib/utils';
import { getCategoryDisplayName } from '~/validators';

interface PaletteAnalyzerProps {
  colors: RGBAVector[];
  className?: string;
}

export function PaletteAnalyzer({ colors, className }: PaletteAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<PaletteAnalyzerResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!colors || colors.length === 0) return;

    const analyzePalette = async () => {
      setIsAnalyzing(true);
      setError(null);

      try {
        // Create worker and wrap with comlink
        const worker = new Worker(
          new URL('../workers/palette-analyzer.worker.ts', import.meta.url),
          { type: 'module' }
        );
        const workerApi = wrap<WorkerApi>(worker);

        // Analyze the palette
        const result = await workerApi.analyzePalette(colors);
        setAnalysisResult(result);

        // Clean up worker
        worker.terminate();
      } catch (err) {
        console.error('Error analyzing palette:', err);
        setError('Failed to analyze palette');
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzePalette();
  }, [colors]);

  if (isAnalyzing) {
    return (
      <div className={cn("flex flex-col space-y-2", className)}>
        <h3 className="text-sm font-medium">Analyzing palette...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col space-y-2", className)}>
        <h3 className="text-sm font-medium text-destructive">{error}</h3>
      </div>
    );
  }

  if (!analysisResult || analysisResult.categories.length === 0) {
    return (
      <div className={cn("flex flex-col space-y-2", className)}>
        <h3 className="text-sm font-medium">Palette Categories</h3>
        <p className="text-xs text-muted-foreground">No matching categories found</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <h3 className="text-sm font-medium">Palette Categories</h3>
      <div className="flex flex-wrap gap-1.5">
        {analysisResult.categories.map((category) => (
          <Badge key={category} variant="secondary" className="text-xs">
            {getCategoryDisplayName(category)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
