<template>
  <div class="upload-area">
    <h3>第一步：上传 Java 项目源代码</h3>
    <el-upload
      class="upload-demo"
      drag
      action="http://localhost:8080/metrics/uploadZip"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      accept=".zip"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将 ZIP 源码压缩包拖到此处，或 <em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">请上传包含 .java 文件的 .zip 压缩包</div>
      </template>
    </el-upload>
  </div>

  <div v-if="tableData.length > 0" class="table-area">
    <el-divider /> <h3>第二步：源代码类度量指标明细</h3>
    <el-table :data="tableData" border stripe style="width: 100%">
      <el-table-column type="expand">
        <template #default="props">
          <div style="padding: 10px 30px; background-color: #f8f9fa;">
            <h4>🛠️ 方法级圈复杂度明细</h4>
            <el-table :data="props.row.methods" border size="small" style="width: 80%">
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
    <div ref="codeChartRef" style="width: 100%; height: 400px; margin-top: 30px;"></div>
  </div>
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

  // 雷达图维度：CBO, NOO, NOC, NOA, DIT, CS (满足设计图要求)
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

  // 数据映射：将每个类单独作为一条数据提取并填充到雷达图中，Echarts会自动分配不同颜色区分各类别
  const seriesData = data.map(item => ({
    name: item.className,
    value: [item.cbo, item.noo, item.noc, item.noa, item.dit, item.cs]
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