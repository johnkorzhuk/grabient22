import { defineConfig } from '@tanstack/react-start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { cloudflare } from 'unenv';
import comlink from 'vite-plugin-comlink';
import { FontaineTransform } from 'fontaine';
import path from 'node:path';

export default defineConfig({
  server: {
    preset: 'cloudflare-pages',
    unenv: cloudflare,
  },
  tsr: {
    appDirectory: 'src',
  },
  vite: {
    plugins: [
      comlink(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      FontaineTransform.vite({
        fallbacks: [
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
        ],
        resolvePath: (id) => {
          return new URL(path.join(path.dirname(import.meta.url), 'node_modules', id));
        },
      }),
    ],
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
});
