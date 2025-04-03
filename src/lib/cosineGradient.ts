import type { CollectionType } from '~/routes';
import type { CoeffsRanges, CollectionPreset } from '~/types';

export const getCoeffs = (coeffs: CollectionPreset['coeffs'], withAlpha: boolean = false) => {
  return withAlpha ? coeffs : coeffs.map((channels) => channels.slice(0, 3));
};

export const applyGlobals = (
  cosCoeffs: CollectionPreset['coeffs'],
  globals: CollectionPreset['globals'],
) => {
  return cosCoeffs.map((coeff, i) => {
    switch (i) {
      case 0:
        return coeff.map((v) => v + globals[0]!);
      case 1:
        return coeff.map((v) => v * globals[1]!);
      case 2:
        return coeff.map((v) => v * globals[2]!);
      case 3:
        return coeff.map((v) => v + globals[3]!);
      default:
        return coeff;
    }
  });
};

export const getRandomCoeffsFromRanges = (ranges: CoeffsRanges, showAlpha: boolean = false) => {
  return ranges.map((range) =>
    Array.from({ length: showAlpha ? 4 : 3 }).map(
      () => Math.random() * (range[1] - range[0]) + range[0],
    ),
  );
};

export function getCollectionStyle(
  type: CollectionType = 'linearGradient',
  processedColors: number[][],
  angle: number = 90,
): React.CSSProperties {
  // Convert RGB values from 0-1 range to 0-255 range for CSS
  const getRgbString = (color: number[]) =>
    `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`;

  if (processedColors.length === 0) {
    return {};
  }

  if (processedColors.length === 1) {
    return { background: getRgbString(processedColors[0]) };
  }

  switch (type) {
    case 'linearGradient': {
      // For linear gradients, create a smooth transition with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;
      processedColors.forEach((color, index) => {
        const position = (index / (processedColors.length - 1)) * 100;
        gradientString += ` ${getRgbString(color)} ${position}%`;
        if (index < processedColors.length - 1) {
          gradientString += ',';
        }
      });
      gradientString += ')';
      return { background: gradientString };
    }

    case 'linearSwatches': {
      // For swatches, create distinct color blocks with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;

      // Calculate the segment size
      const segmentSize = 100 / processedColors.length;

      processedColors.forEach((color, index) => {
        // Calculate start and end positions for this color
        const startPos = index * segmentSize;
        const endPos = (index + 1) * segmentSize;

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbString(color)} ${startPos}%`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbString(color)} ${startPos}%`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbString(color)} ${endPos}%`;
        } else {
          // Last color needs its endpoint too
          gradientString += ` ${endPos}%`;
        }
      });

      gradientString += ')';
      return { background: gradientString };
    }

    case 'angularGradient': {
      // For angular gradients, create a smooth transition using conic gradient with configurable starting angle
      let gradientString = `conic-gradient(from ${angle}deg,`;
      processedColors.forEach((color, index) => {
        const anglePos = (index / (processedColors.length - 1)) * 360;
        gradientString += ` ${getRgbString(color)} ${anglePos}deg`;
        if (index < processedColors.length - 1) {
          gradientString += ',';
        }
      });
      gradientString += ')';
      return { background: gradientString };
    }

    case 'angularSwatches': {
      // For angular swatches, create distinct angular segments with configurable starting angle
      let gradientString = `conic-gradient(from ${angle}deg,`;

      // Calculate the segment size
      const segmentSize = 360 / processedColors.length;

      processedColors.forEach((color, index) => {
        // Calculate start and end angles for this color
        const startAngle = index * segmentSize;
        const endAngle = (index + 1) * segmentSize;

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbString(color)} ${startAngle}deg`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbString(color)} ${startAngle}deg`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbString(color)} ${endAngle}deg`;
        } else {
          // Last color needs its endpoint too
          gradientString += ` ${endAngle}deg`;
        }
      });

      gradientString += ')';
      return { background: gradientString };
    }

    default:
      return {};
  }
}
