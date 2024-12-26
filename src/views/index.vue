<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="main-title">Cursor 零入门开发指南</h1>
      <p class="subtitle">
        从零开始学习 Cursor 开发，掌握 AI 辅助编程的未来方向
      </p>
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="startLearning">
          开始学习
        </el-button>
        <el-button size="large" @click="showDocDialog">查看文档</el-button>
      </div>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <h2 class="section-title">课程特点</h2>
      <div class="features-grid">
        <div class="feature-card" v-for="feature in features" :key="feature.title">
          <el-icon class="feature-icon" :size="40">
            <component :is="feature.icon" />
          </el-icon>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- Target Audience -->
    <div class="audience-section">
      <h2 class="section-title">适用人群</h2>
      <div class="audience-grid">
        <div class="suitable">
          <h3>适合</h3>
          <ul>
            <li v-for="item in suitableFor" :key="item">
              <el-icon><Check /></el-icon>
              {{ item }}
            </li>
          </ul>
        </div>
        <div class="unsuitable">
          <h3>不适合</h3>
          <ul>
            <li v-for="item in unsuitableFor" :key="item">
              <el-icon><Close /></el-icon>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="faq-section">
      <h2 class="section-title">常见问题</h2>
      <el-collapse>
        <el-collapse-item v-for="faq in faqs" :key="faq.question" :title="faq.question">
          <p>{{ faq.answer }}</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 修改页脚部分 -->
    <footer class="footer-section">
      <div class="footer-content">
        <div class="contact-info">
          <h3>联系方式</h3>
          <p>
            <el-icon><Message /></el-icon>
            <span>邮箱：401040990@qq.com</span>
          </p>
        </div>
        <div class="footer-links">
          <a href="https://github.com/LGXfufile/cursor_learning" target="_blank">GitHub</a>
          <el-button link type="primary" @click="showContactDialog">加入学习群</el-button>
          <a href="/privacy">隐私政策</a>
        </div>
        <div class="copyright">
          © {{ new Date().getFullYear() }} Cursor Learning. All rights reserved.
        </div>
      </div>
    </footer>

    <!-- 添加联系方式弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="加入学习群"
      width="300px"
      center
      align-center
    >
      <div class="qrcode-container">
        <el-image
          :src="'/img/WechatIMG107.jpg'"
          fit="contain"
          class="qrcode-image"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Warning /></el-icon>
              <p>二维码加载失败</p>
            </div>
          </template>
        </el-image>
        <p class="qrcode-tip">扫描二维码加入学习群</p>
      </div>
    </el-dialog>

    <!-- 添加文档弹窗 -->
    <el-dialog
      v-model="docDialogVisible"
      title="文档资源"
      width="600px"
    >
      <div class="doc-links">
        <el-card v-for="doc in docResources" :key="doc.title" class="doc-card">
          <div class="doc-header">
            <el-icon :size="24">
              <component :is="doc.icon" />
            </el-icon>
            <h3>{{ doc.title }}</h3>
          </div>
          <p class="doc-desc">{{ doc.description }}</p>
          <div class="doc-actions">
            <el-button 
              type="primary" 
              :icon="doc.external ? 'Link' : 'Document'"
              @click="openDoc(doc.url)"
              :link="doc.external"
            >
              {{ doc.external ? '访问链接' : '查看文档' }}
            </el-button>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Close, Location, Document, Connection, Message, Warning, Link, Files, Guide } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const features = ref([
  {
    icon: Location,
    title: '循序渐进',
    description: '从基础概念开始，逐步深入 Cursor 的高级特性'
  },
  {
    icon: Document,
    title: '实战项目',
    description: '通过真实项目练习，掌握 Cursor 实际应用'
  },
  {
    icon: Connection,
    title: 'AI 集成',
    description: '深入理解 AI 辅助编程的核心概念和最佳实践'
  }
])

const suitableFor = ref([
  '想提升编程效率的开发者',
  '对 AI 编程感兴趣的学习者',
  '需要智能代码补全的程序员',
  '希望快速掌握新技术的从业者'
])

const unsuitableFor = ref([
  '完全没有编程基础的初学者',
  '不愿意尝试新工具的开发者'
])

const faqs = ref([
  {
    question: '需要什么基础才能学习？',
    answer: '建议有基本的编程概念和一定的代码开发经验。'
  },
  {
    question: '课程时长是多少？',
    answer: '完整课程约20小时，可以根据个人进度灵活安排。'
  },
  {
    question: '是否提供技术支持？',
    answer: '我们提供专业的技术支持和活跃的学习社区。'
  }
])

const router = useRouter()

const dialogVisible = ref(false)

const docDialogVisible = ref(false)

const docResources = [
  {
    title: '官方文档',
    description: 'Cursor 官方文档，包含完整的功能说明和使用指南',
    icon: 'Document',
    url: 'https://cursor.sh/docs',
    external: true
  },
  {
    title: '快速入门',
    description: '通过实例快速了解 Cursor 的基本使用方法',
    icon: 'Guide',
    url: '/learn',
    external: false
  },
  {
    title: 'API 参考',
    description: '详细的 API 文档和示例代码',
    icon: 'Files',
    url: 'https://cursor.sh/api',
    external: true
  }
]

const showContactDialog = () => {
  dialogVisible.value = true
}

const showDocDialog = () => {
  docDialogVisible.value = true
}

const openDoc = (url) => {
  if (url.startsWith('http')) {
    window.open(url, '_blank')
  } else {
    router.push(url)
  }
  docDialogVisible.value = false
}

const startLearning = () => {
  router.push('/learn')
}
</script>

<style scoped>
.landing-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 80px); /* 减去页脚高度 */
  display: flex;
  flex-direction: column;
}

.hero-section {
  text-align: center;
  padding: 80px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  margin-bottom: 60px;
}

.main-title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #2196F3, #4CAF50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 20px;
  color: #666;
  margin-bottom: 40px;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.features-grid {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 40px;
}

.feature-card {
  flex: 1;
  padding: 30px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.section-title {
  font-size: 36px;
  text-align: center;
  margin-bottom: 40px;
}

.audience-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 40px;
}

.suitable, .unsuitable {
  padding: 30px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suitable h3, .unsuitable h3 {
  margin-bottom: 20px;
  font-size: 24px;
}

.suitable ul, .unsuitable ul {
  list-style: none;
  padding: 0;
}

.suitable li, .unsuitable li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.faq-section {
  margin-top: 60px;
}

@media (max-width: 768px) {
  .audience-grid {
    grid-template-columns: 1fr;
  }
  
  .main-title {
    font-size: 36px;
  }
  
  .subtitle {
    font-size: 18px;
  }
}

/* 添加页脚样式 */
.footer-section {
  margin-top: 60px;
  padding: 40px 0;
  background-color: #f5f7fa;
  border-top: 1px solid #e6e6e6;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.contact-info {
  text-align: center;
}

.contact-info h3 {
  margin-bottom: 10px;
  color: #303133;
}

.contact-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.contact-info a {
  color: #409EFF;
  text-decoration: none;
}

.contact-info a:hover {
  text-decoration: underline;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-links a {
  color: #606266;
  text-decoration: none;
}

.footer-links a:hover {
  color: #409EFF;
}

.copyright {
  color: #909399;
  font-size: 14px;
}

/* 确保页脚始终在底部 */
.landing-page {
  min-height: calc(100vh - 80px); /* 减去页脚高度 */
  display: flex;
  flex-direction: column;
}

.footer-section {
  margin-top: auto;
}

/* 添加二维码相关样式 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
}

.qrcode-tip {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
}

.image-error .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

/* 添加文档相关样式 */
.doc-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 10px;
}

.doc-card {
  transition: all 0.3s ease;
}

.doc-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.doc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.doc-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.doc-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  min-height: 44px;
}

.doc-actions {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}
</style> 