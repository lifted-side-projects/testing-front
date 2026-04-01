import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            const url = req.url || ''
            if (url.includes('chat')) {
              const contentType = proxyRes.headers['content-type'] || ''
              const contentEncoding = proxyRes.headers['content-encoding'] || 'none'
              const transferEncoding = proxyRes.headers['transfer-encoding'] || 'none'
              console.log(`[proxy-stream] ${req.method} ${url}`)
              console.log(`[proxy-stream] content-type: ${contentType}`)
              console.log(`[proxy-stream] content-encoding: ${contentEncoding}`)
              console.log(`[proxy-stream] transfer-encoding: ${transferEncoding}`)
              let chunks = 0
              proxyRes.on('data', (chunk) => {
                chunks++
                console.log(`[proxy-stream] chunk #${chunks} size=${chunk.length} @ ${new Date().toISOString()}`)
              })
              proxyRes.on('end', () => {
                console.log(`[proxy-stream] done — ${chunks} total chunks`)
              })
            }
          })
        },
      },
    },
  },
})
