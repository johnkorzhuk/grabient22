import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
// Remove this import: import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// import comlink from 'vite-plugin-comlink';
import { FontaineTransform } from 'fontaine';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tsConfigPaths from 'vite-tsconfig-paths';

import path from 'node:path';

const basePlugins = [
  tailwindcss(),
  FontaineTransform.vite({
    fallbacks: ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans'],
    resolvePath: (id) => {
      return new URL(path.join(path.dirname(import.meta.url), 'node_modules', id));
    },
  }),
  tsConfigPaths({
    projects: ['./tsconfig.json'],
  }),
  tanstackStart({
    target: 'cloudflare-pages',
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
  // worker: {
  //   plugins: () => [comlink()],
  // },
});
