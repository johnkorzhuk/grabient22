import type { Doc } from '../convex/_generated/dataModel';
import type { Tuple } from '@thi.ng/api';
import type { coeffsSchema, collectionStyleValidator } from './validators';
import * as v from 'valibot';

export type SystemFields = '_id' | '_creationTime';

export type CollectionPreset = Omit<Doc<'collections'>, SystemFields>;

// Serialized collection type
export type AppCollection = CollectionPreset & {
  _id: string;
  seed: string;
};

export type CoeffsRanges = [Tuple<number, 2>, Tuple<number, 2>, Tuple<number, 2>, Tuple<number, 2>];

export type CollectionStyle = v.InferOutput<typeof collectionStyleValidator>;

// Cosine gradient types
export type CosineCoeffs = v.InferOutput<typeof coeffsSchema>;
export type RGBAVector = [number, number, number, number];
export type CosineParameters = [RGBAVector, RGBAVector, RGBAVector, RGBAVector];
