import { createRouter, createWebHashHistory } from 'vue-router'
import Index from './views/index.vue'
import Learn from './views/learn.vue'
import Organize from './views/organize.vue'

// 使用 hash 模式而不是 history 模式
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Index
    },
    {
      path: '/learn',
      name: 'Learn',
      component: Learn
    },
    {
      path: '/organize',
      name: 'Organize',
      component: Organize
    }
  ]
})

export default router 