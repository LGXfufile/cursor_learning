<template>
  <div class="basic-usage">
    <h3>基本操作指南</h3>
    <el-collapse>
      <el-collapse-item title="Tab 自动补全" name="1">
        <div class="usage-content">
          <p>Tab 功能是 Cursor 最基础的 AI 辅助功能，主要包括：</p>
          <ul>
            <li>代码生成：从光标位置智能预测并补全代码</li>
            <li>多行编辑：支持多行同时修改</li>
            <li>智能重写：根据上下文提供代码优化建议</li>
            <li>光标预测：自动预测下一个编辑位置</li>
          </ul>
          <p class="tip">提示：按 Tab 接受建议，按 Esc 拒绝建议</p>
        </div>
      </el-collapse-item>
      
      <el-collapse-item title="Chat 智能对话" name="2">
        <div class="usage-content">
          <p>使用 Ctrl + L 打开 Chat 功能，支持：</p>
          <ul>
            <li>代码解释：分析并解释选中的代码</li>
            <li>智能问答：回答编程相关问题</li>
            <li>代码生成：根据描述生成代码</li>
            <li>文件引用：使用 @ 引用项目文件</li>
            <li>在线搜索：使用 @Web 获取最新信息</li>
          </ul>
        </div>
      </el-collapse-item>

      <el-collapse-item title="Cmd K 快捷编辑" name="3">
        <div class="usage-content">
          <p>按下 Ctrl + K 快速编辑代码：</p>
          <ul>
            <li>快速编辑：选中代码后描述修改需求</li>
            <li>代码生成：在空白处生成新代码</li>
            <li>代码优化：自动优化选中的代码</li>
            <li>注释生成：为代码生成详细注释</li>
          </ul>
        </div>
      </el-collapse-item>

      <el-collapse-item title="Composer 项目开发" name="4">
        <div class="usage-content">
          <p>使用 Ctrl + I 进行项目级操作：</p>
          <ul>
            <li>创建项目：描述需求自动生成项目框架</li>
            <li>添加功能：通过对话扩展项目功能</li>
            <li>多文件编辑：同时修改多个相关文件</li>
            <li>项目重构：优化项目结构和代码</li>
          </ul>
        </div>
      </el-collapse-item>
    </el-collapse>

    <div class="shortcuts-section">
      <h3>常用快捷键</h3>
      <el-table :data="shortcuts" style="width: 100%">
        <el-table-column prop="key" label="快捷键" width="180" />
        <el-table-column prop="description" label="功能描述" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
const shortcuts = [
  { key: 'Tab', description: '接受 AI 建议的代码补全' },
  { key: 'Ctrl + K', description: '快速编辑或生成代码' },
  { key: 'Ctrl + L', description: '打开 Chat 进行智能对话' },
  { key: 'Ctrl + I', description: '使用 Composer 进行项目开发' },
  { key: 'Ctrl + Enter', description: '立即执行当前命令' },
  { key: 'Alt + Enter', description: '不带上下文提交查询' }
]
</script>

<style scoped>
.basic-usage {
  padding: 20px 0;
}

.usage-content {
  padding: 15px;
  color: #666;
}

ul {
  padding-left: 20px;
  margin: 10px 0;
}

li {
  margin: 8px 0;
  line-height: 1.5;
}

.tip {
  margin-top: 10px;
  padding: 10px;
  background-color: #f4f4f5;
  border-radius: 4px;
  color: #909399;
}

.shortcuts-section {
  margin-top: 30px;
}

h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style> 