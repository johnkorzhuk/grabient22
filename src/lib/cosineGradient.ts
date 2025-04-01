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
