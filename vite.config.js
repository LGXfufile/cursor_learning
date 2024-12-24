import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'production' ? '/cursor_learning/' : '/',
  server: {
    open: true,
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保生成正确的资源引用路径
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
