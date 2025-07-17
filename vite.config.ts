import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { FontaineTransform } from 'fontaine'
import path from 'node:path'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
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
        return new URL(
          path.join(path.dirname(import.meta.url), 'node_modules', id),
        )
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
  ],
})
