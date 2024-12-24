<template>
  <div class="installation">
    <h3>安装配置</h3>
    
    <el-card class="install-steps">
      <h4>安装步骤</h4>
      <el-steps :active="3" direction="vertical">
        <el-step title="下载 Cursor">
          <template #description>
            <p>
              访问官方网站
              <el-link 
                type="primary" 
                href="https://www.cursor.com" 
                target="_blank"
                :underline="false"
              >
                www.cursor.com
              </el-link>
              下载适合你操作系统的版本
            </p>
          </template>
        </el-step>
        <el-step title="安装程序">
          <template #description>
            运行下载的安装程序，按照提示完成安装
          </template>
        </el-step>
        <el-step title="初始配置">
          <template #description>
            首次启动时，按照引导完成基本设置
          </template>
        </el-step>
      </el-steps>
    </el-card>

    <el-card class="system-requirements">
      <template #header>
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>系统要求</span>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作系统">
          Windows 10/11, macOS 10.15+, Linux
        </el-descriptions-item>
        <el-descriptions-item label="处理器">
          Intel Core i5 或同等性能
        </el-descriptions-item>
        <el-descriptions-item label="内存">
          最低 8GB RAM
        </el-descriptions-item>
        <el-descriptions-item label="存储空间">
          至少 2GB 可用空间
        </el-descriptions-item>
        <el-descriptions-item label="网络">
          稳定的互联网连接
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="troubleshooting">
      <template #header>
        <div class="card-header">
          <el-icon><Warning /></el-icon>
          <span>常见问题</span>
        </div>
      </template>
      <el-collapse>
        <el-collapse-item title="安装失败怎么办？" name="1">
          <p>
            请访问
            <el-link 
              type="primary" 
              href="https://help.cursor.so/troubleshooting" 
              target="_blank"
              :underline="false"
            >
              帮助中心
            </el-link>
            查看详细解决方案
          </p>
        </el-collapse-item>
        <el-collapse-item title="如何更新到最新版本？" name="2">
          <p>Cursor 会自动检查并提示更新，也可以手动检查更新</p>
        </el-collapse-item>
        <el-collapse-item title="需要付费吗？" name="3">
          <p>
            基础功能免费使用，详细定价请查看
            <el-link 
              type="primary" 
              href="https://cursor.so/pricing" 
              target="_blank"
              :underline="false"
            >
              价格页面
            </el-link>
          </p>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
import { Monitor, Warning } from '@element-plus/icons-vue'
</script>

<style scoped>
.installation {
  padding: 20px 0;
}

.install-steps {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.system-requirements {
  margin-bottom: 30px;
}

.troubleshooting {
  margin-bottom: 30px;
}

h4 {
  margin: 0 0 20px 0;
  color: #303133;
}

.el-link {
  font-weight: 500;
  margin: 0 4px;
}

.el-link:hover {
  text-decoration: none;
}

p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

:deep(.el-step__description) {
  padding-right: 20px;
}
</style> 