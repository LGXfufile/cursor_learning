<template>
  <div class="web-app-dev">
    <h3>网页应用开发示例</h3>
    
    <el-card class="intro-section">
      <template #header>
        <div class="section-header">
          <el-icon><Monitor /></el-icon>
          <span>项目介绍</span>
        </div>
      </template>
      <p>我们将开发一个现代化的待办事项应用，通过这个示例，你将学习到：</p>
      <ul>
        <li>Vue 3 组合式 API 的使用</li>
        <li>使用 Cursor AI 快速开发</li>
        <li>Element Plus 组件库集成</li>
        <li>前端工程化实践</li>
      </ul>
    </el-card>

    <el-card class="demo-app">
      <template #header>
        <div class="section-header">
          <el-icon><List /></el-icon>
          <span>Todo 应用演示</span>
        </div>
      </template>
      
      <div class="todo-input">
        <el-input
          v-model="newTodo"
          placeholder="请输入待办事项"
          @keyup.enter="addTodo"
        >
          <template #append>
            <el-button @click="addTodo">添加</el-button>
          </template>
        </el-input>
      </div>

      <div class="todo-list">
        <el-empty v-if="!todos.length" description="暂无待办事项" />
        <el-card
          v-for="todo in todos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.completed }"
        >
          <div class="todo-content">
            <el-checkbox
              v-model="todo.completed"
              @change="toggleTodo(todo.id)"
            >
              {{ todo.text }}
            </el-checkbox>
            <el-button
              type="danger"
              size="small"
              @click="deleteTodo(todo.id)"
            >
              删除
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <div class="code-section">
      <h4>核心代码实现</h4>
      <el-tabs type="border-card">
        <el-tab-pane label="TodoList.vue">
          <div class="code-block">
            <pre><code>// TodoList.vue
&lt;script setup&gt;
import { ref } from 'vue'

const todos = ref([])
const newTodo = ref('')

const addTodo = () => {
  if (!newTodo.value.trim()) return
  todos.value.push({
    id: Date.now(),
    text: newTodo.value,
    completed: false
  })
  newTodo.value = ''
}

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.completed = !todo.completed
}

const deleteTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
}
&lt;/script&gt;</code></pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="tips-section">
      <h4>开发提示</h4>
      <el-timeline>
        <el-timeline-item
          v-for="(tip, index) in tips"
          :key="index"
          :type="tip.type"
          :icon="tip.icon"
        >
          <h5>{{ tip.title }}</h5>
          <p>{{ tip.content }}</p>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Monitor, Edit, List } from '@element-plus/icons-vue'

const todos = ref([])
const newTodo = ref('')

const addTodo = () => {
  if (!newTodo.value.trim()) return
  todos.value.push({
    id: Date.now(),
    text: newTodo.value,
    completed: false
  })
  newTodo.value = ''
}

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.completed = !todo.completed
}

const deleteTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
}

const tips = [
  {
    title: '组件化开发',
    content: '将功能拆分为小型、可复用的组件',
    type: 'primary',
    icon: 'Document'
  },
  {
    title: '状态管理',
    content: '使用 Composition API 管理组件状态',
    type: 'success',
    icon: 'Connection'
  },
  {
    title: '性能优化',
    content: '合理使用 v-memo 和 computed 提升性能',
    type: 'warning',
    icon: 'Tools'
  }
]
</script>

<style scoped>
.web-app-dev {
  padding: 20px 0;
}

.intro-section, .demo-app {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-input {
  margin-bottom: 20px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.todo-item {
  transition: all 0.3s ease;
}

.todo-item:hover {
  transform: translateX(5px);
}

.todo-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completed {
  opacity: 0.6;
}

.completed :deep(.el-checkbox__label) {
  text-decoration: line-through;
}

.code-block {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 8px;
  margin: 10px 0;
}

.code-block pre {
  margin: 0;
}

.code-block code {
  color: #d4d4d4;
  font-family: 'Fira Code', monospace;
  white-space: pre-wrap;
}

h4 {
  margin: 30px 0 20px;
  color: #303133;
}

.tips-section {
  margin-top: 40px;
}
</style> 