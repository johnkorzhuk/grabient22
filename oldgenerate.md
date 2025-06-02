```tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Slider } from '~/components/ui/slider';
import { Label } from '~/components/ui/label';
import { Plus, Trash2, RefreshCw, CopyIcon, Wand2 } from 'lucide-react';
import {
  generateCoeffsFromColors,
  refineCoefficients,
  hexToRgb,
  generatePresetVariations,
} from '~/lib/multiColorGradient';
import { cosineGradient, applyGlobals } from '~/lib/cosineGradient';
import { GradientPreview } from '~/components/GradientPreview';
import { getCollectionStyleCSS } from '~/lib/getCollectionStyleCSS';
import { COLLECTION_STYLES, DEFAULT_STYLE, DEFAULT_STEPS, DEFAULT_ANGLE } from '~/validators';
import { nanoid } from 'nanoid';
import { serializeCoeffs } from '~/lib/serialization';
import type { AppCollection, CosineCoeffs } from '~/types';

export const Route = createFileRoute('/_layout/generate')({
  component: GeneratePage,
});

const DEFAULT_COLORS = [
  '#813173', // Purple
  '#D94734', // Red
  '#E8B13C', // Gold
];

function GeneratePage() {
  // State for color stops
  const [colorStops, setColorStops] = useState<string[]>(DEFAULT_COLORS);

  // State for gradient parameters
  const [style, setStyle] = useState<string>(DEFAULT_STYLE);
  const [steps, setSteps] = useState<number>(DEFAULT_STEPS);
  const [angle, setAngle] = useState<number>(DEFAULT_ANGLE);

  // State for generated collections
  const [collections, setCollections] = useState<AppCollection[]>([]);

  // State for copied CSS
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // State for loading status
  const [isGenerating, setIsGenerating] = useState(false);

  // Add a new color stop
  const addColorStop = () => {
    // Generate a random color
    const randomColor = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`;
    setColorStops([...colorStops, randomColor]);
  };

  // Remove a color stop
  const removeColorStop = (index: number) => {
    if (colorStops.length <= 2) return; // Keep at least 2 colors
    const newColors = [...colorStops];
    newColors.splice(index, 1);
    setColorStops(newColors);
  };

  // Update color at index
  const updateColor = (index: number, color: string) => {
    const newColors = [...colorStops];
    newColors[index] = color;
    setColorStops(newColors);
  };

  // Ensure all coefficient vectors have alpha = 1
  const normalizeCoefficients = (coeffs: number[][]): CosineCoeffs => {
    return coeffs.map((vector) => {
      // Make sure the vector has 4 elements and the 4th element is exactly 1
      const normalizedVector = [...vector];
      if (normalizedVector.length < 4) {
        normalizedVector.push(1); // Add alpha if missing
      } else {
        normalizedVector[3] = 1; // Set alpha to exactly 1
      }
      return normalizedVector;
    }) as CosineCoeffs;
  };

  // Copy CSS to clipboard
  const copyCss = (index: number, cssString: string) => {
    navigator.clipboard.writeText(cssString);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Generate gradients based on color stops
  const generateGradients = async () => {
    if (colorStops.length < 2) return;

    setIsGenerating(true);

    try {
      // Convert hex colors to RGB
      const rgbColors = colorStops.map((color) => hexToRgb(color));

      // Generate initial coefficients
      const initialCoeffs = generateCoeffsFromColors(rgbColors);

      // Refine coefficients for better color matching
      const refinedCoeffs = refineCoefficients(rgbColors, initialCoeffs, {
        numStartPoints: 3, // Try multiple starting points for better results
        iterations: 200,
        targetError: 0.008, // Lower target error for better color matching
      });

      // Normalize coefficients to ensure alpha = 1
      const normalizedCoeffs = normalizeCoefficients(refinedCoeffs);

      // Create collection for base gradient
      const baseCollection: AppCollection = {
        _id: nanoid(10),
        coeffs: normalizedCoeffs,
        globals: [0, 1, 1, 0], // Default globals: no exposure, normal contrast, normal frequency, no phase
        style: style as any,
        steps,
        angle,
        seed: '',
        likes: 0,
        _creationTime: Date.now(),
      };

      // Generate and set the seed
      baseCollection.seed = serializeCoeffs(normalizedCoeffs, baseCollection.globals);

      // Generate variations with different styles
      const variations = COLLECTION_STYLES.map((collectionStyle) => ({
        ...baseCollection,
        _id: nanoid(10),
        style: collectionStyle,
        seed: baseCollection.seed,
      }));

      // Add some creative variations based on presets
      const creativeVariations = Array.from({ length: 3 }, () => {
        const presetCoeffs = generatePresetVariations();

        // Explicitly ensure alpha channel is correctly set for all coefficient vectors
        const normalizedCoeffs = [
          [...presetCoeffs[0].slice(0, 3), 1], // a with alpha = 1
          [...presetCoeffs[1].slice(0, 3), 1], // b with alpha = 1 (important!)
          [...presetCoeffs[2].slice(0, 3), 1], // c with alpha = 1
          [...presetCoeffs[3].slice(0, 3), 1], // d with alpha = 0
        ] as CosineCoeffs;

        const creativeCollection: AppCollection = {
          _id: nanoid(10),
          coeffs: normalizedCoeffs, // Use normalized coeffs
          globals: [0, 1, 1, 0],
          style: COLLECTION_STYLES[Math.floor(Math.random() * COLLECTION_STYLES.length)],
          steps,
          angle,
          seed: '',
          likes: 0,
          _creationTime: Date.now(),
        };

        // Now serialize with the normalized coefficients
        creativeCollection.seed = serializeCoeffs(normalizedCoeffs, creativeCollection.globals);
        return creativeCollection;
      });

      // Set collections with base, variations, and creative variations
      // @ts-ignore-next-line
      setCollections([baseCollection, ...variations, ...creativeVariations]);
    } catch (error) {
      console.error('Error generating gradients:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate creative variations using presets
  const generateCreativeVariations = () => {
    setIsGenerating(true);

    try {
      // Generate several creative variations based on artistic presets
      const creativeVariations = Array.from({ length: 8 }, () => {
        const presetCoeffs = generatePresetVariations();

        // Explicitly ensure alpha channel is correctly set for all coefficient vectors
        // This is the critical fix - force alpha values to match validation requirements
        const normalizedCoeffs = [
          [...presetCoeffs[0].slice(0, 3), 1], // a with alpha = 1
          [...presetCoeffs[1].slice(0, 3), 1], // b with alpha = 1 (important!)
          [...presetCoeffs[2].slice(0, 3), 1], // c with alpha = 1
          [...presetCoeffs[3].slice(0, 3), 1], // d with alpha = 1
        ] as CosineCoeffs;

        const creativeCollection: AppCollection = {
          _id: nanoid(10),
          coeffs: normalizedCoeffs, // Use normalized coeffs
          globals: [0, 1, 1, 0],
          style: COLLECTION_STYLES[Math.floor(Math.random() * COLLECTION_STYLES.length)],
          steps,
          angle,
          seed: '',
          likes: 0,
          _creationTime: Date.now(),
        };

        // Now serialize with the normalized coefficients
        creativeCollection.seed = serializeCoeffs(normalizedCoeffs, creativeCollection.globals);
        return creativeCollection;
      });

      // Set collections with creative variations
      setCollections(creativeVariations);
    } catch (error) {
      console.error('Error generating creative variations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on first load
  useEffect(() => {
    generateGradients();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">Generate Multi-Color Gradients</h1>

        <div className="bg-background border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Color Stops</h2>

          <div className="grid gap-4 mb-6">
            {colorStops.map((color, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-md" style={{ backgroundColor: color }}></div>
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="w-32"
                  placeholder="#RRGGBB"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeColorStop(index)}
                  disabled={colorStops.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={addColorStop} className="mb-6">
            <Plus className="h-4 w-4 mr-2" /> Add Color
          </Button>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <Label htmlFor="style">Style</Label>
              <select
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full h-10 px-3 py-2 border rounded-md"
              >
                {COLLECTION_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="steps">Steps ({steps})</Label>
              <Slider
                id="steps"
                min={2}
                max={50}
                step={1}
                value={[steps]}
                onValueChange={(values) => setSteps(values[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="angle">Angle ({angle}°)</Label>
              <Slider
                id="angle"
                min={0}
                max={360}
                step={5}
                value={[angle]}
                onValueChange={(values) => setAngle(values[0])}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={generateGradients} className="flex-1" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                'Generate From Colors'
              )}
            </Button>

            <Button onClick={generateCreativeVariations} className="flex-1" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" /> Creative Variations
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {collections.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Gradients</h2>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              These cosine gradients are generated using mathematical functions that incorporate
              your selected colors. Each uses a different gradient style. Hover over any gradient to
              see controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection, index) => {
              // Apply globals to coefficients
              const processedCoeffs = applyGlobals(collection.coeffs, collection.globals);

              // Generate gradient colors
              const gradientColors = cosineGradient(collection.steps, processedCoeffs);

              // Get CSS for the gradient
              const { cssString, styles } = getCollectionStyleCSS(
                collection.style,
                gradientColors,
                collection.angle,
                {
                  seed: collection.seed,
                  href: window.location.href,
                },
              );

              return (
                <div
                  key={collection._id}
                  className="relative group border rounded-lg overflow-hidden h-48"
                >
                  <Link
                    to="/$seed"
                    params={{ seed: collection.seed }}
                    className="block h-full w-full cursor-pointer"
                  >
                    <GradientPreview cssProps={styles} />
                  </Link>

                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-background/80 backdrop-blur-sm"
                      onClick={() => copyCss(index, cssString)}
                    >
                      {copiedIndex === index ? 'Copied!' : <CopyIcon className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs font-mono bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                      {collection.style}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Original Colors</h3>
            <div className="flex flex-wrap gap-2">
              {colorStops.map((color, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-md border"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs mt-1">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
