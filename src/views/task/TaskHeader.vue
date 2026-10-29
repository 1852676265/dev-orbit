<template>
  <header v-if="task" class="task-header-container">
    <div class="header-main">
      <!-- 属性标签行 -->
      <div class="meta-row">
        <n-tag size="small" type="default" :bordered="false" class="meta-tag">
          {{ task.year }} 年
        </n-tag>
        <n-tag v-if="task.project" size="small" type="info" :bordered="false" class="meta-tag project-tag">
          {{ task.project }}
        </n-tag>
        <n-tag size="small" :type="getStatusTagType(task.status)" :bordered="false">
          {{ getStatusText(task.status) }}
        </n-tag>
        <span class="update-time">
          更新于: {{ formatDetailDate(task.updatedAt || task.createdAt) }}
        </span>
      </div>

      <!-- 任务标题 -->
      <div class="title-row">
        <h2 class="task-title" :title="task.title">
          {{ task.title }}
        </h2>
      </div>

      <!-- 本地路径导航栏 -->
      <div class="path-row">
        <FolderOpen class="icon-small text-teal-400" />
        <span class="path-text" :title="task.fullPath">
          {{ task.fullPath }}
        </span>
      </div>
    </div>

    <!-- 工具操作栏 (系统资源管理器与快捷复制) -->
    <div class="header-actions">
      <n-button
        type="primary"
        secondary
        size="small"
        @click="$emit('open-explorer', task.fullPath)"
        title="在系统资源管理器中打开此任务目录"
      >
        <template #icon>
          <FolderOpen class="icon-small" />
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
          <Copy class="icon-small" />
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

<style scoped>
.task-header-container {
  padding: 14px 20px;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  background-color: var(--app-header-background);
  flex-shrink: 0;
  user-select: none;
}

@media (min-width: 768px) {
  .task-header-container {
    flex-direction: row;
    align-items: flex-start;
  }
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.project-tag {
  font-weight: 700;
}

.update-time {
  font-size: 11px;
  color: var(--app-muted-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-primary-foreground);
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.path-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--app-secondary-foreground);
  overflow: hidden;
}

.path-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 600px;
  user-select: all;
  cursor: text;
  color: var(--app-secondary-foreground);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.icon-small {
  width: 14px;
  height: 14px;
}
</style>
