<template>
    <section v-if="!metricsData" class="analysis-section hero-panel oom-theme is-empty">
      <div class="section-title text-center">
        <span class="section-step">STEP 01</span>
        <h3>上传 DFD 数据流图进行功能点分析</h3>
        <p>导入 PowerDesigner 数据流图 (.oom) 后，系统将自动提取加工与数据存储并初步估算规模。</p>
      </div>
      
      <el-upload
        class="upload-demo upload-panel"
        drag
        action="http://localhost:8080/fpa/uploadDfd"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        accept=".oom"
      >
        <el-icon class="el-icon--upload upload-icon"><document /></el-icon>
        <div class="el-upload__text">将 DFD 模型文件拖到此处，或 <em>点击上传</em></div>
      </el-upload>
    </section>
  
    <section v-else class="analysis-section results-panel oom-theme">
      <div class="section-title compact" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="section-step">STEP 02</span>
          <h3>功能点规模测算面板 (FPA)</h3>
          <p>您可以根据实际业务，手动修正各个功能节点的类型与复杂度，并为系统特征打分。</p>
        </div>
        <el-button type="primary" size="large" @click="handleRecalculate" :loading="isRecalculating">
          保存并重新计算最终功能点
        </el-button>
      </div>
  
      <div class="dashboard-cards">
        <div class="data-card ufp-card">
          <div class="card-title">未调整功能点 (UFP)</div>
          <div class="card-value">{{ metricsData.ufp }}</div>
        </div>
        <div class="data-card vaf-card">
          <div class="card-title">值调整因子 (VAF)</div>
          <div class="card-value">{{ metricsData.vaf.toFixed(2) }}</div>
        </div>
        <div class="data-card fp-card">
          <div class="card-title">最终功能点规模 (FP)</div>
          <div class="card-value highlight">{{ metricsData.fp.toFixed(2) }}</div>
        </div>
      </div>
  
      <div class="table-header-toolbar">
        <span class="table-title">1. 识别出的功能点元素明细 (可修改)</span>
        <el-button type="success" plain size="small" @click="handleAddElement">
          + 手动新增功能点
        </el-button>
      </div>
      
      <el-table :data="metricsData.elements" border stripe class="metrics-table" height="350">
        <el-table-column label="节点名称" min-width="150">
          <template #default="scope">
            <el-input v-model="scope.row.elementName" size="small" placeholder="请输入节点名称" />
          </template>
        </el-table-column>
        
        <el-table-column label="功能类型 (Type)" width="160" align="center">
          <template #default="scope">
            <el-select v-model="scope.row.elementType" size="small" @change="updateElementWeight(scope.row)">
              <el-option label="内部逻辑文件 (ILF)" value="ILF" />
              <el-option label="外部接口文件 (EIF)" value="EIF" />
              <el-option label="外部输入 (EI)" value="EI" />
              <el-option label="外部输出 (EO)" value="EO" />
              <el-option label="外部查询 (EQ)" value="EQ" />
            </el-select>
          </template>
        </el-table-column>
  
        <el-table-column label="复杂度 (Complexity)" width="140" align="center">
          <template #default="scope">
            <el-select v-model="scope.row.complexity" size="small" @change="updateElementWeight(scope.row)">
              <el-option label="Low (低)" value="Low" />
              <el-option label="Average (中)" value="Average" />
              <el-option label="High (高)" value="High" />
            </el-select>
          </template>
        </el-table-column>
  
        <el-table-column prop="weight" label="当前权重" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.weight > 6 ? 'danger' : 'info'">{{ scope.row.weight }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="remarks" label="备注" min-width="120">
          <template #default="scope">
            <el-input v-model="scope.row.remarks" size="small" placeholder="选填" />
          </template>
        </el-table-column>
  
        <el-table-column label="操作" width="80" align="center">
          <template #default="scope">
            <el-button type="danger" link size="small" @click="handleDeleteElement(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
  
      <el-divider style="margin: 24px 0 16px;">2. 通用系统特征打分 (0=无影响, 5=极大影响)</el-divider>
      
      <div class="factors-grid">
        <div class="factor-item" v-for="factor in factorsList" :key="factor.key">
          <span class="factor-label">{{ factor.label }}</span>
          <el-select v-model="metricsData[factor.key]" size="small" style="width: 80px;">
            <el-option v-for="n in 6" :key="n-1" :label="n-1" :value="n-1" />
          </el-select>
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
  
  // 14个系统特征定义
  const factorsList = [
    { key: 'g1', label: '1. 数据通信' }, { key: 'g2', label: '2. 分布式处理' },
    { key: 'g3', label: '3. 性能要求' }, { key: 'g4', label: '4. 重度配置' },
    { key: 'g5', label: '5. 事务处理率' }, { key: 'g6', label: '6. 在线输入' },
    { key: 'g7', label: '7. 用户效率' }, { key: 'g8', label: '8. 在线更新' },
    { key: 'g9', label: '9. 复杂处理' }, { key: 'g10', label: '10. 可重用性' },
    { key: 'g11', label: '11. 易安装性' }, { key: 'g12', label: '12. 易操作性' },
    { key: 'g13', label: '13. 多场所应用' }, { key: 'g14', label: '14. 支持变更' }
  ]
  
  // === 本次优化核心：IFPUG 标准功能点权重换算矩阵 ===
  const weightMatrix = {
    ILF: { Low: 7, Average: 10, High: 15 },
    EIF: { Low: 5, Average: 7, High: 10 },
    EI:  { Low: 3, Average: 4, High: 6 },
    EO:  { Low: 4, Average: 5, High: 7 },
    EQ:  { Low: 3, Average: 4, High: 6 }
  }
  
  // 当用户改变下拉框时，立刻更新该行的权重值，并简单累加显示
  const updateElementWeight = (row) => {
    if (row.elementType && row.complexity) {
      row.weight = weightMatrix[row.elementType][row.complexity] || 0;
    }
  }
  
  // 手动新增一行功能点
  const handleAddElement = () => {
    if (metricsData.value && metricsData.value.elements) {
      metricsData.value.elements.push({
        elementName: '未命名节点',
        elementType: 'EI',
        complexity: 'Average',
        weight: 4, // EI + Average 默认为 4
        remarks: '用户手动添加'
      })
    }
  }
  
  // 手动删除一行功能点
  const handleDeleteElement = (index) => {
    if (metricsData.value && metricsData.value.elements) {
      metricsData.value.elements.splice(index, 1)
    }
  }
  
  const handleUploadSuccess = (response) => {
    metricsData.value = response
    ElMessage.success(`DFD 解析成功！初步识别出 ${response.elements.length} 个功能节点。`)
  }
  
  const handleUploadError = () => {
    ElMessage.error('DFD 文件解析失败，请检查文件格式或后端服务。')
  }
  
  // 保存并提交给后端真正计算
  const handleRecalculate = async () => {
    isRecalculating.value = true
    try {
      const res = await fetch('http://localhost:8080/fpa/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsData.value) 
      })
      
      if (res.ok) {
        const updatedData = await res.json()
        metricsData.value = updatedData 
        ElMessage.success('功能点权重与规模已保存并重新计算完毕！')
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
  .section-step { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: rgba(45, 127, 249, 0.12); color: #1f67c7; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; }
  .section-title h3 { margin: 14px 0 8px; color: #1a2e46; font-size: 2rem; }
  .section-title p { margin: 0; color: #5f7086; font-size: 15px; }
  .upload-panel { width: 100%; max-width: 650px; }
  .upload-icon { font-size: 70px; color: #367ee7; }
  
  .dashboard-cards { display: flex; gap: 20px; margin: 24px 0; }
  .data-card { flex: 1; padding: 20px; border-radius: 16px; text-align: center; background: white; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.02);}
  .card-title { font-size: 14px; color: #64748b; margin-bottom: 8px; font-weight: 600;}
  .card-value { font-size: 28px; font-weight: 800; color: #0f172a; }
  .card-value.highlight { color: #3b82f6; font-size: 32px; }
  
  /* 标题栏布局 */
  .table-header-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .table-title {
    color: #334155;
    font-weight: 700;
    font-size: 15px;
  }
  
  .factors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding: 10px 0; }
  .factor-item { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .factor-label { font-size: 13px; color: #475569; font-weight: 600;}
  
  :deep(.el-upload-dragger) { min-height: 250px; border: 1.5px dashed rgba(59, 130, 246, 0.4); border-radius: 22px; background: rgba(255,255,255,0.5); }
  :deep(.el-upload-dragger:hover) { border-color: #3b82f6; background: rgba(255,255,255,0.8); }
  </style>