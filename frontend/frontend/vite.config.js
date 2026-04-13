// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,                    // ← Important for ngrok
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok-free.dev'
    ],

    // HMR fix for ngrok (https tunnel ke liye)
    hmr: {
      clientPort: 443
    },

    // Proxy configuration (sabse important)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',   // ← tera backend port
        changeOrigin: true,
        secure: false,
      },
      '/graphql': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})