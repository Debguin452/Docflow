import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },

    // Expose VITE_* env vars to client
    define: {
      __SITE_URL__: JSON.stringify(env.VITE_SITE_URL ?? 'https://docflow.pages.dev'),
    },

    build: {
      target: 'es2020',
      sourcemap: false,
      minify: 'esbuild',

      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal loading
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/pdf-lib') || id.includes('node_modules/pdfjs-dist')) {
              return 'pdf-vendor'
            }
            if (id.includes('node_modules/browser-image-compression') || id.includes('node_modules/@imgly')) {
              return 'image-vendor'
            }
            if (id.includes('node_modules/tesseract.js')) {
              return 'ocr-vendor'
            }
            if (id.includes('node_modules/qrcode') || id.includes('node_modules/jsqr')) {
              return 'qr-vendor'
            }
            if (id.includes('node_modules/fuse.js') || id.includes('node_modules/lucide-react') || id.includes('node_modules/clsx') || id.includes('node_modules/react-dropzone') || id.includes('node_modules/react-helmet-async')) {
              return 'ui-vendor'
            }
          },

          // Stable chunk file names (cache-friendly)
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },

      // Warn threshold raised for large PDF/WASM chunks
      chunkSizeWarningLimit: 2000,
    },

    // Web Workers (pdfjs, tesseract)
    worker: {
      format: 'es',
    },

    // Prevent Vite from pre-bundling large WASM-heavy packages
    optimizeDeps: {
      exclude: ['tesseract.js', '@imgly/background-removal', 'pdfjs-dist'],
      include: ['react', 'react-dom', 'react-router-dom', 'pdf-lib', 'fuse.js', 'lucide-react', 'clsx'],
    },

    // Test / preview server
    preview: {
      port: 4173,
      host: true,
    },

    server: {
      port: 5173,
      host: true,
      // Proxy API calls to wrangler pages dev during development
      proxy: {
        '/api': {
          target: 'http://localhost:8788',
          changeOrigin: true,
        },
      },
    },
  }
})
