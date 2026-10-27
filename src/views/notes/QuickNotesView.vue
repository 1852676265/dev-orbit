<template>
  <div class="h-full w-full flex flex-col p-3 md:p-4 overflow-hidden select-none relative font-sans text-slate-100">
    
    <!-- ===================================================================== -->
    <!-- 极客全息矩阵中枢 (统一双翼骨架 - 随手记 & 常用命令军火库)                 -->
    <!-- ===================================================================== -->
    <div
      class="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300"
      style="background: rgba(14, 19, 31, 0.72); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 10px 40px rgba(0,0,0,0.5);"
    >

      <!-- 1. 顶层速战一体指挥栏 (Command Bar) -->
      <div
        class="h-13 px-5 border-b border-white/5 flex items-center justify-between gap-4 flex-shrink-0 z-20 bg-[#121826]/70"
      >
        <!-- 搜索过滤框 -->
        <div class="flex items-center gap-3 flex-1 max-w-md relative">
          <Terminal class="w-4 h-4 text-teal-400 flex-shrink-0 animate-pulse" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="穿透检索命令说明、参数或脚本内容... (按 / 聚焦，↑↓ 切换)"
            class="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="text-slate-400 hover:text-slate-200 p-1"
          >
            <X class="w-3.5 h-3.5" />
          </button>
          <kbd
            v-else
            class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border border-white/10 bg-white/5 text-slate-400 opacity-60"
          >
            /
          </kbd>
        </div>

        <!-- 分类胶囊流 (全量分类快速切换) -->
        <div class="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          <div class="flex items-center p-0.5 rounded-xl border border-white/10 bg-black/40 text-xs">
            <button
              @click="selectedCategory = 'all'"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition"
              :class="selectedCategory === 'all'
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'"
            >
              全部 ({{ notes.length }})
            </button>
            <button
              v-for="cat in categoryList"
              :key="cat.id"
              @click="selectedCategory = cat.id"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              :class="selectedCategory === cat.id
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'"
            >
              <span>{{ cat.name }}</span>
              <span v-if="cat.count > 0" class="text-[10px] font-mono opacity-60">({{ cat.count }})</span>
            </button>
          </div>
        </div>

        <!-- 快捷操作按钮 -->
        <div class="flex items-center gap-2">
          <button
            @click="openAddModal"
            class="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-teal-950/40"
            title="添加新命令 (快捷键 Ctrl+N)"
          >
            <Plus class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">新增命令</span>
          </button>
          <button
            @click="openBatchModal"
            class="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="批量导入命令"
          >
            <Upload class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 2. 双屏极客中枢架构 (左翼：超高密命令条目 36% + 右翼：全息命令行动舱 64%) -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- ==================== 左翼：超高密度命令索引流 ==================== -->
        <div
          class="w-5/12 max-w-md min-w-[320px] border-r border-white/5 flex flex-col overflow-hidden transition-all duration-300 bg-black/30"
        >
          <!-- 统计与分类信息 -->
          <div
            class="h-8 px-4 border-b border-white/5 flex items-center justify-between text-[11px] font-mono flex-shrink-0 bg-white/[0.02] text-slate-400"
          >
            <span class="flex items-center gap-1.5">
              <Code2 class="w-3.5 h-3.5 text-teal-400" />
              <span>常用命令索引 ({{ filteredNotes.length }})</span>
            </span>
            <span class="text-teal-400 font-medium">
              支持一键直拷与运行
            </span>
          </div>

          <!-- 命令条目列表 (一屏容纳 15+ 项，按上下键秒级切换) -->
          <div
            ref="noteListContainerRef"
            class="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar"
          >
            <div
              v-if="filteredNotes.length === 0"
              class="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500"
            >
              <Terminal class="w-10 h-10 mb-2 opacity-40" />
              <p class="text-xs font-medium">未找到匹配的命令条目</p>
              <button @click="openAddModal" class="mt-2 text-xs text-teal-400 underline">新建一条命令</button>
            </div>

            <!-- 条目卡片 (统一黑曜微晶质感，左边缘光条) -->
            <div
              v-for="(item, idx) in filteredNotes"
              :key="item.id"
              :id="`note-item-${idx}`"
              @click="focusedIndex = idx"
              class="note-item-card"
              :class="{ 'is-focused': focusedIndex === idx }"
            >
              <!-- 聚焦高亮左边缘晶体微光条 -->
              <div v-if="focusedIndex === idx" class="active-indicator" />

              <!-- 左侧：分类微标 + 标题 + 缩略命令 -->
              <div class="note-item-content">
                <div class="note-item-meta">
                  <span
                    class="note-tag-badge"
                    :style="{
                      color: getTagColor(item.tag),
                      borderColor: getTagColor(item.tag) + '40',
                      backgroundColor: getTagColor(item.tag) + '15'
                    }"
                  >
                    {{ item.tag || '通用' }}
                  </span>
                  <span class="note-date-text">
                    {{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '' }}
                  </span>
                </div>

                <!-- 作用说明 / 标题 -->
                <h3 class="note-title-text" :class="{ 'is-active': focusedIndex === idx }">
                  {{ item.title }}
                </h3>

                <!-- 命令代码缩略 -->
                <div class="note-cmd-preview">
                  $ {{ item.command }}
                </div>
              </div>

              <!-- 右侧：快捷复制钮与箭头 -->
              <div class="note-item-actions">
                <button
                  @click.stop="copyCommand(item.command)"
                  class="copy-quick-btn"
                  title="一键复制命令"
                >
                  <Copy class="icon-small" />
                </button>
                <ChevronRight
                  class="arrow-icon"
                  :class="{ 'is-active': focusedIndex === idx }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== 右翼：全息命令行动舱 (免弹窗代码生产台) ==================== -->
        <div
          v-if="currentNote"
          class="flex-1 flex flex-col overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar transition-all duration-300 bg-black/20"
        >
          <!-- 1. 命令头部属性与工具条 -->
          <div
            class="p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition shadow-sm bg-[#121826]/80"
          >
            <div class="space-y-1.5 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  :style="{
                    color: getTagColor(currentNote.tag),
                    borderColor: getTagColor(currentNote.tag) + '50',
                    backgroundColor: getTagColor(currentNote.tag) + '15'
                  }"
                >
                  {{ currentNote.tag || '通用分类' }}
                </span>
                <span class="text-[10px] font-mono text-slate-500">
                  创建时间: {{ currentNote.createdAt ? new Date(currentNote.createdAt).toLocaleString() : '本地缓存' }}
                </span>
              </div>

              <!-- 标题与描述 -->
              <h2 class="text-base font-bold leading-relaxed text-white">
                {{ currentNote.title }}
              </h2>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <!-- 一键复制 -->
              <button
                @click="copyCommand(currentNote.command)"
                class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-teal-950/40"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>一键复制</span>
              </button>

              <!-- 编辑 -->
              <button
                @click="editNote(currentNote)"
                class="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition flex items-center gap-1.5"
              >
                <Pencil class="w-3.5 h-3.5" />
                <span>编辑</span>
              </button>

              <!-- 删除 -->
              <button
                @click="deleteNote(currentNote.id)"
                class="p-2 rounded-xl text-xs transition border border-rose-500/20 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50"
                title="删除该命令"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 2. 大屏极客等宽命令代码框 (核心工作区) -->
          <div
            class="p-4 rounded-xl border border-white/5 space-y-3 transition shadow-sm bg-[#121826]/80"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Terminal class="w-4 h-4 text-teal-400" />
                <span>可执行命令行脚本</span>
              </span>
              <span class="text-[10px] font-mono text-slate-500">点击内容亦可全选复制</span>
            </div>

            <!-- 终端风格代码块 -->
            <div
              @click="copyCommand(currentNote.command)"
              class="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-teal-300 leading-relaxed cursor-pointer hover:border-teal-500/40 transition select-all relative group shadow-inner"
            >
              <div class="flex items-start gap-2">
                <span class="text-teal-500/70 select-none font-bold">$</span>
                <span class="flex-1 whitespace-pre-wrap break-all">{{ currentNote.command }}</span>
              </div>
              <span class="absolute right-3 top-3 px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                点击复制
              </span>
            </div>
          </div>

          <!-- 3. 参数快速调试与替换抽屉 -->
          <div
            class="p-4 rounded-xl border border-white/5 space-y-3 transition shadow-sm bg-[#121826]/80"
          >
            <div class="flex items-center justify-between text-xs font-bold text-slate-200">
              <span class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-amber-400" />
                <span>快速运行与参数调优小抽屉</span>
              </span>
              <span class="text-[10px] text-slate-500 font-mono">在当前工作区拉起执行</span>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button
                @click="runInTerminal(currentNote.command)"
                class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-2 transition"
              >
                <Terminal class="w-3.5 h-3.5 text-teal-400" />
                <span>在命令行终端中拉起工作区</span>
              </button>
            </div>
          </div>

        </div>

        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500"
        >
          <Code2 class="w-12 h-12 text-slate-600 mb-3" />
          <p class="text-sm font-medium">请从左侧选择一条常用命令</p>
          <p class="text-xs text-slate-600 mt-1">支持通过 ↑ ↓ 键盘方向键无缝切换查看</p>
        </div>

      </div>

      <!-- 3. 底部状态与快捷键提示行 -->
      <div
        class="h-8 px-5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono flex-shrink-0 select-none bg-black/40 text-slate-400"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5 text-teal-400 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            军火库系统就绪
          </span>
          <span class="hidden md:inline text-slate-500 opacity-40">|</span>
          <span class="hidden md:inline truncate max-w-sm">
            {{ currentNote ? currentNote.title : '未选择命令' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <span class="hidden sm:inline">↑↓ 切换命令</span>
          <span class="hidden sm:inline">Ctrl+C 复制</span>
          <span class="text-teal-400/90 font-bold">DevOrbit Snippets</span>
        </div>
      </div>

    </div>

    <!-- 单条命令添加 / 编辑弹窗 -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 text-slate-100 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h3 class="text-sm font-bold flex items-center gap-2">
            <BookMarked class="w-4 h-4 text-teal-400" />
            {{ editingId ? '编辑命令' : '添加常用命令' }}
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="saveNote" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-300">分类标签</label>
            <input
              v-model="form.tag"
              required
              placeholder="如: 发布脚本, Docker, Git, Linux, SQL, Redis..."
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-300">说明标题</label>
            <input
              v-model="form.title"
              required
              placeholder="如: 默认发布：发布指定日期的所有服务"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-300">脚本命令</label>
            <textarea
              v-model="form.command"
              required
              rows="4"
              placeholder="如: bash deploy-jars.sh 2026-09-10"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-700"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-5 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-sm"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 批量导入弹窗 -->
    <div v-if="showBatchModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 text-slate-100 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h3 class="text-sm font-bold flex items-center gap-2">
            <Upload class="w-4 h-4 text-teal-400" />
            批量导入命令
          </h3>
          <button @click="showBatchModal = false" class="text-slate-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <textarea
            v-model="batchText"
            rows="6"
            placeholder="支持 Markdown 格式导入:&#10;### 分类名称&#10;# 命令说明&#10;```bash&#10;bash your-script.sh&#10;```"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
          ></textarea>

          <div class="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              @click="showBatchModal = false"
              class="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-700"
            >
              取消
            </button>
            <button
              type="button"
              @click="importBatch"
              class="px-5 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-sm"
            >
              开始导入
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Terminal, X, Plus, Upload, Code2, Copy, ChevronRight, Pencil, Trash2, Sparkles, BookMarked
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const notes = ref([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const focusedIndex = ref(0)
const searchInputRef = ref(null)

const showModal = ref(false)
const showBatchModal = ref(false)
const editingId = ref(null)
const batchText = ref('')

const form = ref({
  tag: '发布脚本',
  title: '',
  command: ''
})

// 分类统计
const categoryList = computed(() => {
  const map = new Map()
  for (const n of notes.value) {
    const t = (n.tag || '通用').trim()
    if (!map.has(t)) {
      map.set(t, { id: t, name: t, count: 0 })
    }
    map.get(t).count++
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
})

// 过滤后的命令
const filteredNotes = computed(() => {
  return notes.value.filter(n => {
    if (selectedCategory.value !== 'all' && (n.tag || '通用').trim() !== selectedCategory.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const inTitle = (n.title || '').toLowerCase().includes(q)
      const inCmd = (n.command || '').toLowerCase().includes(q)
      const inTag = (n.tag || '').toLowerCase().includes(q)
      if (!inTitle && !inCmd && !inTag) return false
    }
    return true
  })
})

const currentNote = computed(() => {
  if (filteredNotes.value.length === 0) return null
  const idx = Math.min(focusedIndex.value, filteredNotes.value.length - 1)
  return filteredNotes.value[idx] || null
})

watch(filteredNotes, (newList) => {
  if (newList.length === 0) {
    focusedIndex.value = 0
  } else if (focusedIndex.value >= newList.length) {
    focusedIndex.value = newList.length - 1
  }
})

onMounted(async () => {
  await loadNotes()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

async function loadNotes() {
  if (!window.electronAPI || !window.electronAPI.getQuickNotes) return
  try {
    const data = await window.electronAPI.getQuickNotes()
    notes.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('加载命令库失败', e)
  }
}

function getTagColor(tag) {
  const t = (tag || '').toLowerCase()
  if (t.includes('发布') || t.includes('deploy')) return '#2DD4BF'
  if (t.includes('docker') || t.includes('k8s')) return '#38BDF8'
  if (t.includes('git') || t.includes('svn')) return '#FB923C'
  if (t.includes('linux')) return '#A3E635'
  if (t.includes('sql') || t.includes('dm8') || t.includes('oracle')) return '#FBBF24'
  if (t.includes('nginx')) return '#F472B6'
  return '#94A3B8'
}

async function copyCommand(cmd) {
  if (!cmd) return
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(cmd)
    } else {
      await navigator.clipboard.writeText(cmd)
    }
    emit('toast', '已成功复制命令至剪贴板！', 'success')
  } catch (e) {
    emit('toast', '复制失败', 'error')
  }
}

function openAddModal() {
  editingId.value = null
  form.value = {
    tag: selectedCategory.value !== 'all' ? selectedCategory.value : '发布脚本',
    title: '',
    command: ''
  }
  showModal.value = true
}

function editNote(item) {
  editingId.value = item.id
  form.value = {
    tag: item.tag,
    title: item.title,
    command: item.command
  }
  showModal.value = true
}

async function saveNote() {
  if (!window.electronAPI || !window.electronAPI.saveQuickNote) return
  try {
    const payload = {
      id: editingId.value || undefined,
      tag: form.value.tag.trim(),
      title: form.value.title.trim(),
      command: form.value.command.trim()
    }
    await window.electronAPI.saveQuickNote(payload)
    showModal.value = false
    await loadNotes()
    emit('toast', '命令已保存！', 'success')
  } catch (e) {
    emit('toast', '保存失败: ' + e.message, 'error')
  }
}

async function deleteNote(id) {
  if (!confirm('确认删除该条命令吗？')) return
  try {
    await window.electronAPI.deleteQuickNote(id)
    await loadNotes()
    emit('toast', '已删除命令', 'success')
  } catch (e) {
    emit('toast', '删除失败', 'error')
  }
}

function openBatchModal() {
  batchText.value = ''
  showBatchModal.value = true
}

async function importBatch() {
  if (!batchText.value.trim()) return
  try {
    const lines = batchText.value.split('\n')
    const list = []
    let currentTag = '导入常用'
    let currentTitle = ''
    let inCode = false
    let codeBuffer = []

    for (let line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('###')) {
        currentTag = trimmed.replace(/^###\s*/, '')
      } else if (trimmed.startsWith('#')) {
        currentTitle = trimmed.replace(/^#\s*/, '')
      } else if (trimmed.startsWith('```')) {
        if (inCode) {
          if (currentTitle && codeBuffer.length > 0) {
            list.push({
              tag: currentTag,
              title: currentTitle,
              command: codeBuffer.join('\n')
            })
          }
          currentTitle = ''
          codeBuffer = []
          inCode = false
        } else {
          inCode = true
        }
      } else if (inCode) {
        codeBuffer.push(line)
      }
    }

    if (list.length > 0 && window.electronAPI.saveQuickNotesBatch) {
      await window.electronAPI.saveQuickNotesBatch(list)
      showBatchModal.value = false
      await loadNotes()
      emit('toast', `已成功批量导入 ${list.length} 条命令！`, 'success')
    } else {
      alert('未识别到有效的 Markdown 代码块')
    }
  } catch (e) {
    emit('toast', '导入失败: ' + e.message, 'error')
  }
}

function runInTerminal(cmd) {
  if (window.electronAPI && window.electronAPI.openInTerminal) {
    window.electronAPI.openInTerminal('')
    emit('toast', '已在终端打开工作区，可按 Ctrl+V 粘贴执行', 'info')
  }
}

function handleKeydown(e) {
  const tag = e.target.tagName.toLowerCase()
  if (tag === 'textarea' || (tag === 'input' && e.key !== 'Escape')) {
    if (e.key === 'Escape') e.target.blur()
    return
  }

  if (e.key === '/') {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (focusedIndex.value < filteredNotes.value.length - 1) {
      focusedIndex.value++
      scrollToActive()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (focusedIndex.value > 0) {
      focusedIndex.value--
      scrollToActive()
    }
  } else if (e.key === 'Enter') {
    if (currentNote.value) {
      e.preventDefault()
      copyCommand(currentNote.value.command)
    }
  }
}

function scrollToActive() {
  nextTick(() => {
    const el = document.getElementById(`note-item-${focusedIndex.value}`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}
</script>

<style scoped>
.note-item-card {
  position: relative;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.15s ease-in-out;
  user-select: none;
  color: #cbd5e1;
}

.note-item-card:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.note-item-card.is-focused {
  background-color: rgba(19, 78, 74, 0.35);
  border-color: rgba(45, 212, 191, 0.65);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.2);
  color: #ffffff;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 80%;
  background-color: #2dd4bf;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(45, 212, 191, 0.6);
}

.note-item-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  padding-left: 4px;
}

.note-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.note-tag-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  border-width: 1px;
}

.note-date-text {
  font-size: 10px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.note-title-text {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  color: #e2e8f0;
  transition: color 0.15s ease;
}

.note-title-text.is-active,
.note-item-card:hover .note-title-text {
  color: #5eead4;
}

.note-cmd-preview {
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  opacity: 0.8;
}

.note-item-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-quick-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}
.copy-quick-btn:hover {
  background-color: rgba(45, 212, 191, 0.2);
  color: #2dd4bf;
}

.arrow-icon {
  width: 14px;
  height: 14px;
  color: #475569;
  opacity: 0.4;
  transition: all 0.15s ease;
}

.arrow-icon.is-active,
.note-item-card:hover .arrow-icon {
  color: #2dd4bf;
  opacity: 1;
  transform: translateX(2px);
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
