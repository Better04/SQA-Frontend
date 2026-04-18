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
import SplashScreen from './components/SplashScreen.vue'
import CodeAnalysis from './components/CodeAnalysis.vue'
import OomAnalysis from './components/OomAnalysis.vue'
import HistoryRecords from './components/HistoryRecords.vue'

const isAnimating = ref(true)
const activeTab = ref('code')
const historyRef = ref(null)

const handleTabClick = (tab) => {
  // 当切换到历史页签时，调用子组件的刷新方法
  if (tab.paneName === 'history' && historyRef.value) {
    historyRef.value.fetchHistoryData()
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.header {
  background-color: #2c3e50;
  color: white;
  display: flex;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.main-content { padding: 20px; min-height: calc(100vh - 60px); }
</style>