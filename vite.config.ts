import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(),
        // Bundle analyzer - only active when ANALYZE=true
        process.env.ANALYZE === 'true' ? visualizer({ 
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true
        }) : null
      ].filter(Boolean),
      define: {
        // Only expose safe, non-sensitive environment variables to client
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.npm_package_version || "1.0.0"),
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || "")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-utils': ['@supabase/supabase-js', 'framer-motion', '@tanstack/react-query'],
              'vendor-ai': ['@google/genai']
            }
          }
        }
      }
    };
});
