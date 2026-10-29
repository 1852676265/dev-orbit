<template>
  <div class="cmd-detail-shell">
    <!-- 顶栏 -->
    <div class="right-island-header">
      <div class="flex items-center gap-2 text-xs text-slate-300">
        <Terminal class="w-4 h-4 text-teal-400" />
        <span class="font-bold">命令详情与速查</span>
        <span class="text-slate-500 font-mono">· 右键或双击更多操作</span>
      </div>

      <div class="view-mode-seg">
        <button
          type="button"
          class="mode-btn"
          :class="{ 'is-on': viewMode === 'spotlight' }"
          @click="$emit('update:viewMode', 'spotlight')"
        >
          预览视图
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ 'is-on': viewMode === 'grid' }"
          @click="$emit('update:viewMode', 'grid')"
        >
          卡片网格
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ 'is-on': viewMode === 'list' }"
          @click="$emit('update:viewMode', 'list')"
        >
          高密清单
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredNotes.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
      <Terminal class="w-12 h-12 mb-3 opacity-30 text-teal-400" />
      <p class="text-sm font-semibold text-slate-200">当前没有命令数据</p>
      <p class="text-xs text-slate-400 mt-1 max-w-sm">可通过左侧「TXT 批量导入」载入本地脚本，或点击「新增命令」录入</p>
    </div>

    <!-- 模式 1：Spotlight 选中大预览 -->
    <div v-else-if="viewMode === 'spotlight' && activeCommand" class="flex-1 overflow-y-auto p-6 custom-scrollbar">
      <div class="flex items-center gap-2">
        <span
          class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border"
          :style="{
            color: getTagColor(activeCommand.tag),
            borderColor: getTagColor(activeCommand.tag) + '55',
            backgroundColor: getTagColor(activeCommand.tag) + '18'
          }"
        >
          {{ activeCommand.tag || '通用' }}
        </span>
        <span v-if="activeCommand.isPinned" class="px-2 py-0.5 rounded-md text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/35">
          📌 常用置顶
        </span>
      </div>

      <h2 class="text-lg font-bold text-white mt-3">{{ activeCommand.title }}</h2>

      <pre
        class="spotlight-code-block font-mono select-all"
        title="点击直接复制整条命令 · 右键更多操作"
        @click="$emit('copy', getCmd(activeCommand))"
        @contextmenu.prevent="$emit('contextmenu', $event, activeCommand)"
      >$ {{ getCmd(activeCommand) }}</pre>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="glass-action-btn is-primary px-4 py-1.5"
          @click="$emit('copy', getCmd(activeCommand))"
        >
          <Copy class="w-3.5 h-3.5" />
          <span>复制命令</span>
        </button>
        <button
          type="button"
          class="glass-action-btn px-3 py-1.5"
          @click="$emit('toggle-pin', activeCommand)"
        >
          <Pin class="w-3.5 h-3.5" :class="{ 'text-amber-400 fill-amber-400': activeCommand.isPinned }" />
          <span>{{ activeCommand.isPinned ? '取消置顶' : '设为置顶' }}</span>
        </button>
        <button
          type="button"
          class="glass-action-btn px-3 py-1.5"
          @click="$emit('edit', activeCommand)"
        >
          <Pencil class="w-3.5 h-3.5" />
          <span>编辑</span>
        </button>
        <button
          type="button"
          class="glass-action-btn px-3 py-1.5 hover:text-rose-400"
          @click="$emit('delete', activeCommand.id)"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>删除 (右键亦可)</span>
        </button>
      </div>

      <!-- 同分类其他命令 -->
      <div v-if="sameCategoryCommands.length > 0" class="mt-7">
        <div class="text-xs font-bold text-slate-400 mb-2.5">
          同分类其他命令 ({{ activeCommand.tag || '通用' }} · {{ sameCategoryCommands.length }})
        </div>
        <div class="space-y-2">
          <div
            v-for="rel in sameCategoryCommands"
            :key="rel.id"
            class="related-cmd-row"
            @click="$emit('select', rel.id)"
            @contextmenu.prevent="$emit('contextmenu', $event, rel)"
          >
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-slate-200 truncate">{{ rel.title }}</div>
              <div class="text-xs font-mono text-teal-300/80 truncate mt-0.5">$ {{ getCmd(rel) }}</div>
            </div>
            <button
              type="button"
              class="glass-action-btn text-xs px-2.5 py-1"
              @click.stop="$emit('copy', getCmd(rel))"
            >
              复制
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式 2：卡片网格 -->
    <div v-else-if="viewMode === 'grid'" class="flex-1 p-4 overflow-y-auto custom-scrollbar">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3.5 items-start content-start">
        <div
          v-for="item in filteredNotes"
          :key="item.id"
          class="glass-subcard p-3.5 flex flex-col gap-2.5 group cursor-pointer"
          @click="$emit('select', item.id)"
          @contextmenu.prevent="$emit('contextmenu', $event, item)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span
                class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                :style="{
                  color: getTagColor(item.tag),
                  borderColor: getTagColor(item.tag) + '50',
                  backgroundColor: getTagColor(item.tag) + '15'
                }"
              >
                {{ item.tag || '通用' }}
              </span>
              <span v-if="item.isPinned" class="text-[10px] text-amber-400 font-mono">📌 置顶</span>
            </div>
            <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
              <button @click.stop="$emit('toggle-pin', item)" class="p-1 text-slate-400 hover:text-amber-400 rounded">
                <Pin class="w-3.5 h-3.5" :class="{ 'text-amber-400 fill-amber-400': item.isPinned }" />
              </button>
              <button @click.stop="$emit('edit', item)" class="p-1 text-slate-400 hover:text-teal-300 rounded">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button @click.stop="$emit('delete', item.id)" class="p-1 text-slate-400 hover:text-rose-400 rounded" title="右键亦可删除">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <h3 class="text-xs font-bold text-white leading-snug line-clamp-2">{{ item.title }}</h3>
          <div
            @click.stop="$emit('copy', getCmd(item))"
            class="cursor-pointer p-2 rounded-lg bg-black/45 border border-white/10 text-teal-300 font-mono text-xs hover:border-teal-500/40 transition flex items-center justify-between select-all"
          >
            <span class="truncate mr-2">$ {{ getCmd(item) }}</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-teal-500/15 text-teal-300 flex-shrink-0">复制</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式 3：高密清单 -->
    <div v-else class="flex-1 p-3 overflow-y-auto space-y-1.5 custom-scrollbar">
      <div
        v-for="item in filteredNotes"
        :key="item.id"
        @click="$emit('select', item.id)"
        @contextmenu.prevent="$emit('contextmenu', $event, item)"
        class="glass-subcard p-2.5 px-3 cursor-pointer flex items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 flex-shrink-0">
            {{ item.tag || '通用' }}
          </span>
          <span class="font-bold text-white truncate max-w-sm">{{ item.title }}</span>
          <span class="font-mono text-teal-300/80 truncate">$ {{ getCmd(item) }}</span>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button @click.stop="$emit('copy', getCmd(item))" class="px-2 py-0.5 rounded text-[11px] bg-teal-500/15 text-teal-300 font-bold">复制</button>
          <button @click.stop="$emit('edit', item)" class="p-1 text-slate-400 hover:text-white"><Pencil class="w-3 h-3" /></button>
          <button @click.stop="$emit('delete', item.id)" class="p-1 text-slate-400 hover:text-rose-400" title="右键亦可删除"><Trash2 class="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Terminal, Copy, Pin, Pencil, Trash2 } from 'lucide-vue-next'

defineProps({
  viewMode: { type: String, default: 'spotlight' },
  filteredNotes: { type: Array, default: () => [] },
  activeCommand: { type: Object, default: null },
  sameCategoryCommands: { type: Array, default: () => [] },
  getCmd: { type: Function, required: true },
  getTagColor: { type: Function, required: true }
})

defineEmits(['update:viewMode', 'copy', 'toggle-pin', 'edit', 'delete', 'select', 'contextmenu'])
</script>

<style scoped>
.cmd-detail-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.right-island-header {
  height: 46px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(2, 6, 23, 0.25);
  flex-shrink: 0;
}

.view-mode-seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-btn {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
}

.mode-btn.is-on {
  background: rgba(20, 184, 166, 0.2);
  color: #5eead4;
  font-weight: 700;
}

.spotlight-code-block {
  margin: 14px 0;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.65);
  border: 1px solid rgba(45, 212, 191, 0.25);
  color: #5eead4;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  cursor: pointer;
}

.related-cmd-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.related-cmd-row:hover {
  border-color: rgba(45, 212, 191, 0.35);
  background: rgba(255, 255, 255, 0.07);
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

</style>
