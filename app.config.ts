import { defineConfig } from '@tanstack/react-start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { cloudflare } from 'unenv';
import comlink from 'vite-plugin-comlink';

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
