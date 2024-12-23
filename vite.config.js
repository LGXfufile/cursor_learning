import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 本地开发时注释掉 base 配置
  // base: '/cursor_learning/'
})
