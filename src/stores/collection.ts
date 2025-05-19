import { observable } from '@legendapp/state';
import type { AppCollection } from '~/types';

export interface CollectionStore {
  collections: AppCollection[];
}

export const collectionStore$ = observable<CollectionStore>({
  collections: [],
});
