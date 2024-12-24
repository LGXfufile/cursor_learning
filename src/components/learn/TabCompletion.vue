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

    <!-- 图片演示部分 -->
    <div class="demo-section">
      <h4>使用场景</h4>
      <el-row :gutter="20">
        <el-col :span="8" v-for="(scene, index) in scenes" :key="index">
          <el-card class="scene-card">
            <img :src="scene.image" :alt="scene.title" class="scene-image">
            <div class="scene-info">
              <h5>{{ scene.title }}</h5>
              <p>{{ scene.description }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="examples-section">
      <h4>实际案例</h4>
      <el-tabs type="border-card">
        <el-tab-pane label="函数补全">
          <div class="example-content">
            <div class="code-block">
              <pre><code>// 输入函数名并按 Tab
function calculateTotal</code></pre>
              <p class="completion-hint">→ 按下 Tab 键，AI 会根据上下文补全完整函数：</p>
              <pre><code>function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    if (item.price && item.quantity) {
      total += item.price * item.quantity;
    }
  }
  return total;
}</code></pre>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Vue 组件补全">
          <div class="example-content">
            <div class="code-block">
              <pre><code>// 输入基础结构并按 Tab
&lt;template&gt;
  &lt;div class="user-card"&gt;</code></pre>
              <p class="completion-hint">→ 按下 Tab 键，自动补全组件结构：</p>
              <pre><code>&lt;template&gt;
  &lt;div class="user-card"&gt;
    &lt;div class="user-avatar"&gt;
      &lt;img :src="user.avatar" :alt="user.name"&gt;
    &lt;/div&gt;
    &lt;div class="user-info"&gt;
      &lt;h3&gt;{{ user.name }}&lt;/h3&gt;
      &lt;p&gt;{{ user.email }}&lt;/p&gt;
    &lt;/div&gt;
    &lt;div class="user-actions"&gt;
      &lt;el-button type="primary"&gt;编辑&lt;/el-button&gt;
      &lt;el-button&gt;删除&lt;/el-button&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="tips-section">
      <h4>使用技巧</h4>
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
import { Monitor, Edit, Connection } from '@element-plus/icons-vue'

const scenes = [
  {
    title: '函数补全',
    description: '智能分析函数名，自动生成完整函数实现',
    image: 'https://cdn.jsdelivr.net/gh/microsoft/vscode-docs@main/docs/editor/images/intellisense/intellisense.gif'
  },
  {
    title: '组件补全',
    description: '快速生成 Vue 组件模板结构',
    image: 'https://cdn.jsdelivr.net/gh/microsoft/vscode-docs@main/docs/editor/images/debugging/debug-init.gif'
  },
  {
    title: '代码重构',
    description: '自动优化代码结构和实现',
    image: 'https://cdn.jsdelivr.net/gh/microsoft/vscode-docs@main/docs/editor/images/refactoring/refactoring-example.gif'
  }
]

const tips = [
  {
    title: '使用注释引导',
    content: '在代码前添加注释说明意图，帮助 AI 更准确理解需求',
    type: 'primary',
    icon: 'Edit'
  },
  {
    title: '多方案切换',
    content: '连续按 Tab 键可以在多个补全方案中切换',
    type: 'success',
    icon: 'Connection'
  },
  {
    title: '部分采纳',
    content: '使用 Ctrl + Enter 可以只接受部分补全内容',
    type: 'warning',
    icon: 'Monitor'
  }
]
</script>

<style scoped>
.tab-completion {
  padding: 20px 0;
}

.scene-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
}

.scene-card:hover {
  transform: translateY(-5px);
}

.scene-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid #eee;
}

.scene-info {
  padding: 20px;
  background-color: white;
}

.scene-info h5 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
}

.scene-info p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.code-block {
  position: relative;
  padding: 20px;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  margin: 10px 0;
}

.code-block pre {
  margin: 0;
  padding: 0;
}

.code-block code {
  color: #d4d4d4;
  font-family: 'Fira Code', monospace;
  white-space: pre-wrap;
}

.completion-hint {
  margin: 15px 0;
  padding: 10px 15px;
  background: #2d2d2d;
  border-left: 4px solid #4CAF50;
  color: #d4d4d4;
}

.tips-section {
  margin-top: 40px;
}

h4 {
  margin: 20px 0;
  color: #303133;
  font-size: 20px;
}

.demo-section {
  margin: 30px 0;
}

.examples-section {
  margin: 30px 0;
}

.feature-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style> 