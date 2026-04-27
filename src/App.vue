<template>
  <Transition name="fade" mode="out-in">
    <SplashScreen v-if="isAnimating" @finish="isAnimating = false" />

    <div v-else class="common-layout">
      <el-container style="height: 100vh; overflow: hidden;">
        
        <el-aside width="240px" class="sidebar">
          <div class="sidebar-logo">
            <h2>SQI 平台</h2>
            <span class="version">v1.0</span>
          </div>
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            @select="handleMenuSelect"
            background-color="#1e293b"
            text-color="#94a3b8"
            active-text-color="#38bdf8"
          >
            <el-menu-item-group title="面向对象度量 (CK)">
              <el-menu-item index="code">
                <el-icon><Document /></el-icon>
                <span>Java 源代码分析</span>
              </el-menu-item>
              <el-menu-item index="design">
                <el-icon><Picture /></el-icon>
                <span>设计类图分析 (OOM)</span>
              </el-menu-item>
              <el-menu-item index="history">
                <el-icon><Clock /></el-icon>
                <span>CK 历史度量记录</span>
              </el-menu-item>
            </el-menu-item-group>

            <el-menu-item-group title="系统规模度量">
              <el-menu-item index="fpa">
                <el-icon><PieChart /></el-icon>
                <span>功能点估算 (FPA)</span>
              </el-menu-item>
              
              <el-menu-item index="ucp">
                <el-icon><DataAnalysis /></el-icon>
                <span>用例点估算 (UCP)</span>
              </el-menu-item>

              <el-menu-item index="fpaHistory">
                <el-icon><Clock /></el-icon>
                <span>规模度量历史记录</span>
              </el-menu-item>
            </el-menu-item-group>
          </el-menu>
        </el-aside>

        <el-container class="right-container">
          <el-header class="header">
            <div class="brand-block">
              <div class="brand-kicker">Software Quality Intelligence</div>
              <h2>软件度量自动化分析平台</h2>
            </div>
          </el-header>
          
          <el-main class="main-content">
            <div class="main-shell">
              <CodeAnalysis v-if="activeMenu === 'code'" />
              <OomAnalysis v-if="activeMenu === 'design'" />
              <HistoryRecords ref="historyRef" v-if="activeMenu === 'history'" />
              
              <FpaAnalysis v-if="activeMenu === 'fpa'" />
              <FpaHistory v-if="activeMenu === 'fpaHistory'" />

              <UcpAnalysis v-if="activeMenu === 'ucp'" />
            </div>
          </el-main>
        </el-container>

      </el-container>
      
    <AiAssistant />
    </div>
  </Transition>
</template>

<script setup>
import { ref, nextTick } from 'vue'
// 导入 Element Plus 图标
import { Document, Picture, Clock, PieChart, DataAnalysis } from '@element-plus/icons-vue'// === 【新增：引入 FPA 历史记录组件】 ===
import FpaHistory from './components/FpaHistory.vue'
// 导入所有子组件
import SplashScreen from './components/SplashScreen.vue'
import CodeAnalysis from './components/CodeAnalysis.vue'
import OomAnalysis from './components/OomAnalysis.vue'
import HistoryRecords from './components/HistoryRecords.vue'
import FpaAnalysis from './components/FpaAnalysis.vue' 
import UcpAnalysis from './components/UcpAnalysis.vue'
// 状态控制
import AiAssistant from './components/AiAssistant.vue'

const isAnimating = ref(true)    
const activeMenu = ref('code') // 默认选中的菜单项
const historyRef = ref(null)   

// 菜单点击处理函数
const handleMenuSelect = (index) => {
  activeMenu.value = index
  // 如果切到了 CK 历史记录，顺便触发一下数据的刷新
  if (index === 'history') {
    nextTick(() => {
      if (historyRef.value) {
        historyRef.value.fetchHistoryData()
      }
    })
  }
}
</script>

<style scoped>
/* 过渡动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* === 左侧边栏样式 === */
.sidebar {
  background-color: #1e293b;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 16px rgba(0,0,0,0.1);
  z-index: 10;
}

.sidebar-logo {
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #f8fafc;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.sidebar-logo h2 { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 1px; }
.version { font-size: 12px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 600;}

.sidebar-menu { border-right: none; }
:deep(.el-menu-item-group__title) { color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 1px; padding: 20px 20px 10px; }
:deep(.el-menu-item) { font-weight: 600; border-radius: 8px; margin: 4px 12px; height: 46px; line-height: 46px; }
:deep(.el-menu-item.is-active) { background-color: rgba(56, 189, 248, 0.1) !important; color: #38bdf8; }
:deep(.el-menu-item:hover) { background-color: rgba(255, 255, 255, 0.05) !important; }

/* === 右侧主内容区样式 === */
.right-container { background-color: #f1f5f9; display: flex; flex-direction: column; }

.header {
  background: white;
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 0 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  z-index: 5;
}

.brand-block { display: flex; flex-direction: column; gap: 4px; }
.brand-kicker { font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; font-weight: 700;}
.brand-block h2 { margin: 0; font-size: 1.7rem; font-weight: 800; color: #0f172a; }

.main-content { padding: 32px; flex: 1; overflow-y: auto; }

/* 承载各个功能组件的外壳 */
.main-shell {
  background: transparent;
  min-height: 100%;
}
</style>