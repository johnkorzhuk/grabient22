import { defineConfig } from '@tanstack/react-start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  tsr: {
    appDirectory: 'src',
  },
  server: {
    preset: 'netlify',
    // prerender: {
    //   routes: ['/'],
    //   crawlLinks: false,
    // },
  },
  vite: {
    plugins: [
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
