<template>
  <div>
    <h3>数据库历史度量数据</h3>
    
    <div class="operation-bar">
      <el-button type="primary" @click="fetchHistoryData">刷新历史数据</el-button>
      
      <el-input 
        v-model="searchQuery" 
        placeholder="输入类名进行查找..." 
        clearable 
        @input="handleSearch"
        class="search-input"
      />
    </div>
    
    <el-table :data="paginatedData" border stripe style="width: 100%">
      <el-table-column prop="createTime" label="分析时间" width="200">
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
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        layout="total, prev, pager, next, jumper"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 全量后端数据
const historyData = ref([])

// === 新增：分页与搜索状态 ===
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10) // 固定每页 15 条

// === 新增：计算属性 1 - 根据搜索词过滤后的数据 ===
const filteredData = computed(() => {
  if (!searchQuery.value) {
    return historyData.value
  }
  // 忽略大小写进行模糊匹配
  const lowerQuery = searchQuery.value.toLowerCase()
  return historyData.value.filter(item => 
    item.className && item.className.toLowerCase().includes(lowerQuery)
  )
})

// === 新增：计算属性 2 - 当前页需要展示的数据切片 ===
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  // 使用 slice 方法截取当前页的数据
  return filteredData.value.slice(start, end)
})

// === 新增：计算属性 3 - 过滤后的总条数（提供给分页组件） ===
const totalCount = computed(() => {
  return filteredData.value.length
})

// 当用户输入搜索词时，自动重置回第一页
const handleSearch = () => {
  currentPage.value = 1
}

const fetchHistoryData = () => {
  fetch('http://localhost:8080/metrics/history')
    .then(res => res.json())
    .then(data => {
      historyData.value = data
    })
    .catch(() => ElMessage.error('获取历史数据失败，请检查后端服务'))
}

// 组件挂载时自动拉取一次数据
onMounted(() => fetchHistoryData())

// 暴露方法供父组件 App.vue 切换 Tab 时手动调用
defineExpose({ fetchHistoryData })
</script>

<style scoped>
.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.search-input {
  width: 300px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>