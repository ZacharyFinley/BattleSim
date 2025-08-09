import { defineConfig } from 'vite';

// NOTE: if deploying to GitHub Pages at https://<user>.github.io/<repo>/,
// set base: '/<repo>/' before building.
export default defineConfig({
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: false },
  // base: '/your-repo-name/',
});
