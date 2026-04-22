<template>
  <section class="analysis-section hero-panel oom-theme">
    <div class="section-title">
      <span class="section-step">STEP 01</span>
      <h3>上传 PowerDesigner 类图设计文件</h3>
      <p>在设计阶段提前评估类间关系、继承深度和规模指标，尽早发现结构风险。</p>
    </div>
    <el-upload
      class="upload-demo upload-panel"
      drag
      action="http://localhost:8080/metrics/uploadOom"
      :on-success="handleOomUploadSuccess"
      :on-error="handleUploadError"
      accept=".oom"
    >
      <el-icon class="el-icon--upload upload-icon"><document /></el-icon>
      <div class="el-upload__text">请上传类图设计文件 <em>(.oom格式)</em></div>
      <template #tip>
        <div class="el-upload__tip">用于在设计阶段提前进行质量评估</div>
      </template>
    </el-upload>
  </section>

  <section v-if="oomData.length > 0" class="analysis-section results-panel oom-theme">
    <div class="section-title compact">
      <span class="section-step">STEP 02</span>
      <h3>设计期面向对象度量指标明细</h3>
      <p>从类图中提取核心结构指标，并用雷达图聚焦高风险或高复杂度对象。</p>
    </div>
    <el-table :data="oomData" border stripe class="metrics-table">
      <el-table-column prop="className" label="类名 (Class Name)" min-width="180" />
      <el-table-column prop="wmc" label="方法数量 (WMC)" width="150" align="center" />
      <el-table-column prop="nof" label="属性数量 (NOF)" width="150" align="center" />
      <el-table-column prop="dit" label="继承深度 (DIT)" width="150" align="center" />
      <el-table-column prop="cbo" label="类间耦合度 (CBO)" width="150" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.cbo > 3 ? 'warning' : 'info'">{{ scope.row.cbo }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="noc" label="子类数量 (NOC)" width="150" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.noc > 0 ? 'success' : 'info'">{{ scope.row.noc }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h4>设计类雷达图</h4>
          <p>对 CBO、NOO、NOC、NOA、DIT、CS 六维指标进行集中展示。</p>
        </div>
      </div>
      <div ref="oomChartRef" class="chart-box"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const oomData = ref([])
const oomChartRef = ref(null)

const renderRadarChart = (containerRef, data) => {
  if (!containerRef || !data.length) return
  const myChart = echarts.getInstanceByDom(containerRef) || echarts.init(containerRef)
  
  const getSafeMax = (key, defaultMax) => {
    const maxVal = Math.max(...data.map(item => item[key] || 0))
    return maxVal > 0 ? maxVal * 1.2 : defaultMax
  }

  // 雷达图维度：CBO, NOO, NOC, NOA, DIT, CS
  const indicators = [
    { name: 'CBO', max: getSafeMax('cbo', 8) },
    { name: 'NOO', max: getSafeMax('noo', 8) },
    { name: 'NOC', max: getSafeMax('noc', 4) },
    { name: 'NOA', max: getSafeMax('noa', 8) },
    { name: 'DIT', max: getSafeMax('dit', 4) },
    { name: 'CS', max: getSafeMax('cs', 15) }
  ]

  // 根据 6 个指标的总和，计算综合排名前 10 的类名，其余的类默认隐藏以防图形杂乱
  const top10Names = [...data]
    .sort((a, b) => {
      const sumB = (b.cbo || 0) + (b.noo || 0) + (b.noc || 0) + (b.noa || 0) + (b.dit || 0) + (b.cs || 0)
      const sumA = (a.cbo || 0) + (a.noo || 0) + (a.noc || 0) + (a.noa || 0) + (a.dit || 0) + (a.cs || 0)
      return sumB - sumA
    })
    .slice(0, 10)
    .map(item => item.className)

  const legendSelected = {}
  data.forEach(item => {
    legendSelected[item.className] = top10Names.includes(item.className)
  })

  // 数据映射：将每个组件类单独提取，利用Echarts特性以不同颜色绘制雷达范围网
  const seriesData = data.map(item => ({
    name: item.className,
    value: [item.cbo, item.noo, item.noc, item.noa, item.dit, item.cs]
  }))

  myChart.setOption({
    title: { text: '设计阶段各组件指标对比', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { 
      bottom: 0, 
      type: 'scroll', 
      data: data.map(item => item.className),
      selected: legendSelected, // 绑定选中状态
      inactiveColor: '#909399'  // 提高未选中图例的颜色明度
    },
    radar: { indicator: indicators, shape: 'polygon' },
    series: [{ name: '类度量对比', type: 'radar', data: seriesData }]
  }, true)
}

const handleOomUploadSuccess = (response) => {
  oomData.value = response
  ElMessage.success(`类图解析完成！成功从 OOM 提取了 ${response.length} 个类设计。`)
  nextTick(() => renderRadarChart(oomChartRef.value, response))
}

const handleUploadError = () => ElMessage.error('文件上传或解析失败，请检查后端服务。')
</script>

<style scoped>
.analysis-section + .analysis-section {
  margin-top: 28px;
}

.hero-panel,
.results-panel {
  border: 1px solid rgba(163, 190, 171, 0.22);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(246, 250, 247, 0.94));
  box-shadow: 0 18px 42px rgba(39, 74, 47, 0.08);
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
  background: rgba(61, 171, 115, 0.12);
  color: #2f8f5e;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.section-title h3 {
  margin: 14px 0 8px;
  color: #203629;
  font-size: 2rem;
  line-height: 1.2;
}

.section-title p {
  margin: 0;
  color: #647a6b;
  font-size: 15px;
}

.upload-panel {
  width: 100%;
}

.upload-icon {
  font-size: 70px;
  color: #4ea86f;
}

.metrics-table {
  margin-top: 8px;
}

.chart-card {
  margin-top: 24px;
  padding: 22px 22px 14px;
  border: 1px solid rgba(167, 197, 174, 0.26);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(248, 252, 248, 0.98), rgba(240, 248, 241, 0.98));
}

.chart-header h4 {
  margin: 0 0 8px;
  color: #25402f;
  font-size: 18px;
}

.chart-header p {
  margin: 0;
  color: #6d8474;
  font-size: 14px;
}

.chart-box {
  width: 100%;
  height: 420px;
  margin-top: 10px;
}

:deep(.el-upload-dragger) {
  min-height: 250px;
  border: 1.5px dashed rgba(78, 168, 111, 0.56);
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgba(120, 206, 146, 0.12), transparent 52%),
    linear-gradient(180deg, rgba(250, 254, 250, 0.98), rgba(242, 249, 243, 0.98));
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

:deep(.el-upload-dragger:hover) {
  transform: translateY(-2px);
  border-color: #49a86d;
  box-shadow: 0 18px 36px rgba(73, 168, 109, 0.14);
}

:deep(.el-upload__text) {
  margin-top: 10px;
  color: #597262;
  font-size: 17px;
}

:deep(.el-upload__text em) {
  color: #2f8f5e;
  font-style: normal;
  font-weight: 700;
}

:deep(.el-upload__tip) {
  color: #73897a;
  font-size: 14px;
}

:deep(.el-divider) {
  display: none;
}

:deep(.el-table) {
  border-radius: 18px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background: linear-gradient(180deg, #f6fbf6, #edf6ee);
  color: #718072;
  font-size: 15px;
  font-weight: 700;
}

:deep(.el-table td.el-table__cell) {
  color: #314f3a;
}

:deep(.el-table--border::before),
:deep(.el-table--border::after),
:deep(.el-table__inner-wrapper::before) {
  display: none;
}

@media (max-width: 768px) {
  .hero-panel,
  .results-panel {
    padding: 18px 16px;
    border-radius: 20px;
  }

  .section-title h3 {
    font-size: 1.55rem;
  }

  .chart-card {
    padding: 16px 16px 10px;
  }

  .chart-box {
    height: 360px;
  }
}
</style>
