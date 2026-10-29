<template>
  <n-modal
    v-model:show="isOpen"
    preset="card"
    title="全域穿透搜索"
    class="global-search-modal"
    :block-scroll="true"
    :trap-focus="true"
    :style="{
      width: '92vw',
      maxWidth: '1240px',
      height: '86vh',
      maxHeight: '86vh',
      display: 'flex',
      flexDirection: 'column'
    }"
    content-style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 14px 20px 16px;"
    header-style="flex-shrink: 0; padding: 14px 20px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);"
  >
    <template #header-extra>
      <div class="header-extra-tags">
        <span class="shortcut-tip">
          <kbd class="kbd-tag">双击</kbd> / <kbd class="kbd-tag">Enter</kbd> 软件内打开
        </span>
        <span class="shortcut-tip">
          <kbd class="kbd-tag">↑</kbd><kbd class="kbd-tag">↓</kbd> 切换行
        </span>
        <span class="shortcut-tip">
          <kbd class="kbd-tag">ESC</kbd> 退出
        </span>
      </div>
    </template>

    <div class="search-modal-container">
      <!-- 现代化搜索输入框 -->
      <div class="search-input-header">
        <div class="search-bar-wrap">
          <Search class="search-icon-leading text-teal-400" />
          <input
            ref="searchInputRef"
            v-model="query"
            type="text"
            placeholder="输入关键字穿透全工作区所有文件（如: 表名、ALTER TABLE、接口名称、系统命令）..."
            class="search-bar-input"
            @input="handleSearch"
            @keydown="handleInputKeydown"
          />
          <div class="search-bar-actions">
            <span v-if="searching" class="search-status-tag">
              <Loader2 class="icon-tiny animate-spin text-teal-400" /> 检索中
            </span>
            <span v-else-if="query.trim() && searchResults.length > 0" class="search-count-pill font-mono">
              {{ searchResults.length }} 处匹配
            </span>
            <button
              v-if="query"
              type="button"
              class="clear-input-btn"
              @click="clearQuery"
              title="清空搜索"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 搜索内容主体：左侧结果列表，右侧文件内行定位高亮查看器 -->
      <div class="search-main-content">
        <!-- 左侧：搜索匹配行列表 -->
        <div class="results-sidebar">
          <div class="sidebar-header">
            <div class="filter-chips-row">
              <button
                type="button"
                class="filter-chip"
                :class="{ 'is-active': activeTypeFilter === 'all' }"
                @click="activeTypeFilter = 'all'"
              >
                全部 ({{ searchResults.length }})
              </button>
              <button
                v-if="sqlMatchCount > 0"
                type="button"
                class="filter-chip"
                :class="{ 'is-active': activeTypeFilter === 'sql' }"
                @click="activeTypeFilter = 'sql'"
              >
                SQL ({{ sqlMatchCount }})
              </button>
              <button
                v-if="docMatchCount > 0"
                type="button"
                class="filter-chip"
                :class="{ 'is-active': activeTypeFilter === 'doc' }"
                @click="activeTypeFilter = 'doc'"
              >
                文档/笔记 ({{ docMatchCount }})
              </button>
            </div>
          </div>

          <div class="results-list custom-scrollbar">
            <div v-if="!query.trim()" class="search-empty-state">
              <Search class="empty-icon text-slate-600" />
              <p class="empty-title">输入关键字即可快速全域穿透扫描</p>
              <p class="empty-sub">支持精准扫描所有工作区内的 .sql、.md、.txt、.json、.sh 脚本文件</p>
            </div>
            <div v-else-if="filteredResults.length === 0 && !searching" class="search-empty-state">
              <Sparkles class="empty-icon text-slate-600" />
              <p class="empty-title">未找到包含 "{{ query }}" 的文件或内容</p>
              <p class="empty-sub">请尝试缩短或更换关键字再次搜索</p>
            </div>

            <div
              v-else
              v-for="item in filteredResults"
              :key="item.filePath + ':' + item.lineNum"
              class="result-item-card"
              :class="{ 'is-selected': selectedItem === item }"
              @click="selectResult(item)"
              @dblclick="jumpToFile(item)"
              :title="'双击直接跳转并打开此文件 (' + item.fileName + ')'"
            >
              <div class="result-card-top">
                <div class="result-file-info">
                  <component :is="getFileIcon(item.fileName)" class="icon-tiny file-type-icon" />
                  <span class="result-file-name" :title="item.relativePath">
                    {{ item.fileName }}
                  </span>
                </div>
                <span class="result-line-tag font-mono">
                  第 {{ item.lineNum }} 行
                </span>
              </div>

              <!-- 上级路径面包屑 -->
              <div v-if="getDirectoryHint(item.relativePath)" class="result-path-hint" :title="item.relativePath">
                {{ getDirectoryHint(item.relativePath) }}
              </div>

              <!-- 匹配代码行预览 (带关键字高亮) -->
              <div class="result-line-preview font-mono" v-html="highlightKeyword(item.lineContent, query)"></div>
            </div>
          </div>
        </div>

        <!-- 右侧：文件内精准定位与高亮展示窗口 -->
        <div class="file-preview-area">
          <!-- 预览文件顶栏 -->
          <div class="file-preview-header">
            <div class="file-header-title">
              <FileCode class="icon-small text-teal-400" />
              <span class="filename-text font-mono" :title="activeFile.filePath">
                {{ activeFile.fileName || '请在左侧选择一个匹配结果' }}
              </span>
              <span v-if="selectedItem && targetLine" class="active-line-badge font-mono">
                已定位至第 {{ targetLine }} 行
              </span>
            </div>

            <div v-if="activeFile.filePath" class="file-header-actions">
              <!-- 快捷跳转到软件内文件 -->
              <n-button
                size="tiny"
                type="primary"
                secondary
                @click="jumpToFile(selectedItem || activeFile)"
                title="双击卡片或点击此处：直接在软件内打开此文件并跳转至对应任务/Tab"
              >
                <template #icon><ExternalLink class="icon-tiny" /></template>
                <span>在软件中打开</span>
              </n-button>

              <!-- 快捷复制定位行 -->
              <n-button
                size="tiny"
                quaternary
                @click="copyCurrentTargetLine"
                title="复制当前定位行内容"
              >
                <template #icon><Copy class="icon-tiny" /></template>
                <span>复制定位行</span>
              </n-button>

              <!-- 快捷复制全文 -->
              <n-button
                size="tiny"
                quaternary
                @click="copyAllLines"
                title="复制此文件全文"
              >
                <template #icon><Copy class="icon-tiny" /></template>
                <span>复制全文</span>
              </n-button>

              <!-- 在文件管理器中打开 -->
              <n-button
                size="tiny"
                quaternary
                @click="openInExplorer"
                title="在 Windows 资源管理器中高亮定位此文件"
              >
                <template #icon>
                  <FolderOpen class="icon-small text-amber-400" />
                </template>
                <span>打开目录</span>
              </n-button>
            </div>
          </div>

          <!-- 代码/文件行渲染区 -->
          <div ref="fileViewerRef" class="file-lines-container custom-scrollbar">
            <div v-if="activeFile.lines.length === 0" class="file-empty-tip">
              点击左侧匹配项，右侧将自动平滑滚动并高亮定位至对应代码行
            </div>

            <div
              v-else
              v-for="(lineText, idx) in activeFile.lines"
              :key="idx"
              :id="'line-' + (idx + 1)"
              class="file-line-row"
              :class="{ 'is-target-line': (idx + 1) === targetLine }"
              @dblclick="jumpToFile(selectedItem || activeFile)"
              title="双击直接在对应程序中打开此文件"
            >
              <!-- 行号 -->
              <span class="line-number font-mono" :class="{ 'is-target': (idx + 1) === targetLine }">
                <span v-if="(idx + 1) === targetLine" class="target-indicator">▶</span>
                {{ idx + 1 }}
              </span>

              <!-- 行内容 (带关键字高亮) -->
              <span class="line-text font-mono" v-html="highlightKeyword(lineText, query)"></span>

              <!-- 快捷复制此行按钮 -->
              <button
                type="button"
                class="copy-line-btn"
                @click="copyLine(lineText)"
                title="复制此行"
              >
                <Copy class="icon-tiny" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { NModal, NButton } from 'naive-ui'
import {
  Search,
  Loader2,
  FileCode,
  FolderOpen,
  Copy,
  Sparkles,
  Database,
  FileText,
  ExternalLink
} from 'lucide-vue-next'
import { electronApi } from '@/utils/api'

const emit = defineEmits(['toast', 'navigate'])

const isOpen = ref(false)
const query = ref('')
const searching = ref(false)
const searchResults = ref([])
const selectedItem = ref(null)
const targetLine = ref(null)
const activeTypeFilter = ref('all')
const searchInputRef = ref(null)
const fileViewerRef = ref(null)

const activeFile = ref({
  filePath: '',
  fileName: '',
  lines: []
})

let searchDebounce = null

const sqlMatchCount = computed(() => {
  return searchResults.value.filter(item => (item.fileName || '').toLowerCase().endsWith('.sql')).length
})

const docMatchCount = computed(() => {
  return searchResults.value.filter(item => {
    const fn = (item.fileName || '').toLowerCase()
    return fn.endsWith('.md') || fn.endsWith('.txt') || fn.endsWith('.json')
  }).length
})

const filteredResults = computed(() => {
  if (activeTypeFilter.value === 'all') return searchResults.value
  if (activeTypeFilter.value === 'sql') {
    return searchResults.value.filter(item => (item.fileName || '').toLowerCase().endsWith('.sql'))
  }
  if (activeTypeFilter.value === 'doc') {
    return searchResults.value.filter(item => {
      const fn = (item.fileName || '').toLowerCase()
      return fn.endsWith('.md') || fn.endsWith('.txt') || fn.endsWith('.json')
    })
  }
  return searchResults.value
})

function open() {
  isOpen.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function close() {
  isOpen.value = false
}

function clearQuery() {
  query.value = ''
  searchResults.value = []
  selectedItem.value = null
  targetLine.value = null
  activeFile.value = { filePath: '', fileName: '', lines: [] }
  searchInputRef.value?.focus()
}

function handleSearch() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(async () => {
    const q = query.value.trim()
    if (!q) {
      searchResults.value = []
      selectedItem.value = null
      targetLine.value = null
      activeFile.value = { filePath: '', fileName: '', lines: [] }
      return
    }
    searching.value = true
    try {
      searchResults.value = await electronApi.searchKeyword(q)
      if (filteredResults.value.length > 0) {
        selectResult(filteredResults.value[0])
      }
    } catch (err) {
      console.error('[GlobalSearch] search failed:', err)
    } finally {
      searching.value = false
    }
  }, 220)
}

function handleInputKeydown(e) {
  if (filteredResults.value.length === 0) return
  const currentIdx = filteredResults.value.indexOf(selectedItem.value)

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const nextIdx = currentIdx < filteredResults.value.length - 1 ? currentIdx + 1 : 0
    selectResult(filteredResults.value[nextIdx])
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : filteredResults.value.length - 1
    selectResult(filteredResults.value[prevIdx])
  } else if (e.key === 'Enter') {
    if (selectedItem.value) {
      jumpToFile(selectedItem.value)
    }
  }
}

async function selectResult(item) {
  if (!item) return
  selectedItem.value = item
  targetLine.value = item.lineNum

  // 若同一文件已在内存中，不重新读取文件流，实现秒切
  if (activeFile.value.filePath !== item.filePath) {
    try {
      const res = await electronApi.readFileLines(item.filePath)
      activeFile.value = {
        filePath: item.filePath,
        fileName: res?.fileName || item.fileName,
        lines: res?.lines || []
      }
    } catch (err) {
      console.error('[GlobalSearch] readFileLines failed:', err)
      emit('toast', '读取文件失败: ' + err.message, 'error')
      return
    }
  }

  // 确保 DOM 挂载完成后精准滚动定位至中心
  await nextTick()
  scrollViewerToTarget(item.lineNum)
}

function scrollViewerToTarget(lineNum) {
  const container = fileViewerRef.value
  if (!container) return

  const targetEl = document.getElementById(`line-${lineNum}`)
  if (!targetEl) {
    // 渲染延迟保护：尝试 60ms 后再校验执行一次
    setTimeout(() => {
      const elRetry = document.getElementById(`line-${lineNum}`)
      if (elRetry && fileViewerRef.value) {
        doScroll(fileViewerRef.value, elRetry)
      }
    }, 60)
    return
  }

  doScroll(container, targetEl)
}

function doScroll(container, targetEl) {
  const targetTop = targetEl.offsetTop
  const containerHeight = container.clientHeight
  const desiredScrollTop = Math.max(0, targetTop - containerHeight / 2 + targetEl.clientHeight / 2)
  container.scrollTo({
    top: desiredScrollTop,
    behavior: 'smooth'
  })
}

function highlightKeyword(text, keyword) {
  if (!text) return '&nbsp;'
  // 转义 HTML 实体防止注入
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const kw = (keyword || '').trim()
  if (!kw) return escaped

  const regexKw = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`(${regexKw})`, 'gi')
  return escaped.replace(regex, '<mark class="search-hl">$1</mark>')
}

function getFileIcon(fileName) {
  if (!fileName) return FileCode
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.sql')) return Database
  if (lower.endsWith('.md') || lower.endsWith('.txt')) return FileText
  return FileCode
}

function getDirectoryHint(relPath) {
  if (!relPath) return ''
  const parts = relPath.replace(/\\/g, '/').split('/')
  if (parts.length <= 1) return ''
  parts.pop()
  return parts.join(' / ')
}

async function copyLine(text) {
  await electronApi.copyToClipboard(text)
  emit('toast', '已复制该行内容！', 'success')
}

async function copyCurrentTargetLine() {
  if (!selectedItem.value?.lineContent) return
  await electronApi.copyToClipboard(selectedItem.value.lineContent)
  emit('toast', `已复制第 ${targetLine.value} 行内容！`, 'success')
}

async function copyAllLines() {
  if (!activeFile.value.lines || activeFile.value.lines.length === 0) return
  const fullText = activeFile.value.lines.join('\n')
  await electronApi.copyToClipboard(fullText)
  emit('toast', `已复制 [${activeFile.value.fileName}] 全文内容！`, 'success')
}

function jumpToFile(item) {
  const target = item || selectedItem.value
  if (!target || !target.filePath) return

  // 1. 顺畅关闭当前全域搜索弹窗
  close()

  // 2. 补全定位行信息
  if (!target.lineNum && targetLine.value) {
    target.lineNum = targetLine.value
  }

  // 3. 触发应用内部主视窗切换与定位联动 (软件内跳转至对应任务、SQL Tab 或随手记)
  try {
    emit('navigate', target)
  } catch (err) {
    console.error('[GlobalSearchModal] navigate emit failed:', err)
  }
}

function openInExplorer() {
  if (activeFile.value.filePath) {
    electronApi.openInExplorer(activeFile.value.filePath)
  }
}

defineExpose({ open, close })
</script>

<style scoped>
/* 弹窗容器与全局骨架 */
.search-modal-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-extra-tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcut-tip {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kbd-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #cbd5e1;
}

/* 顶部搜索输入框体系 */
.search-input-header {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.search-bar-wrap {
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(45, 212, 191, 0.3);
  border-radius: 12px;
  padding: 4px 14px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.search-bar-wrap:focus-within {
  border-color: #2dd4bf;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.2), 0 8px 24px rgba(0, 0, 0, 0.45);
  background: rgba(2, 6, 23, 0.85);
}

.search-icon-leading {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  flex-shrink: 0;
}

.search-bar-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f1f5f9;
  font-size: 13.5px;
  padding: 8px 0;
}

.search-bar-input::placeholder {
  color: #64748b;
  font-size: 13px;
}

.search-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.search-status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #2dd4bf;
}

.search-count-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(45, 212, 191, 0.15);
  border: 1px solid rgba(45, 212, 191, 0.3);
  color: #5eead4;
  font-weight: 600;
}

.clear-input-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-input-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* 搜索主体两栏分割 */
.search-main-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  gap: 16px;
  margin-top: 12px;
  overflow: hidden;
}

/* 左侧匹配列表 */
.results-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 12px;
}

.sidebar-header {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.filter-chips-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11px;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip:hover {
  color: #e2e8f0;
  background: rgba(30, 41, 59, 0.6);
}

.filter-chip.is-active {
  background: rgba(20, 184, 166, 0.22);
  border-color: rgba(45, 212, 191, 0.4);
  color: #5eead4;
  font-weight: 700;
}

.results-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 6px;
}

.search-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 16px;
  gap: 8px;
}

.empty-icon {
  width: 36px;
  height: 36px;
}

.empty-title {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
}

.empty-sub {
  font-size: 11px;
  color: #64748b;
  margin: 0;
  max-width: 300px;
}

/* 结果卡片 */
.result-item-card {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-left: 3px solid transparent;
  background-color: rgba(15, 23, 42, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item-card:hover {
  background-color: rgba(30, 41, 59, 0.65);
  border-color: rgba(255, 255, 255, 0.14);
}

.result-item-card.is-selected {
  background-color: rgba(20, 184, 166, 0.1);
  border-color: rgba(45, 212, 191, 0.35);
  border-left: 3px solid #2dd4bf;
}

.result-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-file-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.file-type-icon {
  color: #2dd4bf;
  flex-shrink: 0;
}

.result-file-name {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 11.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-item-card.is-selected .result-file-name {
  color: #5eead4;
}

.result-line-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.35);
  color: #fbbf24;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.result-path-hint {
  font-size: 10px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-line-preview {
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: rgba(2, 6, 23, 0.65);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* 右侧文件高亮查看区 */
.file-preview-area {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background-color: #020617;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.file-preview-header {
  padding: 8px 14px;
  background-color: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
}

.file-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.filename-text {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-line-badge {
  font-size: 10.5px;
  color: #fbbf24;
  padding: 1px 6px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  flex-shrink: 0;
}

.file-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 代码行容器 */
.file-lines-container {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  font-size: 12px;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  user-select: text;
}

.file-empty-tip {
  text-align: center;
  padding: 96px 16px;
  color: #475569;
  font-size: 12px;
}

.file-line-row {
  display: flex;
  align-items: center;
  padding: 2px 10px;
  color: #cbd5e1;
  transition: background-color 0.12s ease;
  position: relative;
  min-width: max-content;
  width: 100%;
}

.file-line-row:hover {
  background-color: rgba(30, 41, 59, 0.5);
}

.file-line-row.is-target-line {
  background-color: rgba(245, 158, 11, 0.18) !important;
  border-left: 3px solid #fbbf24 !important;
  color: #ffffff !important;
}

.line-number {
  width: 48px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 14px;
  user-select: none;
  font-size: 11px;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.line-number.is-target {
  color: #fbbf24;
  font-weight: 700;
}

.target-indicator {
  color: #fbbf24;
  font-size: 9px;
  display: inline-block;
}

.line-text {
  flex: 1;
  white-space: pre;
  tab-size: 2;
  line-height: 1.5;
}

.copy-line-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  color: #94a3b8;
  cursor: pointer;
  margin-left: 12px;
  flex-shrink: 0;
}

.file-line-row:hover .copy-line-btn {
  opacity: 1;
}

.copy-line-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.icon-small {
  width: 14px;
  height: 14px;
}
.icon-tiny {
  width: 12px;
  height: 12px;
}

/* 关键字高亮标签 */
:deep(.search-hl) {
  background: rgba(234, 179, 8, 0.38) !important;
  color: #fef08a !important;
  padding: 1px 4px !important;
  border-radius: 3px !important;
  font-weight: 700 !important;
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.25) !important;
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
.global-search-modal.n-card {
  width: 92vw !important;
  max-width: 1240px !important;
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

.global-search-modal.n-card > .n-card-header {
  flex-shrink: 0 !important;
  padding: 14px 20px 10px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.global-search-modal.n-card > .n-card__content {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  padding: 14px 20px 16px !important;
}
</style>
