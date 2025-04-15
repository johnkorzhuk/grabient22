/**
 * Harmonious Palette Generator based on color theory principles
 * Implements various color harmony categories for more intentional color palettes
 */

// Type definitions
export type RGBAVector = [number, number, number, number];
export type CosineCoeffs = [RGBAVector, RGBAVector, RGBAVector, RGBAVector];
export type HSVVector = [number, number, number]; // [hue, saturation, value]

// Color harmony categories
export type ColorHarmonyCategory =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'high-contrast'
  | 'pastel'
  | 'earthy'
  | 'random';

export interface PaletteResult {
  coeffs: CosineCoeffs;
  globals: [number, number, number, number];
  colors: RGBAVector[];
  steps: number;
  attemptsTaken: number;
  category: ColorHarmonyCategory;
  quality?: string;
}

export interface PaletteGeneratorOptions {
  steps?: number;
  maxAttempts?: number;
  minColorDistance?: number;
  minBrightness?: number;
  maxBrightness?: number;
  minSaturation?: number;
  category?: ColorHarmonyCategory;
}

/**
 * Main function to generate a harmonious palette based on selected category
 */
export function generateHarmoniousPalette({
  steps = 7,
  maxAttempts = 100,
  minColorDistance = 5, // Reduced from 10 as some harmony types have naturally closer colors
  minBrightness = 0.15,
  maxBrightness = 0.85,
  minSaturation = 0.2,
  category = 'random',
}: PaletteGeneratorOptions = {}): PaletteResult {
  // Determine generation strategy based on category
  switch (category) {
    case 'monochromatic':
      return generateMonochromaticPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness,
        maxBrightness,
        minSaturation,
      });
    case 'analogous':
      return generateAnalogousPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness,
        maxBrightness,
        minSaturation,
      });
    case 'complementary':
      return generateComplementaryPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness,
        maxBrightness,
        minSaturation,
      });
    case 'split-complementary':
      return generateSplitComplementaryPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness,
        maxBrightness,
        minSaturation,
      });
    case 'high-contrast':
      return generateHighContrastPalette({
        steps,
        maxAttempts,
        minColorDistance: Math.max(minColorDistance, 15), // Ensure higher distance for contrast
        minBrightness: 0.1, // Allow darker colors for higher contrast
        maxBrightness: 0.9,
        minSaturation: 0.3, // Higher minimum saturation for contrast
      });
    case 'pastel':
      return generatePastelPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness: 0.7, // High brightness for pastels
        maxBrightness: 0.95,
        minSaturation: 0.1, // Lower saturation for pastels
      });
    case 'earthy':
      return generateEarthyPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness: 0.2, // Can be darker for earth tones
        maxBrightness: 0.8,
        minSaturation: 0.2,
      });
    case 'random':
    default:
      return generateRandomPalette({
        steps,
        maxAttempts,
        minColorDistance,
        minBrightness,
        maxBrightness,
        minSaturation,
      });
  }
}

/**
 * Generate a monochromatic palette (variations of a single hue)
 */
function generateMonochromaticPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  while (attempt < maxAttempts) {
    attempt++;

    // Choose a single base hue (0-1)
    const baseHue = Math.random();

    // Convert hue to phase in cosine gradient (0-2π)
    const basePhase = baseHue * TAU;

    // For monochromatic, we want:
    // 1. Very low frequency in the red/green/blue channels to keep the hue stable
    // 2. Varied brightness and saturation

    // Try to create a monochromatic palette by carefully setting coefficients
    const coeffs: CosineCoeffs = [
      // a: offset vector - base colors (mid-range)
      [
        0.4 + Math.random() * 0.2, // Red component
        0.4 + Math.random() * 0.2, // Green component
        0.4 + Math.random() * 0.2, // Blue component
        1, // Alpha always 1
      ],
      // b: amplitude vector
      [
        0.15 + Math.random() * 0.3, // Red
        0.15 + Math.random() * 0.3, // Green
        0.15 + Math.random() * 0.3, // Blue
        0,
      ],
      // c: frequency vector - VERY LOW to maintain hue
      [
        0.2 + Math.random() * 0.2, // Low frequency for Red
        0.2 + Math.random() * 0.2, // Low frequency for Green
        0.2 + Math.random() * 0.2, // Low frequency for Blue
        0,
      ],
      // d: phase vector - similar phase to maintain hue
      [
        basePhase + (Math.random() * 0.2 - 0.1), // Red
        basePhase + (Math.random() * 0.2 - 0.1), // Green
        basePhase + (Math.random() * 0.2 - 0.1), // Blue
        0,
      ],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate the palette
    if (isPaletteValid(colors, options)) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'monochromatic',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal monochromatic palette after ${maxAttempts} attempts.`);

  const coeffs: CosineCoeffs = createMonochromaticCoeffs(Math.random());
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'monochromatic',
    quality: 'fallback',
  };
}

/**
 * Generate an analogous palette (adjacent hues on the color wheel)
 */
function generateAnalogousPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  while (attempt < maxAttempts) {
    attempt++;

    // Choose a primary hue (0-1)
    const primaryHue = Math.random();

    // For analogous, we want:
    // 1. Moderate frequency to create adjacent hues
    // 2. Phase values that span about 30-60 degrees (π/6 to π/3 radians)

    // Calculate hue range (convert to radians)
    const hueRange = (30 / 360) * TAU; // 30 degrees in radians

    // Create phase values for each RGB channel that result in colors within the desired hue range
    const basePhase = primaryHue * TAU;

    const coeffs: CosineCoeffs = [
      // a: offset vector - base colors
      [
        0.4 + Math.random() * 0.2,
        0.4 + Math.random() * 0.2,
        0.4 + Math.random() * 0.2,
        1, // Alpha always 1
      ],
      // b: amplitude vector
      [0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0],
      // c: frequency vector - moderate to create hue variation
      [
        0.5 + Math.random() * 0.5, // Red
        0.5 + Math.random() * 0.5, // Green
        0.5 + Math.random() * 0.5, // Blue
        0,
      ],
      // d: phase vector - staggered to create hue progression
      [
        basePhase, // Red
        basePhase + hueRange * (Math.random() * 0.5), // Green
        basePhase + hueRange * (Math.random() * 1.0), // Blue
        0,
      ],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate the palette
    if (isPaletteValid(colors, options)) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'analogous',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal analogous palette after ${maxAttempts} attempts.`);

  const coeffs: CosineCoeffs = createAnalogousCoeffs(Math.random());
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'analogous',
    quality: 'fallback',
  };
}

/**
 * Generate a complementary palette (opposite hues on the color wheel)
 */
function generateComplementaryPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  while (attempt < maxAttempts) {
    attempt++;

    // Choose a primary hue (0-1)
    const primaryHue = Math.random();
    const complementaryHue = (primaryHue + 0.5) % 1.0; // Opposite on color wheel

    // For complementary, we want:
    // 1. Higher frequency to create opposing hues
    // 2. Phase values that include both primary and complementary hues

    const basePhase = primaryHue * TAU;
    const compPhase = complementaryHue * TAU;

    const coeffs: CosineCoeffs = [
      // a: offset vector
      [
        0.5,
        0.5,
        0.5,
        1, // Alpha always 1
      ],
      // b: amplitude vector
      [0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0],
      // c: frequency vector - higher for strong contrast
      [0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0],
      // d: phase vector - primary and complementary
      [
        basePhase,
        basePhase + (Math.random() > 0.5 ? 0 : Math.PI), // Randomly either primary or complementary
        compPhase,
        0,
      ],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate the palette
    if (isPaletteValid(colors, options)) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'complementary',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal complementary palette after ${maxAttempts} attempts.`);

  const primaryHue = Math.random();
  const coeffs: CosineCoeffs = createComplementaryCoeffs(primaryHue);
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'complementary',
    quality: 'fallback',
  };
}

/**
 * Generate a split-complementary palette
 * (primary hue and two colors adjacent to its complement)
 */
function generateSplitComplementaryPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  while (attempt < maxAttempts) {
    attempt++;

    // Choose a primary hue (0-1)
    const primaryHue = Math.random();
    const complementaryHue = (primaryHue + 0.5) % 1.0; // Opposite on color wheel

    // Calculate split-complements (30 degrees from complementary)
    const splitAmount = 30 / 360; // 30 degrees normalized to 0-1 scale
    const splitComp1 = (complementaryHue - splitAmount + 1.0) % 1.0;
    const splitComp2 = (complementaryHue + splitAmount) % 1.0;

    const basePhase = primaryHue * TAU;
    const splitPhase1 = splitComp1 * TAU;
    const splitPhase2 = splitComp2 * TAU;

    const coeffs: CosineCoeffs = [
      // a: offset vector
      [
        0.5,
        0.5,
        0.5,
        1, // Alpha always 1
      ],
      // b: amplitude vector
      [0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0],
      // c: frequency vector - higher for distinct hues
      [0.6 + Math.random() * 0.4, 0.6 + Math.random() * 0.4, 0.6 + Math.random() * 0.4, 0],
      // d: phase vector - using primary and split complements
      [basePhase, splitPhase1, splitPhase2, 0],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate the palette
    if (isPaletteValid(colors, options)) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'split-complementary',
      };
    }
  }

  // Fallback
  console.warn(
    `Failed to generate optimal split-complementary palette after ${maxAttempts} attempts.`,
  );

  const primaryHue = Math.random();
  const coeffs: CosineCoeffs = createSplitComplementaryCoeffs(primaryHue);
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'split-complementary',
    quality: 'fallback',
  };
}

/**
 * Generate a high contrast palette with maximum perceptual distance
 */
function generateHighContrastPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  // For high contrast, increase the minimum perceptual distance
  const minColorDistance = Math.max(options.minColorDistance || 10, 20);

  while (attempt < maxAttempts) {
    attempt++;

    // For high contrast, we want:
    // 1. High amplitudes for strong variations
    // 2. Phases that create opposing colors
    // 3. High frequencies to increase variation

    const coeffs: CosineCoeffs = [
      // a: offset vector
      [
        0.5,
        0.5,
        0.5,
        1, // Alpha always 1
      ],
      // b: amplitude vector - large for contrast
      [
        0.35 + Math.random() * 0.15, // Close to maximum for contrast
        0.35 + Math.random() * 0.15,
        0.35 + Math.random() * 0.15,
        0,
      ],
      // c: frequency vector - high for variation
      [0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0],
      // d: phase vector - spread out
      [
        Math.random() * TAU,
        (Math.random() * TAU + Math.PI / 2) % TAU, // Offset by 90°
        (Math.random() * TAU + Math.PI) % TAU, // Offset by 180°
        0,
      ],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate with stricter color distance requirements
    if (isPaletteValid(colors, { ...options, minColorDistance })) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'high-contrast',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal high-contrast palette after ${maxAttempts} attempts.`);

  const coeffs: CosineCoeffs = createHighContrastCoeffs();
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'high-contrast',
    quality: 'fallback',
  };
}

/**
 * Generate a pastel palette (soft, light colors)
 */
function generatePastelPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  // Pastel-specific options
  const minBrightness = 0.7; // High brightness for pastels
  const maxBrightness = 0.95;
  const maxSaturation = 0.4; // Low saturation for pastels

  while (attempt < maxAttempts) {
    attempt++;

    // For pastels, we want:
    // 1. High base values (offsets) for brightness
    // 2. Low amplitudes for low saturation
    // 3. Varied hues across the color wheel

    const coeffs: CosineCoeffs = [
      // a: offset vector - high for brightness
      [
        0.7 + Math.random() * 0.25, // High value for brightness
        0.7 + Math.random() * 0.25,
        0.7 + Math.random() * 0.25,
        1, // Alpha always 1
      ],
      // b: amplitude vector - low for low saturation
      [
        0.05 + Math.random() * 0.15, // Low amplitude for pastel
        0.05 + Math.random() * 0.15,
        0.05 + Math.random() * 0.15,
        0,
      ],
      // c: frequency vector - moderate for hue variety
      [0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0],
      // d: phase vector - varied for different hues
      [Math.random() * TAU, Math.random() * TAU, Math.random() * TAU, 0],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Additional validation for pastels
    if (
      isPaletteValid(colors, {
        ...options,
        minBrightness,
        maxBrightness,
      }) &&
      isLowSaturation(colors, maxSaturation)
    ) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'pastel',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal pastel palette after ${maxAttempts} attempts.`);

  const coeffs: CosineCoeffs = createPastelCoeffs();
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'pastel',
    quality: 'fallback',
  };
}

/**
 * Generate an earthy/natural palette (browns, greens, etc.)
 */
function generateEarthyPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  // Earth tone hue ranges (normalized to 0-1)
  const earthHueRanges = [
    [0.05, 0.15], // Browns/Oranges
    [0.25, 0.4], // Greens
    [0.08, 0.13], // Yellows/Tans
    [0.02, 0.05], // Reds/Terracotta
  ];

  while (attempt < maxAttempts) {
    attempt++;

    // Choose a random earth tone hue range
    const hueRange = earthHueRanges[Math.floor(Math.random() * earthHueRanges.length)];
    const primaryHue = hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]);

    // For earth tones, we want:
    // 1. Lower saturation
    // 2. Limited hue range
    // 3. Moderate brightness variation

    const basePhase = primaryHue * TAU;

    const coeffs: CosineCoeffs = [
      // a: offset vector
      [
        0.4 + Math.random() * 0.3, // Moderate brightness
        0.4 + Math.random() * 0.3,
        0.4 + Math.random() * 0.3,
        1, // Alpha always 1
      ],
      // b: amplitude vector - low-moderate for earthy feel
      [
        0.1 + Math.random() * 0.2, // Lower amplitudes for less saturation
        0.1 + Math.random() * 0.2,
        0.1 + Math.random() * 0.2,
        0,
      ],
      // c: frequency vector - low for limited hue range
      [0.3 + Math.random() * 0.3, 0.3 + Math.random() * 0.3, 0.3 + Math.random() * 0.3, 0],
      // d: phase vector - clustered near chosen earth tone
      [
        basePhase + (Math.random() * 0.1 - 0.05), // Small variation
        basePhase + (Math.random() * 0.1 - 0.05), // Small variation
        basePhase + (Math.random() * 0.1 - 0.05), // Small variation
        0,
      ],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate and check if all colors are within earth tone ranges
    if (isPaletteValid(colors, options) && isEarthyPalette(colors)) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'earthy',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal earthy palette after ${maxAttempts} attempts.`);

  const coeffs: CosineCoeffs = createEarthyCoeffs();
  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'earthy',
    quality: 'fallback',
  };
}

/**
 * Generate a random palette (original algorithm)
 */
function generateRandomPalette(options: PaletteGeneratorOptions): PaletteResult {
  const TAU = Math.PI * 2;
  let attempt = 0;
  const maxAttempts = options.maxAttempts || 100;
  const steps = options.steps || 7;

  while (attempt < maxAttempts) {
    attempt++;

    // Generate random coefficients similar to the original algorithm
    const coeffs: CosineCoeffs = [
      // a: offset vector - base colors (mid-range to avoid extremes)
      [
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.4,
        1, // Alpha always 1
      ],
      // b: amplitude vector (not too large to avoid color clipping)
      [0.1 + Math.random() * 0.4, 0.1 + Math.random() * 0.4, 0.1 + Math.random() * 0.4, 1],
      // c: frequency vector - more variation here creates more diverse palettes
      [0.5 + Math.random() * 1.5, 0.5 + Math.random() * 1.5, 0.5 + Math.random() * 1.5, 1],
      // d: phase vector - controls how colors are shifted
      [Math.random() * TAU, Math.random() * TAU, Math.random() * TAU, 1],
    ];

    // Generate colors
    const colors = cosineGradient(steps, coeffs);

    // Validate the palette
    if (isPaletteValid(colors, options)) {
      return {
        coeffs,
        globals: [0, 1, 1, 0],
        colors,
        steps,
        attemptsTaken: attempt,
        category: 'random',
      };
    }
  }

  // Fallback
  console.warn(`Failed to generate optimal random palette after ${maxAttempts} attempts.`);

  const coeffs: CosineCoeffs = [
    [0.5, 0.5, 0.5, 1],
    [0.25, 0.25, 0.25, 1],
    [1.0, 1.0, 1.0, 1],
    [0, 0.33, 0.67, 1],
  ];

  const colors = cosineGradient(steps, coeffs);

  return {
    coeffs,
    globals: [0, 1, 1, 0],
    colors,
    steps,
    attemptsTaken: attempt,
    category: 'random',
    quality: 'fallback',
  };
}

// Helper functions for generating specific coefficient patterns
function createMonochromaticCoeffs(baseHue: number): CosineCoeffs {
  const TAU = Math.PI * 2;
  const basePhase = baseHue * TAU;

  return [
    [0.5, 0.5, 0.5, 1],
    [0.25, 0.25, 0.25, 1],
    [0.2, 0.2, 0.2, 1],
    [basePhase, basePhase, basePhase, 1],
  ];
}

function createAnalogousCoeffs(primaryHue: number): CosineCoeffs {
  const TAU = Math.PI * 2;
  const basePhase = primaryHue * TAU;
  const hueRange = (30 / 360) * TAU;

  return [
    [0.5, 0.5, 0.5, 1],
    [0.25, 0.25, 0.25, 1],
    [0.5, 0.5, 0.5, 1],
    [basePhase, basePhase + hueRange * 0.3, basePhase + hueRange * 0.6, 1],
  ];
}

function createComplementaryCoeffs(primaryHue: number): CosineCoeffs {
  const TAU = Math.PI * 2;
  const basePhase = primaryHue * TAU;
  const compPhase = ((primaryHue + 0.5) % 1.0) * TAU;

  return [
    [0.5, 0.5, 0.5, 1],
    [0.3, 0.3, 0.3, 1],
    [0.6, 0.6, 0.6, 1],
    [basePhase, basePhase, compPhase, 1],
  ];
}

function createSplitComplementaryCoeffs(primaryHue: number): CosineCoeffs {
  const TAU = Math.PI * 2;
  const basePhase = primaryHue * TAU;
  const complementaryHue = (primaryHue + 0.5) % 1.0;

  // Calculate split-complements (30 degrees from complementary)
  const splitAmount = 30 / 360; // 30 degrees normalized to 0-1 scale
  const splitComp1 = (complementaryHue - splitAmount + 1.0) % 1.0;
  const splitComp2 = (complementaryHue + splitAmount) % 1.0;

  const splitPhase1 = splitComp1 * TAU;
  const splitPhase2 = splitComp2 * TAU;

  return [
    [0.5, 0.5, 0.5, 1],
    [0.3, 0.3, 0.3, 1],
    [0.7, 0.7, 0.7, 1],
    [basePhase, splitPhase1, splitPhase2, 1],
  ];
}

function createHighContrastCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  return [
    [0.5, 0.5, 0.5, 1],
    [0.4, 0.4, 0.4, 1], // High amplitude for contrast
    [1.0, 1.0, 1.0, 1], // High frequency
    [0, TAU / 3, (2 * TAU) / 3, 1], // Even spacing for maximum contrast
  ];
}

function createPastelCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  return [
    [0.8, 0.8, 0.8, 1], // High base value for brightness
    [0.1, 0.1, 0.1, 1], // Low amplitude for less saturation
    [0.5, 0.5, 0.5, 1],
    [0, TAU / 4, TAU / 2, 1],
  ];
}

function createEarthyCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Choose a base earth tone (green or brown)
  const isGreen = Math.random() > 0.5;
  const baseHue = isGreen ? 0.3 : 0.08; // Green or brown
  const basePhase = baseHue * TAU;

  return [
    [0.45, 0.45, 0.45, 1], // Moderate brightness
    [0.15, 0.15, 0.15, 1], // Low amplitude for earthy tones
    [0.3, 0.3, 0.3, 1], // Low frequency for limited hue range
    [basePhase, basePhase + 0.1, basePhase - 0.1, 1], // Clustered phases
  ];
}

/**
 * Helper function for cosine gradient
 */
function cosineGradient(numStops: number, coeffs: CosineCoeffs): RGBAVector[] {
  const TAU = Math.PI * 2;
  const result: RGBAVector[] = [];

  // Use a single array allocation for temporary values
  const tempColor = new Array(coeffs[0].length);
  const offsets = coeffs[0];
  const amplitudes = coeffs[1];
  const frequencies = coeffs[2];
  const phases = coeffs[3];

  // Calculate the colors evenly spaced from 0 to 1
  for (let i = 0; i < numStops; i++) {
    const t = numStops > 1 ? i / (numStops - 1) : 0;

    // Calculate each color channel
    for (let channel = 0; channel < offsets.length; channel++) {
      // Cosine gradient formula: offset + amplitude * cos(2π * (frequency * t + phase))
      const value =
        offsets[channel] +
        amplitudes[channel] * Math.cos(TAU * (frequencies[channel] * t + phases[channel]));

      // Clamp the value between 0 and 1
      tempColor[channel] = Math.max(0, Math.min(1, value));
    }

    result.push([...tempColor] as RGBAVector);
  }

  return result;
}

/**
 * Validation functions
 */

// Convert RGB to HSV for hue-based checks
function rgbToHsv(rgb: RGBAVector): HSVVector {
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate HSV
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta === 0) {
    h = 0; // Achromatic (gray)
  } else {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      // max === b
      h = (r - g) / delta + 4;
    }

    h *= 60; // Convert to degrees

    if (h < 0) {
      h += 360;
    }
  }

  // Normalize h to 0-1 range
  h /= 360;

  return [h, s, v];
}

// Calculate perceptual distance using Delta E 2000
function deltaE2000(lab1: [number, number, number], lab2: [number, number, number]): number {
  // This is a simplified implementation - in a production environment,
  // you might want to use a full CIEDE2000 implementation from a color library

  // Extract L, a, b values from each color
  const L1 = lab1[0],
    a1 = lab1[1],
    b1 = lab1[2];
  const L2 = lab2[0],
    a2 = lab2[1],
    b2 = lab2[2];

  // For simplicity, we'll use a weighted Euclidean distance
  // This is not true CIEDE2000 but a reasonable approximation
  const deltaL = L1 - L2;
  const deltaA = a1 - a2;
  const deltaB = b1 - b2;

  // Weighted distance for perceptual uniformity
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// Convert RGB to Lab color space
function rgbToLab(rgb: RGBAVector): [number, number, number] {
  // Step 1: Convert RGB to XYZ
  // First, convert RGB to linear RGB (removing gamma correction)
  let rVal = rgb[0],
    gVal = rgb[1],
    bVal = rgb[2];

  // Convert sRGB to linear RGB
  rVal = rVal > 0.04045 ? Math.pow((rVal + 0.055) / 1.055, 2.4) : rVal / 12.92;
  gVal = gVal > 0.04045 ? Math.pow((gVal + 0.055) / 1.055, 2.4) : gVal / 12.92;
  bVal = bVal > 0.04045 ? Math.pow((bVal + 0.055) / 1.055, 2.4) : bVal / 12.92;

  // Convert linear RGB to XYZ using the standard matrix
  // Using D65 standard illuminant
  let x = rVal * 0.4124564 + gVal * 0.3575761 + bVal * 0.1804375;
  let y = rVal * 0.2126729 + gVal * 0.7151522 + bVal * 0.072175;
  let z = rVal * 0.0193339 + gVal * 0.119192 + bVal * 0.9503041;

  // Step 2: Convert XYZ to Lab
  // Using D65 reference white
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  // XYZ to Lab function
  const epsilon = 0.008856; // Intent is 216/24389
  const kappa = 903.3; // Intent is 24389/27

  // Scale XYZ values relative to reference white
  x = x / xn;
  y = y / yn;
  z = z / zn;

  // Apply the LAB transform
  const fx = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

  // Calculate LAB components
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bComponent = 200 * (fy - fz);

  return [L, a, bComponent];
}

// Calculate brightness (luminance) of a color
function getBrightness(color: RGBAVector): number {
  return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
}

// Calculate approximate saturation of a color
function getSaturation(color: RGBAVector): number {
  const max = Math.max(color[0], color[1], color[2]);
  const min = Math.min(color[0], color[1], color[2]);

  // Avoid division by zero
  if (max === 0) return 0;

  return (max - min) / max;
}

// Validate if a palette meets the criteria
function isPaletteValid(colors: RGBAVector[], options: PaletteGeneratorOptions): boolean {
  // Default options
  const minBrightness = options.minBrightness || 0.15;
  const maxBrightness = options.maxBrightness || 0.85;
  const minSaturation = options.minSaturation || 0.2;
  const minColorDistance = options.minColorDistance || 5;

  // Check brightness range
  const brightnesses = colors.map((color) => getBrightness(color));
  const minFound = Math.min(...brightnesses);
  const maxFound = Math.max(...brightnesses);

  if (minFound < minBrightness || maxFound > maxBrightness) {
    return false;
  }

  // Check saturation
  const saturations = colors.map((color) => getSaturation(color));
  const avgSaturation = saturations.reduce((sum, s) => sum + s, 0) / saturations.length;

  if (avgSaturation < minSaturation) {
    return false;
  }

  // Check for sufficient color variety
  // Convert all colors to Lab for accurate perceptual comparison
  const labColors = colors.map((rgb) => rgbToLab(rgb));

  // Check for minimum distance between any two colors
  for (let i = 0; i < labColors.length; i++) {
    for (let j = i + 1; j < labColors.length; j++) {
      const distance = deltaE2000(labColors[i], labColors[j]);

      if (distance < minColorDistance) {
        return false; // Colors are too similar
      }
    }
  }

  return true;
}

// Check if colors have low saturation (for pastel palettes)
function isLowSaturation(colors: RGBAVector[], maxSaturation: number): boolean {
  for (const color of colors) {
    const saturation = getSaturation(color);
    if (saturation > maxSaturation) {
      return false;
    }
  }
  return true;
}

// Check if colors are within earth tone hue ranges
function isEarthyPalette(colors: RGBAVector[]): boolean {
  // Earth tone hue ranges (normalized to 0-1)
  const earthHueRanges = [
    [0.0, 0.15], // Browns/Oranges/Reds
    [0.2, 0.4], // Greens
    [0.05, 0.15], // Yellows/Tans
  ];

  // Count the number of colors that fall within earth tone ranges
  let earthyColorCount = 0;

  for (const color of colors) {
    const hsv = rgbToHsv(color);
    const hue = hsv[0];
    const saturation = hsv[1];

    // Earth tones typically have lower saturation
    if (saturation > 0.7) {
      continue;
    }

    // Check if the hue falls within any earth tone range
    const isEarthyHue = earthHueRanges.some((range) => hue >= range[0] && hue <= range[1]);

    if (isEarthyHue) {
      earthyColorCount++;
    }
  }

  // At least 70% of colors should be earthy
  return earthyColorCount >= Math.ceil(colors.length * 0.7);
}

// Utility to convert RGB to hex for display
export function rgbToHex(rgb: RGBAVector): string {
  const r = Math.round(rgb[0] * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(rgb[1] * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(rgb[2] * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

// Utility to convert hex to RGB
export function hexToRgb(hex: string): RGBAVector {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle short hex format (e.g., #ABC)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return [r, g, b, 1];
}
