<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 class="section-title">历史度量数据</h3>
        <span class="record-count" v-if="historyData.length > 0">共 {{ totalCount }} 条记录</span>
      </div>
      <div class="toolbar-right">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索类名..." 
          clearable 
          @input="handleSearch"
          class="search-input"
          size="default"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
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
      <el-table-column prop="createTime" label="分析时间" width="180">
        <template #default="scope">
          <span class="time-cell">{{ new Date(scope.row.createTime).toLocaleString('zh-CN', { hour12: false }) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="className" label="类名" min-width="200" />
      <el-table-column prop="loc" label="LoC" width="72" align="center" />
      <el-table-column prop="wmc" label="WMC" width="72" align="center" />
      <el-table-column prop="nof" label="NOF" width="72" align="center" />
      <el-table-column prop="dit" label="DIT" width="72" align="center" />
      <el-table-column prop="rfc" label="RFC" width="72" align="center" />
      <el-table-column prop="cbo" label="CBO" width="72" align="center" />
      <el-table-column prop="lcom" label="LCOM" width="80" align="center" />
      <el-table-column prop="noc" label="NOC" width="72" align="center" />
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
const pageSize = ref(12)
const loading = ref(false)

const headerStyle = () => ({
  background: '#f4f6f9',
  color: '#374151',
  fontWeight: '600',
  fontSize: '0.82rem',
  borderColor: '#e5e7eb',
})

const filteredData = computed(() => {
  if (!searchQuery.value) return historyData.value
  const q = searchQuery.value.toLowerCase()
  return historyData.value.filter(item => item.className?.toLowerCase().includes(q))
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const totalCount = computed(() => filteredData.value.length)

const handleSearch = () => { currentPage.value = 1 }

const fetchHistoryData = () => {
  loading.value = true
  fetch('http://localhost:8080/metrics/history')
    .then(res => res.json())
    .then(data => {
      historyData.value = data
      ElMessage({ message: `已加载 ${data.length} 条历史记录`, type: 'success', duration: 2000 })
    })
    .catch(() => ElMessage.error('获取历史数据失败，请检查后端服务'))
    .finally(() => { loading.value = false })
}

onMounted(() => fetchHistoryData())
defineExpose({ fetchHistoryData })
</script>

<style scoped>
/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.record-count {
  font-size: 0.75rem;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

.search-input {
  width: 240px;
}

/* Table */
.metrics-table { border-radius: 6px; overflow: hidden; }

:deep(.el-table td.el-table__cell) {
  border-color: #f0f2f5;
  font-size: 0.82rem;
  color: #374151;
}

.time-cell {
  color: #6b7280;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  padding: 13px 0;
}

/* Pagination */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.pagination-info {
  font-size: 0.75rem;
  color: #94a3b8;
}

:deep(.el-pagination.is-background .el-pager li) {
  min-width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 6px;
  font-size: 0.8rem;
  margin: 0 2px;
  transition: all 0.2s ease;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-active):hover) {
  color: #409eff;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  min-width: 30px;
  height: 30px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  color: #409eff;
}

:deep(.el-pagination .el-input__wrapper) {
  border-radius: 6px;
}
</style>