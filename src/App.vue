<template>
  <Transition name="fade" mode="out-in">
    
    <SplashScreen v-if="isAnimating" @finish="isAnimating = false" />

    <div v-else class="common-layout">
      <el-container>
        <el-header class="header">
          <div class="brand-block">
            <div class="brand-kicker">Software Quality Intelligence</div>
            <h2>软件度量自动化分析平台</h2>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <el-card class="main-shell" shadow="never">
            <el-tabs v-model="activeTab" class="main-tabs" @tab-click="handleTabClick">
              
              <el-tab-pane label="Java 源代码分析" name="code">
                <CodeAnalysis />
              </el-tab-pane>

              <el-tab-pane label="设计类图分析 (OOM)" name="design">
                <OomAnalysis />
              </el-tab-pane>

              <el-tab-pane label="历史度量记录" name="history">
                <HistoryRecords ref="historyRef" />
              </el-tab-pane>

            </el-tabs>
          </el-card>
        </el-main>
      </el-container>
    </div>
    
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
// 导入所有子组件
import SplashScreen from './components/SplashScreen.vue'
import CodeAnalysis from './components/CodeAnalysis.vue'
import OomAnalysis from './components/OomAnalysis.vue'
import HistoryRecords from './components/HistoryRecords.vue'

// 状态控制
const isAnimating = ref(true)    // 是否正在播放开场动画
const activeTab = ref('code')     // 默认显示的标签页
const historyRef = ref(null)      // 历史记录组件的引用

/**
 * 标签页点击处理函数
 * 当用户点击“历史度量记录”时，手动触发子组件的数据抓取方法，确保数据最新
 */
const handleTabClick = (tab) => {
  if (tab.paneName === 'history' && historyRef.value) {
    historyRef.value.fetchHistoryData()
  }
}
</script>

<style scoped>
/* 过渡动画样式 */
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.6s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

/* 页面顶部样式 */
.header {
  background:
    radial-gradient(circle at top left, rgba(90, 166, 255, 0.22), transparent 32%),
    linear-gradient(135deg, #17304a 0%, #284765 45%, #20354d 100%);
  color: #f8fbff;
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 40px rgba(18, 35, 53, 0.16);
}

/* 主内容区样式 */
.main-content { 
  padding: 28px 20px 36px;
  min-height: calc(100vh - 92px); 
}

.brand-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.brand-kicker {
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(238, 245, 255, 0.72);
}

.brand-block h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.main-shell {
  border: 1px solid rgba(163, 180, 201, 0.24);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.94));
  box-shadow: 0 24px 60px rgba(31, 48, 78, 0.12);
}

/* 深度调整 Element Plus 内部样式（可选） */
:deep(.el-card__body) {
  padding: 24px 26px 28px;
}

:deep(.main-tabs .el-tabs__header) {
  margin: 0;
}

:deep(.main-tabs .el-tabs__nav-wrap::after) {
  height: 1px;
  background: linear-gradient(90deg, rgba(59, 110, 167, 0.28), rgba(59, 110, 167, 0.06));
}

:deep(.main-tabs .el-tabs__item) {
  height: 50px;
  padding: 0 18px;
  font-size: 17px;
  font-weight: 700;
  color: #5d6c80;
}

:deep(.main-tabs .el-tabs__item.is-active) {
  color: #1a5fb4;
}

:deep(.main-tabs .el-tabs__active-bar) {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2d7ff9, #4f9cff);
}

:deep(.el-tabs__content) {
  padding: 28px 0 8px;
}

@media (max-width: 768px) {
  .header {
    min-height: 84px;
    padding: 0 16px;
  }

  .main-content {
    padding: 18px 12px 24px;
  }

  .brand-block h2 {
    font-size: 1.5rem;
  }

  :deep(.el-card__body) {
    padding: 18px 16px 22px;
  }
}
</style>
