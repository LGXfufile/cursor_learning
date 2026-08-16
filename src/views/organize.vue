<template>
  <div class="organize-page">
    <div class="page-header">
      <el-button type="primary" link @click="goHome">
        <el-icon><ArrowLeft /></el-icon>
        返回主页
      </el-button>
      <h1>文件整理分析</h1>
      <p class="lead">
        云端读不到你电脑上的
        <code>/Users/liguangxin/Desktop/文稿new/测试</code>
        。在这里选择同一个文件夹做预览，或把下面的命令拷到本机终端执行。
      </p>
    </div>

    <el-alert
      title="不会改动原文件"
      type="info"
      :closable="false"
      show-icon
      class="hint"
    >
      网页版只做分析。真正移动文件请用本机脚本，默认预览，加 <code>--apply</code> 才整理，可用 <code>--undo</code> 撤回。
    </el-alert>

    <el-card class="command-card">
      <template #header>
        <div class="card-title">
          <el-icon><Monitor /></el-icon>
          <span>本机一键分析</span>
        </div>
      </template>
      <pre class="command">python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试"</pre>
      <pre class="command">python3 scripts/file_organizer.py "/Users/liguangxin/Desktop/文稿new/测试" --apply</pre>
      <p class="tip">脚本会在该目录生成 <code>_文件分析报告.md</code>，整理结果放在旁边的 <code>测试_整理结果</code>。</p>
    </el-card>

    <el-card class="upload-card">
      <template #header>
        <div class="card-title">
          <el-icon><FolderOpened /></el-icon>
          <span>在网页里预览</span>
        </div>
      </template>
      <div class="picker">
        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          directory
          multiple
          class="hidden-input"
          @change="onFolderPicked"
        />
        <el-button type="primary" size="large" @click="pickFolder">选择文件夹</el-button>
        <span v-if="folderLabel" class="folder-name">已选：{{ folderLabel }}</span>
      </div>
    </el-card>

    <div v-if="analysis" class="result">
      <div class="stat-grid">
        <el-card v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </el-card>
      </div>

      <el-card>
        <template #header>类型分布</template>
        <el-table :data="categoryRows" stripe>
          <el-table-column prop="name" label="分类" />
          <el-table-column prop="count" label="数量" width="100" />
          <el-table-column prop="size" label="大小" width="140" />
          <el-table-column label="占比">
            <template #default="{ row }">
              <el-progress :percentage="row.percent" :stroke-width="10" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card>
        <template #header>体积最大的文件</template>
        <el-empty v-if="!analysis.largest.length" description="没有文件" />
        <ul v-else class="plain-list">
          <li v-for="row in analysis.largest" :key="row.relative">
            <code>{{ row.relative }}</code>
            <span>{{ row.size_h }}</span>
          </li>
        </ul>
      </el-card>

      <el-card>
        <template #header>可能重复（同名且同大小）</template>
        <el-empty v-if="!analysis.maybeDuplicates.length" description="未发现同名同大小文件" />
        <el-collapse v-else>
          <el-collapse-item
            v-for="(group, index) in analysis.maybeDuplicates"
            :key="index"
            :title="`组 ${index + 1}（${group.length} 个）`"
          >
            <div v-for="path in group" :key="path"><code>{{ path }}</code></div>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <el-card>
        <template #header>命名或状态问题</template>
        <el-empty v-if="!analysis.messy.length" description="未发现明显问题" />
        <el-table v-else :data="analysis.messy" stripe>
          <el-table-column prop="relative" label="文件" />
          <el-table-column label="问题">
            <template #default="{ row }">{{ row.issues.join('、') }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card>
        <template #header>建议目录</template>
        <p>按类型归到 <code>测试_整理结果</code>，重复文件单独进 <code>_重复文件</code>，不删除任何内容。</p>
        <ul class="plain-list">
          <li v-for="name in suggestedFolders" :key="name"><code>{{ name }}</code></li>
        </ul>
        <el-button type="primary" @click="downloadReport">下载分析报告</el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FolderOpened, Monitor } from '@element-plus/icons-vue'
import { analyzeBrowserFiles, humanSize, renderBrowserReport } from '../utils/fileAnalyze.js'

const router = useRouter()
const folderInput = ref(null)
const folderLabel = ref('')
const analysis = ref(null)

const goHome = () => router.push('/')

const pickFolder = () => {
  folderInput.value?.click()
}

const onFolderPicked = (event) => {
  const files = event.target.files
  if (!files || !files.length) return
  const first = files[0]
  folderLabel.value = (first.webkitRelativePath || first.name).split('/')[0] || '已选文件夹'
  analysis.value = analyzeBrowserFiles(files)
}

const stats = computed(() => {
  if (!analysis.value) return []
  return [
    { label: '文件数', value: String(analysis.value.fileCount) },
    { label: '总大小', value: humanSize(analysis.value.totalSize) },
    { label: '问题文件', value: String(analysis.value.messy.length) },
    { label: '疑似重复组', value: String(analysis.value.maybeDuplicates.length) }
  ]
})

const categoryRows = computed(() => {
  if (!analysis.value) return []
  const total = analysis.value.fileCount || 1
  return Object.keys(analysis.value.byCategory)
    .sort()
    .map((name) => {
      const info = analysis.value.byCategory[name]
      return {
        name,
        count: info.count,
        size: humanSize(info.size),
        percent: Math.round((info.count / total) * 100)
      }
    })
})

const suggestedFolders = computed(() => {
  if (!analysis.value) return []
  const names = Object.keys(analysis.value.byCategory).sort()
  if (analysis.value.maybeDuplicates.length) names.push('_重复文件')
  return names
})

const downloadReport = () => {
  if (!analysis.value) return
  const text = renderBrowserReport(analysis.value, folderLabel.value)
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '_文件分析报告.md'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.organize-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 20px 80px;
}

.page-header h1 {
  margin: 12px 0 8px;
  font-size: 32px;
}

.lead {
  color: #606266;
  line-height: 1.7;
}

.hint,
.command-card,
.upload-card,
.result > * {
  margin-top: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.command {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.tip {
  color: #909399;
  margin-bottom: 0;
}

.hidden-input {
  display: none;
}

.picker {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.folder-name {
  color: #409eff;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.plain-list {
  padding-left: 0;
  list-style: none;
}

.plain-list li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

code {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
