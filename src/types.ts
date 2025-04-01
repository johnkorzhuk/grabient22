import type { Doc } from '../convex/_generated/dataModel';
import type { Tuple } from '@thi.ng/api';

export type SystemFields = '_id' | '_creationTime';

export type CollectionPreset = Omit<Doc<'collections'>, SystemFields>;

export type AppCollection = CollectionPreset & {
  _id: string;
};

export type CoeffsRanges = [Tuple<number, 2>, Tuple<number, 2>, Tuple<number, 2>, Tuple<number, 2>];
