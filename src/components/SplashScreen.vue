<template>
  <div class="splash-screen">
    <h1 class="loading-textA">软件度量自动化分析平台</h1>
    <img class="loader-gif" src="../assets/ALoading.gif" alt="加载动画" />
    <h4 class="loading-text">{{ randomMessage }}</h4>
  </div>
</template>

<script setup>
import { ref,onMounted } from 'vue'

// 定义向父组件发送的事件
const emit = defineEmits(['finish'])

const messages = [
  "(๑・̀ㅂ・́)و✧Welcome~   制作者很累，真的……我没开玩笑！",
  "这只是一条碎碎念，因为怕你无聊",
  "我听说手敲代码的程序员在2026年灭亡了。（尖叫跑开）",
  "说真的，你可以猜猜我准备了几则tips",
  "这里什么也没有……",
  "上帝哦你居然注意到我了吗！",
  "我不建议晚上吃太饱，因为会失眠，那你就只能起来敲代码了",
  "实话讲，我也不知道我为什么要在这里放这些话"
]

// 2. 随机生成一个索引
const randomIndex = Math.floor(Math.random() * messages.length)

// 3. 将随机选中的句子存入响应式变量 randomMessage 中
const randomMessage = ref(messages[randomIndex])

onMounted(() => {
  // 核心逻辑：强制动画播放 2.5 秒
  // 无论页面实际加载多快，必须等这 2.5 秒放完
  setTimeout(() => {
    emit('finish') // 通知 App.vue 动画播放完毕
  }, 3000)
})
</script>

<style scoped>
/* 全屏覆盖，层级最高 */
.loading-textA {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 2.8rem;
  font-weight: 800;
  /* 设置渐变色：从 Element Plus 主题蓝到深蓝色 */
  background: linear-gradient(135deg, #409eff 0%, #0052d9 100%);
  /* 核心：将背景裁剪到文字上 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* 字母间距加宽，增加高级感 */
  letter-spacing: 6px;
  margin-bottom: 20px;
  
  /* 增加一个淡淡的外发光 */
  filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.3));
  
  /* 入场动画：渐显并向上平移 */
  animation: titleFadeUp 1.2s ease-out forwards;
}

@keyframes titleFadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff; /* 与你的全局背景色一致 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 一个简单的纯 CSS 呼吸/旋转加载动画 */
.loader {
  width: 60px;
  height: 60px;
  border: 5px solid #dcdfe6;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 24px;
  color: #606266;
  font-weight: 300;
  letter-spacing: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 旋转动画 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 文字呼吸效果动画 */
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>