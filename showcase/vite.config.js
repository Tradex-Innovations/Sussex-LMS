import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { outDir: '../dist/showcase', emptyOutDir: true, chunkSizeWarningLimit: 1400 },
});
