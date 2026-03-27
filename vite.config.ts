import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages deploy
  build: {
    outDir: 'dist'
  }
});
