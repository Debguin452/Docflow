/// <reference types="vitest" />
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
      __SITE_URL__: JSON.stringify(env.VITE_SITE_URL ?? 'https://filedit.pages.dev'),
    },

    build: {
      target: 'es2020',
      sourcemap: false,
      minify: 'esbuild',

      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal loading
          manualChunks(id) {
            // Vite's tiny shared helpers (__vitePreload, CJS interop) must live in the core
            // chunk. Otherwise Rollup can park them inside a heavy manual chunk (e.g. imgly)
            // and every page load ends up downloading that whole library.
            if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill') || id.includes('commonjsHelpers')) {
              return 'react-vendor'
            }
            if (!id.includes('node_modules')) return
            // Anchored matches: a bare 'node_modules/react' also matches react-dropzone,
            // react-helmet-async… and silently drags them into the wrong chunk.
            if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return 'react-vendor'
            // Heavy libraries get their own chunk so only the tools that need them pay for them
            if (id.includes('/pdf-lib-plus-encrypt/')) return 'pdf-encrypt'
            if (id.includes('/pdf-lib/')) return 'pdf-lib'
            if (id.includes('/pdfjs-dist/')) return 'pdfjs'
            if (id.includes('/@imgly/') || id.includes('/onnxruntime')) return 'imgly'
            if (id.includes('/browser-image-compression/')) return 'img-compress'
            if (id.includes('/tesseract.js')) return 'ocr'
            if (id.includes('/jszip/')) return 'zip'
            if (/\/(qrcode|jsqr)\//.test(id)) return 'qr'
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

    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
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
