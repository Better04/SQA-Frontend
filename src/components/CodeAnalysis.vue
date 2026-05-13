<template>
  <section class="analysis-section hero-panel winui-acrylic is-empty" v-if="tableData.length === 0">
    <div class="section-title text-center">
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
        <div class="el-upload__tip" style="text-align: center;">请上传包含 .java 文件的 .zip 压缩包</div>
      </template>
    </el-upload>
  </section>

  <div v-if="tableData.length === 0" class="metrics-intro winui-acrylic-sub">
    <div class="intro-text">
      <h2>为什么我们需要软件度量？</h2>
      <p>
        软件度量（Software Measurement）是现代软件工程中不可或缺的环节。它通过提取代码行数（LoC）、圈复杂度（CC）、类间耦合度（CBO）等量化指标，将抽象的代码质量转化为直观的数据模型。
        <br>
        这不仅有助于开发团队快速定位系统中的“高风险代码”与“坏味道”，能有效指导代码重构、降低后期维护成本，更是保障大型软件系统稳定性与可扩展性的基石。
      </p>
    </div>
    <div class="intro-image">
      <img src="../assets/photo1.jpg" alt="软件度量概念图" />
    </div>
  </div>
  
  <div v-if="tableData.length === 0" class="metrics-intro winui-acrylic-sub">
    <div class="intro-image">
      <img src="../assets/photo2.jpg" alt="软件度量概念图" />
    </div>
    
    <div class="intro-text">
      <h2>CK度量是什么呢？</h2>
      <p>
        CK 度量（Chidamber & Kemerer Metrics Suite）是 1994 年由 Shyam Chidamber 与 Chris Kemerer 提出、专门针对面向对象软件设计的经典类级别复杂度与质量度量体系。
        <br>
        它弥补了传统代码行数（LOC）等指标无法捕捉继承、多态、耦合、内聚等 OO 特性的缺陷，是业界应用最广、学术验证最充分的面向对象度量标准之一。
      </p>
    </div>
  </div>

  <section v-if="tableData.length > 0" class="analysis-section results-panel winui-acrylic">
    <div class="section-title compact" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span class="section-step">STEP 02</span>
        <h3>源代码类度量指标明细</h3>
        <p>支持展开查看方法级圈复杂度，同时展示系统架构复杂度的 3D 地形勘探。</p>
      </div>
      <!-- 触发全屏 3D 图表的按钮 -->
      <el-button type="primary" size="large" @click="dialog3DVisible = true">
        <el-icon style="margin-right: 8px;"><DataAnalysis /></el-icon>
        查看 3D 架构地形图
      </el-button>
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
      
      <el-table-column prop="overrideMetric" label="重写指标" width="120" align="center">
        <template #default="scope">
          {{ scope.row.overrideMetric != null ? scope.row.overrideMetric.toFixed(2) : '0.00' }}
        </template>
      </el-table-column>
      <el-table-column prop="overloadMetric" label="重载指标" width="120" align="center">
        <template #default="scope">
          {{ scope.row.overloadMetric != null ? scope.row.overloadMetric.toFixed(2) : '0.00' }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 解决只有一半的问题：添加了 append-to-body 属性 -->
    <el-dialog
      v-model="dialog3DVisible"
      title="🌌 系统架构复杂度 3D 地形勘探"
      fullscreen
      append-to-body
      @opened="init3DChart"
      @closed="dispose3DChart"
      destroy-on-close
    >
      <p style="color: #64748b; margin-top: 0;">拖拽旋转 / 滚轮缩放，红色“山峰”区域即为高风险、高耦合代码区</p>
      <div ref="codeChartRef" style="width: 100%; height: calc(100vh - 120px);"></div>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import 'echarts-gl'

const tableData = ref([])
const codeChartRef = ref(null)
const dialog3DVisible = ref(false)
const myChartInstance = shallowRef(null)

const renderSurfaceChart = (containerRef, classData) => {
  if (!containerRef || !classData || classData.length === 0) return
  const myChart = echarts.getInstanceByDom(containerRef) || echarts.init(containerRef)
  myChartInstance.value = myChart

  const topClasses = [...classData]
    .sort((a, b) => {
      const sumB = (b.wmc||0) + (b.cbo||0) + (b.rfc||0) + (b.lcom||0)
      const sumA = (a.wmc||0) + (a.cbo||0) + (a.rfc||0) + (a.lcom||0)
      return sumB - sumA
    })
    .slice(0, 15)

  const classNames = topClasses.map(item => item.className.split('.').pop())
  const metrics = ['WMC (方法)', 'NOF (属性)', 'DIT (继承)', 'RFC (响应)', 'CBO (耦合)', 'LCOM (内聚缺乏)'];

  // 动态计算最大值，确保红色山峰一定会出现
  let maxZValue = 0;

  const data3D = [];
  topClasses.forEach((cls, xIndex) => {
    // 提取当前类的各项指标
    const vals = [
      cls.wmc || 0, cls.nof || 0, cls.dit || 0, 
      cls.rfc || 0, cls.cbo || 0, cls.lcom || 0
    ];
    
    // 更新最大值记录
    const localMax = Math.max(...vals);
    if (localMax > maxZValue) maxZValue = localMax;

    // 推入 3D 坐标数组
    vals.forEach((val, yIndex) => {
      data3D.push([xIndex, yIndex, val]);
    });
  });

  // 如果数据全为空，给个保底值防止报错
  if (maxZValue === 0) maxZValue = 1;

  const option = {
    tooltip: {
      formatter: function (params) {
        const clsName = classNames[params.value[0]];
        const metricName = metrics[params.value[1]];
        const value = params.value[2];
        return `<div style="padding: 4px;">
                  <b style="color:#38bdf8;">${clsName}</b><br/>
                  ${metricName}: <b style="color:#f87171; font-size:16px;">${value}</b>
                </div>`;
      },
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      borderColor: '#38bdf8',
      textStyle: { color: '#fff' }
    },
    visualMap: {
      show: false,
      min: 0,
      // 使用动态计算出的最大值，山顶一定会被染成红色
      max: maxZValue, 
      inRange: {
        color: [
          '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
          '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
        ]
      }
    },
    xAxis3D: { 
      type: 'category', 
      data: classNames, 
      name: '', 
      axisLabel: { color: '#64748b', fontSize: 11, interval: 0, rotate: 30 } 
    },
    yAxis3D: { 
      type: 'category', 
      data: metrics, 
      name: '', 
      axisLabel: { color: '#64748b', fontSize: 11 } 
    },
    zAxis3D: { 
      type: 'value', 
      name: '风险数值', 
      axisLabel: { color: '#94a3b8' } 
    },
    grid3D: {
      boxWidth: 260, 
      boxDepth: 140,
      boxHeight: 90, // 调高一点，山峰显得更挺拔
      viewControl: {
        projection: 'perspective',
        autoRotate: true,
        autoRotateSpeed: 15,
        distance: 160, // 解决视角问题：大幅调近相机距离（原为 280）
        alpha: 30,     // 稍微放平视角，更容易看清侧面高度
        beta: 40
      },
      light: {
        main: { intensity: 1.5, shadow: true, alpha: 30 },
        ambient: { intensity: 0.4 }
      }
    },
    series: [{
      type: 'surface',
      data: data3D,
      shading: 'lambert',
      wireframe: {
        show: true,
        lineStyle: { color: 'rgba(255, 255, 255, 0.4)', width: 1 }
      },
      itemStyle: {
        opacity: 0.85
      }
    }]
  };

  myChart.setOption(option, true)
}

const init3DChart = () => {
  if (codeChartRef.value) {
    renderSurfaceChart(codeChartRef.value, tableData.value)
    window.addEventListener('resize', handleResize)
  }
}

const dispose3DChart = () => {
  if (myChartInstance.value) {
    myChartInstance.value.dispose()
    myChartInstance.value = null
  }
  window.removeEventListener('resize', handleResize)
}

const handleResize = () => {
  if (myChartInstance.value) {
    myChartInstance.value.resize()
  }
}

const handleUploadSuccess = (response) => {
  tableData.value = response
  ElMessage.success(`源码分析完成！共解析了 ${response.length} 个类文件。`)
}

const handleUploadError = () => ElMessage.error('文件上传或解析失败，请检查后端服务。')
</script>

<style scoped>
.analysis-section + .analysis-section {
  margin-top: 28px;
}

.winui-acrylic {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  box-shadow: 0 12px 36px rgba(31, 48, 78, 0.08);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.hero-panel { padding: 28px; }

.hero-panel.is-empty {
  max-width: 900px; margin: 40px auto; display: flex; flex-direction: column; align-items: center; padding: 40px 48px;
}

.text-center { text-align: center; display: flex; flex-direction: column; align-items: center; }

.results-panel { padding: 26px; }

.section-title { margin-bottom: 24px; }
.section-title.compact { margin-bottom: 18px; }

.section-step {
  display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px;
  background: rgba(45, 127, 249, 0.12); color: #1f67c7; font-size: 12px; font-weight: 800; letter-spacing: 0.16em;
}

.section-title h3 { margin: 14px 0 8px; color: #1a2e46; font-size: 2rem; line-height: 1.2; }
.section-title p { margin: 0; color: #5f7086; font-size: 15px; }
.upload-panel { width: 100%; }
.hero-panel.is-empty .upload-panel { max-width: 650px; }

.metrics-intro { display: flex; align-items: center; justify-content: space-between; margin-top: 36px; padding: 40px 32px; gap: 32px; width: 100%; }
.winui-acrylic-sub { background: rgba(255, 255, 255, 0.55); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03); }
.intro-text { flex: 1; }
.intro-text h4 { margin: 0 0 12px 0; font-size: 1.25rem; color: #2b4566; font-weight: 700; }
.intro-text p { margin: 0; color: #5d6c80; font-size: 1.15rem; line-height: 1.7; text-align: justify; }
.intro-image { flex-shrink: 0; width: 400px; height: 280px; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
.intro-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.intro-image:hover img { transform: scale(1.05); }

.upload-icon { font-size: 70px; color: #367ee7; }
.metrics-table { margin-top: 8px; }

.method-panel { padding: 18px 24px; border-radius: 18px; background: linear-gradient(180deg, #f7fbff, #eef5fd); }
.method-panel h4 { margin: 0 0 12px; color: #23364d; font-size: 18px; }
.method-table { width: 100%; }

:deep(.el-upload-dragger) {
  min-height: 250px; border: 1.5px dashed rgba(53, 125, 231, 0.4); border-radius: 22px; background: rgba(255, 255, 255, 0.3); transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
:deep(.el-upload-dragger:hover) { transform: translateY(-2px); border-color: #2f7ef7; box-shadow: 0 18px 36px rgba(47, 126, 247, 0.12); background: rgba(255, 255, 255, 0.6); }
:deep(.el-upload__text) { margin-top: 10px; color: #54657b; font-size: 17px; }
:deep(.el-upload__text em) { color: #1f76f2; font-style: normal; font-weight: 700; }
:deep(.el-upload__tip) { color: #71839a; font-size: 14px; }
:deep(.el-divider) { display: none; }

:deep(.el-table) { border-radius: 18px; overflow: hidden; --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; }
:deep(.el-table th.el-table__cell) { background: rgba(240, 246, 255, 0.6); color: #718096; font-size: 15px; font-weight: 700; }
:deep(.el-table td.el-table__cell) { color: #31465d; }
:deep(.el-table--border::before), :deep(.el-table--border::after), :deep(.el-table__inner-wrapper::before) { display: none; }

@media (max-width: 768px) {
  .hero-panel.is-empty { margin: 16px; padding: 24px 16px; }
  .metrics-intro { flex-direction: column; padding: 20px; gap: 20px; }
  .intro-image { width: 100%; height: auto; }
  .section-title h3 { font-size: 1.55rem; }
}
</style>