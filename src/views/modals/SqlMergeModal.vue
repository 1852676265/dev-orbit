<template>
  <n-modal
    :show="isOpen"
    preset="card"
    title="SQL 脚本一键合并导出"
    class="sql-merge-modal"
    @update:show="(val) => { if (!val) close() }"
  >
    <template #header-extra>
      <n-tag size="small" type="primary" :bordered="false" class="font-mono">
        已选 {{ selectedCount }} / {{ sqlItems.length }} 份
      </n-tag>
    </template>

    <div class="modal-subtitle-bar">
      <span>任务: <b class="task-title-highlight">{{ task?.title }}</b></span>
      <span class="subtitle-hint">· 自动按指定次序拼接、注入元数据头并可选包裹事务</span>
    </div>

    <!-- 主体内容：双栏左右拆分 (左侧：排序与勾选，右侧：合并结果代码预览) -->
    <div class="modal-split-layout">
      <!-- 左侧：脚本排序与选项面板 -->
      <div class="left-order-panel">
        <div class="panel-header-row">
          <span class="panel-title">
            <ListOrdered class="icon-small text-teal-400" />
            脚本执行次序 (上下调整)
          </span>
          <div class="quick-select-links">
            <button class="link-btn" @click="selectAll(true)">全选</button>
            <span class="link-divider">|</span>
            <button class="link-btn" @click="selectAll(false)">全不选</button>
          </div>
        </div>

        <!-- 脚本列表 (支持上下调整执行次序) -->
        <div class="sql-order-list custom-scrollbar">
          <div
            v-for="(item, idx) in sqlItems"
            :key="item.fileName"
            class="order-item-card"
            :class="{ 'is-active': item.selected }"
          >
            <!-- 勾选与次序号 -->
            <div class="item-left">
              <n-checkbox
                v-model:checked="item.selected"
                @update:checked="triggerRegenerate"
              />
              <span class="order-number-badge">
                {{ idx + 1 }}
              </span>
              <div class="item-meta">
                <div class="item-filename" :title="item.fileName">
                  {{ item.fileName }}
                </div>
                <div class="item-sub">
                  <span>{{ formatFileSize(item.size) }}</span>
                  <span v-if="item.testReleased" class="tag-released">● 测试已发</span>
                  <span v-else class="tag-pending">○ 待发测试</span>
                </div>
              </div>
            </div>

            <!-- 上下排序按钮 -->
            <div class="item-order-actions">
              <n-button
                size="tiny"
                quaternary
                :disabled="idx === 0"
                @click="moveItem(idx, -1)"
                title="上移此脚本"
              >
                <template #icon><ArrowUp class="icon-tiny" /></template>
              </n-button>
              <n-button
                size="tiny"
                quaternary
                :disabled="idx === sqlItems.length - 1"
                @click="moveItem(idx, 1)"
                title="下移此脚本"
              >
                <template #icon><ArrowDown class="icon-tiny" /></template>
              </n-button>
            </div>
          </div>
        </div>

        <!-- 底部配置开关 -->
        <div class="options-box">
          <n-checkbox v-model:checked="options.wrapTransaction" @update:checked="triggerRegenerate">
            包裹事务 (START TRANSACTION / COMMIT)
          </n-checkbox>
          <n-checkbox v-model:checked="options.includeHeader" @update:checked="triggerRegenerate">
            包含元数据头 (需求、系统、生成时间与清单)
          </n-checkbox>
          <n-checkbox v-model:checked="options.includeDividers" @update:checked="triggerRegenerate">
            包含单文件分隔注释
          </n-checkbox>
        </div>
      </div>

      <!-- 右侧：拼接代码实时预览区 -->
      <div class="right-preview-panel">
        <div class="preview-header-bar">
          <span class="preview-title">
            <Code2 class="icon-small text-teal-400" />
            合并脚本全文预览
            <span v-if="previewLines > 0" class="lines-count font-mono">
              ({{ previewLines }} 行 · {{ formatFileSize(previewBytes) }})
            </span>
          </span>

          <n-button
            size="tiny"
            quaternary
            type="primary"
            :loading="isGenerating"
            @click="regenerateSql"
          >
            <template #icon><RefreshCw class="icon-tiny" /></template>
            <span>重新生成</span>
          </n-button>
        </div>

        <div class="code-preview-box custom-scrollbar">
          <div v-if="isGenerating" class="code-loading-box">
            <RefreshCw class="icon-medium animate-spin text-teal-400" />
            <span>正在分析并按序拼接 SQL 文件...</span>
          </div>
          <pre v-else class="code-pre select-text">{{ mergedSql }}</pre>
        </div>
      </div>
    </div>

    <!-- 弹窗底部操作按钮 -->
    <template #action>
      <div class="modal-action-bar">
        <div class="action-hint">
          <Info class="icon-tiny text-teal-400" />
          <span>合并结果将按当前排列次序拼接，建议先点击「重新生成」检查</span>
        </div>

        <div class="action-btns">
          <n-button size="small" quaternary @click="close">
            取消
          </n-button>

          <!-- 一键复制全文 -->
          <n-button
            size="small"
            secondary
            type="primary"
            :disabled="!mergedSql.trim() || isGenerating"
            @click="copyMergedSql"
          >
            <template #icon><Copy class="icon-small" /></template>
            <span>一键复制全文 (发版提测)</span>
          </n-button>

          <!-- 另存为任务目录脚本 00_merged_all.sql -->
          <n-button
            size="small"
            type="primary"
            :loading="isSaving"
            :disabled="!mergedSql.trim() || isSaving || isGenerating"
            @click="saveMergedToFile"
          >
            <template #icon><Save class="icon-small" /></template>
            <span>另存为 00_merged_all.sql</span>
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { NModal, NButton, NCheckbox, NTag } from 'naive-ui'
import {
  Layers, ListOrdered, ArrowUp, ArrowDown, Code2,
  RefreshCw, Copy, Save, Info
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  task: { type: Object, default: () => ({}) },
  sqlList: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'updated', 'toast'])

const sqlItems = ref([])
const isGenerating = ref(false)
const isSaving = ref(false)
const mergedSql = ref('')

const options = reactive({
  wrapTransaction: true,
  includeHeader: true,
  includeDividers: true
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initItems()
  }
})

function initItems() {
  const rawList = (props.sqlList || []).filter(item => item.fileName !== '00_merged_all.sql')
  
  sqlItems.value = rawList.map(item => ({
    ...item,
    selected: true
  }))

  nextTick(() => {
    regenerateSql()
  })
}

const selectedCount = computed(() => sqlItems.value.filter(s => s.selected).length)
const previewLines = computed(() => mergedSql.value ? mergedSql.value.split('\n').length : 0)
const previewBytes = computed(() => new TextEncoder().encode(mergedSql.value).length)

function selectAll(val) {
  sqlItems.value.forEach(s => { s.selected = val })
  triggerRegenerate()
}

function moveItem(index, offset) {
  const targetIndex = index + offset
  if (targetIndex < 0 || targetIndex >= sqlItems.value.length) return
  const item = sqlItems.value.splice(index, 1)[0]
  sqlItems.value.splice(targetIndex, 0, item)
  triggerRegenerate()
}

function triggerRegenerate() {
  regenerateSql()
}

async function regenerateSql() {
  isGenerating.value = true
  const selected = sqlItems.value.filter(s => s.selected)

  if (selected.length === 0) {
    mergedSql.value = '-- [提示] 请在左侧勾选至少一份 SQL 脚本进行合并。\n'
    isGenerating.value = false
    return
  }

  try {
    const pieces = []
    const nowStr = new Date().toLocaleString()
    const taskTitle = props.task?.title || '未命名任务'
    const project = props.task?.project || '常规项目'

    if (options.includeHeader) {
      pieces.push(`-- ====================================================================`)
      pieces.push(`--  DevOrbit (星轨) · SQL 脚本统一合并上线总单`)
      pieces.push(`-- ====================================================================`)
      pieces.push(`-- 需求任务 : ${taskTitle}`)
      pieces.push(`-- 所属系统 : ${project}`)
      pieces.push(`-- 生成时间 : ${nowStr}`)
      pieces.push(`-- 脚本总数 : 共 ${selected.length} 份文件`)
      pieces.push(`-- 执行清单 :`)
      selected.forEach((s, idx) => {
        pieces.push(`--   [${idx + 1}] ${s.fileName}`)
      })
      pieces.push(`-- ====================================================================\n`)
    }

    if (options.wrapTransaction) {
      pieces.push(`-- >>> [事务开始] 防止部分 SQL 失败导致脏读，请确保支持 DDL 事务 (MySQL 推荐谨慎分段)`)
      pieces.push(`START TRANSACTION;\n`)
    }

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i]
      let fileContent = ''
      try {
        if (window.electronAPI && window.electronAPI.readSqlContent) {
          fileContent = await window.electronAPI.readSqlContent(item.filePath)
        }
      } catch (err) {
        fileContent = `-- [读取此文件失败: ${err.message}]`
      }

      if (options.includeDividers) {
        pieces.push(`-- --------------------------------------------------------------------`)
        pieces.push(`-- [${i + 1}/${selected.length}] File: ${item.fileName}`)
        pieces.push(`-- --------------------------------------------------------------------`)
      }

      pieces.push(fileContent.trim())
      pieces.push('\n')
    }

    if (options.wrapTransaction) {
      pieces.push(`-- >>> [事务提交] 脚本全部按序执行完成`)
      pieces.push(`COMMIT;\n`)
    }

    mergedSql.value = pieces.join('\n')
  } catch (err) {
    mergedSql.value = `-- 生成合并 SQL 出现异常: ${err.message}`
  } finally {
    isGenerating.value = false
  }
}

async function copyMergedSql() {
  if (!mergedSql.value) return
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(mergedSql.value)
    } else {
      await navigator.clipboard.writeText(mergedSql.value)
    }
    emit('toast', `🎉 已成功复制合并 SQL (${selectedCount.value} 份脚本，共 ${previewLines.value} 行)！`, 'success')
  } catch (e) {
    emit('toast', '复制失败: ' + e.message, 'error')
  }
}

async function saveMergedToFile() {
  if (!mergedSql.value || !props.task?.fullPath) return
  isSaving.value = true
  try {
    const savePath = `${props.task.fullPath}/sql/00_merged_all.sql`
    if (window.electronAPI && window.electronAPI.saveSqlContent) {
      await window.electronAPI.saveSqlContent(savePath, mergedSql.value)
    }
    emit('toast', `✅ 已将合并总单保存为 [00_merged_all.sql]！`, 'success')
    emit('updated')
    close()
  } catch (err) {
    emit('toast', '保存合并文件失败: ' + err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

function close() {
  emit('close')
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}
</script>

<style scoped>
.sql-merge-modal {
  width: 90vw;
  max-width: 980px;
  background-color: #0f172a;
  border: 1px solid #334155;
}

.modal-subtitle-bar {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.task-title-highlight {
  color: #e2e8f0;
}

.subtitle-hint {
  color: #64748b;
}

.modal-split-layout {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 14px;
  min-height: 440px;
  max-height: 56vh;
}

.left-order-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 12px;
  overflow: hidden;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-select-links {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.link-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover {
  color: #2dd4bf;
}

.link-divider {
  color: #475569;
}

.sql-order-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.order-item-card {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(30, 41, 59, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  transition: all 0.15s ease;
  opacity: 0.6;
}
.order-item-card.is-active {
  background-color: rgba(30, 41, 59, 0.8);
  border-color: rgba(45, 212, 191, 0.3);
  opacity: 1;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.order-number-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  color: #2dd4bf;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 1px 6px;
  border-radius: 4px;
}

.item-meta {
  min-width: 0;
  flex: 1;
}

.item-filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.tag-released {
  color: #34d399;
}
.tag-pending {
  color: #fbbf24;
}

.item-order-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.options-box {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 右侧预览区 */
.right-preview-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-title {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lines-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: normal;
}

.code-preview-box {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
  background-color: #020617;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px;
}

.code-loading-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.code-pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #cbd5e1;
  white-space: pre;
}

.modal-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.action-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-medium {
  width: 18px;
  height: 18px;
}
.icon-small {
  width: 14px;
  height: 14px;
}
.icon-tiny {
  width: 12px;
  height: 12px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(45, 212, 191, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(45, 212, 191, 0.6);
}
</style>
