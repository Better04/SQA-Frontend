import { createApp } from 'vue'
import App from './App.vue'
import './style.css' // 引入我们刚刚修改的全局样式

// === 引入 Element Plus 和它的样式表 ===
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

// 告诉 Vue 使用 Element Plus
app.use(ElementPlus)

app.mount('#app')