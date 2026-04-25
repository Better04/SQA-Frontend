<template>
    <div class="analysis-section results-panel oom-theme">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="section-title compact">
            <span class="section-step">HISTORY</span>
            <h3>FPA 功能点估算历史记录</h3>
          </div>
          <span class="record-count" v-if="historyData.length > 0">共 {{ totalCount }} 条记录</span>
        </div>
        <div class="toolbar-right">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索项目名称..." 
            clearable 
            @input="handleSearch"
            class="search-input"
            size="default"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="fetchHistoryData" :icon="RefreshRight" plain>
            刷新数据
          </el-button>
        </div>
      </div>
      
      <el-table 
        :data="paginatedData" 
        border 
        stripe 
        style="width: 100%"
        :header-cell-style="headerStyle"
        class="metrics-table"
        v-loading="loading"
      >
        <el-table-column prop="createTime" label="估算时间" width="200">
          <template #default="scope">
            <span class="time-cell">{{ new Date(scope.row.createTime).toLocaleString('zh-CN', { hour12: false }) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="模型文件名称 (Project Name)" min-width="250" />
        
        <el-table-column prop="ufp" label="未调整功能点 (UFP)" width="180" align="center">
          <template #default="scope">
            <el-tag type="info" effect="plain">{{ scope.row.ufp }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="vaf" label="值调整因子 (VAF)" width="180" align="center">
          <template #default="scope">
            {{ scope.row.vaf ? scope.row.vaf.toFixed(2) : '0.65' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="fp" label="最终功能点 (FP)" width="180" align="center">
          <template #default="scope">
            <strong style="color: #2f8f5e; font-size: 16px;">
              {{ scope.row.fp ? scope.row.fp.toFixed(2) : '0.00' }}
            </strong>
          </template>
        </el-table-column>
      </el-table>
  
      <div class="pagination-bar">
        <span class="pagination-info">
          第 {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalCount) }} 条，共 {{ totalCount }} 条
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          layout="prev, pager, next, jumper"
          background
          size="small"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search, RefreshRight } from '@element-plus/icons-vue'
  
  const historyData = ref([])
  const searchQuery = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  
  const headerStyle = () => ({
    background: '#f4f6f9',
    color: '#374151',
    fontWeight: '600',
    fontSize: '0.85rem',
    borderColor: '#e5e7eb',
  })
  
  const filteredData = computed(() => {
    if (!searchQuery.value) return historyData.value
    const q = searchQuery.value.toLowerCase()
    return historyData.value.filter(item => item.projectName?.toLowerCase().includes(q))
  })
  
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredData.value.slice(start, start + pageSize.value)
  })
  
  const totalCount = computed(() => filteredData.value.length)
  
  const handleSearch = () => { currentPage.value = 1 }
  
  const fetchHistoryData = () => {
    loading.value = true
    fetch('http://localhost:8080/fpa/history')
      .then(res => res.json())
      .then(data => {
        historyData.value = data
        ElMessage({ message: `已加载 ${data.length} 条 FPA 历史记录`, type: 'success', duration: 2000 })
      })
      .catch(() => ElMessage.error('获取历史数据失败，请检查后端服务'))
      .finally(() => { loading.value = false })
  }
  
  onMounted(() => fetchHistoryData())
  defineExpose({ fetchHistoryData })
  </script>
  
  <style scoped>
  .results-panel {
    border: 1px solid rgba(163, 190, 171, 0.22);
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(246, 250, 247, 0.94));
    box-shadow: 0 18px 42px rgba(39, 74, 47, 0.08);
    padding: 26px;
    min-height: calc(100vh - 160px);
  }
  
  .toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; }
  .toolbar-left { display: flex; align-items: baseline; gap: 16px; }
  .toolbar-right { display: flex; align-items: center; gap: 12px; }
  
  .section-step { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: rgba(61, 171, 115, 0.12); color: #2f8f5e; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 8px;}
  .section-title h3 { margin: 0; color: #203629; font-size: 1.5rem; }
  .record-count { font-size: 0.8rem; color: #647a6b; background: rgba(0,0,0,0.04); padding: 4px 10px; border-radius: 12px; }
  
  .search-input { width: 260px; }
  .metrics-table { border-radius: 8px; overflow: hidden; margin-top: 10px; }
  :deep(.el-table td.el-table__cell) { border-color: #f0f2f5; font-size: 0.85rem; color: #374151; }
  .time-cell { color: #6b7280; font-size: 0.85rem; font-variant-numeric: tabular-nums; }
  
  .pagination-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f2f5; }
  .pagination-info { font-size: 0.8rem; color: #94a3b8; }
  </style>