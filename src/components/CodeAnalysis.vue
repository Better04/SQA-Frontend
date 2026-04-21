<template>
  <section class="analysis-section hero-panel">
    <div class="section-title">
      <span class="section-step">STEP 01</span>
      <h3>上传 Java 项目源代码</h3>
      <p>导入源码压缩包后，系统会自动完成类级与方法级度量分析。</p>
    </div>
    <el-upload
      class="upload-demo upload-panel"
      drag
      action="http://localhost:8080/metrics/uploadZip"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      accept=".zip"
    >
      <el-icon class="el-icon--upload upload-icon"><upload-filled /></el-icon>
      <div class="el-upload__text">将 ZIP 源码压缩包拖到此处，或 <em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">请上传包含 .java 文件的 .zip 压缩包</div>
      </template>
    </el-upload>
  </section>

  <section v-if="tableData.length > 0" class="analysis-section results-panel">
    <div class="section-title compact">
      <span class="section-step">STEP 02</span>
      <h3>源代码类度量指标明细</h3>
      <p>支持展开查看方法级圈复杂度，同时展示项目内重点类的雷达图对比。</p>
    </div>
    <el-table :data="tableData" border stripe class="metrics-table">
      <el-table-column type="expand">
        <template #default="props">
          <div class="method-panel">
            <h4>🛠️ 方法级圈复杂度明细</h4>
            <el-table :data="props.row.methods" border size="small" class="method-table">
              <el-table-column prop="methodName" label="方法名称" />
              <el-table-column prop="parameterCount" label="参数个数" width="120" align="center" />
              <el-table-column prop="complexity" label="圈复杂度" width="150" align="center">
                <template #default="scope">
                  <el-tag :type="scope.row.complexity > 5 ? 'danger' : 'success'">{{ scope.row.complexity }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="className" label="类名 (Class Name)" min-width="180" />
      <el-table-column prop="loc" label="代码行数 (LoC)" width="120" align="center" />
      <el-table-column prop="wmc" label="加权方法数 (WMC)" width="140" align="center" />
      <el-table-column prop="nof" label="字段数量 (NOF)" width="120" align="center" />
      <el-table-column prop="dit" label="继承深度 (DIT)" width="120" align="center" />
      <el-table-column prop="rfc" label="响应集 (RFC)" width="120" align="center" />
      <el-table-column prop="cbo" label="类间耦合度 (CBO)" width="140" align="center" />
      <el-table-column prop="lcom" label="缺乏内聚度 (LCOM)" width="150" align="center" />
      <el-table-column prop="noc" label="子类数量 (NOC)" width="130" align="center" />
    </el-table>

    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h4>类度量雷达图</h4>
          <p>默认展示综合指标较高的类，避免图形过度拥挤。</p>
        </div>
      </div>
      <div ref="codeChartRef" class="chart-box"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const tableData = ref([])
const codeChartRef = ref(null)

const renderRadarChart = (containerRef, data) => {
  if (!containerRef || !data.length) return
  const myChart = echarts.getInstanceByDom(containerRef) || echarts.init(containerRef)

  const getSafeMax = (key, defaultMax) => {
    const maxVal = Math.max(...data.map(item => item[key] || 0))
    return maxVal > 0 ? maxVal * 1.2 : defaultMax
  }

  // 雷达图维度：CBO, NOO, NOC, NOA, DIT, CS, LCOM（七维）
  const indicators = [
    { name: 'CBO', max: getSafeMax('cbo', 10) },
    { name: 'NOO', max: getSafeMax('noo', 10) },
    { name: 'NOC', max: getSafeMax('noc', 5) },
    { name: 'NOA', max: getSafeMax('noa', 10) },
    { name: 'DIT', max: getSafeMax('dit', 5) },
    { name: 'CS',  max: getSafeMax('cs', 20) },
    { name: 'LCOM', max: getSafeMax('lcom', 20) }
  ]

  // 根据 6 个指标的总和，计算综合排名前 10 的类名，其余的类默认隐藏以防图形杂乱
  const top10Names = [...data]
    .sort((a, b) => {
      const sumB = (b.cbo || 0) + (b.noo || 0) + (b.noc || 0) + (b.noa || 0) + (b.dit || 0) + (b.cs || 0) + (b.lcom || 0)
      const sumA = (a.cbo || 0) + (a.noo || 0) + (a.noc || 0) + (a.noa || 0) + (a.dit || 0) + (a.cs || 0) + (a.lcom || 0)
      return sumB - sumA
    })
    .slice(0, 10)
    .map(item => item.className)

  const legendSelected = {}
  data.forEach(item => {
    legendSelected[item.className] = top10Names.includes(item.className)
  })

  // 数据映射：将每个类单独作为一条数据提取并填充到雷达图中，Echarts会自动分配不同颜色区分各类别
  const seriesData = data.map(item => ({
    name: item.className,
    value: [item.cbo, item.noo, item.noc, item.noa, item.dit, item.cs, item.lcom]
  }))

  myChart.setOption({
    title: { text: '源代码各模块指标对比', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { 
      bottom: 0, 
      type: 'scroll', 
      data: data.map(item => item.className),
      selected: legendSelected, // 应用显隐配置
      inactiveColor: '#909399'  // 提高未选中图例的文字对比度
    },
    radar: { indicator: indicators, shape: 'polygon' },
    series: [{ name: '类度量对比', type: 'radar', data: seriesData }]
  }, true)
}

const handleUploadSuccess = (response) => {
  tableData.value = response
  ElMessage.success(`源码分析完成！共解析了 ${response.length} 个类文件。`)
  nextTick(() => renderRadarChart(codeChartRef.value, response))
}

const handleUploadError = () => ElMessage.error('文件上传或解析失败，请检查后端服务。')
</script>

<style scoped>
.analysis-section + .analysis-section {
  margin-top: 28px;
}

.hero-panel,
.results-panel {
  border: 1px solid rgba(160, 180, 205, 0.2);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(244, 248, 253, 0.92));
  box-shadow: 0 18px 42px rgba(33, 56, 92, 0.08);
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
  background: rgba(45, 127, 249, 0.12);
  color: #1f67c7;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.section-title h3 {
  margin: 14px 0 8px;
  color: #1a2e46;
  font-size: 2rem;
  line-height: 1.2;
}

.section-title p {
  margin: 0;
  color: #5f7086;
  font-size: 15px;
}

.upload-panel {
  width: 100%;
}

.upload-icon {
  font-size: 70px;
  color: #367ee7;
}

.metrics-table {
  margin-top: 8px;
}

.method-panel {
  padding: 18px 24px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7fbff, #eef5fd);
}

.method-panel h4,
.chart-header h4 {
  margin: 0 0 12px;
  color: #23364d;
  font-size: 18px;
}

.method-table {
  width: 100%;
}

.chart-card {
  margin-top: 24px;
  padding: 22px 22px 14px;
  border: 1px solid rgba(145, 170, 200, 0.22);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(247, 250, 255, 0.96), rgba(240, 246, 255, 0.96));
}

.chart-header p {
  margin: 0;
  color: #6a7a8f;
  font-size: 14px;
}

.chart-box {
  width: 100%;
  height: 420px;
  margin-top: 10px;
}

:deep(.el-upload-dragger) {
  min-height: 250px;
  border: 1.5px dashed rgba(53, 125, 231, 0.52);
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgba(83, 151, 255, 0.12), transparent 50%),
    linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(241, 247, 255, 0.98));
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

:deep(.el-upload-dragger:hover) {
  transform: translateY(-2px);
  border-color: #2f7ef7;
  box-shadow: 0 18px 36px rgba(47, 126, 247, 0.12);
}

:deep(.el-upload__text) {
  margin-top: 10px;
  color: #54657b;
  font-size: 17px;
}

:deep(.el-upload__text em) {
  color: #1f76f2;
  font-style: normal;
  font-weight: 700;
}

:deep(.el-upload__tip) {
  color: #71839a;
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
  background: linear-gradient(180deg, #f7faff, #eef4fb);
  color: #718096;
  font-size: 15px;
  font-weight: 700;
}

:deep(.el-table td.el-table__cell) {
  color: #31465d;
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
