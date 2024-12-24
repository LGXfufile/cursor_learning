import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    open: '/', // 自动打开根路径
    port: 5173,
    host: true
  }
})
