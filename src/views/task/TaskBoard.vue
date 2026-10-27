<template>
  <div class="taskboard-container">
    <!-- 主工作区：左侧边栏 (TaskSidebar) + 右侧行动舱 -->
    <div class="workspace-body">
      <!-- 1. 左侧任务边栏组件 -->
      <TaskSidebar
        v-model:selectedYear="selectedYear"
        v-model:selectedProject="selectedProject"
        v-model:onlyPendingSql="onlyPendingSql"
        :years="props.years"
        :project-list="projectList"
        :filtered-tasks="filteredTasks"
        :total-tasks-count="props.tasks.length"
        :focused-task-index="focusedTaskIndex"
        :current-task="currentTask"
        @select-task="setFocusedTask"
        @open-in-explorer="openInExplorer"
        @task-contextmenu="openTaskContextMenu"
        @project-contextmenu="openProjectContextMenu"
      />

      <!-- 2. 右侧全息行动舱 -->
      <main v-if="currentTask" class="workspace-main">
        <!-- 任务头部组件 -->
        <TaskHeader
          :task="currentTask"
          @open-explorer="openInExplorer"
          @copy-path="copyTaskPath"
        />

        <!-- 标签式工作区 (采用 Naive UI 组件化 n-tabs) -->
        <div class="workspace-tabbar">
          <n-tabs
            :value="activeWorkspaceTab"
            type="line"
            size="small"
            @update:value="switchWorkspaceTab"
          >
            <n-tab name="notes">
              <div class="tab-item-inner">
                <StickyNote class="icon-small text-teal-400" />
                <span>开发备忘与联调参数</span>
                <n-badge
                  :value="notesState.taskNotes.value.length"
                  :max="99"
                  type="info"
                  size="small"
                />
              </div>
            </n-tab>
            <n-tab name="sqls">
              <div class="tab-item-inner">
                <Database class="icon-small text-amber-400" />
                <span>上线 SQL 资产</span>
                <n-tag
                  size="tiny"
                  :type="currentTask.prodPendingCount > 0 ? 'warning' : 'default'"
                  :bordered="false"
                  class="tag-count"
                >
                  {{ currentTask.prodPendingCount > 0 ? `${currentTask.prodPendingCount} 待发` : `${sqlsState.currentSqls.value.length}` }}
                </n-tag>
              </div>
            </n-tab>
            <n-tab name="docs">
              <div class="tab-item-inner">
                <FolderKanban class="icon-small text-blue-400" />
                <span>交付与需求文档</span>
                <n-badge
                  :value="docsState.currentDocs.value.length"
                  :max="99"
                  type="default"
                  size="small"
                />
              </div>
            </n-tab>
          </n-tabs>

          <!-- 保存状态微提示 -->
          <div class="save-status-hint">
            <span v-if="notesState.noteSavedNotice.value" class="saved-badge">
              <span class="saved-dot"></span>
              已保存并同步
            </span>
          </div>
        </div>

        <!-- 标签页主体内容区 -->
        <div class="tab-content-area">
          <!-- Tab 1: 开发备忘与参数速查 -->
          <TaskNotesTab
            v-if="activeWorkspaceTab === 'notes'"
            :notes-state="notesState"
          />

          <!-- Tab 2: 上线 SQL 脚本资产 -->
          <TaskSqlTab
            v-else-if="activeWorkspaceTab === 'sqls'"
            :sqls-state="sqlsState"
            @open-file="openFilePreview"
            @show-in-folder="showInFolder"
            @copy-path="copyTaskPath"
            @sql-contextmenu="openSqlContextMenu"
          />

          <!-- Tab 3: 需求与交付文档资产 -->
          <TaskDocsTab
            v-else-if="activeWorkspaceTab === 'docs'"
            :docs-state="docsState"
            @open-file="openFilePreview"
            @show-in-folder="showInFolder"
            @doc-contextmenu="openDocContextMenu"
          />
        </div>
      </main>

      <!-- 未选中任务空状态 -->
      <div v-else class="empty-selection-state">
        <Layers class="empty-icon" />
        <p class="empty-title">请从左侧选择一个开发任务</p>
        <p class="empty-sub">支持通过 ↑ ↓ 键盘方向键无缝切换查看</p>
      </div>
    </div>

    <!-- 底部状态与快捷键提示行 -->
    <footer class="status-footer">
      <div class="footer-left">
        <span class="system-status">
          <span class="status-dot"></span>
          DevOrbit HUD 就绪
        </span>
        <span class="divider">|</span>
        <span class="task-title-hint">
          {{ currentTask ? currentTask.title : '未选择任务' }}
        </span>
      </div>

      <div class="footer-right">
        <span class="shortcut-hint">↑↓ 切换任务</span>
        <span class="shortcut-hint">Ctrl+E 资源管理器</span>
        <span class="version-tag">⚡ v1.3.0</span>
      </div>
    </footer>

    <!-- 通用文件软件内弹窗编辑器 (免任何外部 IDEA/编辑器) -->
    <FilePreviewModal
      v-model:visible="filePreviewModal.visible"
      :file-path="filePreviewModal.filePath"
      :file-name="filePreviewModal.fileName"
      :initial-edit="filePreviewModal.initialEdit"
      @toast="(msg, type) => emit('toast', msg, type)"
      @file-saved="handleFileSaved"
    />

    <!-- SQL 一键合并弹窗 -->
    <SqlMergeModal
      v-if="sqlsState.sqlMergeModalOpen.value"
      :is-open="sqlsState.sqlMergeModalOpen.value"
      :task="currentTask"
      :sql-list="sqlsState.currentSqls.value"
      @close="sqlsState.sqlMergeModalOpen.value = false"
      @updated="emit('updated')"
      @toast="(msg, type) => emit('toast', msg, type)"
    />

    <!-- 右键上下文菜单 -->
    <TaskContextMenu
      :menu="contextMenu"
      @action="handleContextMenuAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NTabs, NTab, NTag, NBadge } from 'naive-ui'
import { electronApi } from '@/utils/api'

// 子组件引入
import TaskSidebar from './TaskSidebar.vue'
import TaskHeader from './TaskHeader.vue'
import TaskNotesTab from './tabs/TaskNotesTab.vue'
import TaskSqlTab from './tabs/TaskSqlTab.vue'
import TaskDocsTab from './tabs/TaskDocsTab.vue'
import TaskContextMenu from './TaskContextMenu.vue'
import FilePreviewModal from '@/views/modals/FilePreviewModal.vue'
import SqlMergeModal from '@/views/modals/SqlMergeModal.vue'

// 业务逻辑 Hooks 引入
import { useTaskFilter } from '@/utils/taskFilter'
import { useTaskNotes } from '@/utils/taskNotes'
import { useTaskSqls } from '@/utils/taskSqls'
import { useTaskDocs } from '@/utils/taskDocs'

// 图标引入
import {
  Layers,
  StickyNote,
  Database,
  FolderKanban,
  LayoutDashboard
} from 'lucide-vue-next'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  years: { type: Array, default: () => ['2026', '2025'] },
  searchQuery: { type: String, default: '' }
})

const emit = defineEmits(['open-new-task', 'select-task', 'updated', 'toast'])

function emitToast(msg, type = 'info') {
  emit('toast', msg, type)
}

function emitUpdated() {
  emit('updated')
}

// 1. 初始化过滤器逻辑
const {
  selectedYear,
  selectedProject,
  onlyPendingSql,
  focusedTaskIndex,
  projectList,
  filteredTasks,
  currentTask,
  setFocusedTask,
  handleFilterKeydown
} = useTaskFilter(props, async () => {
  await notesState.autoFlushCurrentTaskEdits()
})

// 2. 初始化各模块状态
const notesState = useTaskNotes(currentTask, emitToast, emitUpdated)
const sqlsState = useTaskSqls(currentTask, emitToast, emitUpdated)
const docsState = useTaskDocs(currentTask, emitToast, emitUpdated)

// 3. Tab 切换状态
const activeWorkspaceTab = ref(localStorage.getItem('devorbit_active_tab') || 'notes')

const workspaceTabs = computed(() => {
  const pendingSql = currentTask.value?.prodPendingCount || 0
  return [
    {
      id: 'notes',
      label: '开发备忘与联调参数',
      icon: StickyNote,
      iconColor: 'text-teal-400',
      badge: notesState.taskNotes.value.length,
      badgeClass: 'bg-teal-500/15 text-teal-300'
    },
    {
      id: 'sqls',
      label: '上线 SQL 资产',
      icon: Database,
      iconColor: 'text-amber-400',
      badge: pendingSql > 0 ? `${pendingSql} 待发` : `${sqlsState.currentSqls.value.length}`,
      badgeClass: pendingSql > 0 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-white/10 text-slate-400'
    },
    {
      id: 'docs',
      label: '交付与需求文档',
      icon: FolderKanban,
      iconColor: 'text-blue-400',
      badge: docsState.currentDocs.value.length,
      badgeClass: 'bg-white/10 text-slate-300'
    },
    {
      id: 'overview',
      label: '全景看板',
      icon: LayoutDashboard,
      iconColor: 'text-slate-400'
    }
  ]
})

async function switchWorkspaceTab(tabId) {
  if (activeWorkspaceTab.value === 'notes' && tabId !== 'notes') {
    await notesState.autoFlushCurrentTaskEdits()
  }
  activeWorkspaceTab.value = tabId
  try {
    localStorage.setItem('devorbit_active_tab', tabId)
  } catch (e) {}
}

// 4. 监听选中任务变动，联动刷新数据
watch(currentTask, async (newTask) => {
  if (!newTask) return
  // emit('select-task', newTask)
  await Promise.all([
    notesState.loadNoteForTask(newTask.fullPath),
    sqlsState.loadSqlsForTask(newTask.fullPath),
    docsState.loadDocsForTask(newTask.fullPath)
  ])
}, { immediate: true })

// 5. 软件内文件弹窗预览与编辑器
const filePreviewModal = ref({
  visible: false,
  filePath: '',
  fileName: '',
  initialEdit: false
})

function openFilePreview(filePath, fileName, initialEdit = false) {
  filePreviewModal.value = {
    visible: true,
    filePath,
    fileName,
    initialEdit
  }
}

async function handleFileSaved() {
  if (currentTask.value) {
    await Promise.all([
      notesState.loadNoteForTask(currentTask.value.fullPath),
      sqlsState.loadSqlsForTask(currentTask.value.fullPath),
      docsState.loadDocsForTask(currentTask.value.fullPath)
    ])
  }
}

// 6. 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  type: 'task',
  task: null,
  project: null,
  sql: null,
  doc: null
})

function closeContextMenu() {
  contextMenu.value.visible = false
}

function openTaskContextMenu(e, task) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 220),
    y: Math.min(e.clientY, window.innerHeight - 300),
    type: 'task',
    task,
    project: null,
    sql: null,
    doc: null
  }
}

function openProjectContextMenu(e, proj) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 220),
    y: Math.min(e.clientY, window.innerHeight - 200),
    type: 'project',
    task: null,
    project: proj,
    sql: null,
    doc: null
  }
}

function openSqlContextMenu(e, sql) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 240),
    y: Math.min(e.clientY, window.innerHeight - 280),
    type: 'sql',
    task: null,
    project: null,
    sql,
    doc: null
  }
}

function openDocContextMenu(e, doc) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 240),
    y: Math.min(e.clientY, window.innerHeight - 280),
    type: 'doc',
    task: null,
    project: null,
    sql: null,
    doc
  }
}

async function handleContextMenuAction(action, payload) {
  closeContextMenu()

  switch (action) {
    case 'open-folder':
      openInExplorer(typeof payload === 'string' ? payload : payload.fullPath)
      break
    case 'copy-path':
      copyTaskPath(typeof payload === 'string' ? payload : payload.fullPath)
      break
    case 'change-project': {
      const task = payload
      const current = task.project || '常规项目'
      const target = prompt(`修改任务 [${task.title}] 所属项目名称：`, current)
      if (target && target.trim() && target.trim() !== current) {
        await electronApi.updateTask(task.fullPath, { project: target.trim() })
        emitUpdated()
        emitToast(`项目归属已更新为: ${target.trim()}`, 'success')
      }
      break
    }
    case 'set-status': {
      const { task, status } = payload
      await electronApi.updateTask(task.fullPath, { status })
      emitUpdated()
      emitToast(`状态已更新`, 'success')
      break
    }
    case 'delete-task': {
      const task = payload
      if (confirm(`确认删除任务 [${task.title}] 吗？\n\n该任务将被安全移入系统回收站。`)) {
        await electronApi.deleteTask(task.fullPath)
        emitUpdated()
        emitToast(`已将任务 [${task.title}] 移至回收站`, 'info')
      }
      break
    }
    case 'create-task-in-project': {
      const proj = payload
      emit('open-new-task', selectedYear.value === 'all' ? props.years[0] : selectedYear.value, proj.name)
      break
    }
    case 'rename-project': {
      const proj = payload
      const oldName = proj.name
      const newName = prompt(`请输入项目 [${oldName}] 的新名称:`, oldName)
      if (newName && newName.trim() && newName.trim() !== oldName) {
        const cleanNew = newName.trim()
        const targetTasks = props.tasks.filter(t => (t.project || '常规项目').trim() === oldName)
        for (const t of targetTasks) {
          await electronApi.updateTask(t.fullPath, { project: cleanNew })
        }
        if (selectedProject.value === oldName) {
          selectedProject.value = cleanNew
        }
        emitUpdated()
        emitToast(`已将项目 [${oldName}] 重命名为: ${cleanNew}`, 'success')
      }
      break
    }
    case 'delete-project': {
      const proj = payload
      if (confirm(`⚠️ 危险操作：确认删除项目 [${proj.name}] 吗？\n\n该项目名下的全部 ${proj.totalCount} 个任务都将被安全移入 Windows 系统回收站。`)) {
        const targetTasks = props.tasks.filter(t => (t.project || '常规项目').trim() === proj.name)
        for (const t of targetTasks) {
          await electronApi.deleteTask(t.fullPath)
        }
        if (selectedProject.value === proj.name) {
          selectedProject.value = 'all'
        }
        emitUpdated()
        emitToast(`已将项目 [${proj.name}] 移入回收站`, 'info')
      }
      break
    }
    case 'sql-edit':
      openFilePreview(payload.filePath, payload.fileName, true)
      break
    case 'sql-toggle-prod':
      sqlsState.promptToggleProdStatus(payload)
      break
    case 'delete-sql':
      await sqlsState.deleteSqlItem(payload)
      break
    case 'open-native':
      docsState.openNativeDoc(payload)
      break
    case 'doc-preview':
      openFilePreview(payload.filePath, payload.fileName, false)
      break
    case 'delete-doc':
      await docsState.deleteDocItem(payload)
      break
  }
}

// 7. 辅助方法
function openInExplorer(path) {
  if (path) electronApi.openInExplorer(path)
}

function showInFolder(path) {
  if (path) electronApi.showItemInFolder(path)
}

async function copyTaskPath(path) {
  if (!path) return
  await electronApi.copyToClipboard(path)
  emitToast('已复制绝对路径到剪贴板', 'success')
}

// 8. 全局快捷键与点击监听
function handleGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    if (currentTask.value) {
      openInExplorer(currentTask.value.fullPath)
    }
  } else if (e.key === 'Escape') {
    closeContextMenu()
  } else {
    handleFilterKeydown(e)
  }
}

function handleGlobalClick() {
  closeContextMenu()
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('click', handleGlobalClick)
})
</script>

<style scoped>
.taskboard-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: none;
}

.workspace-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
}

.workspace-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.2);
}

.workspace-tabbar {
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(15, 20, 32, 0.8);
  flex-shrink: 0;
  user-select: none;
}

.tab-item-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.tag-count {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.save-status-hint {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: rgba(45, 212, 191, 0.9);
  display: flex;
  align-items: center;
  gap: 6px;
}

.saved-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #34d399;
}

.saved-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #34d399;
}

.tab-content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: rgba(11, 14, 23, 0.6);
}

.empty-selection-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  color: #64748b;
  user-select: none;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #475569;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e1;
  margin: 0;
}

.empty-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.status-footer {
  height: 32px;
  padding: 0 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  flex-shrink: 0;
  user-select: none;
  background-color: rgba(0, 0, 0, 0.4);
  color: #94a3b8;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2dd4bf;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #2dd4bf;
}

.divider {
  color: #64748b;
  opacity: 0.4;
}

.task-title-hint {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcut-hint {
  color: #64748b;
}

.version-tag {
  color: rgba(45, 212, 191, 0.9);
  font-weight: 700;
}

.icon-small {
  width: 14px;
  height: 14px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.25);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 184, 166, 0.55);
}
</style>
