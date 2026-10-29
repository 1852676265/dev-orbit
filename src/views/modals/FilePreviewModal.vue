<template>
  <Teleport to="body">
    <div
      v-if="isModalVisible"
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
              @keydown.enter.exact="jumpNextMatch"
              @keydown.shift.enter.exact="jumpPrevMatch"
              @keydown.esc.prevent.stop="handleSearchEsc"
              type="text"
              placeholder="查找关键字 (Enter 下一个)..."
              class="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-44 font-mono"
            />
            <span v-if="searchMatches.length > 0" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold">
              {{ currentMatchIndex + 1 }}/{{ searchMatches.length }}
            </span>
            <div v-if="searchMatches.length > 0" class="flex items-center gap-0.5">
              <button
                type="button"
                @click="jumpPrevMatch"
                title="上一个 (Shift+Enter)"
                class="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronUp class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="jumpNextMatch"
                title="下一个 (Enter)"
                class="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition cursor-pointer"
              title="清除搜索"
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
              <!-- 编辑模式：镜像高亮衬底 + 原生 TextArea -->
              <div v-if="isEditing" class="relative flex-1 min-h-0 w-full overflow-hidden">
                <!-- 镜像高亮底衬：与 textarea 严格 1:1 像素与排版对齐 -->
                <div
                  ref="editorBackdropRef"
                  aria-hidden="true"
                  class="editor-layer editor-backdrop"
                  v-html="renderedEditorBackdrop"
                ></div>
                <textarea
                  ref="editorTextareaRef"
                  v-model="textContent"
                  @scroll="syncScroll"
                  @input="handleTextareaInput"
                  @keydown.ctrl.s.prevent="saveContent"
                  class="editor-layer editor-textarea custom-scrollbar"
                  placeholder="在此直接输入或修改内容，按 Ctrl+S 立即保存..."
                  spellcheck="false"
                ></textarea>
              </div>

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
                  :class="{ 'bg-teal-500/15 text-teal-100 font-medium -mx-4 px-4': isLineMatched(idx + 1) }"
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
  ExternalLink, FolderOpen, Copy, Check, Search, X, Pencil, Save, RefreshCw,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  show: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: false },
  filePath: { type: String, default: '' },
  fileName: { type: String, default: '' },
  initialEdit: { type: Boolean, default: false },
  initialEditMode: { type: Boolean, default: false },
  targetLine: { type: Number, default: 0 }
})

const emit = defineEmits(['update:visible', 'update:show', 'update:isOpen', 'close', 'toast', 'file-saved'])

const isModalVisible = computed(() => props.visible || props.show || props.isOpen)

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
const editorBackdropRef = ref(null)

// 辅助 HTML 转义
function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

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

// 编辑模式下的背景高亮衬底 (文字透明，仅渲染高亮底色与当前项焦点)
const renderedEditorBackdrop = computed(() => {
  const text = textContent.value
  if (!text) return ''
  const q = (searchQuery.value || '').trim()
  if (!q || searchMatches.value.length === 0) {
    return escapeHtml(text) + (text.endsWith('\n') ? ' ' : '')
  }

  const matches = searchMatches.value
  const activeIdx = currentMatchIndex.value
  const fragments = []
  let lastEnd = 0

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    if (m.startIndex > lastEnd) {
      fragments.push(escapeHtml(text.slice(lastEnd, m.startIndex)))
    }
    const matchText = escapeHtml(text.slice(m.startIndex, m.endIndex))
    const isCurrent = i === activeIdx
    const markClass = isCurrent ? 'editor-search-mark is-current' : 'editor-search-mark'
    fragments.push(`<mark class="${markClass}">${matchText}</mark>`)
    lastEnd = m.endIndex
  }

  if (lastEnd < text.length) {
    fragments.push(escapeHtml(text.slice(lastEnd)))
  }

  if (text.endsWith('\n')) {
    fragments.push(' ')
  }

  return fragments.join('')
})

// 预览模式下的代码行高亮渲染 (当前项强高亮、其它匹配项柔和高亮)
const highlightedLines = computed(() => {
  const text = textContent.value
  if (!text) return []
  const lines = text.split('\n')
  const q = (searchQuery.value || '').trim()
  if (!q || searchMatches.value.length === 0) {
    return lines.map((line) => escapeHtml(line) || '&nbsp;')
  }

  const activeIdx = currentMatchIndex.value
  const matches = searchMatches.value

  let matchCursor = 0
  let lineStartOffset = 0

  return lines.map((line) => {
    const lineEndOffset = lineStartOffset + line.length
    const lineMatches = []

    while (matchCursor < matches.length && matches[matchCursor].startIndex < lineEndOffset) {
      if (matches[matchCursor].endIndex <= lineEndOffset) {
        lineMatches.push(matches[matchCursor])
      }
      matchCursor++
    }

    if (lineMatches.length === 0) {
      lineStartOffset = lineEndOffset + 1
      return escapeHtml(line) || '&nbsp;'
    }

    const fragments = []
    let currentInLine = 0

    for (const m of lineMatches) {
      const startInLine = m.startIndex - lineStartOffset
      const endInLine = m.endIndex - lineStartOffset

      if (startInLine > currentInLine) {
        fragments.push(escapeHtml(line.slice(currentInLine, startInLine)))
      }

      const matchText = escapeHtml(line.slice(startInLine, endInLine))
      const isCurrent = m.id === activeIdx
      const markClass = isCurrent
        ? 'px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-300 shadow-md transition-all inline-block leading-tight'
        : 'px-0.5 py-0.5 rounded bg-teal-500/30 text-teal-200 font-semibold inline-block leading-tight'
      const idAttr = isCurrent ? 'id="active-preview-match"' : ''
      fragments.push(`<mark ${idAttr} class="${markClass}">${matchText}</mark>`)
      currentInLine = endInLine
    }

    if (currentInLine < line.length) {
      fragments.push(escapeHtml(line.slice(currentInLine)))
    }

    lineStartOffset = lineEndOffset + 1
    return fragments.join('') || '&nbsp;'
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
      // 统一将 Windows CRLF 换行符归一化为 LF，防止 textarea selectionRange 出现字符索引偏差
      textContent.value = (raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
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

watch(isModalVisible, (val) => {
  if (val) {
    loadFile(props.initialEdit || props.initialEditMode)
    if (props.targetLine > 0) {
      nextTick(() => {
        setTimeout(() => {
          scrollToTargetLine(props.targetLine)
        }, 120)
      })
    }
  }
})

function scrollToTargetLine(lineNum) {
  if (!lineNum || lineNum < 1) return
  const container = isEditing.value ? editorTextareaRef.value : viewerContainerRef.value
  if (container) {
    const lineTop = (lineNum - 1) * 20
    container.scrollTo({ top: Math.max(0, lineTop - 80), behavior: 'smooth' })
  }
}

watch(() => props.filePath, (val) => {
  if (isModalVisible.value && val) {
    loadFile(props.initialEdit || props.initialEditMode)
  }
})

// 滚动同步 (行号栏、背景高亮层与代码容器同步滚动)
function syncScroll(e) {
  if (!e || !e.target) return
  const target = e.target
  if (lineGutterRef.value) {
    lineGutterRef.value.scrollTop = target.scrollTop
  }
  if (editorBackdropRef.value) {
    editorBackdropRef.value.scrollTop = target.scrollTop
    editorBackdropRef.value.scrollLeft = target.scrollLeft
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
  nextTick(() => {
    if (isEditing.value) {
      if (editorTextareaRef.value) {
        editorTextareaRef.value.focus()
        if (searchMatches.value.length > 0 && currentMatchIndex.value >= 0) {
          scrollToMatch(currentMatchIndex.value)
        }
      }
    } else {
      if (searchMatches.value.length > 0 && currentMatchIndex.value >= 0) {
        scrollToMatch(currentMatchIndex.value)
      }
    }
  })
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

// 站内搜索定位 (基于全文精确索引查找，支持跨行定位与字符选区)
function handleSearch() {
  const q = (searchQuery.value || '').trim()
  searchMatches.value = []
  currentMatchIndex.value = -1
  if (!q || !textContent.value) return

  // 确保换行符统一为 LF，杜绝因 CRLF 多出 \r 导致的 textarea setSelectionRange 累积漂移
  if (textContent.value.includes('\r')) {
    textContent.value = textContent.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  const textarea = editorTextareaRef.value
  const text = (isEditing.value && textarea) ? textarea.value : textContent.value
  const lowerText = text.toLowerCase()
  const lowerQ = q.toLowerCase()
  const qLen = q.length
  const matches = []

  let searchIndex = lowerText.indexOf(lowerQ, 0)
  let count = 0

  // 记录每一行的起始下标，以便快速计算行号
  const lineStartIndices = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      lineStartIndices.push(i + 1)
    }
  }

  function getLineFromIndex(idx) {
    let low = 0
    let high = lineStartIndices.length - 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (lineStartIndices[mid] <= idx) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return high + 1
  }

  while (searchIndex !== -1) {
    const lineNum = getLineFromIndex(searchIndex)
    matches.push({
      id: count++,
      startIndex: searchIndex,
      endIndex: searchIndex + qLen,
      line: lineNum
    })
    searchIndex = lowerText.indexOf(lowerQ, searchIndex + qLen)
  }

  searchMatches.value = matches
  if (matches.length > 0) {
    currentMatchIndex.value = 0
    scrollToMatch(0)
  }
}

function handleTextareaInput() {
  if (searchQuery.value) {
    handleSearch()
  }
}

function jumpNextMatch() {
  if (searchMatches.value.length === 0) return
  const nextIdx = (currentMatchIndex.value + 1) % searchMatches.value.length
  scrollToMatch(nextIdx)
}

function jumpPrevMatch() {
  if (searchMatches.value.length === 0) return
  const prevIdx = (currentMatchIndex.value - 1 + searchMatches.value.length) % searchMatches.value.length
  scrollToMatch(prevIdx)
}

function scrollToMatch(idx) {
  if (idx < 0 || idx >= searchMatches.value.length) return
  currentMatchIndex.value = idx
  const match = searchMatches.value[idx]

  nextTick(() => {
    if (isEditing.value) {
      const textarea = editorTextareaRef.value
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(match.startIndex, match.endIndex)

        const lineHeight = 20
        const lineTop = (match.line - 1) * lineHeight
        const targetScrollTop = Math.max(0, lineTop - textarea.clientHeight / 2 + 30)

        textarea.scrollTop = targetScrollTop

        if (editorBackdropRef.value) {
          editorBackdropRef.value.scrollTop = targetScrollTop
        }
        if (lineGutterRef.value) {
          lineGutterRef.value.scrollTop = targetScrollTop
        }
      }
    } else {
      const container = viewerContainerRef.value
      if (container) {
        const activeEl = container.querySelector('#active-preview-match')
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          const lineTop = (match.line - 1) * 20
          container.scrollTo({
            top: Math.max(0, lineTop - container.clientHeight / 2 + 30),
            behavior: 'smooth'
          })
        }
      }
    }
  })
}

function clearSearch() {
  searchQuery.value = ''
  searchMatches.value = []
  currentMatchIndex.value = -1
  if (isEditing.value && editorTextareaRef.value) {
    const cur = editorTextareaRef.value.selectionStart || 0
    editorTextareaRef.value.setSelectionRange(cur, cur)
  }
}

function handleSearchEsc() {
  if (searchQuery.value) {
    clearSearch()
  } else {
    closeModal()
  }
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
  emit('update:show', false)
  emit('update:isOpen', false)
  emit('close')
}

// 监听 Esc 键关闭
function handleKeyDown(e) {
  if (!isModalVisible.value) return
  if (e.key === 'Escape') {
    if (searchQuery.value) {
      clearSearch()
    } else {
      closeModal()
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && isTextFile.value) {
    e.preventDefault()
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      searchInputRef.value.select()
    }
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

/* 编辑模式下的层叠布局与精确对齐 */
.editor-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem; /* text-xs: 12px */
  line-height: 1.25rem; /* leading-5: 20px */
  box-sizing: border-box;
  tab-size: 4;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.editor-backdrop {
  pointer-events: none;
  color: transparent;
  background-color: transparent;
  overflow: hidden;
  user-select: none;
  z-index: 1;
}

.editor-textarea {
  background-color: transparent;
  color: #e2e8f0;
  caret-color: #38bdf8;
  resize: none;
  outline: none;
  border: none;
  overflow: auto;
  z-index: 2;
}

/* 文本域原生选区风格与 DevOrbit 琥珀黄高亮保持协调 */
.editor-textarea::selection {
  background-color: rgba(245, 158, 11, 0.45);
  color: #ffffff;
}

/* 编辑器背景高亮匹配项 */
:deep(.editor-search-mark) {
  background-color: rgba(234, 179, 8, 0.35); /* 琥珀黄色半透明 */
  color: transparent;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.5);
}

:deep(.editor-search-mark.is-current) {
  background-color: #f59e0b; /* 琥珀黄实色 */
  color: transparent;
  border-radius: 2px;
  box-shadow: 0 0 0 2px #fbbf24, 0 0 8px rgba(245, 158, 11, 0.85);
}
</style>
