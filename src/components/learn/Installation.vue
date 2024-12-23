<template>
  <div class="installation">
    <h3>安装步骤</h3>
    <el-steps :active="1" direction="vertical">
      <el-step title="下载 Cursor">
        <template #description>
          访问官方网站 www.cursor.so 下载适合你操作系统的版本
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
  </div>
</template>

<style scoped>
.installation {
  padding: 20px 0;
}
</style> 