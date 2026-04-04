/**
 * @file Vite build configuration for bundling the extension and React output.
 */
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (target) => {
          return target.name === 'background'
            ? '[name].js'
            : 'assets/[name]-[hash].js';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
