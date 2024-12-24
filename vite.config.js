import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/cursor_learning/',
  server: {
    open: true,
    port: 5173,
    host: true
  }
})
