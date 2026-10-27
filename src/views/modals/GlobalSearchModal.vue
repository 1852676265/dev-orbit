<template>
  <n-modal
    v-model:show="isOpen"
    preset="card"
    title="全域穿透搜索"
    class="global-search-modal"
  >
    <div class="search-modal-container">
      <!-- 搜索输入框 -->
      <div class="search-input-header">
        <n-input
          ref="searchInputRef"
          v-model:value="query"
          size="medium"
          placeholder="输入关键字搜索全部文件与命令（如: docker logs, ALTER TABLE, 某个接口名）..."
          clearable
          class="search-bar-input"
          @input="handleSearch"
        >
          <template #prefix>
            <Search class="icon-small text-teal-400" />
          </template>
        </n-input>
      </div>

      <!-- 搜索内容主体：左侧结果列表，右侧文件内行定位高亮查看器 -->
      <div class="search-main-content">
        <!-- 左侧：搜索匹配行列表 -->
        <div class="results-sidebar">
          <div class="sidebar-header">
            <span>找到 {{ searchResults.length }} 处匹配行</span>
            <span v-if="searching" class="searching-tag">
              <Loader2 class="icon-tiny animate-spin" /> 检索中
            </span>
          </div>

          <div class="results-list custom-scrollbar">
            <div v-if="!query.trim()" class="search-empty-tip">
              输入关键字即可快速扫描工作区内所有 txt / md / sql 文件
            </div>
            <div v-else-if="searchResults.length === 0 && !searching" class="search-empty-tip">
              未找到包含 "{{ query }}" 的文件或命令
            </div>

            <div
              v-for="(item, index) in searchResults"
              :key="index"
              @click="selectResult(item)"
              class="result-item-card"
              :class="{ 'is-selected': selectedItem === item }"
            >
              <div class="result-card-top">
                <span class="result-file-name" :title="item.relativePath">
                  {{ item.fileName }}
                </span>
                <span class="result-line-tag">
                  第 {{ item.lineNum }} 行
                </span>
              </div>
              <div class="result-line-preview">
                {{ item.lineContent }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：文件内精准定位与高亮展示窗口 -->
        <div class="file-preview-area">
          <!-- 预览文件顶栏 -->
          <div class="file-preview-header">
            <div class="file-header-title">
              <FileCode class="icon-small text-teal-400" />
              <span class="filename-text">
                {{ activeFile.fileName || '请在左侧选择一个匹配结果' }}
              </span>
              <span v-if="selectedItem" class="active-line-hint">
                (已精准定位至第 {{ selectedItem.lineNum }} 行)
              </span>
            </div>

            <div v-if="activeFile.filePath" class="file-header-actions">
              <n-button
                size="tiny"
                quaternary
                @click="openInExplorer"
                title="在资源管理器中定位"
              >
                <template #icon>
                  <FolderOpen class="icon-small" />
                </template>
              </n-button>
            </div>
          </div>

          <!-- 代码/文件行渲染区 -->
          <div ref="fileViewerRef" class="file-lines-container custom-scrollbar">
            <div v-if="activeFile.lines.length === 0" class="file-empty-tip">
              点击左侧匹配项，此处将直接滚动并高亮定位该命令所在行
            </div>

            <div
              v-for="(lineText, idx) in activeFile.lines"
              :key="idx"
              :id="'line-' + (idx + 1)"
              class="file-line-row"
              :class="{ 'is-target-line': (idx + 1) === targetLine }"
            >
              <!-- 行号 -->
              <span class="line-number" :class="{ 'is-target': (idx + 1) === targetLine }">
                {{ idx + 1 }}
              </span>

              <!-- 行内容 -->
              <span class="line-text">
                {{ lineText || ' ' }}
              </span>

              <!-- 快捷复制此行 -->
              <n-button
                size="tiny"
                quaternary
                class="copy-line-btn"
                @click="copyLine(lineText)"
                title="复制此行命令"
              >
                <template #icon><Copy class="icon-tiny" /></template>
                <span>复制行</span>
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { NModal, NInput, NButton } from 'naive-ui'
import {
  Search,
  Loader2,
  FileCode,
  FolderOpen,
  Copy
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const isOpen = ref(false)
const query = ref('')
const searching = ref(false)
const searchResults = ref([])
const selectedItem = ref(null)
const targetLine = ref(null)
const searchInputRef = ref(null)
const fileViewerRef = ref(null)

const activeFile = ref({
  filePath: '',
  fileName: '',
  lines: []
})

let searchDebounce = null

function open() {
  isOpen.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function close() {
  isOpen.value = false
}

function handleSearch() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(async () => {
    if (!query.value.trim()) {
      searchResults.value = []
      return
    }
    searching.value = true
    try {
      searchResults.value = await window.electronAPI.searchKeyword(query.value)
      if (searchResults.value.length > 0) {
        selectResult(searchResults.value[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      searching.value = false
    }
  }, 250)
}

async function selectResult(item) {
  selectedItem.value = item
  targetLine.value = item.lineNum

  const res = await window.electronAPI.readFileLines(item.filePath)
  activeFile.value = {
    filePath: item.filePath,
    fileName: res.fileName,
    lines: res.lines
  }

  await nextTick()
  const el = document.getElementById(`line-${item.lineNum}`)
  if (el && fileViewerRef.value) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function copyLine(text) {
  await window.electronAPI.copyToClipboard(text)
  emit('toast', '已复制该行内容！')
}

function openInExplorer() {
  if (activeFile.value.filePath) {
    window.electronAPI.openInExplorer(activeFile.value.filePath)
  }
}

defineExpose({ open })
</script>

<style scoped>
.global-search-modal {
  width: 90vw;
  max-width: 1080px;
  height: 85vh;
  background-color: #0f172a;
  border: 1px solid #334155;
}

.search-modal-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input-header {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.search-main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin-top: 10px;
}

/* 左侧匹配列表 */
.results-sidebar {
  width: 40%;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  background-color: rgba(15, 23, 42, 0.5);
}

.sidebar-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.searching-tag {
  color: #2dd4bf;
  display: flex;
  align-items: center;
  gap: 4px;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-empty-tip {
  text-align: center;
  padding: 64px 16px;
  color: #64748b;
  font-size: 12px;
}

.result-item-card {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(30, 41, 59, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}
.result-item-card:hover {
  background-color: rgba(30, 41, 59, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}
.result-item-card.is-selected {
  background-color: rgba(19, 78, 74, 0.4);
  border-color: rgba(45, 212, 191, 0.5);
  color: #ffffff;
}

.result-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.result-file-name {
  font-weight: 600;
  color: #2dd4bf;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.result-line-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.4);
  color: #fbbf24;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.result-line-preview {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: rgba(2, 6, 23, 0.6);
  padding: 4px 6px;
  border-radius: 4px;
}

/* 右侧文件高亮查看区 */
.file-preview-area {
  width: 60%;
  display: flex;
  flex-direction: column;
  background-color: #020617;
}

.file-preview-header {
  padding: 8px 14px;
  background-color: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.file-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.filename-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-line-hint {
  font-size: 11px;
  color: #fbbf24;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.file-lines-container {
  flex: 1;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  padding: 2px 8px;
  border-radius: 4px;
  color: #cbd5e1;
  transition: background-color 0.15s ease;
}
.file-line-row:hover {
  background-color: rgba(30, 41, 59, 0.6);
}
.file-line-row.is-target-line {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fef3c7;
}

.line-number {
  width: 40px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 12px;
  user-select: none;
  font-size: 11px;
  color: #475569;
}
.line-number.is-target {
  color: #fbbf24;
  font-weight: 700;
}

.line-text {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
}

.copy-line-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.file-line-row:hover .copy-line-btn {
  opacity: 1;
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
