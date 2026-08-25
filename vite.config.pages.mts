import { defineConfig } from 'vite';

export default defineConfig({
  base: '/chess-board/',
  appType: 'mpa',
  clearScreen: true,
  build: {
    outDir: 'github-pages',
    rolldownOptions: {
      input: {
        "index": 'index.html',
        "demo": 'demo.html',
        "api": "demo-api.html"
      }
    }
  }
});
