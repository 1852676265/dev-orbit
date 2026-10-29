<template>
  <aside class="sidebar-container glass-island">
    <!-- 1. 顶部控制栏 (年份 + 项目筛选 + 待发SQL筛选) -->
    <div class="filter-header">
      <!-- 第一行：年份与所属项目下拉 -->
      <div class="filter-row">
        <n-select
          v-model:value="selectedYear"
          size="small"
          :options="yearOptions"
          class="flex-1"
          placeholder="年份筛选"
        />
        <n-select
          v-model:value="selectedProject"
          size="small"
          :options="projectOptions"
          class="flex-1"
          placeholder="所有所属项目"
          filterable
        />
      </div>

      <!-- 第二行：操作按钮行（新建任务 + 待发 SQL 跨任务合并） -->
      <div class="filter-row sidebar-action-row">
        <n-button
          v-if="totalPendingSqls > 0"
          type="warning"
          secondary
          size="small"
          class="pending-merge-btn flex-1"
          title="点击打开跨任务 SQL 一键合并总单"
          @click="$emit('open-cross-merge')"
        >
          <template #icon>
            <Database class="icon-tiny text-amber-400" />
          </template>
          <span>{{ totalPendingSqls }} 待发 SQL · 合并</span>
        </n-button>

        <n-button
          type="primary"
          size="small"
          class="new-task-btn"
          :class="{ 'flex-1': totalPendingSqls > 0, 'w-full': totalPendingSqls === 0 }"
          @click="$emit('open-new-task')"
          title="新建研发任务脚手架"
        >
          <template #icon>
            <Plus class="icon-small" />
          </template>
          <span>新建任务</span>
        </n-button>
      </div>

      <!-- 第三行：待发 SQL 筛选 + 重置 -->
      <div class="filter-row">
        <n-button
          size="tiny"
          :type="onlyPendingSql ? 'warning' : 'default'"
          secondary
          @click="onlyPendingSql = !onlyPendingSql"
          title="仅看有待发产线 SQL 的任务"
        >
          <template #icon>
            <Database class="icon-tiny text-amber-400" />
          </template>
          <span>仅看待发 SQL</span>
        </n-button>

        <n-button
          v-if="selectedYear !== 'all' || selectedProject !== 'all' || onlyPendingSql"
          size="tiny"
          quaternary
          @click="resetAllFilters"
          title="重置全部筛选"
        >
          <RotateCcw class="icon-tiny text-slate-400" />
        </n-button>

        <span class="match-count-text">
          匹配 <b class="highlight-num">{{ filteredTasks.length }}</b>/{{ totalTasksCount }}
        </span>
      </div>
    </div>

    <!-- 2. 按状态分组的任务列表 (方案 6 Spotlight 风格) -->
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

      <!-- 按状态分组渲染 (进行中 / 挂起延期 / 已上线归档) -->
      <template v-else>
        <div
          v-for="group in groupedTasks"
          :key="group.status"
          class="status-group-block"
        >
          <div class="group-section-title">
            <span>{{ group.label }} · {{ group.items.length }}</span>
          </div>

          <div
            v-for="item in group.items"
            :key="item.task.fullPath"
            @click="selectTask(item.task, item.idx)"
            @dblclick="$emit('open-in-explorer', item.task.fullPath)"
            @contextmenu.prevent.stop="$emit('task-contextmenu', $event, item.task)"
            class="task-card"
            :class="{ 'is-focused': isTaskFocused(item.task, item.idx) }"
          >
            <div v-if="isTaskFocused(item.task, item.idx)" class="active-indicator" />

            <div class="task-main">
              <span
                class="status-dot"
                :class="getStatusDotClass(item.task.status)"
              />

              <div class="task-meta">
                <h3 class="task-title" :title="item.task.title">
                  {{ item.task.title }}
                </h3>
                <div class="task-tags">
                  <span class="sub-meta-text">{{ item.task.year }} · {{ item.task.project || '常规' }}</span>
                  <span v-if="item.task.updatedAt || item.task.createdAt" class="sub-meta-text">
                    · {{ formatTaskDate(item.task.updatedAt || item.task.createdAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- SQL 标签徽章 -->
            <div class="task-badges">
              <n-tag
                v-if="item.task.prodPendingCount > 0"
                size="tiny"
                type="warning"
                round
                class="sql-tag-pending"
              >
                {{ item.task.prodPendingCount }} 待发
              </n-tag>
              <n-tag
                v-else-if="item.task.sqlCount > 0"
                size="tiny"
                type="success"
                :bordered="false"
                class="sql-tag-normal"
              >
                {{ item.task.sqlCount }} SQL
              </n-tag>
            </div>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { NSelect, NButton, NTag } from 'naive-ui'
import {
  RotateCcw,
  Database,
  Layers,
  Plus
} from 'lucide-vue-next'

const props = defineProps({
  years: { type: Array, default: () => [] },
  projectList: { type: Array, default: () => [] },
  filteredTasks: { type: Array, default: () => [] },
  totalTasksCount: { type: Number, default: 0 },
  totalPendingSqls: { type: Number, default: 0 },
  focusedTaskIndex: { type: Number, default: 0 },
  currentTask: { type: Object, default: null }
})

const emit = defineEmits([
  'select-task',
  'open-in-explorer',
  'task-contextmenu',
  'project-contextmenu',
  'open-new-task',
  'open-cross-merge'
])

const STATUS_GROUPS = [
  { status: 'in-progress', label: '进行中' },
  { status: 'suspended', label: '挂起延期' },
  { status: 'archived', label: '已上线归档' }
]

const groupedTasks = computed(() => {
  const buckets = {
    'in-progress': [],
    suspended: [],
    archived: []
  }
  props.filteredTasks.forEach((task, idx) => {
    const st = task.status === 'suspended' || task.status === 'archived' ? task.status : 'in-progress'
    buckets[st].push({ task, idx })
  })
  return STATUS_GROUPS
    .map(g => ({ ...g, items: buckets[g.status] }))
    .filter(g => g.items.length > 0)
})

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
/* 侧边栏主体容器（方案 6 玻璃悬浮岛） */
.sidebar-container {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* 顶部过滤控制区 */
.filter-header {
  padding: 12px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-secondary-background);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-action-row {
  margin-top: 1px;
  gap: 8px;
}

.pending-merge-btn {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  font-size: 11px;
}

.new-task-btn {
  font-weight: 700;
  font-size: 12px;
}

.match-count-text {
  margin-left: auto;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--app-secondary-foreground);
}

.status-group-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.group-section-title {
  padding: 6px 8px 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--app-secondary-foreground);
  letter-spacing: 0.02em;
}

.sub-meta-text {
  font-size: 11px;
  color: var(--app-muted-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.highlight-num {
  color: var(--app-accent-teal);
  font-weight: 700;
}

.tip-text {
  color: var(--app-muted-foreground);
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
  color: var(--app-muted-foreground);
  margin-bottom: 12px;
}

.empty-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-primary-foreground);
}

.empty-subtitle {
  font-size: 11px;
  color: var(--app-muted-foreground);
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
  border: 1px solid var(--app-border);
  background-color: var(--app-card-background);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.15s ease-in-out;
  color: var(--app-secondary-foreground);
}

.task-card:hover {
  background-color: var(--app-list-hover-background);
  border-color: var(--app-card-border);
  color: var(--app-primary-foreground);
}

.task-card.is-focused {
  background-color: var(--app-list-active-background);
  border-color: var(--app-list-active-border);
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.14);
  color: var(--app-list-active-foreground);
}

/* 激活指示光条 */
.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 80%;
  background-color: #14b8a6;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(45, 212, 191, 0.5);
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
  background-color: #14b8a6;
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
  color: var(--app-muted-foreground);
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
  color: var(--app-primary-foreground);
  transition: color 0.15s ease;
}

.task-card:hover .task-title {
  color: var(--app-accent-teal);
}

.task-card.is-focused .task-title {
  color: var(--app-list-active-foreground);
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
  color: var(--app-muted-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  opacity: 0.6;
}

.arrow-icon {
  width: 14px;
  height: 14px;
  color: var(--app-muted-foreground);
  transition: color 0.15s ease;
}

.task-card:hover .arrow-icon {
  color: var(--app-accent-teal);
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
