import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: './', // 修改为相对路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue': 'vue' // 移除 CDN 引用
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
