/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      exclude: ['*.css', '*.html', "./index.ts"],
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary', 'json-summary'].concat(
        process.env.GITHUB_ACTIONS ? ['github-actions'] : []
      )
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
