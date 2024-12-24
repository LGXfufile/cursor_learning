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

    <div class="code-section">
      <h4>1. 项目结构</h4>
      <div class="code-block">
        <pre><code>todo-app/
├── src/
│   ├── components/
│   │   ├── TodoList.vue
│   │   ├── TodoItem.vue
│   │   └── TodoForm.vue
│   ├── stores/
│   │   └── todo.js
│   ├── App.vue
│   └── main.js
└── package.json</code></pre>
      </div>

      <h4>2. 核心组件实现</h4>
      <el-tabs type="border-card">
        <el-tab-pane label="TodoList.vue">
          <div class="code-block">
            <pre><code>&lt;template&gt;
  &lt;div class="todo-list"&gt;
    &lt;todo-form @add="addTodo" /&gt;
    &lt;el-card v-for="todo in todos"
             :key="todo.id"
             class="todo-item"&gt;
      &lt;todo-item :todo="todo"
                @toggle="toggleTodo"
                @delete="deleteTodo" /&gt;
    &lt;/el-card&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue'
import TodoForm from './TodoForm.vue'
import TodoItem from './TodoItem.vue'

const todos = ref([])

const addTodo = (text) => {
  todos.value.push({
    id: Date.now(),
    text,
    completed: false
  })
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

        <el-tab-pane label="TodoItem.vue">
          <div class="code-block">
            <pre><code>&lt;template&gt;
  &lt;div class="todo-item"
       :class="{ completed: props.todo.completed }"&gt;
    &lt;el-checkbox
      v-model="props.todo.completed"
      @change="$emit('toggle', props.todo.id)"&gt;
      {{ props.todo.text }}
    &lt;/el-checkbox&gt;
    &lt;el-button
      type="danger"
      size="small"
      @click="$emit('delete', props.todo.id)"&gt;
      删除
    &lt;/el-button&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})

defineEmits(['toggle', 'delete'])
&lt;/script&gt;

&lt;style scoped&gt;
.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #fff;
}

.completed {
  opacity: 0.6;
  text-decoration: line-through;
}
&lt;/style&gt;</code></pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="demo-section">
      <h4>效果演示</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="demo-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Edit /></el-icon>
                <span>添加待办事项</span>
              </div>
            </template>
            <div class="demo-placeholder">
              <el-image 
                src="https://cdn.jsdelivr.net/gh/element-plus/element-plus-playground/public/images/playground-preview.png"
                fit="contain"
                class="demo-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                    <p>输入待办事项并点击添加</p>
                  </div>
                </template>
              </el-image>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="demo-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><List /></el-icon>
                <span>待办列表</span>
              </div>
            </template>
            <div class="demo-placeholder">
              <el-image 
                src="https://cdn.jsdelivr.net/gh/element-plus/element-plus-playground/public/images/playground-preview-dark.png"
                fit="contain"
                class="demo-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                    <p>查看和管理待办事项</p>
                  </div>
                </template>
              </el-image>
            </div>
          </el-card>
        </el-col>
      </el-row>
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
import { Monitor, Edit, List, Picture } from '@element-plus/icons-vue'

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

.intro-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
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

.demo-card {
  height: 100%;
  transition: all 0.3s ease;
}

.demo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.demo-placeholder {
  background: #f5f7fa;
  border-radius: 8px;
  height: 300px;
  overflow: hidden;
}

.image-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 12px;
}

.demo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.demo-image:hover {
  transform: scale(1.02);
}

h4 {
  margin: 30px 0 20px;
  color: #303133;
}

ul {
  padding-left: 20px;
  margin: 10px 0;
  color: #666;
}

li {
  margin: 8px 0;
  line-height: 1.6;
}

.tips-section {
  margin-top: 40px;
}
</style> 