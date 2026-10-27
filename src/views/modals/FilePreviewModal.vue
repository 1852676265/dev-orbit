<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none"
      @click.self="closeModal"
    >
      <div
        class="bg-[#0f172a] border border-slate-700/80 w-full max-w-5xl h-[86vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        @click.stop
      >
        <!-- 1. 弹窗顶栏 (文件名、类型徽章、操作区) -->
        <div class="h-14 px-5 border-b border-slate-800 bg-[#090d16] flex items-center justify-between flex-shrink-0 gap-3">
          <!-- 左侧：图标 + 文件名 + 元信息 -->
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
              :class="fileTypeMeta.badgeClass"
            >
              <component :is="fileTypeMeta.icon" class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-mono text-sm font-bold text-white truncate" :title="fileName">
                  {{ fileName }}
                </h3>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border flex-shrink-0" :class="fileTypeMeta.tagClass">
                  {{ fileTypeMeta.label }}
                </span>
                <span v-if="fileStats.sizeText" class="text-[11px] text-slate-500 font-mono flex-shrink-0">
                  {{ fileStats.sizeText }}
                </span>
                <span v-if="isTextFile && lineCount > 0" class="text-[11px] text-slate-500 font-mono flex-shrink-0">
                  · {{ lineCount }} 行
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-mono truncate max-w-xl" :title="filePath">
                {{ filePath }}
              </p>
            </div>
          </div>

          <!-- 中间：文本文件站内关键字检索 (Ctrl+F) -->
          <div v-if="isTextFile" class="hidden md:flex items-center gap-1.5 bg-black/40 border border-slate-700/60 px-2.5 py-1 rounded-lg">
            <Search class="w-3.5 h-3.5 text-slate-400" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              @input="handleSearch"
              @keydown.enter="jumpNextMatch"
              @keydown.esc="clearSearch"
              type="text"
              placeholder="查找关键字 (Enter 下一个)..."
              class="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-44 font-mono"
            />
            <span v-if="searchMatches.length > 0" class="text-[10px] font-mono px-1 rounded bg-teal-500/20 text-teal-300">
              {{ currentMatchIndex + 1 }}/{{ searchMatches.length }}
            </span>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="text-slate-400 hover:text-white p-0.5"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <!-- 右侧：快捷操作按钮 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- 文本编辑 / 浏览模式切换 -->
            <button
              v-if="isTextFile"
              type="button"
              @click="toggleEditMode"
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              :class="isEditing
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold shadow-amber-950/30'
                : 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/30'"
              :title="isEditing ? '退出编辑模式 (可随时再次进入)' : '进入编辑模式修改 SQL / 文本'"
            >
              <Pencil class="w-3.5 h-3.5" />
              <span>{{ isEditing ? '编辑中 (点击退出)' : '进入编辑' }}</span>
            </button>

            <!-- 复制文件内容 -->
            <button
              v-if="isTextFile"
              type="button"
              @click="copyContent"
              class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="一键复制文件全文到剪贴板"
            >
              <Check v-if="copied" class="w-3.5 h-3.5 text-teal-400" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copied ? '已复制' : '复制全文' }}</span>
            </button>

            <!-- 仅在 Word、Excel 类文件时提供专用打开入口 (如 Microsoft Word / Excel)，SQL/文本/代码类完全由软件内置弹窗直接编辑，杜绝任何 IDE/外部编辑器 按钮 -->
            <button
              v-if="['word', 'excel'].includes(fileTypeMeta.type)"
              type="button"
              @click="openInExternalApp"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              :class="fileTypeMeta.openBtnClass"
              :title="`在外部专用程序中打开 (${fileTypeMeta.appName})`"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>{{ fileTypeMeta.appName }} 打开</span>
            </button>

            <!-- 资源管理器定位 -->
            <button
              type="button"
              @click="locateInFolder"
              class="p-2 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer"
              title="在 Windows 资源管理器中高亮定位"
            >
              <FolderOpen class="w-4 h-4" />
            </button>

            <!-- 关闭弹窗 -->
            <button
              type="button"
              @click="closeModal"
              class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
              title="关闭预览 (Esc)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 2. 弹窗主展示区 -->
        <div class="flex-1 min-h-0 relative overflow-hidden bg-[#070b14] flex flex-col select-text">
          <!-- 加载中状态 -->
          <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw class="w-6 h-6 animate-spin text-teal-400" />
            <span class="text-xs font-mono">正在载入「{{ fileName }}」内容...</span>
          </div>

          <!-- A. 文本代码类文件 (.sql, .md, .txt, .json, .yaml, .xml, .java, etc.) -->
          <div v-else-if="isTextFile" class="flex-1 min-h-0 flex overflow-hidden">
            <!-- 行号槽 -->
            <div
              ref="lineGutterRef"
              class="w-14 bg-[#090d16] border-r border-slate-800/80 py-4 font-mono text-[11px] text-slate-600 text-right pr-3 select-none overflow-hidden flex-shrink-0"
            >
              <div v-for="n in lineCount" :key="n" class="leading-5 h-5">
                {{ n }}
              </div>
            </div>

            <!-- 代码编辑 / 预览区 -->
            <div class="flex-1 min-h-0 relative flex flex-col overflow-hidden">
              <!-- 编辑模式：原生 TextArea -->
              <textarea
                v-if="isEditing"
                ref="editorTextareaRef"
                v-model="textContent"
                @scroll="syncScroll"
                @keydown.ctrl.s.prevent="saveContent"
                class="flex-1 w-full bg-transparent p-4 font-mono text-xs leading-5 text-slate-200 resize-none outline-none custom-scrollbar whitespace-pre tab-4"
                placeholder="在此直接输入或修改内容，按 Ctrl+S 立即保存..."
                spellcheck="false"
              ></textarea>

              <!-- 预览模式：代码视图 (双击进入编辑) -->
              <div
                v-else
                ref="viewerContainerRef"
                @scroll="syncScroll"
                @dblclick="toggleEditMode"
                class="flex-1 w-full p-4 font-mono text-xs leading-5 text-slate-300 overflow-auto custom-scrollbar whitespace-pre tab-4 cursor-text"
                title="双击此处即可快速进入编辑模式"
              >
                <div
                  v-for="(line, idx) in highlightedLines"
                  :key="idx"
                  class="leading-5 min-h-[20px] transition-colors"
                  :class="{ 'bg-teal-500/20 text-teal-200 font-bold -mx-4 px-4': isLineMatched(idx + 1) }"
                  v-html="line"
                ></div>
              </div>

              <!-- 编辑模式底部保存提醒浮条 -->
              <div
                v-if="isEditing"
                class="h-8 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono select-none flex-shrink-0"
              >
                <span class="text-amber-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  正在编辑中，按 Ctrl+S 或点击右侧保存
                </span>
                <button
                  type="button"
                  @click="saveContent"
                  :disabled="isSaving"
                  class="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow"
                >
                  <Save class="w-3.5 h-3.5" />
                  <span>{{ isSaving ? '保存中...' : '保存修改' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- B. Word 文档类文件 (.docx, .doc) -->
          <div
            v-else-if="fileTypeMeta.type === 'word'"
            class="flex-1 flex flex-col items-center justify-center p-8 select-none"
          >
            <div class="max-w-md w-full bg-slate-900/90 border border-blue-500/30 rounded-2xl p-6 text-center shadow-xl space-y-4 backdrop-blur-md">
              <div class="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <FileText class="w-8 h-8" />
              </div>
              <div class="space-y-1">
                <h3 class="font-bold text-white text-base truncate" :title="fileName">{{ fileName }}</h3>
                <p class="text-xs text-blue-400 font-medium">Microsoft Word 格式文档</p>
                <p class="text-[11px] text-slate-400 font-mono mt-1">
                  大小: {{ fileStats.sizeText || '未知' }} · 更新于: {{ fileStats.updatedAt || '最近' }}
                </p>
              </div>

              <div class="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  @click="openInExternalApp"
                  class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition cursor-pointer"
                >
                  <FileText class="w-4 h-4" />
                  <span>使用 Microsoft Word 打开此文档</span>
                </button>

                <button
                  type="button"
                  @click="locateInFolder"
                  class="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                  <span>在 Windows 资源管理器中定位</span>
                </button>
              </div>

              <p class="text-[11px] text-slate-500">
                提示：Word 文档为复合排版文件，调用本机 Microsoft Word 能获得 100% 完整的排版与批注体验。
              </p>
            </div>
          </div>

          <!-- C. Excel 表格文件 (.xlsx, .xls) -->
          <div
            v-else-if="fileTypeMeta.type === 'excel'"
            class="flex-1 flex flex-col items-center justify-center p-8 select-none"
          >
            <div class="max-w-md w-full bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-xl space-y-4 backdrop-blur-md">
              <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Sheet class="w-8 h-8" />
              </div>
              <div class="space-y-1">
                <h3 class="font-bold text-white text-base truncate" :title="fileName">{{ fileName }}</h3>
                <p class="text-xs text-emerald-400 font-medium">Microsoft Excel 工作簿</p>
                <p class="text-[11px] text-slate-400 font-mono mt-1">
                  大小: {{ fileStats.sizeText || '未知' }} · 更新于: {{ fileStats.updatedAt || '最近' }}
                </p>
              </div>

              <div class="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  @click="openInExternalApp"
                  class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
                >
                  <Sheet class="w-4 h-4" />
                  <span>使用 Microsoft Excel 打开表格</span>
                </button>

                <button
                  type="button"
                  @click="locateInFolder"
                  class="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                  <span>在 Windows 资源管理器中定位</span>
                </button>
              </div>
            </div>
          </div>

          <!-- D. PDF 文件 (.pdf) -->
          <div
            v-else-if="fileTypeMeta.type === 'pdf'"
            class="flex-1 min-h-0 relative flex flex-col"
          >
            <iframe
              v-if="binaryDataUrl"
              :src="binaryDataUrl"
              class="w-full flex-1 border-0 bg-white"
            ></iframe>
            <div v-else class="flex-1 flex flex-col items-center justify-center p-8 select-none">
              <FileText class="w-12 h-12 text-rose-400 mb-2" />
              <p class="text-sm font-bold text-white">PDF 预览加载中或受系统安全限制</p>
              <button
                type="button"
                @click="openInExternalApp"
                class="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>使用系统 PDF 阅读器打开</span>
              </button>
            </div>
          </div>

          <!-- E. 图片预览 (.png, .jpg, .svg, etc.) -->
          <div
            v-else-if="fileTypeMeta.type === 'image'"
            class="flex-1 flex items-center justify-center p-6 overflow-auto"
          >
            <img
              v-if="binaryDataUrl"
              :src="binaryDataUrl"
              :alt="fileName"
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
            />
            <div v-else class="text-slate-400 text-xs">正在渲染图片数据...</div>
          </div>

          <!-- F. 其他未知文件 -->
          <div v-else class="flex-1 flex flex-col items-center justify-center p-8 select-none text-center">
            <FileCode class="w-14 h-14 text-slate-500 mb-3" />
            <h3 class="text-base font-bold text-white mb-1">{{ fileName }}</h3>
            <p class="text-xs text-slate-400 max-w-sm mb-4">此格式文件建议通过外部关联软件进行查看与处理</p>
            <button
              type="button"
              @click="openInExternalApp"
              class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <ExternalLink class="w-4 h-4" />
              <span>使用系统关联程序打开</span>
            </button>
          </div>
        </div>

        <!-- 3. 弹窗底栏 (快捷键提示与行信息) -->
        <div class="h-8 px-5 border-t border-slate-800 bg-[#090d16] flex items-center justify-between text-[11px] font-mono text-slate-500 select-none flex-shrink-0">
          <div class="flex items-center gap-4">
            <span class="text-teal-400 font-bold">DevOrbit 弹窗预览器</span>
            <span class="text-slate-700">|</span>
            <span>按 ESC 关闭</span>
            <span v-if="isTextFile">· Ctrl+F 搜索 · Ctrl+S 保存</span>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="isTextFile && isEditing" class="text-amber-400 font-bold">● 已开启写入模式</span>
            <span v-else-if="isTextFile" class="text-slate-400">只读速览</span>
            <span>编码: UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  FileText, Database, Code, FileCode, Sheet, Image as ImageIcon,
  ExternalLink, FolderOpen, Copy, Check, Search, X, Pencil, Save, RefreshCw
} from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  filePath: { type: String, default: '' },
  fileName: { type: String, default: '' },
  initialEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'toast', 'file-saved'])

const loading = ref(false)
const textContent = ref('')
const isEditing = ref(false)
const isSaving = ref(false)
const copied = ref(false)
const binaryDataUrl = ref(null)
const fileStats = ref({ sizeText: '', updatedAt: '' })

// 搜索定位状态
const searchQuery = ref('')
const searchMatches = ref([])
const currentMatchIndex = ref(-1)
const searchInputRef = ref(null)
const lineGutterRef = ref(null)
const viewerContainerRef = ref(null)
const editorTextareaRef = ref(null)

// 判定文件类型元数据
const fileTypeMeta = computed(() => {
  const name = (props.fileName || props.filePath || '').toLowerCase()
  const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : ''

  if (['.sql'].includes(ext)) {
    return {
      type: 'sql',
      label: 'SQL 脚本',
      icon: Database,
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      tagClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      appName: 'IDE / 编辑器',
      openBtnClass: 'bg-amber-600 hover:bg-amber-500 text-white'
    }
  }
  if (['.docx', '.doc'].includes(ext)) {
    return {
      type: 'word',
      label: 'Word 文档',
      icon: FileText,
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      tagClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      appName: 'Word',
      openBtnClass: 'bg-blue-600 hover:bg-blue-500 text-white'
    }
  }
  if (['.xlsx', '.xls', '.csv'].includes(ext)) {
    return {
      type: ext === '.csv' ? 'text' : 'excel',
      label: ext === '.csv' ? 'CSV 表格' : 'Excel 表格',
      icon: Sheet,
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      tagClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      appName: 'Excel',
      openBtnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    }
  }
  if (['.pdf'].includes(ext)) {
    return {
      type: 'pdf',
      label: 'PDF 文档',
      icon: FileText,
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      tagClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      appName: 'PDF 阅读器',
      openBtnClass: 'bg-rose-600 hover:bg-rose-500 text-white'
    }
  }
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
    return {
      type: 'image',
      label: '图像资产',
      icon: ImageIcon,
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      tagClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      appName: '查看图片',
      openBtnClass: 'bg-purple-600 hover:bg-purple-500 text-white'
    }
  }
  if (['.md', '.markdown'].includes(ext)) {
    return {
      type: 'text',
      label: 'Markdown',
      icon: FileCode,
      badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      tagClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      appName: '默认程序',
      openBtnClass: 'bg-teal-600 hover:bg-teal-500 text-white'
    }
  }
  if (['.json', '.yaml', '.yml', '.xml', '.txt', '.log', '.properties', '.env', '.java', '.vue', '.js', '.ts', '.css'].includes(ext)) {
    return {
      type: 'text',
      label: ext.replace('.', '').toUpperCase(),
      icon: Code,
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      tagClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      appName: 'IDE / 编辑器',
      openBtnClass: 'bg-cyan-600 hover:bg-cyan-500 text-white'
    }
  }

  return {
    type: 'binary',
    label: ext ? ext.replace('.', '').toUpperCase() : '文件',
    icon: FileCode,
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    tagClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    appName: '系统程序',
    openBtnClass: 'bg-slate-700 hover:bg-slate-600 text-white'
  }
})

const isTextFile = computed(() => {
  return ['sql', 'text'].includes(fileTypeMeta.value.type)
})

const lineCount = computed(() => {
  if (!textContent.value) return 1
  return textContent.value.split('\n').length
})

// 简单转义并高亮匹配项
const highlightedLines = computed(() => {
  if (!textContent.value) return []
  const lines = textContent.value.split('\n')
  const q = (searchQuery.value || '').trim()

  return lines.map((line) => {
    let escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (q) {
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      escaped = escaped.replace(regex, '<mark class="bg-teal-500/40 text-teal-100 rounded px-0.5 font-bold">$1</mark>')
    }
    return escaped || '&nbsp;'
  })
})

function isLineMatched(lineNum) {
  if (searchMatches.value.length === 0 || currentMatchIndex.value < 0) return false
  const active = searchMatches.value[currentMatchIndex.value]
  return active && active.line === lineNum
}

// 载入文件内容
async function loadFile(openInEdit = false) {
  if (!props.filePath || !window.electronAPI) return
  loading.value = true
  textContent.value = ''
  binaryDataUrl.value = null
  isEditing.value = isTextFile.value ? !!openInEdit : false
  clearSearch()

  try {
    if (isTextFile.value) {
      const raw = await window.electronAPI.readTextFile(props.filePath)
      textContent.value = raw || ''
      if (isEditing.value) {
        nextTick(() => {
          if (editorTextareaRef.value) editorTextareaRef.value.focus()
        })
      }
    } else if (['image', 'pdf'].includes(fileTypeMeta.value.type)) {
      if (typeof window.electronAPI.readFileDataUrl === 'function') {
        binaryDataUrl.value = await window.electronAPI.readFileDataUrl(props.filePath)
      }
    }
  } catch (err) {
    console.error('加载文件失败:', err)
    emit('toast', '读取文件失败: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    loadFile(props.initialEdit)
  }
})

watch(() => props.filePath, (val) => {
  if (props.visible && val) {
    loadFile(props.initialEdit)
  }
})

// 滚动同步 (行号栏与代码容器同步滚动)
function syncScroll(e) {
  if (lineGutterRef.value && e.target) {
    lineGutterRef.value.scrollTop = e.target.scrollTop
  }
}

// 复制全文
async function copyContent() {
  if (!textContent.value || !window.electronAPI) return
  try {
    await window.electronAPI.copyToClipboard(textContent.value)
    copied.value = true
    emit('toast', '已复制文件全文到剪贴板！', 'success')
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    emit('toast', '复制失败: ' + err.message, 'error')
  }
}

// 切换编辑模式
function toggleEditMode() {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    nextTick(() => {
      if (editorTextareaRef.value) editorTextareaRef.value.focus()
    })
  }
}

// 保存修改
async function saveContent() {
  if (!props.filePath || !window.electronAPI) return
  isSaving.value = true
  try {
    await window.electronAPI.saveTextFile(props.filePath, textContent.value)
    emit('toast', `[${props.fileName}] 已成功保存修改！`, 'success')
    emit('file-saved', props.filePath)
    isEditing.value = false
  } catch (err) {
    emit('toast', '保存失败: ' + err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

// 站内搜索定位
function handleSearch() {
  const q = (searchQuery.value || '').trim().toLowerCase()
  searchMatches.value = []
  currentMatchIndex.value = -1
  if (!q || !textContent.value) return

  const lines = textContent.value.split('\n')
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(q)) {
      searchMatches.value.push({ line: idx + 1 })
    }
  })
  if (searchMatches.value.length > 0) {
    currentMatchIndex.value = 0
    scrollToMatch(0)
  }
}

function jumpNextMatch() {
  if (searchMatches.value.length === 0) return
  currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
  scrollToMatch(currentMatchIndex.value)
}

function scrollToMatch(idx) {
  const match = searchMatches.value[idx]
  if (!match) return
  const container = isEditing.value ? editorTextareaRef.value : viewerContainerRef.value
  if (container) {
    const lineTop = (match.line - 1) * 20
    container.scrollTo({ top: Math.max(0, lineTop - 60), behavior: 'smooth' })
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchMatches.value = []
  currentMatchIndex.value = -1
}

// 专用外部应用打开 (Word打开Word，Excel打开Excel，系统打开系统)
function openInExternalApp() {
  if (!props.filePath || !window.electronAPI) return
  window.electronAPI.openInExplorer(props.filePath)
  emit('toast', `已调用 ${fileTypeMeta.value.appName} 打开「${props.fileName}」`, 'info')
}

// 资源管理器定位
function locateInFolder() {
  if (!props.filePath || !window.electronAPI) return
  window.electronAPI.showItemInFolder(props.filePath)
  emit('toast', '已在 Windows 资源管理器中高亮定位', 'info')
}

function closeModal() {
  emit('update:visible', false)
}

// 监听 Esc 键关闭
function handleKeyDown(e) {
  if (!props.visible) return
  if (e.key === 'Escape') {
    closeModal()
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && isTextFile.value) {
    e.preventDefault()
    if (searchInputRef.value) searchInputRef.value.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.tab-4 {
  tab-size: 4;
}
</style>
