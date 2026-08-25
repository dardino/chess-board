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
      ...(process.env.GITHUB_ACTIONS ? {} : {
        reporter: [
          'text', 'json', 'html', 'lcov', 'text-summary', 'json-summary'
        ]
      }),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
