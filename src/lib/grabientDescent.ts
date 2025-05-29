type RGB = [number, number, number];
type Vec3 = [number, number, number];

interface CosinePaletteResult {
  a: Vec3;
  b: Vec3;
  c: Vec3;
  d: Vec3;
  error: number;
}

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) =>
        Math.round(x * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

// Generate color using cosine palette formula
function cosineColor(t: number, a: Vec3, b: Vec3, c: Vec3, d: Vec3): RGB {
  return [
    a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0])),
    a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1])),
    a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2])),
  ];
}

// Objective function to minimize - sum of squared differences
function objectiveFunction(params: number[], targetColors: RGB[], tValues: number[]): number {
  const [a1, a2, a3, b1, b2, b3, c1, c2, c3, d1, d2, d3] = params;
  const a: Vec3 = [a1, a2, a3];
  const b: Vec3 = [b1, b2, b3];
  const c: Vec3 = [c1, c2, c3];
  const d: Vec3 = [d1, d2, d3];

  let totalError = 0;
  for (let i = 0; i < targetColors.length; i++) {
    const generated = cosineColor(tValues[i], a, b, c, d);
    for (let j = 0; j < 3; j++) {
      const diff = generated[j] - targetColors[i][j];
      totalError += diff * diff;
    }
  }
  return totalError;
}

// Simple gradient descent optimization
function fitCosinePalette(
  hexColors: string[],
  maxIterations: number = 1000,
  learningRate: number = 0.01,
): CosinePaletteResult {
  // Convert hex colors to RGB
  const targetColors: RGB[] = hexColors.map(hexToRgb);

  // Generate t values (0 to 1 for the palette)
  const tValues: number[] = hexColors.map((_, i) => i / (hexColors.length - 1));

  // Initial guess - start with reasonable defaults
  let params: number[] = [
    0.5,
    0.5,
    0.5, // a (offset)
    0.5,
    0.5,
    0.5, // b (amplitude)
    1.0,
    1.0,
    1.0, // c (frequency)
    0.0,
    0.33,
    0.67, // d (phase)
  ];

  const epsilon = 1e-6; // Small value for numerical gradient

  for (let iter = 0; iter < maxIterations; iter++) {
    const currentError = objectiveFunction(params, targetColors, tValues);

    // Calculate gradient numerically
    const gradient: number[] = new Array(12);
    for (let i = 0; i < 12; i++) {
      const paramsPlus = [...params];
      const paramsMinus = [...params];
      paramsPlus[i] += epsilon;
      paramsMinus[i] -= epsilon;

      const errorPlus = objectiveFunction(paramsPlus, targetColors, tValues);
      const errorMinus = objectiveFunction(paramsMinus, targetColors, tValues);

      gradient[i] = (errorPlus - errorMinus) / (2 * epsilon);
    }

    // Update parameters
    for (let i = 0; i < 12; i++) {
      params[i] -= learningRate * gradient[i];
    }

    // Adaptive learning rate
    if (iter > 100 && iter % 100 === 0) {
      learningRate *= 0.95;
    }

    if (currentError < 1e-6) break;
  }

  return {
    a: [params[0], params[1], params[2]] as Vec3,
    b: [params[3], params[4], params[5]] as Vec3,
    c: [params[6], params[7], params[8]] as Vec3,
    d: [params[9], params[10], params[11]] as Vec3,
    error: objectiveFunction(params, targetColors, tValues),
  };
}

// Enhanced version with multiple attempts for better results
function fitCosinePaletteRobust(
  hexColors: string[],
  maxIterations: number = 2000,
  learningRate: number = 0.05,
  attempts: number = 3,
): CosinePaletteResult {
  const targetColors: RGB[] = hexColors.map(hexToRgb);
  const tValues: number[] = hexColors.map((_, i) => i / (hexColors.length - 1));

  let bestResult: CosinePaletteResult | null = null;
  let bestError = Infinity;

  for (let attempt = 0; attempt < attempts; attempt++) {
    // Random initial guess with better bounds for each attempt
    let params: number[] = [
      Math.random() * 0.8 + 0.1,
      Math.random() * 0.8 + 0.1,
      Math.random() * 0.8 + 0.1, // a (offset) 0.1-0.9
      Math.random() * 0.8 + 0.1,
      Math.random() * 0.8 + 0.1,
      Math.random() * 0.8 + 0.1, // b (amplitude) 0.1-0.9
      Math.random() * 2 + 0.5,
      Math.random() * 2 + 0.5,
      Math.random() * 2 + 0.5, // c (frequency) 0.5-2.5
      Math.random(),
      Math.random(),
      Math.random(), // d (phase) 0-1
    ];

    const epsilon = 1e-6;
    let currentLearningRate = learningRate;

    for (let iter = 0; iter < maxIterations; iter++) {
      const currentError = objectiveFunction(params, targetColors, tValues);

      // Calculate gradient numerically
      const gradient: number[] = new Array(12);
      for (let i = 0; i < 12; i++) {
        const paramsPlus = [...params];
        const paramsMinus = [...params];
        paramsPlus[i] += epsilon;
        paramsMinus[i] -= epsilon;

        const errorPlus = objectiveFunction(paramsPlus, targetColors, tValues);
        const errorMinus = objectiveFunction(paramsMinus, targetColors, tValues);

        gradient[i] = (errorPlus - errorMinus) / (2 * epsilon);
      }

      // Update parameters with clipping
      for (let i = 0; i < 12; i++) {
        params[i] -= currentLearningRate * gradient[i];

        // Clamp parameters to reasonable ranges
        if (i < 6) {
          // a and b parameters
          params[i] = Math.max(0, Math.min(1, params[i]));
        } else if (i < 9) {
          // c parameters
          params[i] = Math.max(0.1, Math.min(5, params[i]));
        } else {
          // d parameters
          params[i] = params[i] % 1; // Keep phase in [0,1]
          if (params[i] < 0) params[i] += 1;
        }
      }

      // Adaptive learning rate
      if (iter > 500 && iter % 200 === 0) {
        currentLearningRate *= 0.9;
      }

      if (currentError < 1e-8) break;
    }

    const finalError = objectiveFunction(params, targetColors, tValues);
    if (finalError < bestError) {
      bestError = finalError;
      bestResult = {
        a: [params[0], params[1], params[2]] as Vec3,
        b: [params[3], params[4], params[5]] as Vec3,
        c: [params[6], params[7], params[8]] as Vec3,
        d: [params[9], params[10], params[11]] as Vec3,
        error: finalError,
      };
    }
  }

  return bestResult!;
}

// Utility function to generate a color palette using fitted coefficients
function generatePalette(coefficients: CosinePaletteResult, steps: number = 256): string[] {
  const palette: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const rgb = cosineColor(t, coefficients.a, coefficients.b, coefficients.c, coefficients.d);
    palette.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
  }
  return palette;
}

// Utility function to validate the fit quality
function validateFit(
  hexColors: string[],
  coefficients: CosinePaletteResult,
): {
  averageError: number;
  maxError: number;
  colorComparisons: Array<{ original: string; fitted: string; error: number }>;
} {
  const tValues = hexColors.map((_, i) => i / (hexColors.length - 1));
  const comparisons = [];
  let totalError = 0;
  let maxError = 0;

  for (let i = 0; i < hexColors.length; i++) {
    const target = hexToRgb(hexColors[i]);
    const generated = cosineColor(
      tValues[i],
      coefficients.a,
      coefficients.b,
      coefficients.c,
      coefficients.d,
    );
    const fittedHex = rgbToHex(generated[0], generated[1], generated[2]);

    // Calculate average RGB difference (0-255 scale)
    const rDiff = Math.abs(target[0] - generated[0]) * 255;
    const gDiff = Math.abs(target[1] - generated[1]) * 255;
    const bDiff = Math.abs(target[2] - generated[2]) * 255;
    const avgError = (rDiff + gDiff + bDiff) / 3;

    totalError += avgError;
    maxError = Math.max(maxError, avgError);

    comparisons.push({
      original: hexColors[i],
      fitted: fittedHex,
      error: avgError,
    });
  }

  return {
    averageError: totalError / hexColors.length,
    maxError,
    colorComparisons: comparisons,
  };
}

// Export the main functions
export {
  hexToRgb,
  rgbToHex,
  cosineColor,
  fitCosinePalette,
  fitCosinePaletteRobust,
  generatePalette,
  validateFit,
  type RGB,
  type Vec3,
  type CosinePaletteResult,
};

// Example usage:
/*
const colors = ['#ffffc4', '#ffbe8e', '#e20b3d', '#b00012'];
const result = fitCosinePaletteRobust(colors);
console.log('Fitted coefficients:', result);

const validation = validateFit(colors, result);
console.log('Fit quality:', validation);

const fullPalette = generatePalette(result);
console.log('Generated palette:', fullPalette.slice(0, 10)); // First 10 colors
*/
