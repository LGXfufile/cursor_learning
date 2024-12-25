import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/cursor_learning/', // 修改为仓库名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue': 'https://unpkg.com/vue@3/dist/vue.esm-browser.js' // 添加 vue 的 CDN
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保资源正确打包
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
