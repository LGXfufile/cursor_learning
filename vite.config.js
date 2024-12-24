import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 根据环境变量设置基础路径
const base = process.env.NODE_ENV === 'production' ? '/cursor_learning/' : '/'

export default defineConfig({
  plugins: [vue()],
  base: base,  // 设置基础路径
  server: {
    open: true,
    port: 5173,
    host: true
  }
})
