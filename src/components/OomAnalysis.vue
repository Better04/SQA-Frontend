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

  // 雷达图维度：CBO, NOO, NOC, NOA, DIT, CS
  const indicators = [
    { name: 'CBO', max: getSafeMax('cbo', 10) },
    { name: 'NOO', max: getSafeMax('noo', 10) },
    { name: 'NOC', max: getSafeMax('noc', 5) },
    { name: 'NOA', max: getSafeMax('noa', 10) },
    { name: 'DIT', max: getSafeMax('dit', 5) },
    { name: 'CS', max: getSafeMax('cs', 20) }
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
.upload-area {
  max-width: 600px;
  margin: 40px auto;
  text-align: center;
}

h3 {
  color: #606266;
  margin-bottom: 20px;
}

.table-area {
  margin-top: 40px;
}
</style>