import { Migrations } from '@convex-dev/migrations';
import { components, internal } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

// export const renameFields = migrations.define({
//   table: 'collections',
//   migrateOne: (_ctx, doc) => {
//     const numStops = doc.numStops;
//     const randomIndex = Math.floor(Math.random() * COLLECTION_TYPES.length);

//     return {
//       numStops: undefined,
//       steps: numStops,
//       style: COLLECTION_TYPES[randomIndex],
//     };
//   },
// });

// export const runRenameFields = migrations.runner(internal.migrations.renameFields);
