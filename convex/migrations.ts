import { Migrations } from '@convex-dev/migrations';
import { components, internal } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';
import { z } from 'zod';

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

const angleSchema = z.number().min(0).max(360).describe('Angle of gradient in degrees');

const getRandomAngle = () => {
  const validAngles = [0.0, 45.0, 90.0, 135.0, 180.0, 225.0, 270.0, 315.0];
  return angleSchema.parse(validAngles[Math.floor(Math.random() * validAngles.length)]);
};

export const addFieldd = migrations.define({
  table: 'collections',
  migrateOne: (_ctx, doc) => {
    return {
      angle: getRandomAngle(),
    };
  },
});

export const runAddFieldds = migrations.runner(internal.migrations.addFieldd);
