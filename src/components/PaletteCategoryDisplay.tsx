import { useEffect, useState } from 'react';
import { wrap } from 'comlink';
import type { RGBAVector } from '~/types';
import type { WorkerApi, PaletteAnalyzerResult } from '~/workers/palette-analyzer.worker';
import { cn } from '~/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import { CategoryBadge } from './CategoryBadge';

interface PaletteCategoryDisplayProps {
  colors: RGBAVector[];
  className?: string;
}

export function PaletteCategoryDisplay({ colors, className }: PaletteCategoryDisplayProps) {
  const [analysisResult, setAnalysisResult] = useState<PaletteAnalyzerResult | null>(null);

  useEffect(() => {
    if (!colors || colors.length === 0) return;

    const analyzePalette = async () => {
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
      }
    };

    analyzePalette();
  }, [colors]);

  if (!analysisResult || analysisResult.categories.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <Carousel className="w-full">
        <CarouselContent className="-ml-1 py-1">
          {analysisResult.categories.map((category) => (
            <CarouselItem key={category} className="pl-1 basis-auto">
              <CategoryBadge 
                category={category} 
                variant="secondary" 
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
