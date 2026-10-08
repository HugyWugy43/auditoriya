import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET } = loadEnv(mode, '.', 'API_PROXY_TARGET')
  const apiTarget = API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/graphql': { target: apiTarget },
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
