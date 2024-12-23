<template>
  <div class="tab-completion">
    <h3>Tab 自动补全功能介绍</h3>
    
    <el-card class="feature-section">
      <template #header>
        <div class="section-header">
          <el-icon><Monitor /></el-icon>
          <span>功能概述</span>
        </div>
      </template>
      <p>Tab 自动补全是 Cursor 最核心的 AI 辅助功能，它能实时分析你的代码上下文，提供智能的代码补全建议。</p>
    </el-card>

    <div class="demo-section">
      <h4>示例演示</h4>
      <el-carousel height="400px">
        <el-carousel-item v-for="(demo, index) in demos" :key="index">
          <div class="demo-content">
            <img :src="demo.image" :alt="demo.title">
            <div class="demo-description">
              <h5>{{ demo.title }}</h5>
              <p>{{ demo.description }}</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <div class="examples-section">
      <h4>实际案例</h4>
      <el-collapse>
        <el-collapse-item title="1. 函数补全示例" name="1">
          <div class="example-content">
            <div class="code-block">
              <pre><code>function calculate</code></pre>
              <p class="completion-hint">→ 按下 Tab 键，AI 会根据上下文补全完整函数：</p>
              <pre><code>function calculateTotalPrice(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}</code></pre>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="2. Vue 组件补全" name="2">
          <div class="example-content">
            <div class="code-block">
              <pre><code>&lt;template&gt;
  &lt;div class="user-</code></pre>
              <p class="completion-hint">→ 按下 Tab 键，自动补全组件结构：</p>
              <pre><code>&lt;template&gt;
  &lt;div class="user-profile"&gt;
    &lt;div class="user-avatar"&gt;
      &lt;img :src="user.avatar" :alt="user.name"&gt;
    &lt;/div&gt;
    &lt;div class="user-info"&gt;
      &lt;h2&gt;{{ user.name }}&lt;/h2&gt;
      &lt;p&gt;{{ user.email }}&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="tips-section">
      <h4>使用技巧</h4>
      <el-alert
        v-for="(tip, index) in tips"
        :key="index"
        :title="tip.title"
        :description="tip.content"
        type="info"
        show-icon
        class="tip-item"
      />
    </div>
  </div>
</template>

<script setup>
import { Monitor } from '@element-plus/icons-vue'

const demos = [
  {
    title: '函数补全',
    description: '输入函数名和参数，Cursor 自动补全函数体',
    image: '/images/tab-completion-1.png'
  },
  {
    title: '组件模板补全',
    description: '输入基础标签，自动补全完整组件结构',
    image: '/images/tab-completion-2.png'
  },
  {
    title: '智能变量补全',
    description: '根据上下文自动推断并补全变量名和类型',
    image: '/images/tab-completion-3.png'
  }
]

const tips = [
  {
    title: '连续按 Tab',
    content: '如果第一个补全建议不符合预期，可以继续按 Tab 查看其他建议'
  },
  {
    title: '使用注释引导',
    content: '在代码前添加注释，可以帮助 AI 更准确地理解你的意图'
  },
  {
    title: '部分接受',
    content: '补全时可以按 Ctrl + Enter 只接受部分补全内容'
  }
]
</script>

<style scoped>
.tab-completion {
  padding: 20px 0;
}

.feature-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
}

.demo-section {
  margin: 30px 0;
}

.demo-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.demo-content img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}

.demo-description {
  padding: 15px;
  background: rgba(255, 255, 255, 0.9);
}

.examples-section {
  margin: 30px 0;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
}

.code-block pre {
  margin: 0;
  white-space: pre-wrap;
}

.completion-hint {
  color: #666;
  margin: 10px 0;
  padding: 5px 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.tips-section {
  margin-top: 30px;
}

.tip-item {
  margin-bottom: 10px;
}

h4 {
  margin: 20px 0;
  color: #303133;
  font-size: 20px;
}

h5 {
  margin: 10px 0;
  color: #303133;
}
</style> 