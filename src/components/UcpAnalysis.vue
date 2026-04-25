<template>
    <section v-if="!metricsData" class="analysis-section hero-panel oom-theme is-empty">
      <div class="section-title text-center">
        <span class="section-step">STEP 01</span>
        <h3>上传用例图进行 UCP 规模估算</h3>
        <p>导入 PowerDesigner 用例图 (.oom) 后，系统将自动提取参与者 (Actor) 和用例 (UseCase)。</p>
      </div>
      
      <el-upload
        class="upload-demo upload-panel"
        drag
        action="http://localhost:8080/ucp/uploadOom"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        accept=".oom"
      >
        <el-icon class="el-icon--upload upload-icon"><document /></el-icon>
        <div class="el-upload__text">将 UCP 模型文件拖到此处，或 <em>点击上传</em></div>
      </el-upload>
    </section>
  
    <section v-else class="analysis-section results-panel oom-theme">
      <div class="section-title compact" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="section-step">STEP 02</span>
          <h3>用例点规模测算面板 (UCP)</h3>
          <p>手动修正参与者与用例的复杂度，并对技术/环境因子进行 0~5 分的打分评估。</p>
        </div>
        <el-button type="primary" size="large" @click="handleRecalculate" :loading="isRecalculating">
          保存并重新计算 UCP
        </el-button>
      </div>
  
      <div class="dashboard-cards">
        <div class="data-card ufp-card">
          <div class="card-title">未调整用例点 (UUCP)</div>
          <div class="card-value">{{ metricsData.uucp }} <span class="sub-text">(UAW:{{ metricsData.uaw }} + UUCW:{{ metricsData.uucw }})</span></div>
        </div>
        <div class="data-card vaf-card">
          <div class="card-title">技术复杂度 (TCF)</div>
          <div class="card-value">{{ metricsData.tcf.toFixed(3) }}</div>
        </div>
        <div class="data-card vaf-card">
          <div class="card-title">环境复杂度 (ECF)</div>
          <div class="card-value">{{ metricsData.ecf.toFixed(3) }}</div>
        </div>
        <div class="data-card fp-card">
          <div class="card-title">最终用例点 (UCP)</div>
          <div class="card-value highlight">{{ metricsData.ucp.toFixed(2) }}</div>
        </div>
      </div>
  
      <el-divider>1. 用例图元素明细 (切换复杂度会自动调整权重)</el-divider>
      
      <el-table :data="metricsData.elements" border stripe class="metrics-table" height="300">
        <el-table-column prop="elementName" label="节点名称" min-width="150" />
        
        <el-table-column label="元素类型 (Type)" width="160" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.elementType === 'Actor' ? 'warning' : 'success'">
              {{ scope.row.elementType }}
            </el-tag>
          </template>
        </el-table-column>
  
        <el-table-column label="复杂度 (Complexity)" width="180" align="center">
          <template #default="scope">
            <el-select v-model="scope.row.complexity" size="small" @change="handleComplexityChange(scope.row)">
              <el-option label="Simple (简单)" value="Simple" />
              <el-option label="Average (平均)" value="Average" />
              <el-option label="Complex (复杂)" value="Complex" />
            </el-select>
          </template>
        </el-table-column>
  
        <el-table-column prop="weight" label="对应权重" width="100" align="center">
          <template #default="scope">
            <el-tag type="info">权重: {{ scope.row.weight }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="remarks" label="备注" min-width="120" />
      </el-table>
  
      <div class="factors-container">
        <div class="factor-section">
          <el-divider>2. 技术复杂度因子 TCF (0=无影响, 5=强影响)</el-divider>
          <div class="factors-grid">
            <div class="factor-item" v-for="factor in tFactorsList" :key="factor.key">
              <span class="factor-label">{{ factor.label }}</span>
              <el-select v-model="metricsData[factor.key]" size="small" style="width: 70px;">
                <el-option v-for="n in 6" :key="n-1" :label="n-1" :value="n-1" />
              </el-select>
            </div>
          </div>
        </div>
  
        <div class="factor-section">
          <el-divider>3. 环境复杂度因子 ECF (0=无经验/不稳定, 5=精通/极稳定)</el-divider>
          <div class="factors-grid">
            <div class="factor-item" v-for="factor in eFactorsList" :key="factor.key">
              <span class="factor-label">{{ factor.label }}</span>
              <el-select v-model="metricsData[factor.key]" size="small" style="width: 70px;">
                <el-option v-for="n in 6" :key="n-1" :label="n-1" :value="n-1" />
              </el-select>
            </div>
          </div>
        </div>
      </div>
  
    </section>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Document } from '@element-plus/icons-vue'
  
  const metricsData = ref(null)
  const isRecalculating = ref(false)
  
  // 技术因子 T1~T13
  const tFactorsList = [
    { key: 't1', label: 'T1 分布式系统' }, { key: 't2', label: 'T2 响应/吞吐性能' },
    { key: 't3', label: 'T3 终端用户效率' }, { key: 't4', label: 'T4 复杂内部处理' },
    { key: 't5', label: 'T5 代码可重用性' }, { key: 't6', label: 'T6 易安装性' },
    { key: 't7', label: 'T7 易用性' }, { key: 't8', label: 'T8 可移植性' },
    { key: 't9', label: 'T9 易更改性' }, { key: 't10', label: 'T10 并发性' },
    { key: 't11', label: 'T11 特殊的安全性' }, { key: 't12', label: 'T12 第三方接口' },
    { key: 't13', label: 'T13 用户培训' }
  ]
  
  // 环境因子 E1~E8
  const eFactorsList = [
    { key: 'e1', label: 'E1 熟悉UML' }, { key: 'e2', label: 'E2 兼职人员' },
    { key: 'e3', label: 'E3 分析人员能力' }, { key: 'e4', label: 'E4 应用程序经验' },
    { key: 'e5', label: 'E5 面向对象经验' }, { key: 'e6', label: 'E6 动机' },
    { key: 'e7', label: 'E7 困难的编程语言' }, { key: 'e8', label: 'E8 稳定的需求' }
  ]
  
  const handleUploadSuccess = (response) => {
    metricsData.value = response
    ElMessage.success(`用例图解析成功！发现 ${response.elements.length} 个元素。`)
  }
  
  const handleUploadError = () => {
    ElMessage.error('用例图文件解析失败，请检查文件格式。')
  }
  
  // 核心：当用户切换复杂度时，自动更改权重
  const handleComplexityChange = (row) => {
    if (row.elementType === 'Actor') {
      if (row.complexity === 'Simple') row.weight = 1
      else if (row.complexity === 'Average') row.weight = 2
      else if (row.complexity === 'Complex') row.weight = 3
    } else if (row.elementType === 'UseCase') {
      if (row.complexity === 'Simple') row.weight = 5
      else if (row.complexity === 'Average') row.weight = 10
      else if (row.complexity === 'Complex') row.weight = 15
    }
  }
  
  // 点击重新计算按钮
  const handleRecalculate = async () => {
    isRecalculating.value = true
    try {
      const res = await fetch('http://localhost:8080/ucp/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsData.value) 
      })
      
      if (res.ok) {
        metricsData.value = await res.json()
        ElMessage.success('用例点 (UCP) 已重新计算完毕！')
      } else {
        ElMessage.error('计算请求失败！')
      }
    } catch (error) {
      ElMessage.error('网络或服务异常。')
    } finally {
      isRecalculating.value = false
    }
  }
  </script>
  
  <style scoped>
  /* 继承之前的漂亮UI风格 */
  .hero-panel, .results-panel {
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px);
    box-shadow: 0 12px 36px rgba(31, 48, 78, 0.08);
  }
  .hero-panel { padding: 28px; }
  .hero-panel.is-empty { max-width: 900px; margin: 40px auto; display: flex; flex-direction: column; align-items: center; padding: 40px 48px; }
  .text-center { text-align: center; display: flex; flex-direction: column; align-items: center; }
  .results-panel { padding: 26px; }
  
  .section-title { margin-bottom: 24px; }
  .section-step { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: rgba(139, 92, 246, 0.12); color: #7c3aed; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; }
  .section-title h3 { margin: 14px 0 8px; color: #1a2e46; font-size: 2rem; }
  .section-title p { margin: 0; color: #5f7086; font-size: 15px; }
  
  .dashboard-cards { display: flex; gap: 20px; margin: 24px 0; }
  .data-card { flex: 1; padding: 20px; border-radius: 16px; text-align: center; background: white; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.02);}
  .card-title { font-size: 14px; color: #64748b; margin-bottom: 8px; font-weight: 600;}
  .card-value { font-size: 28px; font-weight: 800; color: #0f172a; }
  .card-value.highlight { color: #8b5cf6; font-size: 32px; }
  .sub-text { font-size: 13px; color: #94a3b8; font-weight: normal; }
  
  .factors-container { display: flex; gap: 24px; margin-top: 10px; }
  .factor-section { flex: 1; }
  
  .factors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 10px 0; }
  .factor-item { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .factor-label { font-size: 12px; color: #475569; font-weight: 600;}
  
  :deep(.el-upload-dragger) { min-height: 250px; border: 1.5px dashed rgba(139, 92, 246, 0.4); border-radius: 22px; background: rgba(255,255,255,0.5); }
  :deep(.el-upload-dragger:hover) { border-color: #8b5cf6; background: rgba(255,255,255,0.8); }
  </style>