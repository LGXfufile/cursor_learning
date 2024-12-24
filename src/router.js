import { createRouter, createWebHistory } from 'vue-router'
import Index from './views/index.vue'
import Learn from './views/learn.vue'

// 根据环境变量设置基础路径
const base = process.env.NODE_ENV === 'production' ? '/cursor_learning/' : '/'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Index
  },
  {
    path: '/learn',
    name: 'Learn',
    component: Learn
  }
]

const router = createRouter({
  history: createWebHistory(base),  // 使用正确的基础路径
  routes
})

export default router 