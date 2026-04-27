<template>
  <section class="analysis-section hero-panel flowchart-theme">
    <div class="section-title">
      <span class="section-step">STEP 01</span>
      <h3>上传程序流程图 (Draw.io)</h3>
      <p>通过解析流程图文件，进行严谨的结构化度量与复杂度分析。</p>
    </div>
    <el-upload
      class="upload-demo upload-panel"
      drag
      :auto-upload="false"
      :on-change="handleFileChange"
      accept=".xml,.drawio"
    >
      <el-icon class="el-icon--upload upload-icon"><document /></el-icon>
      <div class="el-upload__text">请拖拽或点击上传流程图 <em>(Draw.io的.xml或.drawio格式)</em></div>
      <template #tip>
        <div class="el-upload__tip">解析计算节点与逻辑圈复杂度</div>
      </template>
    </el-upload>
  </section>

  <section v-if="hasResult" class="analysis-section results-panel flowchart-theme">
    <div class="section-title compact">
      <span class="section-step">STEP 02</span>
      <h3>结构化度量与复杂度分析结果</h3>
      <p>自动提取图形网络拓扑结构，洞察代码复杂度和测试难点。</p>
    </div>

    <!-- 指标卡片 -->
    <div class="metrics-cards">
      <div class="metric-card">
        <div class="metric-value">{{ metrics.nodes }}</div>
        <div class="metric-label">总节点数 (N)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ metrics.edges }}</div>
        <div class="metric-label">总连线数 (E)</div>
      </div>
      <div class="metric-card highlight" :class="{'danger': metrics.cyclomaticComplexity > 10}">
        <div class="metric-value">{{ metrics.cyclomaticComplexity }}</div>
        <div class="metric-label">圈复杂度 (V(G))</div>
        <div class="metric-desc" v-if="metrics.cyclomaticComplexity > 10">复杂度过高，建议重构</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ metrics.predicates }}</div>
        <div class="metric-label">判定节点数 (P)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ metrics.maxFanIn }}</div>
        <div class="metric-label">最大扇入 (Max Fan-in)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ metrics.maxFanOut }}</div>
        <div class="metric-label">最大扇出 (Max Fan-out)</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'

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
      ElMessage.success('流程图解析成功！')
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
  
  // 查找所有的 mxCell
  const cells = xmlDoc.getElementsByTagName('mxCell')
  
  let nodesCount = 0
  let edgesCount = 0
  
  // 记录出入度
  const outDegreeMap = {}
  const inDegreeMap = {}
  
  // 第一遍：统计有效节点
  const validNodeIds = new Set()
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const id = cell.getAttribute('id')
    const vertex = cell.getAttribute('vertex')
    
    // id 为 0 和 1 的通常是底层画板 default root 元素，不视为业务节点
    if (vertex === "1" && id !== "0" && id !== "1") {
      validNodeIds.add(id)
      outDegreeMap[id] = 0
      inDegreeMap[id] = 0
    }
  }
  nodesCount = validNodeIds.size
  
  // 第二遍：统计连线与出入度
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const edge = cell.getAttribute('edge')
    
    if (edge === "1") {
      const source = cell.getAttribute('source')
      const target = cell.getAttribute('target')
      
      // 只有连接了有效节点的线才算有效边
      if (source && target && validNodeIds.has(source) && validNodeIds.has(target)) {
        edgesCount++
        outDegreeMap[source]++
        inDegreeMap[target]++
      }
    }
  }
  
  // 统计其他指标
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
  
  // McCabe 圈复杂度：V(G) = E - N + 2
  // 对于具有 p 个连通分支的图，V(G) = E - N + 2p，通常单流程图 p=1
  const cyclomaticComplexity = edgesCount - nodesCount + 2
  
  metrics.value = {
    nodes: nodesCount,
    edges: edgesCount,
    cyclomaticComplexity: cyclomaticComplexity > 0 ? cyclomaticComplexity : 1, // 最少是1
    predicates: predicatesCount,
    maxFanIn: maxFanIn,
    maxFanOut: maxFanOut
  }
  hasResult.value = true
}
</script>

<style scoped>
.analysis-section + .analysis-section {
  margin-top: 28px;
}

.hero-panel,
.results-panel {
  border: 1px solid rgba(133, 172, 230, 0.22);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(246, 249, 255, 0.94));
  box-shadow: 0 18px 42px rgba(39, 74, 147, 0.08);
}

.hero-panel {
  padding: 28px;
}

.results-panel {
  padding: 26px;
}

.section-title {
  margin-bottom: 20px;
}

.section-title.compact {
  margin-bottom: 18px;
}

.section-step {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(61, 116, 230, 0.12);
  color: #2f65d6;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.section-title h3 {
  margin: 14px 0 8px;
  color: #202b3d;
  font-size: 2rem;
  line-height: 1.2;
}

.section-title p {
  margin: 0;
  color: #5c6c85;
  font-size: 15px;
}

.upload-panel {
  width: 100%;
}

.upload-icon {
  font-size: 70px;
  color: #4b83f0;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.metric-card {
  padding: 24px 20px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(193, 212, 245, 0.4);
  text-align: center;
  box-shadow: 0 4px 12px rgba(45, 87, 184, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(45, 87, 184, 0.08);
}

.metric-card.highlight {
  background: linear-gradient(135deg, #e8f0ff, #f3f7ff);
  border-color: #a3c4f5;
}

.metric-card.highlight.danger {
  background: linear-gradient(135deg, #fff0f0, #fff7f7);
  border-color: #f5a3a3;
}

.metric-value {
  font-size: 36px;
  font-weight: 800;
  color: #2b56a8;
  margin-bottom: 8px;
}

.metric-card.highlight.danger .metric-value {
  color: #d63333;
}

.metric-label {
  font-size: 14px;
  color: #647a96;
  font-weight: 500;
}

.metric-desc {
  margin-top: 6px;
  font-size: 12px;
  color: #d63333;
  background: rgba(214, 51, 51, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

:deep(.el-upload-dragger) {
  min-height: 250px;
  border: 1.5px dashed rgba(75, 131, 240, 0.56);
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgba(120, 163, 250, 0.12), transparent 52%),
    linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(242, 245, 250, 0.98));
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

:deep(.el-upload-dragger:hover) {
  transform: translateY(-2px);
  border-color: #3b74e6;
  box-shadow: 0 18px 36px rgba(59, 116, 230, 0.14);
}

:deep(.el-upload__text) {
  margin-top: 10px;
  color: #556c8f;
  font-size: 17px;
}

:deep(.el-upload__text em) {
  color: #2b61d6;
  font-style: normal;
  font-weight: 700;
}

:deep(.el-upload__tip) {
  color: #6a82a6;
  font-size: 14px;
}
</style>
