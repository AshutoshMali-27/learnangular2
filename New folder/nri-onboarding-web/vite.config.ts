import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      // Same-origin in dev so the session cookie and anti-forgery cookie flow as in production.
      proxy: {
        '/Onboarding': {
          target: env.VITE_PROXY_TARGET || 'https://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
