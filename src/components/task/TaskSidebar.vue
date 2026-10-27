<template>
  <aside class="w-80 md:w-96 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0D111A]/95 overflow-hidden">
    <!-- 1. 顶部控制栏 (年份 + 项目筛选) -->
    <div class="p-3 border-b border-white/5 space-y-2 bg-black/20">
      <!-- 第一行：年份与产线快速开关 -->
      <div class="flex items-center gap-2">
        <!-- 年份快速下拉 -->
        <n-select
          v-model:value="selectedYear"
          size="small"
          :options="yearOptions"
          class="flex-1"
          placeholder="年份筛选"
        />

        <!-- 待发产线高亮过滤按钮 -->
        <n-button
          size="small"
          :type="onlyPendingSql ? 'warning' : 'default'"
          secondary
          @click="onlyPendingSql = !onlyPendingSql"
          title="仅看有待发产线 SQL 的任务"
        >
          <template #icon>
            <Database class="w-3.5 h-3.5" />
          </template>
          <span>待发 SQL</span>
        </n-button>
      </div>

      <!-- 第二行：所属项目快速下拉 -->
      <div class="flex items-center gap-1.5">
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
          <RotateCcw class="w-3.5 h-3.5 text-slate-400" />
        </n-button>
      </div>

      <!-- 统计指标与提示 -->
      <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5 pt-0.5">
        <span>已匹配: <b class="text-teal-400">{{ filteredTasks.length }}</b> / {{ totalTasksCount }} 个任务</span>
        <span class="text-slate-500">双击定位 · 右键操作</span>
      </div>
    </div>

    <!-- 2. 任务卡片列表 -->
    <div class="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
      <!-- 空状态 -->
      <div
        v-if="filteredTasks.length === 0"
        class="h-64 flex flex-col items-center justify-center text-center p-6"
      >
        <Layers class="w-10 h-10 text-slate-600 mb-3" />
        <p class="text-xs font-medium text-slate-300">
          {{ totalTasksCount > 0 ? `当前筛选条件下暂无任务 (已加载 ${totalTasksCount} 个)` : "工作区内暂无任务" }}
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          {{ totalTasksCount > 0 ? "年份或项目过滤排除了任务" : "可点击右上角新建任务创建" }}
        </p>
        <n-button
          v-if="totalTasksCount > 0"
          size="small"
          type="primary"
          secondary
          class="mt-3.5"
          @click="resetAllFilters"
        >
          重置全部筛选条件
        </n-button>
      </div>

      <!-- 任务条目卡片 -->
      <div
        v-for="(task, idx) in filteredTasks"
        :key="task.fullPath"
        @click="$emit('select-task', idx)"
        @dblclick="$emit('open-in-explorer', task.fullPath)"
        @contextmenu.prevent.stop="$emit('task-contextmenu', $event, task)"
        class="p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative select-none"
        :class="focusedTaskIndex === idx
          ? 'bg-teal-950/40 border-teal-500/70 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/30 text-white'
          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-300'"
      >
        <!-- 聚焦微光条 -->
        <div
          v-if="focusedTaskIndex === idx"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4/5 bg-teal-400 rounded-r shadow-md shadow-teal-400"
        ></div>

        <div class="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 pl-1">
          <!-- 状态呼吸灯 -->
          <div
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="task.status === 'archived'
              ? 'bg-slate-500'
              : (task.status === 'suspended' ? 'bg-amber-400' : 'bg-teal-400 animate-pulse')"
          ></div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono flex-shrink-0 bg-white/10 text-slate-400">
                {{ task.year }}
              </span>
              <span
                v-if="task.project"
                class="px-1.5 py-0.2 rounded text-[10px] font-mono flex-shrink-0 bg-teal-950/60 text-teal-300 border border-teal-800/50 font-bold"
              >
                {{ task.project }}
              </span>
              <span class="text-[10px] text-slate-500 font-mono truncate">
                {{ formatTaskDate(task.updatedAt || task.createdAt) }}
              </span>
            </div>

            <!-- 任务标题 -->
            <h3
              class="text-xs font-semibold leading-snug truncate transition"
              :class="focusedTaskIndex === idx
                ? 'text-teal-200 font-bold'
                : 'text-slate-200 group-hover:text-teal-300'"
              :title="task.title"
            >
              {{ task.title }}
            </h3>
          </div>
        </div>

        <!-- SQL 标签徽章 -->
        <div class="flex-shrink-0 flex items-center gap-1.5">
          <span
            v-if="task.prodPendingCount > 0"
            class="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 shadow-sm bg-amber-950/70 text-amber-300 border border-amber-600/50"
          >
            <Database class="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span>{{ task.prodPendingCount }} 待发</span>
          </span>
          <span
            v-else-if="task.sqlCount > 0"
            class="text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 bg-teal-950/40 text-teal-300/90 border border-teal-800/40"
          >
            <Database class="w-3 h-3 text-teal-400 flex-shrink-0" />
            <span>{{ task.sqlCount }} SQL</span>
          </span>
          <span v-else class="text-[10px] text-slate-500 font-mono opacity-50 hidden sm:inline">
            无SQL
          </span>
          <ChevronRight class="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition" />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { NSelect, NButton } from 'naive-ui'
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
  focusedTaskIndex: { type: Number, default: 0 }
})

const emit = defineEmits([
  'select-task',
  'open-in-explorer',
  'task-contextmenu',
  'project-contextmenu'
])

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
