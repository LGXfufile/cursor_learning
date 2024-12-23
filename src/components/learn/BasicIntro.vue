<template>
  <div class="basic-intro">
    <h3>什么是 Cursor？</h3>
    <p>Cursor 是一个革命性的 AI 驱动的代码编辑器，它能够帮助开发者更快速、更智能地编写代码。通过集成先进的 AI 模型，Cursor 提供了强大的代码补全、重构和优化功能。</p>

    <h3>主要特点</h3>
    <el-card class="feature-card" v-for="feature in features" :key="feature.title">
      <template #header>
        <div class="card-header">
          <el-icon>
            <component :is="feature.icon" />
          </el-icon>
          <span>{{ feature.title }}</span>
        </div>
      </template>
      <div class="card-content">
        {{ feature.description }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Monitor, Edit, Setting } from '@element-plus/icons-vue'

const features = [
  {
    icon: Monitor,
    title: 'AI 驱动',
    description: '使用先进的 AI 模型提供智能代码补全和建议'
  },
  {
    icon: Edit,
    title: '智能重构',
    description: '自动识别代码模式并提供优化建议'
  },
  {
    icon: Setting,
    title: '简单易用',
    description: '直观的界面设计，快速上手，提升开发效率'
  }
]
</script>

<style scoped>
.basic-intro {
  color: #2c3e50;
}

h3 {
  margin-top: 30px;
  margin-bottom: 20px;
  color: #1a1a1a;
}

p {
  line-height: 1.6;
  color: #4c4c4c;
}

.feature-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.card-content {
  color: #666;
  line-height: 1.5;
}
</style> 