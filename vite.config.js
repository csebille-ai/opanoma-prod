import { defineConfig } from 'vite';
import { cpSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',   // public/ contains images, videos — copied as-is to dist/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  plugins: [
    {
      name: 'copy-backend',
      closeBundle() {
        // Copy PHP/Node API backend
        cpSync('prod/api', join('dist', 'api'), { recursive: true });
        // Copy PWA files
        cpSync('prod/sw.js', join('dist', 'sw.js'));
        cpSync('prod/manifest.json', join('dist', 'manifest.json'));
        // Copy non-module scripts referenced by inline HTML
        cpSync('src/popup.js', join('dist', 'src', 'popup.js'));
        cpSync('src/popup-adapter.js', join('dist', 'src', 'popup-adapter.js'));
        cpSync('src/card-animations.js', join('dist', 'src', 'card-animations.js'));
      },
    },
  ],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'https://api-opanoma.csebille.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
