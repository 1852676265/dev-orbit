<template>
  <aside class="sidebar-container">
    <!-- 1. 顶部控制栏 (年份 + 项目筛选) -->
    <div class="filter-header">
      <!-- 第一行：年份与产线快速开关 -->
      <div class="filter-row">
        <n-select
          v-model:value="selectedYear"
          size="small"
          :options="yearOptions"
          class="flex-1"
          placeholder="年份筛选"
        />

        <n-button
          size="small"
          :type="onlyPendingSql ? 'warning' : 'default'"
          secondary
          @click="onlyPendingSql = !onlyPendingSql"
          title="仅看有待发产线 SQL 的任务"
        >
          <template #icon>
            <Database class="icon-small text-amber-400" />
          </template>
          <span>待发 SQL</span>
        </n-button>
      </div>

      <!-- 第二行：所属项目快速下拉 -->
      <div class="filter-row">
        <n-select
          v-model:value="selectedProject"
          size="small"
          :options="projectOptions"
          class="flex-1"
          placeholder="所有所属项目"
          filterable
        />
        <n-button
          v-if="selectedYear !== 'all' || selectedProject !== 'all' || onlyPendingSql"
          size="small"
          quaternary
          @click="resetAllFilters"
          title="重置全部筛选"
        >
          <RotateCcw class="icon-small text-slate-400" />
        </n-button>
      </div>

      <!-- 统计指标与提示 -->
      <div class="filter-stats">
        <span>已匹配: <b class="highlight-num">{{ filteredTasks.length }}</b> / {{ totalTasksCount }} 个任务</span>
        <span class="tip-text">双击定位 · 右键操作</span>
      </div>
    </div>

    <!-- 2. 任务卡片列表 -->
    <div class="task-list-container custom-scrollbar">
      <!-- 空状态 -->
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <Layers class="empty-icon" />
        <p class="empty-title">
          {{ totalTasksCount > 0 ? `当前筛选条件下暂无任务 (已加载 ${totalTasksCount} 个)` : "工作区内暂无任务" }}
        </p>
        <p class="empty-subtitle">
          {{ totalTasksCount > 0 ? "年份或项目过滤排除了任务" : "可点击右上角新建任务创建" }}
        </p>
        <n-button
          v-if="totalTasksCount > 0"
          size="small"
          type="primary"
          secondary
          class="empty-btn"
          @click="resetAllFilters"
        >
          重置全部筛选条件
        </n-button>
      </div>

      <!-- 任务条目卡片 -->
      <div
        v-for="(task, idx) in filteredTasks"
        :key="task.fullPath"
        @click="selectTask(task, idx)"
        @dblclick="$emit('open-in-explorer', task.fullPath)"
        @contextmenu.prevent.stop="$emit('task-contextmenu', $event, task)"
        class="task-card"
        :class="{ 'is-focused': isTaskFocused(task, idx) }"
      >
        <!-- 聚焦微光条 -->
        <div v-if="isTaskFocused(task, idx)" class="active-indicator" />

        <div class="task-main">
          <!-- 状态呼吸灯 -->
          <span
            class="status-dot"
            :class="getStatusDotClass(task.status)"
          />

          <div class="task-meta">
            <!-- 标签行 -->
            <div class="task-tags">
              <n-tag size="tiny" :bordered="false" class="meta-tag">
                {{ task.year }}
              </n-tag>
              <n-tag
                v-if="task.project"
                size="tiny"
                type="info"
                :bordered="false"
                class="meta-tag project-tag"
              >
                {{ task.project }}
              </n-tag>
              <span class="task-date">
                {{ formatTaskDate(task.updatedAt || task.createdAt) }}
              </span>
            </div>

            <!-- 任务标题 -->
            <h3 class="task-title" :title="task.title">
              {{ task.title }}
            </h3>
          </div>
        </div>

        <!-- SQL 标签徽章 -->
        <div class="task-badges">
          <n-tag
            v-if="task.prodPendingCount > 0"
            size="tiny"
            type="warning"
            round
            class="sql-tag-pending"
          >
            <template #icon>
              <Database class="icon-tiny text-amber-400" />
            </template>
            {{ task.prodPendingCount }} 待发
          </n-tag>
          <n-tag
            v-else-if="task.sqlCount > 0"
            size="tiny"
            type="success"
            :bordered="false"
            class="sql-tag-normal"
          >
            <template #icon>
              <Database class="icon-tiny text-teal-400" />
            </template>
            {{ task.sqlCount }} SQL
          </n-tag>
          <span v-else class="no-sql-hint">
            无SQL
          </span>
          <ChevronRight class="arrow-icon" />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { NSelect, NButton, NTag } from 'naive-ui'
import {
  Layers,
  Database,
  RotateCcw,
  ChevronRight
} from 'lucide-vue-next'

const props = defineProps({
  years: { type: Array, default: () => [] },
  projectList: { type: Array, default: () => [] },
  filteredTasks: { type: Array, default: () => [] },
  totalTasksCount: { type: Number, default: 0 },
  focusedTaskIndex: { type: Number, default: 0 },
  currentTask: { type: Object, default: null }
})

const emit = defineEmits([
  'select-task',
  'open-in-explorer',
  'task-contextmenu',
  'project-contextmenu'
])

function isTaskFocused(task, idx) {
  if (props.currentTask && props.currentTask.fullPath) {
    return props.currentTask.fullPath === task.fullPath
  }
  return props.focusedTaskIndex === idx
}

function selectTask(task, idx) {
  emit('select-task', task)
}

const selectedYear = defineModel('selectedYear', { type: String, default: 'all' })
const selectedProject = defineModel('selectedProject', { type: String, default: 'all' })
const onlyPendingSql = defineModel('onlyPendingSql', { type: Boolean, default: false })

const yearOptions = computed(() => {
  const opts = [{ label: '全部年份资产', value: 'all' }]
  for (const y of props.years || []) {
    opts.push({ label: `${y} 年度任务`, value: y })
  }
  return opts
})

const projectOptions = computed(() => {
  const opts = [{ label: '全部所属项目', value: 'all' }]
  for (const p of props.projectList || []) {
    opts.push({
      label: `${p.name} (${p.totalCount})${p.pendingCount > 0 ? ` · ⚠️${p.pendingCount}待发` : ''}`,
      value: p.name
    })
  }
  return opts
})

function resetAllFilters() {
  selectedYear.value = 'all'
  selectedProject.value = 'all'
  onlyPendingSql.value = false
}

function getStatusDotClass(status) {
  if (status === 'archived') return 'status-dot--archived'
  if (status === 'suspended') return 'status-dot--suspended'
  return 'status-dot--active'
}

function formatTaskDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getMonth() + 1}/${d.getDate()}`
  } catch (e) {
    return dateStr
  }
}
</script>

<style scoped>
/* 侧边栏主体容器 */
.sidebar-container {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(13, 17, 26, 0.95);
  overflow: hidden;
  user-select: none;
}
@media (min-width: 768px) {
  .sidebar-container {
    width: 384px;
  }
}

/* 顶部过滤控制区 */
.filter-header {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #94a3b8;
  padding: 2px 2px 0 2px;
}

.highlight-num {
  color: #2dd4bf;
}

.tip-text {
  color: #64748b;
}

/* 任务列表滚动区 */
.task-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 空状态展示 */
.empty-state {
  height: 256px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: #475569;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
}

.empty-subtitle {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.empty-btn {
  margin-top: 14px;
}

/* 单个任务卡片项 */
.task-card {
  position: relative;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.15s ease-in-out;
  color: #cbd5e1;
}

.task-card:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.task-card.is-focused {
  background-color: rgba(19, 78, 74, 0.35);
  border-color: rgba(45, 212, 191, 0.65);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.2);
  color: #ffffff;
}

/* 激活指示光条 */
.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 80%;
  background-color: #2dd4bf;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(45, 212, 191, 0.6);
}

/* 卡片主要内容与状态灯 */
.task-main {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  padding-left: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.status-dot--active {
  background-color: #2dd4bf;
  box-shadow: 0 0 6px rgba(45, 212, 191, 0.6);
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-dot--suspended {
  background-color: #fbbf24;
}

.status-dot--archived {
  background-color: #64748b;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.85); }
}

/* 卡片元信息 */
.task-meta {
  min-width: 0;
  flex: 1;
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.meta-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.project-tag {
  font-weight: 700;
}

.task-date {
  font-size: 10px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.task-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  color: #e2e8f0;
  transition: color 0.15s ease;
}

.task-card:hover .task-title {
  color: #5eead4;
}

.task-card.is-focused .task-title {
  color: #99f6e4;
  font-weight: 700;
}

/* 右侧徽章状态 */
.task-badges {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sql-tag-pending {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: bold;
}

.sql-tag-normal {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.no-sql-hint {
  font-size: 10px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  opacity: 0.6;
}

.arrow-icon {
  width: 14px;
  height: 14px;
  color: #475569;
  transition: color 0.15s ease;
}

.task-card:hover .arrow-icon {
  color: #2dd4bf;
}

.icon-small {
  width: 14px;
  height: 14px;
}

.icon-tiny {
  width: 12px;
  height: 12px;
}
</style>
