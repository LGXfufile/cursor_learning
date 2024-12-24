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
        <el-button size="large">查看文档</el-button>
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

    <!-- 添加页脚部分 -->
    <footer class="footer-section">
      <div class="footer-content">
        <div class="contact-info">
          <h3>联系方式</h3>
          <p>
            <el-icon><Message /></el-icon>
            邮箱：<a href="mailto:401040990@qq.com">401040990@qq.com</a>
          </p>
        </div>
        <div class="footer-links">
          <a href="https://github.com/LGXfufile/cursor_learning" target="_blank">GitHub</a>
          <a href="/about">关于我们</a>
          <a href="/privacy">隐私政策</a>
        </div>
        <div class="copyright">
          © {{ new Date().getFullYear() }} Cursor Learning. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Close, Location, Document, Connection, Message } from '@element-plus/icons-vue'
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.feature-card {
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
  color: #606266;
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
</style> 