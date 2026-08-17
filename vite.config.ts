import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const stylesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/styles');

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: [stylesDir],
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8798',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
