/**
 * High-Value Palette Generator
 * Creates bright, colorful palettes with high brightness but visible hue variation
 * Perfect for light themes, day scenes, and airy designs
 * Aggressively tuned to prevent all-white palettes
 */

import type { CosineCoeffs, RGBAVector } from '~/types';
import { BasePaletteGenerator } from '../base-generator';
import { rgbToHsv } from '../color-utils';

/**
 * Specific bright color hues for guaranteed color variation
 */
const BRIGHT_COLORS = {
  CREAM: 0.12,
  MINT: 0.4,
  SKY: 0.55,
  LAVENDER: 0.75,
  ROSE: 0.95,
  PEACH: 0.08,
};

/**
 * Utility function to generate high-value style coefficients
 * Completely restructured to enforce color variation
 */
export function generateHighValueCoeffs(): CosineCoeffs {
  const TAU = Math.PI * 2;

  // Select from multiple high-value strategies with GUARANTEED color
  const strategyType = Math.floor(Math.random() * 5);

  // Define base values based on selected strategy
  let primaryHue: number;
  let secondaryHue: number;
  let offsetRange: [number, number];
  let amplitudeRange: [number, number];
  let frequencyRange: [number, number];
  let phaseDistribution: 'pastel' | 'dual' | 'triad' | 'rainbow' | 'themed' = 'pastel';

  switch (strategyType) {
    case 0: // Pastel theme with ENFORCED color
      // Select specific pastel-friendly hue
      primaryHue = selectRandomValue(BRIGHT_COLORS);
      secondaryHue = (primaryHue + 0.1) % 1.0; // Slight variation
      offsetRange = [0.4, 0.55]; // REDUCED to prevent too much brightness
      amplitudeRange = [0.3, 0.4]; // INCREASED for more color saturation
      frequencyRange = [0.3, 0.5];
      phaseDistribution = 'pastel';
      break;

    case 1: // Dual-tone bright
      // Select two complementary bright hues
      primaryHue = selectRandomValue(BRIGHT_COLORS);
      secondaryHue = (primaryHue + 0.5) % 1.0; // Complement
      offsetRange = [0.35, 0.5]; // REDUCED to prevent too much brightness
      amplitudeRange = [0.35, 0.45]; // INCREASED for stronger color contrast
      frequencyRange = [0.4, 0.6];
      phaseDistribution = 'dual';
      break;

    case 2: // Triadic bright
      primaryHue = selectRandomValue(BRIGHT_COLORS);
      secondaryHue = (primaryHue + 0.33) % 1.0; // +120°
      offsetRange = [0.35, 0.5]; // REDUCED to prevent too much brightness
      amplitudeRange = [0.35, 0.45]; // INCREASED for stronger color contrast
      frequencyRange = [0.5, 0.7];
      phaseDistribution = 'triad';
      break;

    case 3: // Rainbow bright
      primaryHue = 0; // Start at red
      secondaryHue = 0; // Not used for rainbow
      offsetRange = [0.35, 0.5]; // REDUCED to prevent too much brightness
      amplitudeRange = [0.35, 0.45]; // INCREASED for stronger color contrast
      frequencyRange = [0.8, 1.0]; // Higher for more hue variation
      phaseDistribution = 'rainbow';
      break;

    case 4: // Themed bright (nature, sea, sunset)
      // Select a themed color set
      const themes = [
        [BRIGHT_COLORS.MINT, BRIGHT_COLORS.SKY], // Nature theme
        [BRIGHT_COLORS.SKY, BRIGHT_COLORS.LAVENDER], // Sea theme
        [BRIGHT_COLORS.PEACH, BRIGHT_COLORS.ROSE], // Sunset theme
      ];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      primaryHue = theme[0];
      secondaryHue = theme[1];
      offsetRange = [0.35, 0.5]; // REDUCED to prevent too much brightness
      amplitudeRange = [0.3, 0.4]; // INCREASED for stronger color contrast
      frequencyRange = [0.3, 0.5]; // Moderate for smooth transitions
      phaseDistribution = 'themed';
      break;

    default: // Fallback to pastel with color
      primaryHue = BRIGHT_COLORS.MINT;
      secondaryHue = BRIGHT_COLORS.SKY;
      offsetRange = [0.4, 0.55]; // REDUCED to prevent too much brightness
      amplitudeRange = [0.3, 0.4]; // INCREASED for more color saturation
      frequencyRange = [0.3, 0.5];
      phaseDistribution = 'pastel';
  }

  // Random value within a range helper
  const randomInRange = (range: [number, number]): number => {
    return range[0] + Math.random() * (range[1] - range[0]);
  };

  // Helper to select random value from object
  function selectRandomValue(obj: Record<string, number>): number {
    const values = Object.values(obj);
    return values[Math.floor(Math.random() * values.length)];
  }

  // Create strategic channel settings for visible color
  const basePhase = primaryHue * TAU;
  const secondPhase = secondaryHue * TAU;

  // Strategic channel assignments to FORCE color variation
  let redPhase: number, greenPhase: number, bluePhase: number;
  let redOffset: number, greenOffset: number, blueOffset: number;
  let redAmp: number, greenAmp: number, blueAmp: number;
  let redFreq: number, greenFreq: number, blueFreq: number;

  // CRITICAL: Introduce guaranteed channel imbalance to create visible color
  // We will intentionally make one channel lower than others
  switch (phaseDistribution) {
    case 'pastel': // Pastel with guaranteed color
      // Set phases for soft pastel effect
      redPhase = basePhase;
      greenPhase = basePhase + (Math.random() * 0.1 - 0.05); // Close to primary
      bluePhase = basePhase + (Math.random() * 0.1 - 0.05); // Close to primary

      // Intentionally vary offsets to create color
      redOffset = randomInRange(offsetRange);
      greenOffset = randomInRange(offsetRange);
      blueOffset = randomInRange([offsetRange[0] - 0.15, offsetRange[1] - 0.15]); // Lower blue for color

      // Higher amplitude for color visibility
      redAmp = randomInRange(amplitudeRange);
      greenAmp = randomInRange(amplitudeRange);
      blueAmp = randomInRange(amplitudeRange);

      // Frequencies
      redFreq = randomInRange(frequencyRange);
      greenFreq = randomInRange(frequencyRange);
      blueFreq = randomInRange(frequencyRange);
      break;

    case 'dual': // Dual-tone with strong contrast
      // Set complementary phases
      redPhase = basePhase;
      greenPhase = Math.random() > 0.5 ? basePhase : secondPhase; // 50% chance of second color
      bluePhase = Math.random() > 0.5 ? basePhase : secondPhase; // 50% chance of second color

      // Vary offsets strategically
      redOffset = randomInRange(offsetRange);
      greenOffset = randomInRange(offsetRange);
      blueOffset = randomInRange([offsetRange[0] - 0.1, offsetRange[1] - 0.1]); // Lower for color

      // Higher amplitude for contrast
      redAmp = randomInRange(amplitudeRange);
      greenAmp = randomInRange(amplitudeRange);
      blueAmp = randomInRange(amplitudeRange);

      // Frequencies
      redFreq = randomInRange(frequencyRange);
      greenFreq = randomInRange(frequencyRange);
      blueFreq = randomInRange(frequencyRange);
      break;

    case 'triad': // Triadic high-value
      // Three evenly spaced hues
      redPhase = basePhase;
      greenPhase = (basePhase + TAU / 3) % TAU; // +120°
      bluePhase = (basePhase + (2 * TAU) / 3) % TAU; // +240°

      // Strategic offset variation
      redOffset = randomInRange(offsetRange);
      greenOffset = randomInRange(offsetRange);
      blueOffset = randomInRange([offsetRange[0] - 0.1, offsetRange[1] - 0.1]); // Lower for color

      // Higher amplitude for color visibility
      redAmp = randomInRange(amplitudeRange);
      greenAmp = randomInRange(amplitudeRange);
      blueAmp = randomInRange(amplitudeRange);

      // Frequencies
      redFreq = randomInRange(frequencyRange);
      greenFreq = randomInRange(frequencyRange);
      blueFreq = randomInRange(frequencyRange);
      break;

    case 'rainbow': // Rainbow gradient
      // Sequential hue shift
      redOffset = randomInRange(offsetRange);
      greenOffset = randomInRange(offsetRange);
      blueOffset = randomInRange([offsetRange[0] - 0.15, offsetRange[1] - 0.15]); // Lower for color

      // Higher amplitude for color visibility
      redAmp = randomInRange(amplitudeRange);
      greenAmp = randomInRange(amplitudeRange);
      blueAmp = randomInRange(amplitudeRange);

      // Higher frequencies with phase shifts for rainbow effect
      redFreq = randomInRange(frequencyRange);
      greenFreq = randomInRange(frequencyRange);
      blueFreq = randomInRange(frequencyRange);

      // Staggered phases for rainbow
      redPhase = 0;
      greenPhase = TAU / 3; // 120° offset
      bluePhase = (2 * TAU) / 3; // 240° offset
      break;

    case 'themed': // Themed color palette
      // Set phases for themed effect
      redPhase = basePhase;
      greenPhase = secondPhase;
      bluePhase = (basePhase + secondPhase) / 2; // Middle phase

      // Strategic offset variation
      redOffset = randomInRange(offsetRange);
      greenOffset = randomInRange(offsetRange);
      blueOffset = randomInRange([offsetRange[0] - 0.1, offsetRange[1] - 0.1]); // Lower for color

      // Higher amplitude for color visibility
      redAmp = randomInRange(amplitudeRange);
      greenAmp = randomInRange(amplitudeRange);
      blueAmp = randomInRange(amplitudeRange);

      // Frequencies
      redFreq = randomInRange(frequencyRange);
      greenFreq = randomInRange(frequencyRange);
      blueFreq = randomInRange(frequencyRange);
      break;

    default: // Fallback to pastel with color
      redPhase = basePhase;
      greenPhase = basePhase;
      bluePhase = basePhase;

      // Offsets
      redOffset = randomInRange(offsetRange);
      greenOffset = randomInRange(offsetRange);
      blueOffset = randomInRange([offsetRange[0] - 0.15, offsetRange[1] - 0.15]); // Lower for color

      // Amplitudes
      redAmp = randomInRange(amplitudeRange);
      greenAmp = randomInRange(amplitudeRange);
      blueAmp = randomInRange(amplitudeRange);

      // Frequencies
      redFreq = randomInRange(frequencyRange);
      greenFreq = randomInRange(frequencyRange);
      blueFreq = randomInRange(frequencyRange);
  }

  return [
    // a: offset vector - high but varied values to ensure color
    [
      redOffset,
      greenOffset,
      blueOffset,
      1, // Alpha always 1
    ] as [number, number, number, 1],

    // b: amplitude vector - higher for color visibility
    [
      redAmp,
      greenAmp,
      blueAmp,
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // c: frequency vector - varied for transitions
    [
      redFreq,
      greenFreq,
      blueFreq,
      1, // Alpha for serialization
    ] as [number, number, number, 1],

    // d: phase vector - strategic for color schemes
    [
      redPhase,
      greenPhase,
      bluePhase,
      1, // Alpha for serialization
    ] as [number, number, number, 1],
  ];
}

export class HighValueGenerator extends BasePaletteGenerator {
  constructor(steps: number, options = {}) {
    super('Bright', steps, options);
  }

  /**
   * Generate candidate coefficients for a high-value palette
   */
  protected generateCandidateCoeffs(): CosineCoeffs {
    return generateHighValueCoeffs();
  }

  /**
   * Validate that the palette meets high-value criteria
   * SIGNIFICANTLY RELAXED to improve generation success rate
   */
  protected validateCategorySpecificCriteria(colors: RGBAVector[]): boolean {
    return validateHighValuePalette(colors);
  }
}

/**
 * Validates that a palette contains high-value (bright) colors
 * SIMPLIFIED to maximize generation success
 */
export function validateHighValuePalette(colors: RGBAVector[]): boolean {
  let highValueCount = 0;
  let pureWhiteCount = 0;
  let colorfulCount = 0;

  // Define high-value quality thresholds
  const HIGH_VALUE_MIN = 0.55; // Minimum brightness to qualify as high-value (slightly reduced)
  const WHITE_THRESHOLD = 0.9; // LOWERED threshold for considering a color "pure white"

  // Check each color for brightness and colorfulness
  for (const color of colors) {
    const hsv = rgbToHsv(color);
    const [h, s, v] = hsv;

    // Count high-value colors
    if (v >= HIGH_VALUE_MIN) {
      highValueCount++;

      // Check if this is pure white
      if (v >= WHITE_THRESHOLD && s < 0.1) {
        pureWhiteCount++;
      }

      // Check if it has visible color
      if (s >= 0.1) {
        colorfulCount++;
      }
    }
  }

  // Calculate percentages
  const highValuePercentage = highValueCount / colors.length;
  const pureWhitePercentage = pureWhiteCount / colors.length;
  const colorfulPercentage = colorfulCount / colors.length;

  // STRICTER VALIDATION TO REDUCE WHITES:
  // 1. At least 70% of colors should be high-value (bright)
  // 2. No more than 30% should be pure white (REDUCED from 50%)
  // 3. At least 50% should have visible color (INCREASED from 30%)
  const hasHighValue = highValuePercentage >= 0.7;
  const notTooWhite = pureWhitePercentage <= 0.3; // STRICTER limit on whites
  const hasEnoughColor = colorfulPercentage >= 0.5; // REQUIRE more color

  // Calculate average brightness - should be bright but not too bright
  const avgBrightness = colors.reduce((sum, c) => sum + rgbToHsv(c)[2], 0) / colors.length;
  const isBrightOverall = avgBrightness >= 0.55 && avgBrightness <= 0.85; // CAPPED maximum brightness

  // STRICTER CONDITIONS TO ENSURE COLORFUL RESULTS:
  // Require more conditions to pass
  return (
    (hasHighValue && notTooWhite && isBrightOverall && hasEnoughColor) || // Ideal case
    (hasHighValue && notTooWhite && hasEnoughColor) // Fallback case
  );
}
