import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { copyFileSync } from 'fs'

function spa404Plugin(): Plugin {
  return {
    name: 'spa-404',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
    },
  }
}

export default defineConfig({
  base: '/testing-front/',
  plugins: [react(), tailwindcss(), spa404Plugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
