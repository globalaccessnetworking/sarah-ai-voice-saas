import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5600,
    proxy: {
      // FIX 1: This proxy ONLY runs during `npm run dev`.
      // In production, api.ts uses the absolute VITE_BACKEND_URL instead.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('[PROXY ERROR]', err));
          proxy.on('proxyRes', (proxyRes, req) => {
            if (proxyRes.statusCode !== 200) {
              console.log('[PROXY RES ERROR]', proxyRes.statusCode, req.url);
            }
          });
        },
      },
    },
  },
  preview: {
    port: 5600,
  },
})
