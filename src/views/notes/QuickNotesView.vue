<template>
  <div class="notes-spotlight-shell" @click="closeContextMenu">
    <!-- 主体双悬浮岛容器 -->
    <div class="notes-islands-wrap">
      <!-- 左侧悬浮岛：模块切换 + 搜索 + 分类过滤 + 列表 -->
      <CommandListPanel
        ref="listPanelRef"
        :sub-module="subModule"
        :commands-count="commands.length"
        :memos-count="memos.length"
        :search-query="searchQuery"
        :active-category="activeCategory"
        :pinned-commands-count="pinnedCommandsCount"
        :custom-categories="customCategories"
        :active-memo-tag="activeMemoTag"
        :pinned-memos-count="pinnedMemosCount"
        :all-memo-tags="allMemoTags"
        :filtered-commands="filteredCommands"
        :grouped-commands="groupedCommands"
        :collapsed-groups="collapsedGroups"
        :selected-cmd-id="selectedCommand?.id || ''"
        :filtered-memos="filteredMemos"
        :selected-memo-id="selectedMemo?.id || ''"
        @switch-module="switchSubModule"
        @update:search-query="searchQuery = $event"
        @update:active-category="activeCategory = $event"
        @update:active-memo-tag="activeMemoTag = $event"
        @create-category="handleCreateCategory"
        @delete-category="deleteCategory"
        @import-txt="importTxtCommands"
        @open-add-cmd="openCommandModal()"
        @toggle-group="toggleGroupCollapse"
        @select-cmd="selectedCommand = $event"
        @copy-cmd="copyCommandText"
        @context-cmd="(e, item) => openContextMenu(e, 'command', item)"
        @select-memo="selectedMemo = $event"
        @open-memo-preview="openMemoPreview"
        @context-memo="(e, memo) => openContextMenu(e, 'memo', memo)"
      />

      <!-- 右侧悬浮岛：命令详情工作台 / 随手记便签墙 -->
      <section class="right-workspace-island glass-island">
        <!-- 常用命令右侧详情与速查 -->
        <CommandDetailPanel
          v-if="subModule === 'commands'"
          :commands="commands"
          :filtered-commands="filteredCommands"
          :selected-command="selectedCommand"
          :related-commands="relatedCommands"
          :right-view-mode="rightViewMode"
          @update:right-view-mode="rightViewMode = $event"
          @select-cmd="selectedCommand = $event"
          @copy-cmd="copyCommandText"
          @edit-cmd="openCommandModal"
          @delete-cmd="deleteCommand"
          @toggle-pin-cmd="togglePinCommand"
          @open-add-cmd="openCommandModal()"
          @context-cmd="(e, item) => openContextMenu(e, 'command', item)"
        />

        <!-- 极速随手记右侧便签工作台 -->
        <div v-else class="memos-workspace-pane">
          <div class="right-island-header">
            <div class="flex items-center gap-2">
              <StickyNote class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-bold text-slate-200">极速随手记 & 灵感便签</span>
              <span class="text-[11px] text-slate-500">· 单击勾选待办，双击全屏阅读，右键设色/置顶</span>
            </div>
            <div class="view-mode-seg">
              <button
                class="r-seg-btn"
                :class="{ 'is-on': rightMemoLayout === 'grid' }"
                @click="rightMemoLayout = 'grid'"
              >
                便签网格
              </button>
              <button
                class="r-seg-btn"
                :class="{ 'is-on': rightMemoLayout === 'list' }"
                @click="rightMemoLayout = 'list'"
              >
                紧凑列表
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <!-- 顶部快速录入框 -->
            <MemoComposer
              :quick-preset-tags="quickPresetTags"
              :memo-color-options="memoColorOptions"
              @submit="handleAddMemo"
            />

            <!-- 随手记空状态 -->
            <div
              v-if="filteredMemos.length === 0"
              class="h-56 flex flex-col items-center justify-center text-center text-slate-500"
            >
              <StickyNote class="w-10 h-10 text-amber-500/30 mb-2" />
              <p class="text-sm font-semibold text-slate-300">暂无匹配的随手记便签</p>
              <p class="text-xs text-slate-500 mt-1">在上方输入框随手记录账号、临时 SQL、待办清单，按 Ctrl + Enter 秒存</p>
            </div>

            <!-- 便签卡片网格/列表 -->
            <div
              v-else
              :class="rightMemoLayout === 'grid' ? 'memos-grid-layout' : 'space-y-2.5'"
            >
              <MemoCard
                v-for="memo in filteredMemos"
                :key="memo.id"
                :memo="memo"
                :memo-color-options="memoColorOptions"
                @open-preview="openMemoPreview"
                @context="(e, m) => openContextMenu(e, 'memo', m)"
                @change-color="(color) => changeMemoColor(memo, color)"
                @toggle-pin="togglePinMemo(memo)"
                @copy="copyMemoText(memo.content)"
                @delete="deleteMemo(memo.id)"
                @toggle-todo="(lineIdx) => toggleMemoTodoLine(memo, lineIdx)"
                @filter-tag="activeMemoTag = $event"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 右键菜单 -->
    <NotesContextMenu
      :menu="ctxMenu"
      :memo-color-options="memoColorOptions"
      @copy-cmd="copyCommandText(ctxMenu.item?.command)"
      @toggle-pin-cmd="togglePinCommand(ctxMenu.item)"
      @edit-cmd="openCommandModal(ctxMenu.item)"
      @delete-cmd="deleteCommand(ctxMenu.item?.id)"
      @preview-memo="openMemoPreview(ctxMenu.item)"
      @edit-memo="openMemoEditModal(ctxMenu.item)"
      @copy-memo="copyMemoText(ctxMenu.item?.content)"
      @toggle-pin-memo="togglePinMemo(ctxMenu.item)"
      @change-memo-color="(color) => changeMemoColor(ctxMenu.item, color)"
      @delete-memo="deleteMemo(ctxMenu.item?.id)"
    />

    <!-- 新增/编辑命令弹窗 -->
    <n-modal
      v-model:show="showCmdModal"
      preset="card"
      class="app-modal-dialog"
      :style="{ width: '560px' }"
      :title="editingCmdId ? '编辑常用命令' : '新增常用命令'"
      :bordered="false"
      size="small"
    >
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">
            <label class="block text-xs text-slate-400 mb-1">命令标题 / 用途简述 *</label>
            <n-input v-model:value="cmdForm.title" size="small" placeholder="例如：查看 Nginx 实时错误日志" />
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">所属分类</label>
            <n-select
              v-model:value="cmdForm.category"
              size="small"
              filterable
              tag
              :options="categorySelectOptions"
              placeholder="选择或输入"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">可执行命令脚本 *</label>
          <n-input
            v-model:value="cmdForm.command"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 7 }"
            placeholder="tail -f /var/log/nginx/error.log"
            class="font-mono text-xs"
          />
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">补充说明 / 参数备注（选填）</label>
          <n-input
            v-model:value="cmdForm.note"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="参数含义或执行前置条件..."
            class="text-xs"
          />
        </div>
        <div class="flex items-center justify-between pt-2">
          <label class="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input v-model="cmdForm.pinned" type="checkbox" class="rounded border-slate-600 text-teal-500" />
            <span>置顶该条命令</span>
          </label>
          <div class="flex items-center gap-2">
            <n-button size="small" quaternary @click="showCmdModal = false">取消</n-button>
            <n-button size="small" type="primary" @click="saveCommandItem">保存命令</n-button>
          </div>
        </div>
      </div>
    </n-modal>

    <!-- 随手记全屏阅读弹窗 -->
    <MemoPreviewModal
      v-model:show="showMemoPreview"
      :memo="previewingMemo"
      @toggle-pin="togglePinMemo"
      @copy="copyMemoText"
      @edit="openMemoEditFromPreview"
      @toggle-todo="toggleMemoTodoLine"
    />

    <!-- 随手记编辑弹窗 -->
    <MemoEditModal
      v-model:show="showMemoEditModal"
      :initial-content="editingMemoItem?.content || ''"
      @save="saveEditedMemo"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { NModal, NInput, NSelect, NButton } from 'naive-ui'
import { StickyNote } from 'lucide-vue-next'
import { api } from '../../utils/api'
import CommandListPanel from './CommandListPanel.vue'
import CommandDetailPanel from './CommandDetailPanel.vue'
import MemoComposer from './MemoComposer.vue'
import MemoCard from './MemoCard.vue'
import MemoPreviewModal from './MemoPreviewModal.vue'
import MemoEditModal from './MemoEditModal.vue'
import NotesContextMenu from './NotesContextMenu.vue'

defineProps({
  isLight: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toast'])

const listPanelRef = ref(null)
const subModule = ref('commands')
const searchQuery = ref('')
const activeCategory = ref('all')
const activeMemoTag = ref('all')
const rightViewMode = ref('spotlight')
const rightMemoLayout = ref('grid')

const commands = ref([])
const memos = ref([])
const customCategories = ref(['Linux 运维', 'Docker & K8s', 'Git 常用', '数据库 SQL'])
const collapsedGroups = reactive({})

const selectedCommand = ref(null)
const selectedMemo = ref(null)

const quickPresetTags = ['#账号密码', '#待办上线', '#环境配置', '#SQL片段']
const memoColorOptions = [
  { value: 'default', label: '深空灰', dotClass: 'bg-slate-400' },
  { value: 'amber', label: '琥珀黄', dotClass: 'bg-amber-400' },
  { value: 'teal', label: '极光青', dotClass: 'bg-teal-400' },
  { value: 'sky', label: '晴空蓝', dotClass: 'bg-sky-400' }
]

const showCmdModal = ref(false)
const editingCmdId = ref(null)
const cmdForm = reactive({
  title: '',
  category: 'Linux 运维',
  command: '',
  note: '',
  pinned: false
})

const showMemoPreview = ref(false)
const previewingMemo = ref(null)
const showMemoEditModal = ref(false)
const editingMemoItem = ref(null)

const ctxMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  type: 'command',
  item: null
})

const pinnedCommandsCount = computed(() => commands.value.filter(c => c.pinned).length)
const pinnedMemosCount = computed(() => memos.value.filter(m => m.pinned).length)

const categorySelectOptions = computed(() => {
  const set = new Set([...customCategories.value, ...commands.value.map(c => c.category).filter(Boolean)])
  return Array.from(set).map(cat => ({ label: cat, value: cat }))
})

const allMemoTags = computed(() => {
  const set = new Set()
  memos.value.forEach(m => {
    ;(m.tags || []).forEach(t => set.add(t))
  })
  return Array.from(set)
})

const filteredCommands = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return commands.value
    .filter(item => {
      if (activeCategory.value === 'pinned' && !item.pinned) return false
      if (activeCategory.value !== 'all' && activeCategory.value !== 'pinned' && item.category !== activeCategory.value) {
        return false
      }
      if (!q) return true
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.command || '').toLowerCase().includes(q) ||
        (item.note || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
})

const groupedCommands = computed(() => {
  const map = new Map()
  filteredCommands.value.forEach(item => {
    const cat = item.category || '未分类'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(item)
  })
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
})

const relatedCommands = computed(() => {
  if (!selectedCommand.value) return []
  return commands.value
    .filter(c => c.id !== selectedCommand.value.id && c.category === selectedCommand.value.category)
    .slice(0, 4)
})

const filteredMemos = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return memos.value
    .filter(memo => {
      if (activeMemoTag.value === 'pinned' && !memo.pinned) return false
      if (activeMemoTag.value !== 'all' && activeMemoTag.value !== 'pinned' && !(memo.tags || []).includes(activeMemoTag.value)) {
        return false
      }
      if (!q) return true
      return (memo.content || '').toLowerCase().includes(q) || (memo.tags || []).some(t => t.toLowerCase().includes(q))
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
})

async function loadNotesData() {
  try {
    const data = await api.getNotes()
    if (data && typeof data === 'object') {
      commands.value = Array.isArray(data.commands) ? data.commands : []
      memos.value = Array.isArray(data.memos) ? data.memos : []
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        customCategories.value = data.categories
      }
      if (!selectedCommand.value && commands.value.length > 0) {
        selectedCommand.value = commands.value[0]
      }
    }
  } catch (err) {
    console.error('[QuickNotesView] loadNotesData failed:', err)
  }
}

async function persistNotesData() {
  try {
    await api.saveNotes({
      commands: commands.value,
      memos: memos.value,
      categories: customCategories.value
    })
  } catch (err) {
    console.error('[QuickNotesView] persistNotesData failed:', err)
    emit('toast', '保存数据失败: ' + err.message, 'error')
  }
}

function switchSubModule(mod) {
  subModule.value = mod
  searchQuery.value = ''
}

function handleCreateCategory(name) {
  if (!name) return
  if (!customCategories.value.includes(name)) {
    customCategories.value.push(name)
    persistNotesData()
  }
  activeCategory.value = name
  emit('toast', `已创建分类「${name}」`, 'success')
}

function deleteCategory(cat) {
  customCategories.value = customCategories.value.filter(c => c !== cat)
  if (activeCategory.value === cat) activeCategory.value = 'all'
  persistNotesData()
  emit('toast', `已移除分类「${cat}」`, 'info')
}

function toggleGroupCollapse(cat) {
  collapsedGroups[cat] = !collapsedGroups[cat]
}

function openCommandModal(item = null) {
  if (item && item.id) {
    editingCmdId.value = item.id
    cmdForm.title = item.title || ''
    cmdForm.category = item.category || 'Linux 运维'
    cmdForm.command = item.command || ''
    cmdForm.note = item.note || ''
    cmdForm.pinned = !!item.pinned
  } else {
    editingCmdId.value = null
    cmdForm.title = ''
    cmdForm.category = activeCategory.value !== 'all' && activeCategory.value !== 'pinned' ? activeCategory.value : (customCategories.value[0] || 'Linux 运维')
    cmdForm.command = ''
    cmdForm.note = ''
    cmdForm.pinned = false
  }
  showCmdModal.value = true
}

function saveCommandItem() {
  if (!cmdForm.title.trim() || !cmdForm.command.trim()) {
    emit('toast', '请填写命令标题与脚本内容', 'warning')
    return
  }
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false })
  if (editingCmdId.value) {
    const idx = commands.value.findIndex(c => c.id === editingCmdId.value)
    if (idx !== -1) {
      commands.value[idx] = {
        ...commands.value[idx],
        title: cmdForm.title.trim(),
        category: cmdForm.category || '未分类',
        command: cmdForm.command.trim(),
        note: cmdForm.note.trim(),
        pinned: cmdForm.pinned,
        updatedAt: nowStr
      }
      selectedCommand.value = commands.value[idx]
    }
    emit('toast', '命令已更新', 'success')
  } else {
    const newItem = {
      id: 'cmd_' + Date.now(),
      title: cmdForm.title.trim(),
      category: cmdForm.category || '未分类',
      command: cmdForm.command.trim(),
      note: cmdForm.note.trim(),
      pinned: cmdForm.pinned,
      createdAt: nowStr,
      updatedAt: nowStr
    }
    commands.value.unshift(newItem)
    selectedCommand.value = newItem
    emit('toast', '已新增命令', 'success')
  }
  if (cmdForm.category && !customCategories.value.includes(cmdForm.category)) {
    customCategories.value.push(cmdForm.category)
  }
  showCmdModal.value = false
  persistNotesData()
}

function deleteCommand(id) {
  commands.value = commands.value.filter(c => c.id !== id)
  if (selectedCommand.value?.id === id) {
    selectedCommand.value = filteredCommands.value[0] || null
  }
  persistNotesData()
  emit('toast', '命令已删除', 'info')
}

function togglePinCommand(item) {
  if (!item) return
  item.pinned = !item.pinned
  persistNotesData()
  emit('toast', item.pinned ? '已置顶命令' : '已取消置顶', 'success')
}

async function copyCommandText(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    emit('toast', '命令已复制到剪贴板', 'success')
  } catch (err) {
    console.error('[QuickNotesView] copyCommandText failed:', err)
  }
}

async function importTxtCommands() {
  try {
    if (!api.importTxtCommands) {
      emit('toast', '当前环境暂不支持文件导入', 'warning')
      return
    }
    const res = await api.importTxtCommands()
    if (res && Array.isArray(res.commands) && res.commands.length > 0) {
      commands.value.unshift(...res.commands)
      selectedCommand.value = commands.value[0]
      persistNotesData()
      emit('toast', `成功导入 ${res.commands.length} 条命令`, 'success')
    }
  } catch (err) {
    console.error('[QuickNotesView] importTxtCommands failed:', err)
    emit('toast', '导入失败: ' + err.message, 'error')
  }
}

function extractTags(text) {
  const matches = text.match(/#[\u4e00-\u9fa5a-zA-Z0-9_-]+/g)
  return matches ? Array.from(new Set(matches.map(t => t.slice(1)))) : []
}

function handleAddMemo(payload) {
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false })
  const newMemo = {
    id: 'memo_' + Date.now(),
    content: payload.content,
    tags: extractTags(payload.content),
    pinned: !!payload.pinned,
    color: payload.color || 'default',
    createdAt: nowStr,
    updatedAt: nowStr
  }
  memos.value.unshift(newMemo)
  selectedMemo.value = newMemo
  persistNotesData()
  emit('toast', '随手记已保存', 'success')
}

function togglePinMemo(memo) {
  if (!memo) return
  memo.pinned = !memo.pinned
  persistNotesData()
  emit('toast', memo.pinned ? '便签已置顶' : '已取消置顶', 'success')
}

function changeMemoColor(memo, color) {
  if (!memo) return
  memo.color = color
  persistNotesData()
}

function toggleMemoTodoLine(memo, lineIdx) {
  if (!memo || !memo.content) return
  const lines = memo.content.split('\n')
  const line = lines[lineIdx]
  if (typeof line !== 'string') return
  if (/^\s*-\s*\[\s\]\s+/.test(line)) {
    lines[lineIdx] = line.replace(/^(\s*-\s*)\[\s\](\s+)/, '$1[x]$2')
  } else if (/^\s*-\s*\[[xX]\]\s+/.test(line)) {
    lines[lineIdx] = line.replace(/^(\s*-\s*)\[[xX]\](\s+)/, '$1[ ]$2')
  }
  memo.content = lines.join('\n')
  persistNotesData()
}

async function copyMemoText(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    emit('toast', '便签内容已复制', 'success')
  } catch (err) {
    console.error('[QuickNotesView] copyMemoText failed:', err)
  }
}

function deleteMemo(id) {
  memos.value = memos.value.filter(m => m.id !== id)
  if (selectedMemo.value?.id === id) selectedMemo.value = null
  if (previewingMemo.value?.id === id) showMemoPreview.value = false
  persistNotesData()
  emit('toast', '便签已删除', 'info')
}

function openMemoPreview(memo) {
  selectedMemo.value = memo
  previewingMemo.value = memo
  showMemoPreview.value = true
}

function openMemoEditFromPreview(memo) {
  showMemoPreview.value = false
  openMemoEditModal(memo)
}

function openMemoEditModal(memo) {
  if (!memo) return
  editingMemoItem.value = memo
  showMemoEditModal.value = true
}

function saveEditedMemo(newContent) {
  const content = typeof newContent === 'string' ? newContent : newContent?.content
  if (!editingMemoItem.value || !content) return
  editingMemoItem.value.content = content
  editingMemoItem.value.tags = extractTags(content)
  editingMemoItem.value.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  showMemoEditModal.value = false
  persistNotesData()
  emit('toast', '随手记已更新', 'success')
}

function openContextMenu(e, type, item) {
  ctxMenu.visible = true
  ctxMenu.x = Math.min(e.clientX, window.innerWidth - 190)
  ctxMenu.y = Math.min(e.clientY, window.innerHeight - 240)
  ctxMenu.type = type
  ctxMenu.item = item
}

function closeContextMenu() {
  if (ctxMenu.visible) ctxMenu.visible = false
}

function handleContextAction(action, payload) {
  const item = ctxMenu.item
  closeContextMenu()
  if (!item) return

  if (ctxMenu.type === 'command') {
    if (action === 'copy') copyCommandText(item.command)
    else if (action === 'pin') togglePinCommand(item)
    else if (action === 'edit') openCommandModal(item)
    else if (action === 'delete') deleteCommand(item.id)
  } else {
    if (action === 'preview') openMemoPreview(item)
    else if (action === 'edit') openMemoEditModal(item)
    else if (action === 'copy') copyMemoText(item.content)
    else if (action === 'pin') togglePinMemo(item)
    else if (action === 'color') changeMemoColor(item, payload)
    else if (action === 'delete') deleteMemo(item.id)
  }
}

function focusItem(target) {
  if (!target) return
  if (target.type === 'memo' || target.content) {
    subModule.value = 'memos'
    const found = memos.value.find(m => m.id === target.id)
    if (found) openMemoPreview(found)
  } else {
    subModule.value = 'commands'
    const found = commands.value.find(c => c.id === target.id)
    if (found) selectedCommand.value = found
  }
}

function handleKeydown(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault()
    listPanelRef.value?.focusSearch()
  }
}

defineExpose({
  focusItem,
  loadNotesData
})

onMounted(() => {
  loadNotesData()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.notes-spotlight-shell {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  color: var(--app-primary-foreground);
}

.notes-islands-wrap {
  flex: 1;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.right-workspace-island {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.memos-workspace-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.right-island-header {
  height: 46px;
  padding: 0 18px;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-header-background);
}

.view-mode-seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--app-input-secondary-background);
  border: 1px solid var(--app-border);
}

.r-seg-btn {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--app-secondary-foreground);
  transition: all 0.15s ease;
}

.r-seg-btn.is-on {
  background: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  font-weight: 700;
}

.memos-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  align-items: start;
}
</style>
