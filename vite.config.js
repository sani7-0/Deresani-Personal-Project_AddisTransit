import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/routes': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/stops': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/buses': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/alerts': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/feedback': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/trip': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/feedbacks': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/debug': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
})