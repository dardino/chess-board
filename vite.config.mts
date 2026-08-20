import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets/*',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChessBoard',
      fileName: (format: string) => `chess-board.${format}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  server: {
    open: '/demo.html'
  }
});
