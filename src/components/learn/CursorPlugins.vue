<template>
  <div class="cursor-plugins">
    <el-card class="intro-section">
      <template #header>
        <div class="section-header">
          <el-icon><Opportunity /></el-icon>
          <span>这一课解决什么</span>
        </div>
      </template>
      <p>
        Cursor 插件把 Rules、Skills、Commands、Agents、MCP、Hooks 打成一份可分发的包。
        FDE 提效的关键不是多装几个主题，而是把「怎么写课、怎么审、怎么接外部系统」固化下来，让 Agent 每次按同一套约定执行。
      </p>
      <p>
        本课对应计划
        <code>docs/plans/fde/提效/cursor插件.md</code>
        ，仓库里同时放了可本地加载的示例插件
        <code>examples/fde-cursor-plugin/</code>。
      </p>
    </el-card>

    <h4>插件里能装什么</h4>
    <el-row :gutter="16">
      <el-col
        v-for="item in pluginComponents"
        :key="item.key"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <el-card class="component-card" shadow="hover">
          <h5>{{ item.title }}</h5>
          <p>{{ item.summary }}</p>
          <el-tag size="small" type="info">{{ item.useWhen }}</el-tag>
        </el-card>
      </el-col>
    </el-row>

    <h4>安装路径</h4>
    <el-timeline>
      <el-timeline-item
        v-for="(step, index) in installSteps"
        :key="index"
        type="primary"
      >
        <h5>{{ step.title }}</h5>
        <p>{{ step.content }}</p>
      </el-timeline-item>
    </el-timeline>

    <h4>推荐清单</h4>
    <p class="filter-row">
      <el-radio-group v-model="activeCategory" size="small">
        <el-radio-button label="全部" />
        <el-radio-button
          v-for="category in categories"
          :key="category"
          :label="category"
        />
      </el-radio-group>
    </p>
    <el-table :data="filteredPlugins" stripe>
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="kind" label="类型" width="120" />
      <el-table-column prop="category" label="分类" width="90" />
      <el-table-column prop="why" label="为什么装" min-width="260" />
      <el-table-column prop="install" label="怎么装" min-width="220" />
    </el-table>

    <h4>加载本仓库示例插件</h4>
    <el-alert
      title="示例不进 Marketplace，只用于本地教学。"
      type="info"
      :closable="false"
      class="local-alert"
    />
    <div class="code-block">
      <pre><code>{{ localPluginTree }}</code></pre>
    </div>
    <div class="code-block">
      <pre><code>{{ localInstallCommand }}</code></pre>
    </div>
    <p>执行后打开命令面板，跑 <code>Developer: Reload Window</code>，再到 Customize 里确认 Rules / Skills / Commands 已出现。</p>

    <h4>自己做一份插件</h4>
    <el-tabs type="border-card">
      <el-tab-pane label="Cursor Plugin">
        <div class="code-block">
          <pre><code>my-plugin/
├── .cursor-plugin/plugin.json
├── rules/coding-standards.mdc
├── skills/code-reviewer/SKILL.md
├── commands/new-lesson.md
└── agents/lesson-writer.md</code></pre>
        </div>
        <p>适合要带 Rules、Commands、Hooks、变量的团队插件。清单里至少要有 <code>name</code>。</p>
      </el-tab-pane>
      <el-tab-pane label="Agent Plugin">
        <div class="code-block">
          <pre><code>my-plugin/
├── plugin.json
├── skills/code-reviewer/SKILL.md
└── mcp.json</code></pre>
        </div>
        <p>开放标准，只打包 Skills 和 MCP，换到其他支持 Agent Plugins 的工具也能用。</p>
      </el-tab-pane>
    </el-tabs>

    <h4>FDE 用法</h4>
    <el-timeline>
      <el-timeline-item
        v-for="(tip, index) in practiceTips"
        :key="index"
        :type="tip.type"
      >
        <h5>{{ tip.title }}</h5>
        <p>{{ tip.content }}</p>
      </el-timeline-item>
    </el-timeline>

    <h4>官方文档</h4>
    <ul class="doc-list">
      <li v-for="doc in officialDocs" :key="doc.url">
        <a :href="doc.url" target="_blank" rel="noreferrer">{{ doc.title }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Opportunity } from '@element-plus/icons-vue'
import {
  installSteps,
  localInstallCommand,
  localPluginTree,
  officialDocs,
  pluginComponents,
  recommendedPlugins
} from '../../data/pluginCatalog.js'

const activeCategory = ref('全部')
const categories = [...new Set(recommendedPlugins.map((item) => item.category))]

const filteredPlugins = computed(() => {
  if (activeCategory.value === '全部') {
    return recommendedPlugins
  }
  return recommendedPlugins.filter((item) => item.category === activeCategory.value)
})

const practiceTips = [
  {
    title: '规范进 Rules，流程进 Skills',
    content: '「用 script setup、不要加新 UI 库」这类话放 Rules。加课、审课这种分步流程放 Skills，避免规则文件变成操作手册。',
    type: 'primary'
  },
  {
    title: '先本地，再考虑 Marketplace',
    content: '开发时链到 ~/.cursor/plugins/local。团队要分发再用 Team Marketplace，并标清 Default Off / Default On / Required。',
    type: 'success'
  },
  {
    title: 'MCP 按需开',
    content: '用不到的 MCP 在 Customize 里关掉，少占上下文，也少一次鉴权失败。教学示例故意不带 MCP。',
    type: 'warning'
  },
  {
    title: '扩展和插件分开看',
    content: 'Vue / ESLint / GitLens 是编辑器扩展，改的是你自己的阅读和诊断。Cursor Plugin 改的是 Agent 的约定和工具箱。两类都要，不要互相替代。',
    type: 'info'
  }
]
</script>

<style scoped>
.cursor-plugins {
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

h4 {
  margin: 32px 0 16px;
  color: #303133;
}

h5 {
  margin: 0 0 8px;
  color: #303133;
}

p {
  color: #606266;
  line-height: 1.7;
}

code {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.component-card {
  margin-bottom: 16px;
  min-height: 168px;
}

.filter-row {
  margin-bottom: 12px;
}

.local-alert {
  margin-bottom: 12px;
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
  background: transparent;
  color: #d4d4d4;
  font-family: 'Fira Code', monospace;
  white-space: pre-wrap;
}

.doc-list {
  padding-left: 20px;
  color: #606266;
}

.doc-list a {
  color: #409eff;
  text-decoration: none;
}

.doc-list a:hover {
  text-decoration: underline;
}
</style>
