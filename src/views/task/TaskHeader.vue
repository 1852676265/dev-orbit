<template>
  <header
    v-if="task"
    class="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition shadow-sm bg-[#121826]/90 flex-shrink-0 select-none"
  >
    <div class="space-y-1.5 flex-1 min-w-0">
      <!-- 属性标签行 -->
      <div class="flex items-center gap-2 flex-wrap">
        <n-tag size="small" type="default" :bordered="false" class="font-mono">
          {{ task.year }} 年
        </n-tag>
        <n-tag v-if="task.project" size="small" type="info" :bordered="false" class="font-bold">
          {{ task.project }}
        </n-tag>
        <n-tag size="small" :type="getStatusTagType(task.status)" :bordered="false">
          {{ getStatusText(task.status) }}
        </n-tag>
        <span class="text-[11px] text-slate-500 font-mono">
          更新于: {{ formatDetailDate(task.updatedAt || task.createdAt) }}
        </span>
      </div>

      <!-- 任务标题与路径提示 -->
      <div class="flex items-center gap-2 group">
        <h2 class="text-base md:text-lg font-bold text-white tracking-tight truncate" :title="task.title">
          {{ task.title }}
        </h2>
      </div>

      <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400 truncate">
        <FolderOpen class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
        <span class="truncate max-w-xl select-all cursor-text text-slate-300" :title="task.fullPath">
          {{ task.fullPath }}
        </span>
      </div>
    </div>

    <!-- 工具操作栏 (仅保留资源管理器与快捷复制路径) -->
    <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
      <n-button
        type="primary"
        secondary
        size="small"
        @click="$emit('open-explorer', task.fullPath)"
        title="在系统资源管理器中打开此任务目录"
      >
        <template #icon>
          <FolderOpen class="w-3.5 h-3.5" />
        </template>
        <span>打开资源管理器</span>
      </n-button>

      <n-button
        size="small"
        quaternary
        @click="$emit('copy-path', task.fullPath)"
        title="复制此任务的本地绝对路径"
      >
        <template #icon>
          <Copy class="w-3.5 h-3.5" />
        </template>
        <span>复制路径</span>
      </n-button>
    </div>
  </header>
</template>

<script setup>
import { NTag, NButton } from 'naive-ui'
import { FolderOpen, Copy } from 'lucide-vue-next'

const props = defineProps({
  task: { type: Object, default: null }
})

defineEmits(['open-explorer', 'copy-path'])

function getStatusTagType(status) {
  switch (status) {
    case 'in-progress': return 'primary'
    case 'archived': return 'default'
    case 'suspended': return 'warning'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'in-progress': return '进行中'
    case 'archived': return '已上线归档'
    case 'suspended': return '挂起延期'
    default: return '未归类'
  }
}

function formatDetailDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch (e) {
    return dateStr
  }
}
</script>
