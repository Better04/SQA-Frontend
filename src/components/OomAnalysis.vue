<template>
  <div class="upload-area">
    <h3>第一步：上传 PowerDesigner 类图设计文件</h3>
    <el-upload
      class="upload-demo"
      drag
      action="http://localhost:8080/metrics/uploadOom"
      :on-success="handleOomUploadSuccess"
      :on-error="handleUploadError"
      accept=".oom"
    >
      <el-icon class="el-icon--upload" style="color: #67C23A;"><document /></el-icon>
      <div class="el-upload__text">请上传类图设计文件 <em>(.oom格式)</em></div>
      <template #tip>
        <div class="el-upload__tip">用于在设计阶段提前进行质量评估</div>
      </template>
    </el-upload>
  </div>

  <div v-if="oomData.length > 0" class="table-area">
    <el-divider /> <h3>第二步：设计期面向对象度量指标明细</h3>
    <el-table :data="oomData" border stripe style="width: 100%">
      <el-table-column prop="className" label="类名 (Class Name)" min-width="180" />
      <el-table-column prop="wmc" label="方法数量 (WMC)" width="150" align="center" />
      <el-table-column prop="nof" label="属性数量 (NOF)" width="150" align="center" />
      <el-table-column prop="dit" label="继承深度 (DIT)" width="150" align="center" />
      <el-table-column prop="cbo" label="类间耦合度 (CBO)" width="180" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.cbo > 3 ? 'warning' : 'info'">{{ scope.row.cbo }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div ref="oomChartRef" style="width: 100%; height: 400px; margin-top: 30px;"></div>
  </div>
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

  const indicators = [
    { name: '方法数 (WMC)', max: getSafeMax('wmc', 10) },
    { name: '属性数 (NOF)', max: getSafeMax('nof', 10) },
    { name: '继承深度 (DIT)', max: getSafeMax('dit', 5) },
    { name: '耦合度 (CBO)', max: getSafeMax('cbo', 10) }
  ]

  const seriesData = data.map(item => ({
    name: item.className,
    value: [item.wmc, item.nof, item.dit, item.cbo]
  }))

  myChart.setOption({
    title: { text: '设计阶段各组件指标对比', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll', data: data.map(item => item.className) },
    radar: { indicator: indicators, shape: 'circle' },
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