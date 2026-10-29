<template>
  <aside class="notes-left-island glass-island">
    <!-- 顶部双联分段切换器 (默认先看命令，随手记彻底分离) -->
    <div class="left-tools-box">
      <div class="sub-switch-pill">
        <button
          type="button"
          class="sub-switch-btn"
          :class="{ 'is-active-cmd': activeTab === 'commands' }"
          @click="$emit('update:activeTab', 'commands')"
        >
          <Terminal class="w-3.5 h-3.5" />
          <span>常用命令 ({{ totalCmds }})</span>
        </button>
        <button
          type="button"
          class="sub-switch-btn"
          :class="{ 'is-active-memo': activeTab === 'memos' }"
          @click="$emit('update:activeTab', 'memos')"
        >
          <StickyNote class="w-3.5 h-3.5" />
          <span>极速随手记 ({{ totalMemos }})</span>
        </button>
      </div>

      <!-- 分支 A：常用命令搜索与分类 -->
      <template v-if="activeTab === 'commands'">
        <div class="search-input-wrap">
          <Search class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
          <input
            :value="cmdSearchQuery"
            type="text"
            placeholder="检索命令说明、参数、服务名 (按 / 聚焦)..."
            class="glass-search-input"
            @input="$emit('update:cmdSearchQuery', $event.target.value)"
          />
          <button
            v-if="cmdSearchQuery"
            type="button"
            class="clear-btn"
            @click="$emit('update:cmdSearchQuery', '')"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- 分类胶囊条 -->
        <div class="cat-pills-row">
          <button
            type="button"
            class="cat-chip"
            :class="{ 'is-active': selectedCmdCategory === 'all' }"
            @click="$emit('update:selectedCmdCategory', 'all')"
          >
            全部 ({{ totalCmds }})
          </button>
          <button
            type="button"
            class="cat-chip"
            :class="{ 'is-active-amber': selectedCmdCategory === 'pinned' }"
            @click="$emit('update:selectedCmdCategory', 'pinned')"
          >
            📌 置顶 ({{ pinnedCmdCount }})
          </button>
          <button
            v-for="cat in allCategories"
            :key="cat.name"
            type="button"
            class="cat-chip"
            :class="{ 'is-active': selectedCmdCategory === cat.name }"
            @click="$emit('update:selectedCmdCategory', cat.name)"
          >
            <span>{{ cat.name }}</span>
            <span class="opacity-60 font-mono text-[10px] ml-0.5">{{ cat.count }}</span>
            <span
              v-if="cat.canDelete"
              class="ml-1 hover:text-rose-400"
              title="删除空分类"
              @click.stop="$emit('delete-category', cat.name)"
            >×</span>
          </button>
          <button
            type="button"
            class="cat-chip is-add"
            @click="$emit('open-new-category')"
          >
            + 分类
          </button>
        </div>

        <div class="left-action-row">
          <button
            type="button"
            class="glass-action-btn"
            @click="$emit('open-txt-import')"
          >
            <FileText class="w-3.5 h-3.5 text-teal-400" />
            <span>TXT 导入</span>
          </button>
          <button
            type="button"
            class="glass-action-btn is-primary"
            @click="$emit('open-add-cmd')"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>新增命令</span>
          </button>
        </div>
      </template>

      <!-- 分支 B：极速随手记搜索与标签 -->
      <template v-else>
        <div class="search-input-wrap">
          <Search class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <input
            :value="memoSearchQuery"
            type="text"
            placeholder="搜索随手记内容或 #标签..."
            class="glass-search-input"
            @input="$emit('update:memoSearchQuery', $event.target.value)"
          />
          <button
            v-if="memoSearchQuery"
            type="button"
            class="clear-btn"
            @click="$emit('update:memoSearchQuery', '')"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <div class="cat-pills-row">
          <button
            type="button"
            class="cat-chip"
            :class="{ 'is-active-amber': selectedMemoTag === 'all' }"
            @click="$emit('update:selectedMemoTag', 'all')"
          >
            全部 ({{ totalMemos }})
          </button>
          <button
            type="button"
            class="cat-chip"
            :class="{ 'is-active-amber': selectedMemoTag === 'pinned' }"
            @click="$emit('update:selectedMemoTag', 'pinned')"
          >
            📌 常驻 ({{ pinnedMemosCount }})
          </button>
          <button
            v-for="t in memoTagList"
            :key="t.name"
            type="button"
            class="cat-chip"
            :class="{ 'is-active-amber': selectedMemoTag === t.name }"
            @click="$emit('update:selectedMemoTag', t.name)"
          >
            {{ t.name }} ({{ t.count }})
          </button>
        </div>
      </template>
    </div>

    <!-- 左侧可滚动列表 -->
    <div class="left-list-scroll custom-scrollbar">
      <template v-if="activeTab === 'commands'">
        <div v-if="groupedCommands.length === 0" class="left-empty-box">
          <Terminal class="w-8 h-8 opacity-30 text-teal-400 mb-2" />
          <span>当前分类暂无命令</span>
        </div>
        <template v-else>
          <div
            v-for="group in groupedCommands"
            :key="group.tag"
            class="list-group-block"
          >
            <div
              class="list-group-header"
              :class="{ 'is-collapsed': isGroupCollapsed(group.tag) }"
              title="点击展开/折叠此分类"
              @click="toggleGroupCollapse(group.tag)"
            >
              <div class="group-header-left">
                <ChevronRight
                  class="group-chevron"
                  :class="{ 'is-expanded': !isGroupCollapsed(group.tag) }"
                />
                <span class="group-icon">{{ getCategoryIcon(group.tag) }}</span>
                <span class="group-name">{{ group.tag }}</span>
              </div>
              <span class="group-count">· {{ group.items.length }}</span>
            </div>

            <transition name="group-collapse">
              <div v-show="!isGroupCollapsed(group.tag)" class="group-items-container">
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  :id="'cmd-card-' + item.id"
                  class="spot-list-item"
                  :class="{ 'is-selected': activeCommandId === item.id }"
                  @click="$emit('select-cmd', item.id)"
                  @contextmenu.prevent="$emit('contextmenu', $event, 'cmd', item)"
                >
                  <span class="spot-item-ico font-mono">›_</span>
                  <div class="spot-item-body">
                    <div class="spot-item-title">{{ item.title }}</div>
                    <div class="spot-item-sub font-mono">{{ getCmd(item) }}</div>
                  </div>
                  <span v-if="item.isPinned" class="text-xs" title="已置顶">📌</span>
                </div>
              </div>
            </transition>
          </div>
        </template>
      </template>

      <template v-else>
        <div v-if="filteredMemos.length === 0" class="left-empty-box">
          <StickyNote class="w-8 h-8 opacity-30 text-amber-400 mb-2" />
          <span>暂无随手记</span>
        </div>
        <template v-else>
          <div
            v-for="memo in filteredMemos"
            :key="memo.id"
            :id="'memo-list-item-' + memo.id"
            class="spot-list-item"
            :class="{ 'is-selected-memo': activeMemoId === memo.id }"
            @click="$emit('select-memo', memo.id)"
            @contextmenu.prevent="$emit('contextmenu', $event, 'memo', memo)"
          >
            <span class="spot-item-ico is-memo">📌</span>
            <div class="spot-item-body">
              <div class="spot-item-title" :title="getMemoTitleSafe(memo)">{{ getMemoTitleSafe(memo) }}</div>
              <div class="spot-item-sub font-mono">
                <span v-if="memo.tag" class="text-amber-300 mr-1.5">{{ memo.tag }}</span>
                <span>{{ formatMemoTime(memo.createdAt) }}</span>
                <span v-if="memo.title && memo.content" class="memo-sub-summary truncate ml-1.5 text-slate-400 opacity-80" :title="getMemoFirstLine(memo.content)">· {{ getMemoFirstLine(memo.content) }}</span>
              </div>
            </div>
            <span v-if="memo.isPinned" class="text-xs">⭐</span>
          </div>
        </template>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  Terminal,
  StickyNote,
  Search,
  X,
  Plus,
  FileText,
  ChevronRight
} from 'lucide-vue-next'

const props = defineProps({
  activeTab: { type: String, default: 'commands' },
  totalCmds: { type: Number, default: 0 },
  totalMemos: { type: Number, default: 0 },
  cmdSearchQuery: { type: String, default: '' },
  selectedCmdCategory: { type: String, default: 'all' },
  pinnedCmdCount: { type: Number, default: 0 },
  allCategories: { type: Array, default: () => [] },
  memoSearchQuery: { type: String, default: '' },
  selectedMemoTag: { type: String, default: 'all' },
  pinnedMemosCount: { type: Number, default: 0 },
  memoTagList: { type: Array, default: () => [] },
  groupedCommands: { type: Array, default: () => [] },
  activeCommandId: { type: [String, Number], default: null },
  filteredMemos: { type: Array, default: () => [] },
  activeMemoId: { type: [String, Number], default: null },
  getCategoryIcon: { type: Function, required: true },
  getCmd: { type: Function, required: true },
  getMemoFirstLine: { type: Function, required: true },
  getMemoTitle: { type: Function, default: null },
  formatMemoTime: { type: Function, required: true }
})

function getMemoTitleSafe(memo) {
  if (props.getMemoTitle) return props.getMemoTitle(memo)
  if (memo?.title && memo.title.trim()) return memo.title.trim()
  return props.getMemoFirstLine(memo?.content)
}

const emit = defineEmits([
  'update:activeTab',
  'update:cmdSearchQuery',
  'update:selectedCmdCategory',
  'update:memoSearchQuery',
  'update:selectedMemoTag',
  'select-cmd',
  'select-memo',
  'open-add-cmd',
  'open-txt-import',
  'open-new-category',
  'delete-category',
  'contextmenu'
])

const STORAGE_KEY = 'devorbit_collapsed_cmd_categories'
const collapsedGroupMap = ref({})

try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const arr = JSON.parse(saved)
    if (Array.isArray(arr)) {
      arr.forEach(tag => {
        if (tag) collapsedGroupMap.value[tag] = true
      })
    }
  }
} catch (e) {
  console.warn('[CommandListPanel] 读取折叠状态失败', e)
}

function saveCollapsedState() {
  try {
    const arr = Object.keys(collapsedGroupMap.value).filter(k => collapsedGroupMap.value[k])
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch (e) {}
}

function isGroupCollapsed(tag) {
  if (props.cmdSearchQuery && props.cmdSearchQuery.trim()) {
    return false
  }
  return !!collapsedGroupMap.value[tag]
}

function toggleGroupCollapse(tag) {
  collapsedGroupMap.value[tag] = !collapsedGroupMap.value[tag]
  saveCollapsedState()
}

watch(
  () => props.activeCommandId,
  (newId) => {
    if (!newId || !props.groupedCommands) return
    for (const group of props.groupedCommands) {
      if (group.items && group.items.some(item => item.id === newId)) {
        if (collapsedGroupMap.value[group.tag]) {
          collapsedGroupMap.value[group.tag] = false
          saveCollapsedState()
        }
        break
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.notes-left-island {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.left-tools-box {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex-shrink: 0;
}

.sub-switch-pill {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border-radius: 11px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sub-switch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-switch-btn:hover { color: #f1f5f9; }

.sub-switch-btn.is-active-cmd {
  background: rgba(20, 184, 166, 0.22);
  color: #5eead4;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(20, 184, 166, 0.18);
}

.sub-switch-btn.is-active-memo {
  background: rgba(245, 158, 11, 0.22);
  color: #fcd34d;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.18);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-search-input {
  flex: 1;
  background: transparent;
  font-size: 12px;
  color: #f1f5f9;
  outline: none;
  border: none;
}

.clear-btn {
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
}

.cat-pills-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.cat-chip {
  padding: 3px 9px;
  border-radius: 7px;
  font-size: 11px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}

.cat-chip:hover { color: #f1f5f9; background: rgba(255, 255, 255, 0.09); }

.cat-chip.is-active {
  background: rgba(20, 184, 166, 0.2);
  border-color: rgba(45, 212, 191, 0.45);
  color: #5eead4;
  font-weight: 700;
}

.cat-chip.is-active-amber {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.45);
  color: #fcd34d;
  font-weight: 700;
}

.cat-chip.is-add {
  border-style: dashed;
  color: #5eead4;
}

.left-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.glass-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.15s ease;
}

.glass-action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(45, 212, 191, 0.4);
}

.glass-action-btn.is-primary {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  border-color: transparent;
  color: #042f2e;
  font-weight: 700;
}

.left-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px 12px;
}

.left-empty-box {
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
}

.list-group-block {
  margin-bottom: 6px;
}

.list-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.list-group-header:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.list-group-header.is-collapsed {
  opacity: 0.85;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.group-chevron {
  width: 13px;
  height: 13px;
  color: #64748b;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s ease;
  flex-shrink: 0;
}

.list-group-header:hover .group-chevron {
  color: #5eead4;
}

.group-chevron.is-expanded {
  transform: rotate(90deg);
}

.group-icon {
  font-size: 12px;
  line-height: 1;
}

.group-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-count {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
  margin-left: auto;
  flex-shrink: 0;
}

.group-collapse-enter-active,
.group-collapse-leave-active {
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.group-collapse-enter-from,
.group-collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.spot-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 3px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.spot-list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.spot-list-item.is-selected {
  background: rgba(20, 184, 166, 0.16);
  border-color: rgba(45, 212, 191, 0.4);
}

.spot-list-item.is-selected-memo {
  background: rgba(245, 158, 11, 0.16);
  border-color: rgba(245, 158, 11, 0.4);
}

.spot-item-ico {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(20, 184, 166, 0.14);
  color: #5eead4;
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.spot-item-ico.is-memo {
  background: rgba(245, 158, 11, 0.14);
}

.spot-item-body {
  min-width: 0;
  flex: 1;
}

.spot-item-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spot-item-sub {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

</style>
