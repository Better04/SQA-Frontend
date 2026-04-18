<template>
  <Transition name="fade" mode="out-in">
    
    <SplashScreen v-if="isAnimating" @finish="isAnimating = false" />

    <div v-else class="common-layout">
      <el-container>
        <el-header class="header">
          <h2>软件度量自动化分析平台</h2>
        </el-header>
        
        <el-main class="main-content">
          <el-card>
            <el-tabs v-model="activeTab" @tab-click="handleTabClick">
              
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
  background-color: #2c3e50;
  color: white;
  display: flex;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 主内容区样式 */
.main-content { 
  padding: 20px; 
  min-height: calc(100vh - 60px); 
}

/* 深度调整 Element Plus 内部样式（可选） */
:deep(.el-tabs__content) {
  padding: 20px 0;
}
</style>