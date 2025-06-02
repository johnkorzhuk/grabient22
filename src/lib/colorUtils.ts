// convex/lib/colorUtils.ts

/**
 * Color conversion utilities for different color spaces
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface LCHColor {
  l: number;
  c: number;
  h: number;
}

export interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
  lch: string;
}

/**
 * Convert RGB (0-1) to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c * 255))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB (0-1) to RGB string
 */
export function rgbToRgbString(r: number, g: number, b: number): string {
  const rInt = Math.round(Math.max(0, Math.min(255, r * 255)));
  const gInt = Math.round(Math.max(0, Math.min(255, g * 255)));
  const bInt = Math.round(Math.max(0, Math.min(255, b * 255)));
  return `rgb(${rInt}, ${gInt}, ${bInt})`;
}

/**
 * Convert RGB (0-1) to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSLColor {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sum = max + min;

  let h = 0;
  let s = 0;
  const l = sum / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / sum;

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert RGB (0-1) to HSL string
 */
export function rgbToHslString(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Convert RGB to XYZ color space (intermediate step for LCH)
 */
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  // Convert sRGB to linear RGB
  const toLinear = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Convert to XYZ using sRGB matrix
  const x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  const y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.072175;
  const z = rLinear * 0.0193339 + gLinear * 0.119192 + bLinear * 0.9503041;

  return { x, y, z };
}

/**
 * Convert XYZ to LAB color space
 */
function xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  // Reference white D65
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  const fx = x / xn;
  const fy = y / yn;
  const fz = z / zn;

  const delta = 6 / 29;
  const deltaSquared = delta * delta;
  const deltaCubed = delta * deltaSquared;

  const f = (t: number) => {
    return t > deltaCubed ? Math.pow(t, 1 / 3) : t / (3 * deltaSquared) + 4 / 29;
  };

  const fxResult = f(fx);
  const fyResult = f(fy);
  const fzResult = f(fz);

  const l = 116 * fyResult - 16;
  const a = 500 * (fxResult - fyResult);
  const b = 200 * (fyResult - fzResult);

  return { l, a, b };
}

/**
 * Convert LAB to LCH
 */
function labToLch(l: number, a: number, b: number): LCHColor {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);

  if (h < 0) {
    h += 360;
  }

  return {
    l: Math.round(l),
    c: Math.round(c),
    h: Math.round(h),
  };
}

/**
 * Convert RGB (0-1) to LCH
 */
export function rgbToLch(r: number, g: number, b: number): LCHColor {
  const { x, y, z } = rgbToXyz(r, g, b);
  const { l, a, b: labB } = xyzToLab(x, y, z);
  return labToLch(l, a, labB);
}

/**
 * Convert RGB (0-1) to LCH string
 */
export function rgbToLchString(r: number, g: number, b: number): string {
  const { l, c, h } = rgbToLch(r, g, b);
  return `lch(${l}% ${c} ${h})`;
}

/**
 * Convert a color array [r, g, b, a?] to all color formats
 */
export function colorToAllFormats(color: number[]): ColorFormats {
  const [r, g, b] = color;

  return {
    hex: rgbToHex(r, g, b),
    rgb: rgbToRgbString(r, g, b),
    hsl: rgbToHslString(r, g, b),
    lch: rgbToLchString(r, g, b),
  };
}
