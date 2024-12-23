<template>
  <div class="learn-container">
    <!-- 左侧目录 -->
    <div class="sidebar">
      <el-menu
        default-active="1-1"
        class="menu"
        @select="handleSelect"
      >
        <el-sub-menu index="1">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>基础入门</span>
          </template>
          <el-menu-item index="1-1">Cursor 简介</el-menu-item>
          <el-menu-item index="1-2">安装配置</el-menu-item>
          <el-menu-item index="1-3">基本使用</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>核心功能</span>
          </template>
          <el-menu-item index="2-1">AI 代码补全</el-menu-item>
          <el-menu-item index="2-2">代码优化</el-menu-item>
          <el-menu-item index="2-3">智能重构</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="3">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>高级特性</span>
          </template>
          <el-menu-item index="3-1">自定义提示</el-menu-item>
          <el-menu-item index="3-2">项目分析</el-menu-item>
          <el-menu-item index="3-3">最佳实践</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>

    <!-- 右侧内容 -->
    <div class="content">
      <div class="content-header">
        <h2>{{ currentTitle }}</h2>
      </div>
      <div class="content-body">
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import { Document, Tools, Connection } from '@element-plus/icons-vue'
import BasicIntro from '../components/learn/BasicIntro.vue'
import Installation from '../components/learn/Installation.vue'
import BasicUsage from '../components/learn/BasicUsage.vue'

const currentTitle = ref('Cursor 简介')
const currentComponent = shallowRef(BasicIntro)

const contentMap = {
  '1-1': { title: 'Cursor 简介', component: BasicIntro },
  '1-2': { title: '安装配置', component: Installation },
  '1-3': { title: '基本使用', component: BasicUsage },
}

const handleSelect = (index) => {
  if (contentMap[index]) {
    currentTitle.value = contentMap[index].title
    currentComponent.value = contentMap[index].component
  }
}
</script>

<style scoped>
.learn-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  width: 260px;
  background-color: white;
  border-right: 1px solid #e6e6e6;
  height: 100%;
  overflow-y: auto;
}

.menu {
  border-right: none;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-header {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.content-body {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  min-height: calc(100vh - 160px);
}

h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}
</style> 