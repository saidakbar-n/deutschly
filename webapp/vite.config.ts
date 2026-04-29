import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  preview: {
    allowedHosts: [
      'localhost',
      '.up.railway.app',
    ],
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000/api/v1'),
    'process.env.VITE_TELEGRAM_BOT_NAME': JSON.stringify(process.env.VITE_TELEGRAM_BOT_NAME || 'Deutschly'),
  }
})
