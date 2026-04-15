<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <h2>软件度量自动化分析平台</h2>
      </el-header>
      
      <el-main class="main-content">
        <el-card>
          <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            
            <el-tab-pane label="Java 源代码分析" name="code">
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

              <div v-if="activeTab === 'code' && tableData.length > 0" class="table-area">
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
                <div id="codeChart" ref="codeChartRef" style="width: 100%; height: 400px; margin-top: 30px;"></div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="设计类图分析 (OOM)" name="design">
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

              <div v-if="activeTab === 'design' && oomData.length > 0" class="table-area">
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
                <div id="oomChart" ref="oomChartRef" style="width: 100%; height: 400px; margin-top: 30px;"></div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="历史度量记录" name="history">
              <h3>数据库历史度量数据</h3>
              <el-button type="primary" @click="fetchHistoryData" style="margin-bottom: 15px;">刷新历史数据</el-button>
              
              <el-table :data="historyData" border stripe style="width: 100%">
                <el-table-column prop="createTime" label="分析时间" width="180">
                  <template #default="scope">
                    {{ new Date(scope.row.createTime).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="className" label="类名 (Class Name)" min-width="150" />
                <el-table-column prop="loc" label="LoC" width="80" align="center" />
                <el-table-column prop="wmc" label="WMC" width="80" align="center" />
                <el-table-column prop="nof" label="NOF" width="80" align="center" />
                <el-table-column prop="dit" label="DIT" width="80" align="center" />
                <el-table-column prop="rfc" label="RFC" width="80" align="center" />
                <el-table-column prop="cbo" label="CBO" width="80" align="center" />
                <el-table-column prop="lcom" label="LCOM" width="80" align="center" />
                <el-table-column prop="noc" label="NOC" width="80" align="center" />
              </el-table>
            </el-tab-pane>

          </el-tabs>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue' 
import * as echarts from 'echarts'

const activeTab = ref('code') 
const tableData = ref([])     
const oomData = ref([])       
const historyData = ref([]) 

const codeChartRef = ref(null)
const oomChartRef = ref(null)

const handleTabClick = (tab) => {
  if (tab.paneName === 'history') {
    fetchHistoryData()
  }
}

const fetchHistoryData = () => {
  fetch('http://localhost:8080/metrics/history')
    .then(res => res.json())
    .then(data => {
      historyData.value = data
    })
    .catch(err => {
      ElMessage.error('获取历史数据失败，请检查后端服务')
    })
}

// 统一的画图方法 (支持配置显示哪些指标)
const renderRadarChart = (containerRef, data, isOom = false) => {
  if (!containerRef) return;
  
  const myChart = echarts.getInstanceByDom(containerRef) || echarts.init(containerRef);

  let totalWmc = 0, totalNof = 0, totalDit = 0, totalRfc = 0, totalCbo = 0, totalLcom = 0, totalNoc = 0;
  data.forEach(item => {
    totalWmc += item.wmc || 0;
    totalNof += item.nof || 0;
    totalDit += item.dit || 0;
    totalRfc += item.rfc || 0;
    totalCbo += item.cbo || 0;
    totalLcom += item.lcom || 0;
    totalNoc += item.noc || 0;
  });
  
  const count = data.length || 1; 
  
  let indicators = [];
  let avgData = [];
  
  if (isOom) {
    indicators = [
      { name: '平均方法数 (WMC)', max: Math.max(10, (totalWmc / count) * 2) },
      { name: '平均属性数 (NOF)', max: Math.max(10, (totalNof / count) * 2) },
      { name: '平均继承深度 (DIT)', max: Math.max(5, (totalDit / count) * 2) },
      { name: '平均耦合度 (CBO)', max: Math.max(10, (totalCbo / count) * 2) },
      { name: '平均子类数量 (NOC)', max: Math.max(5, (totalNoc / count) * 2) }
    ];
    avgData = [(totalWmc/count).toFixed(2), (totalNof/count).toFixed(2), (totalDit/count).toFixed(2), (totalCbo/count).toFixed(2), (totalNoc/count).toFixed(2)];
  } else {
    indicators = [
      { name: '加权方法数 (WMC)', max: Math.max(10, (totalWmc / count) * 2) },
      { name: '字段数 (NOF)', max: Math.max(10, (totalNof / count) * 2) },
      { name: '继承深度 (DIT)', max: Math.max(5, (totalDit / count) * 2) },
      { name: '响应集 (RFC)', max: Math.max(20, (totalRfc / count) * 2) },
      { name: '类间耦合度 (CBO)', max: Math.max(10, (totalCbo / count) * 2) },
      { name: '缺乏内聚度 (LCOM)', max: Math.max(10, (totalLcom / count) * 2) },
      { name: '子类数量 (NOC)', max: Math.max(5, (totalNoc / count) * 2) }
    ];
    avgData = [(totalWmc/count).toFixed(2), (totalNof/count).toFixed(2), (totalDit/count).toFixed(2), (totalRfc/count).toFixed(2), (totalCbo/count).toFixed(2), (totalLcom/count).toFixed(2), (totalNoc/count).toFixed(2)];
  }

  const option = {
    title: { text: isOom ? '设计阶段质量评估' : '系统平均面向对象度量值 (全面CK模型)', left: 'center' },
    tooltip: {}, 
    radar: { indicator: indicators },
    series: [{
      name: '项目平均指标', type: 'radar',
      data: [{
        value: avgData, name: '平均度量值',
        areaStyle: { color: isOom ? 'rgba(103, 194, 58, 0.2)' : 'rgba(64, 158, 255, 0.2)' }, 
        lineStyle: { color: isOom ? '#67C23A' : '#409EFF' },                 
        itemStyle: { color: isOom ? '#67C23A' : '#409EFF' }                  
      }]
    }]
  };
  myChart.setOption(option, true); 
}

// 源码上传成功
const handleUploadSuccess = (response) => {
  tableData.value = response 
  ElMessage.success('源码分析完成！共解析了 ' + response.length + ' 个类文件。')
  nextTick(() => renderRadarChart(codeChartRef.value, response, false))
}

// OOM 上传成功
const handleOomUploadSuccess = (response) => {
  oomData.value = response 
  ElMessage.success('类图解析完成！成功从 OOM 提取了 ' + response.length + ' 个类设计。')
  nextTick(() => renderRadarChart(oomChartRef.value, response, true))
}

const handleUploadError = (error) => {
  console.error(error)
  ElMessage.error('文件上传或解析失败，请检查后端服务。')
}
</script>

<style scoped>
.header {
  background-color: #2c3e50; 
  color: white;
  display: flex;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.main-content { padding: 20px; min-height: calc(100vh - 60px); }
.upload-area { max-width: 600px; margin: 40px auto; text-align: center; }
h3 { color: #606266; margin-bottom: 20px; }
.table-area { margin-top: 40px; }
</style>