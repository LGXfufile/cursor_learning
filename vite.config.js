import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 获取当前环境的基础路径
const base = process.env.NODE_ENV === 'production' ? '/cursor_learning/' : '/'

export default defineConfig({
  plugins: [vue()],
  base: base, // 设置基础路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 添加路径别名
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保资源正确打包
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
