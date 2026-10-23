<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="app-modal-dialog bg-slate-900 border border-slate-700 w-full max-w-5xl h-[86vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
      
      <!-- 搜索输入框 -->
      <div class="p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center gap-3 flex-shrink-0">
        <Search class="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <input
          ref="searchInputRef"
          v-model="query"
          type="text"
          placeholder="输入关键字搜索全部文件与命令（如: docker logs, ALTER TABLE, 某个接口名）..."
          @input="handleSearch"
          class="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <span class="text-xs text-slate-400 px-2 py-1 bg-slate-700/60 rounded border border-slate-600/50">
          ESC 关闭
        </span>
        <button @click="close" class="text-slate-400 hover:text-slate-200">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 搜索内容主体：左侧结果列表，右侧文件内行定位高亮查看器 -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- 左侧：搜索匹配行列表 -->
        <div class="w-2/5 border-r border-slate-700/80 flex flex-col bg-slate-900/60">
          <div class="px-4 py-2 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>找到 {{ searchResults.length }} 处匹配行</span>
            <span v-if="searching" class="text-emerald-400 flex items-center gap-1">
              <Loader2 class="w-3 h-3 animate-spin" /> 检索中
            </span>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-1.5">
            <div
              v-if="!query.trim()"
              class="text-center py-16 text-slate-500 text-xs"
            >
              输入关键字即可快速扫描工作区内所有 txt / md / sql 文件
            </div>
            <div
              v-else-if="searchResults.length === 0 && !searching"
              class="text-center py-16 text-slate-500 text-xs"
            >
              未找到包含 "{{ query }}" 的文件或命令
            </div>

            <div
              v-for="(item, index) in searchResults"
              :key="index"
              @click="selectResult(item)"
              class="p-2.5 rounded-lg border cursor-pointer transition text-xs"
              :class="selectedItem === item ? 'bg-emerald-950/40 border-emerald-500/50 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-emerald-400 truncate max-w-[200px]" :title="item.relativePath">
                  {{ item.fileName }}
                </span>
                <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  第 {{ item.lineNum }} 行
                </span>
              </div>
              <div class="font-mono text-[11px] text-slate-300 truncate bg-slate-950/60 px-2 py-1 rounded">
                {{ item.lineContent }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：文件内精准定位与高亮展示窗口 -->
        <div class="w-3/5 flex flex-col bg-slate-950">
          <!-- 预览文件顶栏 -->
          <div class="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-2 truncate">
              <FileCode class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span class="text-xs font-mono text-slate-200 truncate">
                {{ activeFile.fileName || '请在左侧选择一个匹配结果' }}
              </span>
              <span v-if="selectedItem" class="text-xs text-amber-400 font-mono">
                (已精准定位至第 {{ selectedItem.lineNum }} 行)
              </span>
            </div>

            <div v-if="activeFile.filePath" class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="openInExplorer"
                title="在文件夹中显示"
                class="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
              >
                <FolderOpen class="w-3.5 h-3.5" />
              </button>
              <button
                @click="openInIDE"
                title="在编辑器中打开此文件"
                class="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
              >
                <Code2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 代码/文件行渲染区 -->
          <div
            ref="fileViewerRef"
            class="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-0.5 select-text"
          >
            <div
              v-if="activeFile.lines.length === 0"
              class="text-center py-24 text-slate-600 text-xs"
            >
              点击左侧匹配项，此处将直接滚动并高亮定位该命令所在行
            </div>

            <div
              v-for="(lineText, idx) in activeFile.lines"
              :key="idx"
              :id="'line-' + (idx + 1)"
              class="flex items-center px-2 py-1 rounded transition group"
              :class="(idx + 1) === targetLine ? 'highlight-row bg-amber-500/20 text-amber-200' : 'text-slate-300 hover:bg-slate-900'"
            >
              <!-- 行号 -->
              <span
                class="w-10 flex-shrink-0 text-right pr-3 select-none text-[11px]"
                :class="(idx + 1) === targetLine ? 'text-amber-400 font-bold' : 'text-slate-600'"
              >
                {{ idx + 1 }}
              </span>

              <!-- 行内容 -->
              <span class="flex-1 whitespace-pre-wrap break-all">
                {{ lineText || ' ' }}
              </span>

              <!-- 快捷复制此行 -->
              <button
                @click="copyLine(lineText)"
                class="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition flex items-center gap-1 flex-shrink-0 ml-2"
                title="复制此行命令"
              >
                <Copy class="w-3 h-3" />
                复制行
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import {
  Search, X, Loader2, FileCode, FolderOpen, Code2, Copy
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
      // 如果有结果，默认展示第1条
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

  // 加载该文件全部行
  const res = await window.electronAPI.readFileLines(item.filePath)
  activeFile.value = {
    filePath: item.filePath,
    fileName: res.fileName,
    lines: res.lines
  }

  // 滚动并高亮该行
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

function openInIDE() {
  if (activeFile.value.filePath) {
    window.electronAPI.openInIDE(activeFile.value.filePath)
  }
}

defineExpose({ open })
</script>
