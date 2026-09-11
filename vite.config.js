import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, host: true,
    proxy: {
      // Dev server proxies /api to our local serverless backend. Both paths
      // are valid: (1) start `npx vercel dev --listen 3056` (full stack with
      // real Gemini via server key), OR (2) run this `vite dev` (full frontend,
      // /api -> local api server, AI uses on-device fallback). The user must
      // pick their mode; the config keeps both working.
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  preview: { port: 4173 },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Dashboard (recharts) is already route-split; isolate shared vendors
        // so route chunks don't duplicate react/router.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
})
