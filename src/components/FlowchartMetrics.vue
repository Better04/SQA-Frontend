<template>
  <section v-if="!hasResult" class="analysis-section hero-panel flowchart-theme is-empty">
    <div class="section-title text-center">
      <span class="section-step">STEP 01</span>
      <h3>上传程序流程图进行结构化分析</h3>
      <p>导入 Draw.io (.xml / .drawio) 文件后，系统将自动解析节点和连线并计算逻辑复杂度。</p>
    </div>
    
    <el-upload
      class="upload-demo upload-panel"
      drag
      :auto-upload="false"
      :on-change="handleFileChange"
      accept=".xml,.drawio"
    >
      <el-icon class="el-icon--upload upload-icon"><document /></el-icon>
      <div class="el-upload__text">将流程图文件拖到此处，或 <em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip text-center">纯前端极速解析计算节点与逻辑圈复杂度</div>
      </template>
    </el-upload>
  </section>

  <section v-else class="analysis-section results-panel flowchart-theme">
    <div class="section-title compact" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span class="section-step">STEP 02</span>
        <h3>程序结构度量与复杂度分析结果</h3>
        <p>自动提取图形网络拓扑结构，洞察代码复杂度和测试难点。</p>
      </div>
      <!-- 将按钮包裹在 el-upload 中，直接唤起文件选择器，避免跳转回初始页面 -->
      <el-upload
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xml,.drawio"
        :show-file-list="false"
        class="inline-upload"
      >
        <el-button type="primary" plain size="large">
          <el-icon style="margin-right: 6px;"><RefreshRight /></el-icon> 重新上传流程图
        </el-button>
      </el-upload>
    </div>

    <!-- 核心指标卡片：统一设置 fp-card 以保证第一行对称，背景颜色在 css 中调淡 -->
    <div class="dashboard-cards">
      <div class="data-card fp-card">
        <div class="card-title">总节点数 (N)</div>
        <div class="card-value highlight">{{ metrics.nodes }}</div>
        <div class="sub-text">有效控制节点</div>
      </div>
      <div class="data-card fp-card">
        <div class="card-title">总连线数 (E)</div>
        <div class="card-value highlight">{{ metrics.edges }}</div>
        <div class="sub-text">节点间的跳转边</div>
      </div>
      <div class="data-card fp-card" :class="{'danger-card': metrics.cyclomaticComplexity > 10}">
        <div class="card-title">圈复杂度 (V(G))</div>
        <div class="card-value highlight">{{ metrics.cyclomaticComplexity }}</div>
        <div class="sub-text" v-if="metrics.cyclomaticComplexity > 10" style="color:#ef4444; font-weight:600;">复杂度过高，测试极难，强烈建议重构</div>
        <div class="sub-text" v-else style="color:#0ea5e9; font-weight:600;">结构清晰，复杂度在安全范围</div>
      </div>
    </div>

    <el-divider>详细结构度量指标明细</el-divider>

    <!-- 次要指标卡片 -->
    <div class="factors-grid">
      <div class="factor-item">
        <span class="factor-label">判定节点数 (P) <span class="tip">出度≥2的分支节点</span></span>
        <span class="factor-value">{{ metrics.predicates }}</span>
      </div>
      <div class="factor-item">
        <span class="factor-label">最大扇出 (Max Fan-out) <span class="tip">最复杂的条件散发程度</span></span>
        <span class="factor-value">{{ metrics.maxFanOut }}</span>
      </div>
      <div class="factor-item">
        <span class="factor-label">最大扇入 (Max Fan-in) <span class="tip">代码块被复用或跳转的最高次数</span></span>
        <span class="factor-value">{{ metrics.maxFanIn }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, RefreshRight } from '@element-plus/icons-vue'

const hasResult = ref(false)
const metrics = ref({
  nodes: 0,
  edges: 0,
  cyclomaticComplexity: 0,
  predicates: 0,
  maxFanIn: 0,
  maxFanOut: 0
})

const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const xmlString = e.target.result
      parseDrawioXml(xmlString)
      ElMessage.success('流程图解析成功！计算完成。')
    } catch (error) {
      console.error(error)
      ElMessage.error('解析失败，请确保上传的是有效的 Draw.io 格式文件')
    }
  }
  reader.readAsText(file)
}

const parseDrawioXml = (xmlString) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, "text/xml")
  
  const cells = xmlDoc.getElementsByTagName('mxCell')
  
  let nodesCount = 0
  let edgesCount = 0
  
  const outDegreeMap = {}
  const inDegreeMap = {}
  
  const validNodeIds = new Set()
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const id = cell.getAttribute('id')
    const vertex = cell.getAttribute('vertex')
    
    if (vertex === "1" && id !== "0" && id !== "1") {
      validNodeIds.add(id)
      outDegreeMap[id] = 0
      inDegreeMap[id] = 0
    }
  }
  nodesCount = validNodeIds.size
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const edge = cell.getAttribute('edge')
    
    if (edge === "1") {
      const source = cell.getAttribute('source')
      const target = cell.getAttribute('target')
      
      if (source && target && validNodeIds.has(source) && validNodeIds.has(target)) {
        edgesCount++
        outDegreeMap[source]++
        inDegreeMap[target]++
      }
    }
  }
  
  let predicatesCount = 0
  let maxFanIn = 0
  let maxFanOut = 0
  
  for (const id of validNodeIds) {
    const outD = outDegreeMap[id]
    const inD = inDegreeMap[id]
    
    if (outD >= 2) predicatesCount++
    if (inD > maxFanIn) maxFanIn = inD
    if (outD > maxFanOut) maxFanOut = outD
  }
  
  const cyclomaticComplexity = edgesCount - nodesCount + 2
  
  metrics.value = {
    nodes: nodesCount,
    edges: edgesCount,
    cyclomaticComplexity: cyclomaticComplexity > 0 ? cyclomaticComplexity : 1,
    predicates: predicatesCount,
    maxFanIn: maxFanIn,
    maxFanOut: maxFanOut
  }
  hasResult.value = true
}
</script>

<style scoped>
/* 继承和其他页面一致的漂亮UI玻璃态风格 */
.hero-panel, .results-panel {
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 36px rgba(31, 48, 78, 0.08);
}

.hero-panel { padding: 28px; }
.hero-panel.is-empty { 
  max-width: 900px; 
  margin: 40px auto; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  padding: 40px 48px; 
}

.text-center { 
  text-align: center; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
}

.results-panel { padding: 26px; }

.section-title { margin-bottom: 24px; }
.section-step { 
  display: inline-flex; 
  align-items: center; 
  padding: 6px 12px; 
  border-radius: 999px; 
  background: rgba(16, 185, 129, 0.12); /* 绿色主题色 */
  color: #059669; 
  font-size: 12px; 
  font-weight: 800; 
  letter-spacing: 0.16em; 
}
.section-title h3 { margin: 14px 0 8px; color: #1a2e46; font-size: 2rem; }
.section-title p { margin: 0; color: #5f7086; font-size: 15px; }

.upload-panel { width: 100%; max-width: 650px; margin-top: 10px; }
.upload-icon { font-size: 70px; color: #10b981; }

.dashboard-cards { display: flex; gap: 20px; margin: 24px 0; }
.data-card { 
  flex: 1; 
  padding: 24px 20px; 
  border-radius: 16px; 
  text-align: center; 
  background: white; 
  border: 1px solid rgba(0,0,0,0.06); 
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}
.data-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.12);
}
.card-title { font-size: 14px; color: #64748b; margin-bottom: 8px; font-weight: 600;}
.card-value { font-size: 36px; font-weight: 800; color: #0f172a; }
.card-value.highlight { color: #0ea5e9; font-size: 42px; }

.fp-card {
  /* 极浅的蓝绿色渐变，保证三张卡片都有底色但不会太突兀 */
  background: linear-gradient(180deg, #ffffff, #f4fafe);
  border-color: #e0f2fe;
}
.fp-card.danger-card {
  background: linear-gradient(180deg, #ffffff, #fef2f2);
  border-color: #fecaca;
}
.fp-card.danger-card .card-value.highlight {
  color: #ef4444;
}

.sub-text { font-size: 13px; color: #94a3b8; font-weight: normal; margin-top: 8px;}

/* 明细因子卡片 */
.factors-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 16px; 
  padding: 10px 0; 
}
.factor-item { 
  display: flex; 
  flex-direction: column;
  justify-content: center; 
  align-items: center; 
  background: #fff; 
  padding: 16px; 
  border-radius: 12px; 
  border: 1px solid #e2e8f0; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.factor-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
.factor-label { 
  font-size: 14px; 
  color: #475569; 
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.factor-label .tip {
  font-size: 12px;
  color: #94a3b8;
  font-weight: normal;
  margin-top: 4px;
}
.factor-value {
  font-size: 24px;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  padding: 4px 20px;
  border-radius: 8px;
}

:deep(.el-upload-dragger) { 
  min-height: 250px; 
  border: 1.5px dashed rgba(16, 185, 129, 0.4); 
  border-radius: 22px; 
  background: rgba(255,255,255,0.5); 
}
:deep(.el-upload-dragger:hover) { 
  border-color: #10b981; 
  background: rgba(255,255,255,0.8); 
}
:deep(.el-divider__text) {
  color: #64748b;
  font-weight: bold;
}
</style>
