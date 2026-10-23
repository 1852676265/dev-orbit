<template>
  <div class="h-full flex flex-col p-6 space-y-5">
    <!-- 顶栏：分类过滤与操作 -->
    <div class="flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-bold app-page-heading flex items-center gap-2">
          <BookMarked class="w-5 h-5 text-amber-400" />
          随手记 & 常用命令库
        </h2>
        <span class="text-xs app-page-muted">
          (已记录 {{ notes.length }} 条命令/笔记，数据存储在本地 <span class="font-mono text-emerald-400">_quick_notes/</span>)
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- 搜索框 -->
        <div class="relative w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索命令名称或内容..."
            class="w-full app-filter-box backdrop-blur-md rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder:opacity-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <button
          @click="openAddModal"
          class="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-950/40 border border-amber-400/20 transition active:scale-95"
        >
          <Plus class="w-3.5 h-3.5" />
          添加命令/笔记
        </button>
      </div>
    </div>

    <!-- 标签分类筛选胶囊 -->
    <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
      <button
        @click="selectedTag = ''"
        class="px-3 py-1 rounded-full text-xs font-medium transition border"
        :class="selectedTag === '' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'app-year-pill'"
      >
        全部 ({{ notes.length }})
      </button>
      <button
        v-for="tag in allTags"
        :key="tag"
        @click="selectedTag = tag"
        class="px-3 py-1 rounded-full text-xs font-medium transition border"
        :class="selectedTag === tag ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'app-year-pill'"
      >
        #{{ tag }}
      </button>
    </div>

    <!-- 命令卡片网格 -->
    <div class="flex-1 overflow-y-auto pr-1">
      <div v-if="filteredNotes.length === 0" class="text-center py-20 text-sm app-page-muted">
        <StickyNote class="w-10 h-10 mx-auto mb-2 opacity-50" />
        没有找到相关的命令或笔记
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="app-task-card rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group"
          :style="{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-sm font-bold app-task-title group-hover:text-amber-400 transition line-clamp-1">
                {{ note.title }}
              </h3>
              <span class="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono flex-shrink-0">
                #{{ note.tag || '通用' }}
              </span>
            </div>

            <!-- 命令内容展示与一键复制 -->
            <div class="relative app-task-tag rounded-xl p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-36 overflow-y-auto shadow-inner" style="color: var(--theme-primary)">
              {{ note.content }}
            </div>
          </div>

          <div class="mt-4 pt-3 border-t flex items-center justify-between text-xs" style="border-color: var(--card-border)">
            <span class="text-[11px] app-task-subtext">
              {{ new Date(note.createdAt).toLocaleDateString() }}
            </span>
            <div class="flex items-center gap-2">
              <button
                @click="editNote(note)"
                class="p-1 app-task-subtext hover:text-current transition"
                title="编辑"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                @click="deleteNote(note.id)"
                class="p-1 app-task-subtext hover:text-rose-400 transition"
                title="删除"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
              <!-- 一键复制 -->
              <button
                @click="copyCommand(note.content)"
                class="px-2.5 py-1 text-xs font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white rounded transition flex items-center gap-1 shadow active:scale-95"
              >
                <Copy class="w-3 h-3" />
                <span>复制命令</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑笔记弹窗 -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 text-slate-100">
        <h3 class="text-base font-semibold mb-4 flex items-center gap-2">
          <BookMarked class="w-4 h-4 text-emerald-400" />
          {{ editingId ? '编辑随手记 / 命令' : '添加新的随手记 / 命令' }}
        </h3>

        <form @submit.prevent="saveNote" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">标题 / 描述</label>
            <input
              v-model="form.title"
              required
              placeholder="如: Docker 清理无用镜像与容器"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">分类标签</label>
            <input
              v-model="form.tag"
              placeholder="如: Docker, Git, Linux, SQL, 排错"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">命令 / 笔记详细内容</label>
            <textarea
              v-model="form.content"
              required
              rows="6"
              placeholder="输入一条或多条命令、脚本或配置笔记..."
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BookMarked, Search, Plus, StickyNote, Copy, Pencil, Trash2
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const notes = ref([])
const searchQuery = ref('')
const selectedTag = ref('')

const showModal = ref(false)
const editingId = ref(null)
const form = ref({
  title: '',
  tag: '通用',
  content: ''
})

onMounted(() => {
  loadNotes()
})

async function loadNotes() {
  try {
    notes.value = await window.electronAPI.getQuickNotes()
  } catch (err) {
    console.error(err)
  }
}

const allTags = computed(() => {
  const set = new Set()
  notes.value.forEach(n => {
    if (n.tag) set.add(n.tag.trim())
  })
  return Array.from(set)
})

const filteredNotes = computed(() => {
  return notes.value.filter(n => {
    const matchTag = !selectedTag.value || n.tag === selectedTag.value
    const q = searchQuery.value.toLowerCase().trim()
    const matchQuery = !q ||
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.tag && n.tag.toLowerCase().includes(q))
    return matchTag && matchQuery
  })
})

function openAddModal() {
  editingId.value = null
  form.value = { title: '', tag: '通用', content: '' }
  showModal.value = true
}

function editNote(note) {
  editingId.value = note.id
  form.value = { title: note.title, tag: note.tag, content: note.content }
  showModal.value = true
}

async function saveNote() {
  try {
    const payload = {
      title: form.value.title.trim(),
      tag: form.value.tag.trim() || '通用',
      content: form.value.content.trim()
    }
    if (editingId.value) {
      payload.id = editingId.value
    }
    notes.value = await window.electronAPI.saveQuickNote(payload)
    showModal.value = false
    emit('toast', editingId.value ? '已更新随手记' : '已添加新随手记')
  } catch (err) {
    alert('保存失败: ' + err.message)
  }
}

async function deleteNote(id) {
  if (confirm('确认删除这条随手记吗？')) {
    notes.value = await window.electronAPI.deleteQuickNote(id)
    emit('toast', '已删除')
  }
}

async function copyCommand(text) {
  await window.electronAPI.copyToClipboard(text)
  emit('toast', '已复制命令到剪贴板！')
}
</script>
