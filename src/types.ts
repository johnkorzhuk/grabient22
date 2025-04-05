import type { Doc } from '../convex/_generated/dataModel';
import type { Tuple } from '@thi.ng/api';
import type { collectionStyleValidator } from './stores/ui';
import * as v from 'valibot';
import { coeffsSchema } from './lib/cosineGradient';

export type SystemFields = '_id' | '_creationTime';

export type CollectionPreset = Omit<Doc<'collections'>, SystemFields>;

export type AppCollection = CollectionPreset & {
  _id: string;
};

export type CoeffsRanges = [Tuple<number, 2>, Tuple<number, 2>, Tuple<number, 2>, Tuple<number, 2>];

export type CollectionStyle = v.InferOutput<typeof collectionStyleValidator>;

// Cosine gradient types
export type CosineCoeffs = v.InferOutput<typeof coeffsSchema>;
export type RGBAVector = [number, number, number, number];
export type CosineParameters = [RGBAVector, RGBAVector, RGBAVector, RGBAVector];
