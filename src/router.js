import { createRouter, createWebHistory } from 'vue-router'
import Index from './views/index.vue'
import Learn from './views/learn.vue'

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
  history: createWebHistory(),
  routes
})

export default router 