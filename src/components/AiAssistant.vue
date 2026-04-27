<template>
  <div class="ai-assistant-container">
    <div class="floating-btn" @click="togglePanel" v-if="!isPanelOpen">
      <el-icon :size="24" color="#fff"><MagicStick /></el-icon>
    </div>

    <transition name="fade-slide">
      <div class="ai-panel" v-show="isPanelOpen">
        <div class="ai-header">
          <div class="header-title">
            
            <span>AI 类质量分析助手</span>
          </div>
          <el-icon class="close-btn" @click="togglePanel"><Close /></el-icon>
        </div>

        <div class="ai-body">
          <div class="search-area">
            <el-input
              v-model="classNameQuery"
              placeholder="请输入需要分析的类名 (例如: UserService)"
              @keyup.enter="fetchAnalysis"
              clearable
            >
              <template #append>
                <el-button @click="fetchAnalysis" :loading="isLoading">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <div class="result-area" v-loading="isLoading" element-loading-text="AI正在深度分析中...">
            <div v-if="!analysisResult && !isLoading" class="empty-state">
              输入类名，获取 AI 智能度量与质量分析报告。
            </div>
            <div v-if="analysisResult" class="markdown-result">
              {{ analysisResult }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, Close, Search, Monitor } from '@element-plus/icons-vue'

// 状态控制
const isPanelOpen = ref(false)
const classNameQuery = ref('')
const analysisResult = ref('')
const isLoading = ref(false)

// 切换面板显示/隐藏
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

// 调用后端接口获取 AI 分析
const fetchAnalysis = async () => {
  if (!classNameQuery.value.trim()) {
    ElMessage.warning('请输入有效的类名')
    return
  }

  isLoading.value = true
  analysisResult.value = '' // 清空历史结果

  try {
    const response = await fetch(`http://localhost:8080/api/analysis/className/${classNameQuery.value.trim()}`)
    
    if (response.ok) {
      // 因为后端返回的是 String (可能包含中文和换行)，使用 text() 解析
      const textData = await response.text() 
      analysisResult.value = textData
      ElMessage.success('AI 分析完成')
    } else {
      ElMessage.error(`请求失败，状态码: ${response.status}`)
    }
  } catch (error) {
    console.error('获取 AI 分析失败:', error)
    ElMessage.error('网络或服务异常，请检查后端服务是否启动')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 容器固定在右下角 */
.ai-assistant-container {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 9999; /* 确保层级最高 */
}

/* 悬浮按钮样式 */
.floating-btn {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #38bdf8, #3b82f6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.floating-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
}

/* AI 面板样式 (延续了你项目的亚克力/毛玻璃风格) */
.ai-panel {
  width: 400px;
  height: 550px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(31, 48, 78, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.ai-header {
  height: 54px;
  background: linear-gradient(90deg, #1e293b, #334155);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  font-weight: 600;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}
.close-btn {
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s ease;
}
.close-btn:hover {
  transform: scale(1.2) rotate(90deg);
}

/* 主体内容 */
.ai-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.search-area {
  margin-bottom: 20px;
}

/* 结果展示区 */
.result-area {
  flex: 1;
  background: rgba(241, 245, 249, 0.6);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.empty-state {
  color: #94a3b8;
  text-align: center;
  margin-top: 80px;
  font-size: 14px;
}

.markdown-result {
  color: #334155;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap; /* 关键：保留后端的换行符并自动换行 */
  word-wrap: break-word;
}

/* 动画效果 */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>