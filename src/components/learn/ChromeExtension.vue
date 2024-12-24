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
          <el-card class="demo-card">
            <template #header>
              <div class="card-header">
                <span>选中文本</span>
              </div>
            </template>
            <img src="https://cdn.jsdelivr.net/gh/microsoft/vscode-docs@main/docs/editor/images/selection/selection.gif" alt="选中文本演示">
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="demo-card">
            <template #header>
              <div class="card-header">
                <span>翻译结果</span>
              </div>
            </template>
            <img src="https://cdn.jsdelivr.net/gh/microsoft/vscode-docs@main/docs/editor/images/tooltip/tooltip.gif" alt="翻译结果演示">
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
import { ChromeFilled } from '@element-plus/icons-vue'

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
  margin-bottom: 20px;
}

.demo-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-header {
  font-weight: bold;
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