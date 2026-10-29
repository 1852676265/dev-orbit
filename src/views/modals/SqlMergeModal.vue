<template>
  <n-modal
    :show="isOpen"
    preset="card"
    title="SQL 脚本一键合并导出"
    class="sql-merge-modal"
    :block-scroll="true"
    :trap-focus="true"
    :style="{
      width: '92vw',
      maxWidth: '1200px',
      height: '86vh',
      maxHeight: '86vh',
      display: 'flex',
      flexDirection: 'column'
    }"
    content-style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 14px 20px;"
    header-style="flex-shrink: 0; padding: 14px 20px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);"
    footer-style="flex-shrink: 0; padding: 12px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(2, 6, 23, 0.5);"
    @update:show="(val) => { if (!val) close() }"
  >
    <template #header-extra>
      <div class="header-extra-row">
        <div class="scope-seg-pill">
          <button
            type="button"
            class="scope-seg-btn"
            :class="{ 'is-active': mergeScope === 'current' }"
            @click="switchScope('current')"
          >
            当前任务 SQL
          </button>
          <button
            type="button"
            class="scope-seg-btn"
            :class="{ 'is-active': mergeScope === 'cross' }"
            @click="switchScope('cross')"
          >
            ✨ 跨多任务合并 SQL
          </button>
        </div>
        <n-tag size="small" type="primary" :bordered="false" class="font-mono">
          已选 {{ selectedCount }} / {{ displayedItems.length }} 份
        </n-tag>
      </div>
    </template>

    <div class="modal-subtitle-bar">
      <template v-if="mergeScope === 'current'">
        <span>当前任务: <b class="task-title-highlight">{{ task?.title || '未选定任务' }}</b></span>
        <span class="subtitle-hint">· 自动按指定次序拼接、注入元数据头并可选包裹事务</span>
      </template>
      <template v-else>
        <div class="cross-filter-bar">
          <span class="filter-label">跨任务筛选:</span>
          <select v-model="crossProjectFilter" class="cross-select">
            <option value="all">全部所属项目 ({{ crossSqlItems.length }} 份)</option>
            <option v-for="p in crossProjectOptions" :key="p" :value="p">{{ p }}</option>
          </select>
          <button type="button" class="quick-filter-chip" @click="selectOnlyPendingProd">
            ⚡ 仅勾选待发产线 SQL
          </button>
          <button type="button" class="quick-filter-chip chip-outline" @click="selectAll(true)">
            全部勾选
          </button>
          <span class="subtitle-hint">· 共扫描到 {{ crossTaskGroupCount }} 个任务</span>
        </div>
      </template>
    </div>

    <!-- 主体内容：双栏左右拆分 (左侧：排序与勾选，右侧：合并结果代码预览) -->
    <div class="modal-split-layout" @wheel.stop>
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

        <!-- 脚本列表 (支持单任务与跨多任务上下调整执行次序) -->
        <div class="sql-order-list custom-scrollbar" @wheel.stop>
          <div v-if="isLoadingCrossSqls" class="code-loading-box">
            <RefreshCw class="icon-medium animate-spin text-teal-400" />
            <span>正在扫描所有任务的 SQL 脚本资产...</span>
          </div>
          <div v-else-if="displayedItems.length === 0" class="code-loading-box">
            <span>当前范围内未找到可合并的 .sql 文件</span>
          </div>
          <div
            v-else
            v-for="(item, idx) in displayedItems"
            :key="item.uid || item.filePath || item.fileName"
            class="order-item-card cursor-pointer"
            :class="{ 'is-active': item.selected }"
            @click="toggleSelectItem(item)"
          >
            <!-- 勾选与次序号与文件名 -->
            <div class="item-left">
              <n-checkbox
                v-model:checked="item.selected"
                @click.stop
                @update:checked="triggerRegenerate"
              />
              <span class="order-number-badge">
                {{ idx + 1 }}
              </span>
              <div class="item-meta">
                <div class="item-filename" :title="item.fileName">
                  <span v-if="mergeScope === 'cross'" class="task-badge-inline">
                    [{{ item.taskProject }} · {{ item.taskTitle }}]
                  </span>
                  {{ item.fileName }}
                </div>
                <div class="item-sub">
                  <span>{{ formatFileSize(item.size) }}</span>
                  <span v-if="item.prodReleased" class="tag-released">● 产线已发</span>
                  <span v-else class="tag-pending">⚡ 待发产线</span>
                </div>
              </div>
            </div>

            <!-- 上下排序按钮 -->
            <div class="item-order-actions">
              <n-button
                size="tiny"
                quaternary
                :disabled="idx === 0"
                @click.stop="moveItem(idx, -1)"
                title="上移此脚本"
              >
                <template #icon><ArrowUp class="icon-tiny" /></template>
              </n-button>
              <n-button
                size="tiny"
                quaternary
                :disabled="idx === displayedItems.length - 1"
                @click.stop="moveItem(idx, 1)"
                title="下移此脚本"
              >
                <template #icon><ArrowDown class="icon-tiny" /></template>
              </n-button>
            </div>
          </div>
        </div>

        <!-- 底部配置开关 -->
        <div class="options-box">
          <div class="options-title">生成配置</div>
          <div class="options-grid">
            <n-checkbox size="small" v-model:checked="options.wrapTransaction" @update:checked="triggerRegenerate">
              包裹事务 (START TRANSACTION / COMMIT)
            </n-checkbox>
            <n-checkbox size="small" v-model:checked="options.includeHeader" @update:checked="triggerRegenerate">
              包含元数据头 (需求/系统/时间/清单)
            </n-checkbox>
            <n-checkbox size="small" v-model:checked="options.includeDividers" @update:checked="triggerRegenerate">
              包含单文件分隔注释
            </n-checkbox>
          </div>
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

          <div class="preview-actions">
            <n-button
              size="tiny"
              quaternary
              :type="isWrapLines ? 'primary' : 'default'"
              @click="isWrapLines = !isWrapLines"
              :title="isWrapLines ? '当前已换行，点击开启横向滚动条模式' : '当前单行模式，点击自动换行'"
            >
              <template #icon><WrapText class="icon-tiny" /></template>
              <span>{{ isWrapLines ? '已自动换行' : '不换行 (横向滚动)' }}</span>
            </n-button>

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
        </div>

        <div class="code-preview-box custom-scrollbar" @wheel.stop>
          <div v-if="isGenerating" class="code-loading-box">
            <RefreshCw class="icon-medium animate-spin text-teal-400" />
            <span>正在分析并按序拼接 SQL 文件...</span>
          </div>
          <pre v-else class="code-pre select-text" :class="{ 'is-wrapped': isWrapLines }">{{ mergedSql }}</pre>
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
import { ref, computed, reactive, watch, nextTick, onMounted } from 'vue'
import { NModal, NButton, NCheckbox, NTag } from 'naive-ui'
import {
  Layers, ListOrdered, ArrowUp, ArrowDown, Code2,
  RefreshCw, Copy, Save, Info, WrapText
} from 'lucide-vue-next'
import { electronApi } from '@/utils/api'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  task: { type: Object, default: () => ({}) },
  sqlList: { type: Array, default: () => [] },
  allTasks: { type: Array, default: () => [] },
  initialScope: { type: String, default: 'current' }
})

const emit = defineEmits(['close', 'updated', 'toast'])

const mergeScope = ref(props.initialScope || 'current')
const sqlItems = ref([])
const crossSqlItems = ref([])
const isLoadingCrossSqls = ref(false)
const crossProjectFilter = ref('all')
const isGenerating = ref(false)
const isSaving = ref(false)
const isWrapLines = ref(false)
const mergedSql = ref('')

const options = reactive({
  wrapTransaction: true,
  includeHeader: true,
  includeDividers: true
})

onMounted(() => {
  if (props.isOpen) {
    mergeScope.value = props.initialScope || 'current'
    initItems()
  }
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    mergeScope.value = props.initialScope || 'current'
    initItems()
  }
})

watch(() => props.allTasks, async (newTasks) => {
  if (props.isOpen && mergeScope.value === 'cross' && Array.isArray(newTasks) && newTasks.length > 0) {
    await loadAllTasksSqls()
    regenerateSql()
  }
})

async function switchScope(scope) {
  if (mergeScope.value === scope) return
  mergeScope.value = scope
  if (scope === 'cross' && crossSqlItems.value.length === 0) {
    await loadAllTasksSqls()
  }
  regenerateSql()
}

async function initItems() {
  const rawList = (props.sqlList || []).filter(item => item.fileName !== '00_merged_all.sql')
  sqlItems.value = rawList.map(item => ({
    ...item,
    uid: `${props.task?.fullPath || ''}::${item.fileName}`,
    taskTitle: props.task?.title || '当前任务',
    taskProject: props.task?.project || '常规',
    taskPath: props.task?.fullPath || '',
    selected: true
  }))

  if (mergeScope.value === 'cross') {
    await loadAllTasksSqls()
  }

  nextTick(() => {
    regenerateSql()
  })
}

async function loadAllTasksSqls() {
  isLoadingCrossSqls.value = true
  try {
    let tasksToScan = Array.isArray(props.allTasks) && props.allTasks.length > 0
      ? props.allTasks
      : []

    if (tasksToScan.length === 0) {
      try {
        const res = await electronApi.getTasks()
        if (res?.tasks && Array.isArray(res.tasks)) {
          tasksToScan = res.tasks
        } else if (Array.isArray(res)) {
          tasksToScan = res
        }
      } catch (e) {}
    }

    if (tasksToScan.length === 0 && props.task?.fullPath) {
      tasksToScan = [props.task]
    }

    const results = await Promise.all(
      tasksToScan.map(async (t) => {
        try {
          const files = await electronApi.getSqlFiles(t.fullPath)
          return (files || [])
            .filter(f => f.fileName !== '00_merged_all.sql')
            .map(f => ({
              ...f,
              uid: `${t.fullPath}::${f.fileName}`,
              taskTitle: t.title || t.dirName,
              taskProject: t.project || '常规',
              taskPath: t.fullPath,
              selected: !f.prodReleased
            }))
        } catch (e) {
          return []
        }
      })
    )

    const flat = results.flat()
    if (flat.length > 0 && flat.every(x => !x.selected)) {
      flat.forEach(x => { x.selected = true })
    }
    crossSqlItems.value = flat
  } finally {
    isLoadingCrossSqls.value = false
  }
}

const crossProjectOptions = computed(() => {
  const set = new Set()
  for (const item of crossSqlItems.value) {
    if (item.taskProject) set.add(item.taskProject)
  }
  return Array.from(set)
})

const crossTaskGroupCount = computed(() => {
  const set = new Set(crossSqlItems.value.map(i => i.taskPath))
  return set.size
})

const displayedItems = computed(() => {
  if (mergeScope.value === 'current') return sqlItems.value
  if (crossProjectFilter.value === 'all') return crossSqlItems.value
  return crossSqlItems.value.filter(i => i.taskProject === crossProjectFilter.value)
})

watch(crossProjectFilter, () => {
  if (mergeScope.value === 'cross') regenerateSql()
})

const selectedCount = computed(() => displayedItems.value.filter(s => s.selected).length)
const previewLines = computed(() => mergedSql.value ? mergedSql.value.split('\n').length : 0)
const previewBytes = computed(() => new TextEncoder().encode(mergedSql.value).length)

function selectAll(val) {
  displayedItems.value.forEach(s => { s.selected = val })
  triggerRegenerate()
}

function toggleSelectItem(item) {
  item.selected = !item.selected
  triggerRegenerate()
}

function selectOnlyPendingProd() {
  displayedItems.value.forEach(s => {
    s.selected = !s.prodReleased
  })
  triggerRegenerate()
}

function moveItem(index, offset) {
  const list = mergeScope.value === 'current' ? sqlItems.value : crossSqlItems.value
  const currentDisplayed = displayedItems.value
  const movingItem = currentDisplayed[index]
  const targetDisplayedItem = currentDisplayed[index + offset]
  if (!movingItem || !targetDisplayedItem) return

  const fromIdx = list.indexOf(movingItem)
  const toIdx = list.indexOf(targetDisplayedItem)
  if (fromIdx === -1 || toIdx === -1) return

  list.splice(fromIdx, 1)
  list.splice(toIdx, 0, movingItem)
  triggerRegenerate()
}

function triggerRegenerate() {
  regenerateSql()
}

async function regenerateSql() {
  isGenerating.value = true
  const selected = displayedItems.value.filter(s => s.selected)

  if (selected.length === 0) {
    mergedSql.value = '-- [提示] 请在左侧勾选至少一份 SQL 脚本进行合并。\n'
    isGenerating.value = false
    return
  }

  try {
    const pieces = []
    const nowStr = new Date().toLocaleString()
    const isCross = mergeScope.value === 'cross'
    const taskSet = Array.from(new Set(selected.map(s => s.taskTitle || props.task?.title || '未命名任务')))
    const projSet = Array.from(new Set(selected.map(s => s.taskProject || props.task?.project || '常规项目')))

    if (options.includeHeader) {
      pieces.push(`-- ====================================================================`)
      pieces.push(`--  DevOrbit (星轨) · ${isCross ? '跨多任务 SQL 统一合并上线总单' : 'SQL 脚本统一合并上线总单'}`)
      pieces.push(`-- ====================================================================`)
      pieces.push(`-- 涉及任务 : ${taskSet.join(' / ')} (${taskSet.length} 个任务)`)
      pieces.push(`-- 所属系统 : ${projSet.join(' / ')}`)
      pieces.push(`-- 生成时间 : ${nowStr}`)
      pieces.push(`-- 脚本总数 : 共 ${selected.length} 份文件`)
      pieces.push(`-- 执行清单 :`)
      selected.forEach((s, idx) => {
        pieces.push(`--   [${idx + 1}] [${s.taskProject || '常规'} · ${s.taskTitle || props.task?.title}] ${s.fileName}`)
      })
      pieces.push(`-- ====================================================================\n`)
    }

    if (options.wrapTransaction) {
      pieces.push(`-- >>> [事务开始] 防止部分 SQL 失败导致脏读，请确保支持 DDL 事务`)
      pieces.push(`START TRANSACTION;\n`)
    }

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i]
      let fileContent = ''
      try {
        fileContent = await electronApi.readSqlContent(item.filePath)
      } catch (err) {
        fileContent = `-- [读取此文件失败: ${err.message}]`
      }

      if (options.includeDividers) {
        pieces.push(`-- --------------------------------------------------------------------`)
        pieces.push(`-- [${i + 1}/${selected.length}] 任务: ${item.taskTitle || props.task?.title} | 文件: ${item.fileName}`)
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
    await electronApi.copyToClipboard(mergedSql.value)
    emit('toast', `🎉 已成功复制合并 SQL (${selectedCount.value} 份脚本，共 ${previewLines.value} 行)！`, 'success')
  } catch (e) {
    emit('toast', '复制失败: ' + e.message, 'error')
  }
}

async function saveMergedToFile() {
  const selected = displayedItems.value.filter(s => s.selected)
  const targetTaskPath = props.task?.fullPath || selected[0]?.taskPath
  if (!mergedSql.value || !targetTaskPath) return
  isSaving.value = true
  try {
    const savePath = `${targetTaskPath}/sql/00_merged_all.sql`
    await electronApi.saveSqlContent(savePath, mergedSql.value)
    emit('toast', `✅ 已将合并总单保存至 [00_merged_all.sql]！`, 'success')
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
/* 模态框双栏主布局 */
.modal-split-layout {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 16px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 顶部副标题条与过滤 */
.modal-subtitle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: #94a3b8;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.task-title-highlight {
  color: #f1f5f9;
}

.subtitle-hint {
  color: #64748b;
}

.header-extra-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-seg-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scope-seg-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11.5px;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scope-seg-btn:hover {
  color: #e2e8f0;
}

.scope-seg-btn.is-active {
  background: rgba(20, 184, 166, 0.25);
  color: #5eead4;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.cross-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  color: #94a3b8;
  font-weight: 500;
}

.cross-select {
  padding: 3px 10px;
  border-radius: 6px;
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  font-size: 11px;
  outline: none;
}

.cross-select:focus {
  border-color: #2dd4bf;
}

.quick-filter-chip {
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fbbf24;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-filter-chip:hover {
  background: rgba(245, 158, 11, 0.25);
  border-color: rgba(245, 158, 11, 0.5);
}

.quick-filter-chip.chip-outline {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  color: #94a3b8;
}

.quick-filter-chip.chip-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

/* 左侧面板 */
.left-order-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 14px;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.quick-select-links {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.link-btn {
  background: transparent;
  border: none;
  color: #2dd4bf;
  cursor: pointer;
  padding: 0 2px;
  font-size: 11px;
  transition: color 0.15s ease;
}

.link-btn:hover {
  color: #5eead4;
  text-decoration: underline;
}

.link-divider {
  color: #475569;
}

/* 左侧脚本列表容器 */
.sql-order-list {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 6px;
}

/* 单个脚本项卡片 */
.order-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-left: 3px solid transparent;
  border-radius: 8px;
  transition: all 0.15s ease;
  user-select: none;
}

.order-item-card:hover {
  background: rgba(30, 41, 59, 0.65);
  border-color: rgba(255, 255, 255, 0.14);
}

.order-item-card.is-active {
  background: rgba(20, 184, 166, 0.09);
  border-color: rgba(45, 212, 191, 0.35);
  border-left: 3px solid #2dd4bf;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.order-number-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.4);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.order-item-card.is-active .order-number-badge {
  color: #5eead4;
  background: rgba(20, 184, 166, 0.22);
  border-color: rgba(45, 212, 191, 0.45);
}

.item-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-badge-inline {
  color: #5eead4;
  font-weight: 700;
  margin-right: 4px;
  font-size: 11px;
}

.item-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.tag-released {
  color: #34d399;
  font-weight: 500;
}

.tag-pending {
  color: #fbbf24;
  font-weight: 600;
}

.item-order-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* 底部选项配置盒 */
.options-box {
  flex-shrink: 0;
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.options-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 右侧预览面板 */
.right-preview-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.preview-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lines-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 400;
}

/* 代码预览盒 */
.code-preview-box {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  border-radius: 8px;
  background-color: #020617;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 14px;
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
  font-size: 12px;
  line-height: 1.6;
  color: #cbd5e1;
  white-space: pre;
  tab-size: 2;
}

.code-pre.is-wrapped {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
}

/* 弹窗底部操作条 */
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
  font-size: 11.5px;
  color: #94a3b8;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 10px;
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

/* 极清晰、醒目的专业深色滚动条系统 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(45, 212, 191, 0.45) rgba(15, 23, 42, 0.6);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(45, 212, 191, 0.4);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.15s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(45, 212, 191, 0.75);
}

.custom-scrollbar::-webkit-scrollbar-corner {
  background: rgba(15, 23, 42, 0.6);
}
</style>

<style>
/* 全局样式穿透 (确保 Naive UI Teleport 弹出后依然严格锁死尺寸与防溢出) */
.sql-merge-modal.n-card {
  width: 92vw !important;
  max-width: 1200px !important;
  height: 86vh !important;
  max-height: 86vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  background-color: #0b1120 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 16px !important;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75) !important;
}

.sql-merge-modal.n-card > .n-card-header {
  flex-shrink: 0 !important;
  padding: 14px 20px 10px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.sql-merge-modal.n-card > .n-card__content {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  padding: 14px 20px !important;
}

.sql-merge-modal.n-card > .n-card__action {
  flex-shrink: 0 !important;
  padding: 12px 20px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: rgba(2, 6, 23, 0.5) !important;
}
</style>
