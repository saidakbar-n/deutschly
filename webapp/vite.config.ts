import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  preview: {
    allowedHosts: [
      'localhost',
      '.up.railway.app',
      '.railway.app',
    ],
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || (import.meta.env.PROD ? 'https://web-production-aab8a.up.railway.app/api/v1' : 'http://localhost:8000/api/v1')),
    'process.env.VITE_TELEGRAM_BOT_NAME': JSON.stringify(process.env.VITE_TELEGRAM_BOT_NAME || 'Deutschly'),
  }
})
