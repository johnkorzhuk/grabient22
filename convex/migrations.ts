import { Migrations } from '@convex-dev/migrations';
import { components, internal } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';
import { z } from 'zod';
import * as v from 'valibot';
import { coeffsSchema, globalsSchema, COEFF_PRECISION, PI } from '../src/validators';

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

// Helper function to clamp a number between min and max
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

// Helper to format number to COEFF_PRECISION decimals
const formatNumber = (n: number) => Number(n.toFixed(COEFF_PRECISION));

export const fixGradientData = migrations.define({
  table: 'collections',
  migrateOne: (_ctx, doc) => {
    try {
      // Try to validate existing data first
      const validatedCoeffs = v.parse(coeffsSchema, doc.coeffs);
      const validatedGlobals = v.parse(globalsSchema, doc.globals);

      return {
        coeffs: validatedCoeffs,
        globals: validatedGlobals,
      };
    } catch (error) {
      // If validation fails, transform the data to match the schema

      // Fix coefficients
      const fixedCoeffs = doc.coeffs.map((vec: number[], index: number) => {
        // Get first 3 components of the vector (RGB)
        const rgb = vec.slice(0, 3).map((component: number) => {
          if (index === 0 || index === 1) {
            // a and b vectors: clamp to [0, 1]
            return formatNumber(clamp(component, 0, 1));
          } else if (index === 2) {
            // c vector (frequency): clamp to [0, 2]
            return formatNumber(clamp(component, 0, 2));
          } else {
            // d vector (phase): clamp to [0, 1]
            return formatNumber(clamp(component, 0, 1));
          }
        });

        // Always set alpha to 1
        return [...rgb, 1];
      });

      // Fix globals
      const [exposure, contrast, frequency, phase] = doc.globals;
      const fixedGlobals: [number, number, number, number] = [
        formatNumber(clamp(exposure, -1, 1)), // exposure: [-1, 1]
        formatNumber(clamp(contrast, 0, 2)), // contrast: [0, 2]
        formatNumber(clamp(frequency, 0, 2)), // frequency: [0, 2]
        formatNumber(clamp(phase, -PI, PI)), // phase: [-π, π]
      ];

      return {
        coeffs: fixedCoeffs,
        globals: fixedGlobals,
      };
    }
  },
});

export const runFixGradientData = migrations.runner(internal.migrations.fixGradientData);
