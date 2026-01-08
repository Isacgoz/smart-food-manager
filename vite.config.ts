import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      external: [/^api\//],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/storage-js'],
          'icons-vendor': ['lucide-react'],
          'toast-vendor': ['react-hot-toast']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    cssMinify: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', '@supabase/supabase-js', 'recharts', 'react-hot-toast'],
  },
});
