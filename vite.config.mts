import { fileURLToPath } from 'node:url';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets/ScacchiPainter*',
          dest: '.'
        }
      ]
    })
  ],
  esbuild: {
    target: "es2025",
  },
  build: {
    target: 'es2025',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChessBoard',
      fileName: (format: string) => `chess-board.${format}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      },
    }
  },
  server: {
    open: '/index.html'
  }
});
