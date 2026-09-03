/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    reporters: process.env.GITHUB_ACTIONS === 'true' 
      ? ['default', 
        ['json',{
          outputFile: './coverage/test-results.json',
        }],
        'github-actions'] 
      : ['default'],
    coverage: {
      exclude: ['*.css', '*.html', "./index.ts"],
      reporter: [
        'text', 'json', 'html', 'lcov', 'text-summary', 'json-summary',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
