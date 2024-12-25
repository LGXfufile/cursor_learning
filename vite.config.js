import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 根据环境设置不同的基础路径
const base = process.env.NODE_ENV === 'production' 
  ? '/cursor_learning/' 
  : '/'

export default defineConfig({
  plugins: [vue()],
  base: base, // 开发环境使用 '/'，生产环境使用 '/cursor_learning/'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
