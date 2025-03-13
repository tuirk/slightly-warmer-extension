import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      async writeBundle() {
        // Copy manifest.json
        await import('fs').then(fs => {
          fs.copyFileSync(
            resolve(__dirname, 'manifest.json'),
            resolve(__dirname, 'dist/manifest.json')
          );
          
          // Create icons directory if it doesn't exist
          if (!fs.existsSync(resolve(__dirname, 'dist/icons'))) {
            fs.mkdirSync(resolve(__dirname, 'dist/icons'));
          }
          
          // Copy icon files
          ['16', '32', '48', '128'].forEach(size => {
            fs.copyFileSync(
              resolve(__dirname, `icons/icon${size}.png`),
              resolve(__dirname, `dist/icons/icon${size}.png`)
            );
          });
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
}); 