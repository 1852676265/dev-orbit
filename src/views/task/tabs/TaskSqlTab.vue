<template>
  <div class="sql-tab-container hide-scrollbar">
    <!-- 头部工具栏 -->
    <div class="sql-toolbar">
      <div class="toolbar-title-group">
        <h3 class="toolbar-title">
          <Database class="icon-medium text-amber-400" />
          <span>上线 SQL 脚本资产 ({{ sqlsState.currentSqls.value.length }})</span>
        </h3>
        <n-tag
          v-if="pendingCount > 0"
          type="warning"
          size="small"
          class="tag-count"
        >
          {{ pendingCount }} 份待发产线
        </n-tag>
        <n-tag
          v-else-if="sqlsState.currentSqls.value.length > 0"
          type="success"
          size="small"
          class="tag-count"
        >
          全部已发产线
        </n-tag>
      </div>

      <div class="toolbar-action-group">
        <n-button
          v-if="sqlsState.currentSqls.value.length > 0"
          type="primary"
          size="small"
          @click="sqlsState.sqlMergeModalOpen.value = true"
          title="一键按序拼接本任务 SQL 并生成 00_merged_all.sql"
        >
          <template #icon>
            <Sparkles class="icon-small" />
          </template>
          <span>合并本任务 SQL</span>
        </n-button>

        <n-button
          type="warning"
          secondary
          size="small"
          @click="$emit('open-cross-merge')"
          title="跨多个开发任务自由勾选并一键合并 SQL 脚本"
        >
          <template #icon>
            <Sparkles class="icon-small" />
          </template>
          <span>跨多任务合并 SQL</span>
        </n-button>

        <n-button
          size="small"
          quaternary
          @click="openNewSqlModal"
        >
          <template #icon>
            <Plus class="icon-small text-teal-400" />
          </template>
          <span>新建 SQL</span>
        </n-button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="sqlsState.loadingSqls.value" class="sql-loading-state">
      <RefreshCw class="icon-medium icon-spin text-teal-400" />
      <span>正在扫描任务 SQL 脚本...</span>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="sqlsState.currentSqls.value.length === 0"
      class="sql-empty-state"
    >
      <Database class="empty-icon" />
      <p class="empty-text">当前任务暂无 SQL 脚本</p>
      <p class="empty-subtext">可点击上方「新建 SQL」或将 .sql 文件放入 sql 目录</p>
    </div>

    <!-- 脚本条目列表 -->
    <div v-else class="sql-items-list">
      <div
        v-for="sql in sqlsState.currentSqls.value"
        :key="sql.fileName"
        :id="'sql-card-' + sql.fileName"
        @click="$emit('open-file', sql.filePath, sql.fileName, true)"
        @contextmenu.prevent.stop="$emit('sql-contextmenu', $event, sql)"
        class="sql-item-card"
        :class="{ 'is-highlight-target': highlightedSqlName === sql.fileName }"
        :title="`点击在软件内查看与编辑 · 右键查看更多操作: ${sql.fileName}`"
      >
        <!-- 文件名与大小 -->
        <div class="sql-info">
          <Database class="icon-small text-amber-400" />
          <span class="sql-filename" :title="sql.fileName">
            {{ sql.fileName }}
          </span>
          <span class="sql-filesize">
            ({{ (sql.size / 1024).toFixed(1) }} KB)
          </span>
        </div>

        <!-- 操作区 (采用 Naive UI 组件化 n-button 与 n-popconfirm) -->
        <div class="sql-actions" @click.stop>
          <!-- 产线状态变更按钮 -->
          <n-button
            size="tiny"
            :type="sql.prodReleased ? 'success' : 'warning'"
            :secondary="sql.prodReleased"
            class="prod-status-btn"
            @click.stop="sqlsState.promptToggleProdStatus(sql)"
            :title="`当前状态: ${sql.prodReleased ? '已发' : '待发'} (点击确认变更)`"
          >
            产线: {{ sql.prodReleased ? '已发' : '待发' }}
          </n-button>

          <!-- 弹窗查看源码 (预览) -->
          <n-button
            size="tiny"
            quaternary
            @click.stop="$emit('open-file', sql.filePath, sql.fileName, false)"
            title="在软件弹框中查看 SQL"
          >
            <template #icon><Eye class="icon-small" /></template>
          </n-button>

          <!-- 弹窗编辑源码 (编辑) -->
          <n-button
            size="tiny"
            quaternary
            @click.stop="$emit('open-file', sql.filePath, sql.fileName, true)"
            title="在软件弹框中直接编辑 SQL"
          >
            <template #icon><Pencil class="icon-small text-amber-400" /></template>
          </n-button>

          <!-- 在资源管理器中定位 -->
          <n-button
            size="tiny"
            quaternary
            @click.stop="$emit('show-in-folder', sql.filePath)"
            title="在 Windows 资源管理器中定位"
          >
            <template #icon><FolderOpen class="icon-small text-blue-400" /></template>
          </n-button>

          <!-- 复制 SQL 路径 -->
          <n-button
            size="tiny"
            quaternary
            @click.stop="$emit('copy-path', sql.filePath)"
            title="复制绝对路径"
          >
            <template #icon><Copy class="icon-small" /></template>
          </n-button>

          <!-- 删除 SQL 脚本 (使用 Naive UI n-popconfirm 气泡确认) -->
          <n-popconfirm
            @positive-click="sqlsState.deleteSqlItem(sql)"
            positive-text="确认删除"
            negative-text="取消"
          >
            <template #trigger>
              <n-button
                size="tiny"
                quaternary
                type="error"
                title="删除此 SQL (移入系统回收站)"
              >
                <template #icon><Trash2 class="icon-small" /></template>
              </n-button>
            </template>
            确认将 SQL 脚本 [{{ sql.fileName }}] 删除并移入 Windows 系统回收站吗？
          </n-popconfirm>
        </div>
      </div>
    </div>

    <!-- 新建 SQL 脚本弹窗 (替代 Electron 彻底不支持的 window.prompt) -->
    <n-modal
      v-model:show="showNewSqlModal"
      preset="card"
      title="新建上线 SQL 脚本"
      class="new-sql-modal"
      style="width: 480px; max-width: 90vw;"
      :segmented="{ content: 'soft', action: 'soft' }"
    >
      <div class="new-sql-form">
        <label class="form-label">SQL 脚本名称</label>
        <n-input
          v-model:value="newSqlFileName"
          placeholder="例如: 02_create_table.sql 或 03_init_data"
          autofocus
          @keyup.enter="handleCreateSql"
        >
          <template #prefix>
            <Database class="icon-small text-amber-400" />
          </template>
        </n-input>
        <p class="form-hint">
          * 将自动生成在当前任务目录的 <code>/sql/</code> 下，若未输入 <code>.sql</code> 后缀将自动补全
        </p>
      </div>

      <template #action>
        <div class="modal-actions">
          <n-button quaternary size="small" @click="showNewSqlModal = false">
            取消
          </n-button>
          <n-button
            type="primary"
            size="small"
            :disabled="!newSqlFileName.trim()"
            @click="handleCreateSql"
          >
            确认创建
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { NButton, NTag, NPopconfirm, NModal, NInput } from 'naive-ui'
import {
  Database,
  Sparkles,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  FolderOpen,
  Copy,
  Trash2
} from 'lucide-vue-next'

const props = defineProps({
  sqlsState: { type: Object, required: true },
  highlightedSqlName: { type: String, default: '' }
})

defineEmits(['open-file', 'show-in-folder', 'copy-path', 'sql-contextmenu', 'open-cross-merge'])

const pendingCount = computed(() => {
  return props.sqlsState.currentSqls.value.filter(s => !s.prodReleased).length
})

const showNewSqlModal = ref(false)
const newSqlFileName = ref('')

watch(
  () => props.highlightedSqlName,
  (name) => {
    if (!name) return
    nextTick(() => {
      const el = document.getElementById(`sql-card-${name}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  },
  { immediate: true }
)

function openNewSqlModal() {
  newSqlFileName.value = ''
  showNewSqlModal.value = true
}

async function handleCreateSql() {
  const name = newSqlFileName.value.trim()
  if (!name) return
  showNewSqlModal.value = false
  await props.sqlsState.createNewSqlFile(name)
}
</script>

<style scoped>
.sql-tab-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sql-tab-container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 顶部工具栏 */
.sql-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 12px;
  flex-wrap: wrap;
  user-select: none;
}

.toolbar-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--app-primary-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.tag-count {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.toolbar-action-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 加载状态 */
.sql-loading-state {
  padding: 48px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--app-secondary-foreground);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 空状态 */
.sql-empty-state {
  padding: 48px 16px;
  text-align: center;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background-color: var(--app-subcard-background);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--app-muted-foreground);
}

.empty-text {
  font-size: 12px;
  color: var(--app-secondary-foreground);
  margin: 0;
}

.empty-subtext {
  font-size: 11px;
  color: var(--app-muted-foreground);
  margin: 0;
}

/* 脚本列表 */
.sql-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.sql-item-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--app-card-border);
  background-color: var(--app-subcard-background);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
}

.sql-item-card:hover {
  background-color: var(--app-list-hover-background);
  border-color: var(--app-accent-teal-border);
}

.sql-item-card.is-highlight-target {
  background: var(--app-accent-teal-bg) !important;
  border-color: #14b8a6 !important;
  border-left: 3px solid #14b8a6 !important;
  box-shadow: 0 0 16px rgba(45, 212, 191, 0.25) !important;
  animation: targetSqlPulse 2s ease-in-out infinite;
}

@keyframes targetSqlPulse {
  0%, 100% {
    box-shadow: 0 0 14px rgba(45, 212, 191, 0.25);
  }
  50% {
    box-shadow: 0 0 24px rgba(45, 212, 191, 0.5);
  }
}

.sql-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.sql-filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: var(--app-primary-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;
}

.sql-item-card:hover .sql-filename {
  color: var(--app-accent-teal);
}

.sql-filesize {
  font-size: 10px;
  color: var(--app-muted-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  flex-shrink: 0;
}

.sql-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.prod-status-btn {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.icon-medium {
  width: 16px;
  height: 16px;
}

.icon-small {
  width: 14px;
  height: 14px;
}

/* 新建 SQL 弹窗表单样式 */
.new-sql-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 12px;
  color: var(--app-secondary-foreground);
  font-weight: 500;
}

.form-hint {
  font-size: 11px;
  color: var(--app-muted-foreground);
  margin: 2px 0 0 0;
  line-height: 1.4;
}

.form-hint code {
  color: var(--app-accent-teal);
  background-color: var(--app-accent-teal-bg);
  padding: 1px 4px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
