import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
// Remove this import: import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import comlink from 'vite-plugin-comlink';
import { FontaineTransform } from 'fontaine';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { cloudflare } from 'unenv';
import path from 'node:path';

const basePlugins = [
  tanstackStart({
    server: {
      preset: 'cloudflare-pages',
      unenv: cloudflare,
    },
    tsr: {
      appDirectory: 'src',
      autoCodeSplitting: true,
    },
    react: {
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              target: '19',
            },
          ],
        ],
      },
    },
  }),

  comlink(),
  viteTsConfigPaths({
    projects: ['./tsconfig.json'],
  }),
  FontaineTransform.vite({
    fallbacks: ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans'],
    resolvePath: (id) => {
      return new URL(path.join(path.dirname(import.meta.url), 'node_modules', id));
    },
  }),

  // TanStack Start handles React - no need for separate viteReact()
  tailwindcss(),
];

// Rest of your config...
// Add Sentry plugin only if auth token is available
if (process.env.SENTRY_AUTH_TOKEN) {
  basePlugins.push(
    sentryVitePlugin({
      org: 'grabient',
      project: 'grabient',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: basePlugins,
  build: {
    // Only generate source maps if Sentry is enabled
    sourcemap: !!process.env.SENTRY_AUTH_TOKEN,
  },
  worker: {
    plugins: () => [comlink()],
  },
});
