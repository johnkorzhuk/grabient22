// Cosine Palette Coefficient Fitting
// Based on Inigo Quilez's cosine palette formula: color(t) = a + b * cos(2π * (c * t + d))

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function rgbToHex(r, g, b) {
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
function cosineColor(t, a, b, c, d) {
  return [
    a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0])),
    a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1])),
    a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2])),
  ];
}

// Objective function to minimize - sum of squared differences
function objectiveFunction(params, targetColors, tValues) {
  const [a1, a2, a3, b1, b2, b3, c1, c2, c3, d1, d2, d3] = params;
  const a = [a1, a2, a3];
  const b = [b1, b2, b3];
  const c = [c1, c2, c3];
  const d = [d1, d2, d3];

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
function fitCosinePalette(hexColors, maxIterations = 1000, learningRate = 0.01) {
  // Convert hex colors to RGB
  const targetColors = hexColors.map(hexToRgb);

  // Generate t values (0 to 1 for the palette)
  const tValues = hexColors.map((_, i) => i / (hexColors.length - 1));

  // Initial guess - start with reasonable defaults
  let params = [
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
    const gradient = new Array(12);
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
    a: [params[0], params[1], params[2]],
    b: [params[3], params[4], params[5]],
    c: [params[6], params[7], params[8]],
    d: [params[9], params[10], params[11]],
    error: objectiveFunction(params, targetColors, tValues),
  };
}

// Test the function with some example colors
const testColors = ['#FF5722', '#FFD54F', '#26C6DA', '#1976D2', '#3E2723'];
console.log('Input colors:', testColors);

const result = fitCosinePalette(testColors);
console.log('\nFitted coefficients:');
console.log(
  'a:',
  result.a.map((x) => x.toFixed(3)),
);
console.log(
  'b:',
  result.b.map((x) => x.toFixed(3)),
);
console.log(
  'c:',
  result.c.map((x) => x.toFixed(3)),
);
console.log(
  'd:',
  result.d.map((x) => x.toFixed(3)),
);
console.log('Final error:', result.error.toFixed(6));

// Verify by generating colors back
console.log('\nVerification - regenerated colors:');
const tValues = testColors.map((_, i) => i / (testColors.length - 1));
for (let i = 0; i < testColors.length; i++) {
  const generated = cosineColor(tValues[i], result.a, result.b, result.c, result.d);
  const hexGenerated = rgbToHex(generated[0], generated[1], generated[2]);
  console.log(`t=${tValues[i].toFixed(2)}: ${testColors[i]} -> ${hexGenerated}`);
}
