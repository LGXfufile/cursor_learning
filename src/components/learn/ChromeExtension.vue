<template>
  <div class="chrome-extension">
    <h3>Chrome 插件开发示例</h3>
    
    <el-card class="intro-section">
      <template #header>
        <div class="section-header">
          <el-icon><ChromeFilled /></el-icon>
          <span>项目介绍</span>
        </div>
      </template>
      <p>我们将开发一个简单的 Chrome 扩展，它可以快速翻译选中的文本。通过这个示例，你将学习到：</p>
      <ul>
        <li>Chrome 插件的基本结构</li>
        <li>使用 Cursor AI 加速开发</li>
        <li>调用翻译 API</li>
        <li>处理浏览器事件</li>
      </ul>
    </el-card>

    <div class="code-section">
      <h4>1. 创建项目结构</h4>
      <div class="code-block">
        <pre><code>translation-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── background.js</code></pre>
      </div>

      <h4>2. 配置 manifest.json</h4>
      <div class="code-block">
        <pre><code>{
  "manifest_version": 3,
  "name": "Quick Translator",
  "version": "1.0",
  "description": "快速翻译选中的文本",
  "permissions": [
    "contextMenus",
    "storage",
    "activeTab"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["&lt;all_urls&gt;"],
    "js": ["content.js"]
  }]
}</code></pre>
      </div>

      <h4>3. 实现翻译功能</h4>
      <el-tabs type="border-card">
        <el-tab-pane label="content.js">
          <div class="code-block">
            <pre><code>// 监听文本选择事件
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      type: 'translate',
      text: selectedText
    });
  }
});</code></pre>
          </div>
        </el-tab-pane>

        <el-tab-pane label="background.js">
          <div class="code-block">
            <pre><code>// 处理翻译请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'translate') {
    translateText(request.text)
      .then(result => {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'showTranslation',
          translation: result
        });
      });
  }
});</code></pre>
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
                <el-icon><Select /></el-icon>
                <span>选中文本翻译</span>
              </div>
            </template>
            <div class="demo-placeholder">
              <el-image 
                src="https://storage.googleapis.com/chrome-gcs-uploader.google.com/image/WlD8wC6g8P8IaQK1gJHBcBM9CO72/UV4C9qBjvtjvZa5GbU4E.png"
                fit="contain"
                class="demo-image"
              >
                <template #placeholder>
                  <div class="image-loading">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <p>加载中...</p>
                  </div>
                </template>
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                    <p>选中文本后，点击扩展图标进行翻译</p>
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
                <el-icon><Document /></el-icon>
                <span>翻译结果展示</span>
              </div>
            </template>
            <div class="demo-placeholder">
              <el-image 
                src="https://storage.googleapis.com/chrome-gcs-uploader.google.com/image/WlD8wC6g8P8IaQK1gJHBcBM9CO72/qd7KqhZxK3U0OeEhS93H.png"
                fit="contain"
                class="demo-image"
              >
                <template #placeholder>
                  <div class="image-loading">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <p>加载中...</p>
                  </div>
                </template>
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                    <p>翻译结果将在弹窗中显示</p>
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
import { ChromeFilled, Picture, Select, Document, Loading } from '@element-plus/icons-vue'

const tips = [
  {
    title: '使用 manifest.json',
    content: '确保正确配置权限和脚本注入规则',
    type: 'primary',
    icon: 'Document'
  },
  {
    title: '消息通信',
    content: '使用 chrome.runtime.sendMessage 在不同脚本间通信',
    type: 'success',
    icon: 'Connection'
  },
  {
    title: '调试技巧',
    content: '使用 chrome://extensions 页面的调试工具进行开发',
    type: 'warning',
    icon: 'Tools'
  }
]
</script>

<style scoped>
.chrome-extension {
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

h4 {
  margin: 30px 0 20px;
  color: #303133;
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

.image-placeholder, .image-loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 12px;
}

.image-loading .el-icon {
  font-size: 24px;
  animation: rotating 2s linear infinite;
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

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.el-image {
  width: 100%;
  height: 100%;
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