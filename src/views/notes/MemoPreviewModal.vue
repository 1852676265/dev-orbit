<template>
  <n-modal
    :show="visible"
    preset="card"
    title="随手记便签 · 全景详情"
    :style="{ width: '560px', maxWidth: '92vw' }"
    class="glass-island app-modal-dialog"
    @update:show="(val) => { if (!val) close() }"
  >
    <div v-if="memo" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            v-if="memo.isPinned"
            class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
          >
            📌 常驻置顶
          </span>
          <span
            v-if="memo.tag"
            class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/10 text-slate-200"
          >
            {{ memo.tag }}
          </span>
          <span class="text-xs font-mono text-slate-400">
            记录于 {{ formatTime(memo.createdAt) }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <n-button size="tiny" quaternary @click="$emit('edit', memo)">
            <template #icon><Pencil class="w-3.5 h-3.5 text-amber-400" /></template>
            <span>编辑</span>
          </n-button>
          <n-button size="tiny" quaternary @click="$emit('copy', memo.content)">
            <template #icon><Copy class="w-3.5 h-3.5" /></template>
            <span>复制</span>
          </n-button>
          <n-button size="tiny" quaternary @click="$emit('toggle-pin', memo)">
            <template #icon>
              <Pin class="w-3.5 h-3.5" :class="{ 'text-amber-400 fill-amber-400': memo.isPinned }" />
            </template>
            <span>{{ memo.isPinned ? '取消' : '置顶' }}</span>
          </n-button>
          <n-button size="tiny" quaternary type="error" @click="handleDelete">
            <template #icon><Trash2 class="w-3.5 h-3.5" /></template>
            <span>删除</span>
          </n-button>
        </div>
      </div>

      <!-- 标题展示栏 -->
      <div class="preview-title-bar">
        <h3 class="preview-title">{{ displayTitle }}</h3>
      </div>

      <!-- 全文内容区 (支持滚动与待办复选框交互) -->
      <div class="preview-body custom-scrollbar">
        <template v-for="(line, idx) in (memo.content || '').split('\n')" :key="idx">
          <div
            v-if="line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')"
            class="flex items-start gap-2 py-1 cursor-pointer select-none"
            @click="$emit('toggle-check', memo, idx)"
          >
            <input
              type="checkbox"
              :checked="line.trim().startsWith('- [x] ')"
              class="rounded text-teal-400 focus:ring-0 mt-0.5 pointer-events-none"
            />
            <span :class="{ 'line-through text-slate-500 opacity-60': line.trim().startsWith('- [x] ') }">
              {{ line.replace(/^- \[[ x]\]\s*/, '') }}
            </span>
          </div>
          <div v-else class="py-0.5">
            {{ line }}
          </div>
        </template>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import { NModal, NButton } from 'naive-ui'
import { Copy, Pin, Trash2, Pencil } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  memo: { type: Object, default: null }
})

const emit = defineEmits(['close', 'copy', 'toggle-pin', 'edit', 'delete', 'toggle-check'])

const displayTitle = computed(() => {
  if (props.memo?.title && props.memo.title.trim()) {
    return props.memo.title.trim()
  }
  const first = (props.memo?.content || '').split('\n')[0].replace(/^- \[[ x]\]\s*/, '').trim()
  return first || '随手记便签'
})

function close() {
  emit('close')
}

function handleDelete() {
  if (props.memo) {
    emit('delete', props.memo.id)
    close()
  }
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.preview-title-bar {
  padding: 2px 2px 8px 2px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.preview-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.4;
  margin: 0;
  word-break: break-all;
}

.preview-body {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #f1f5f9;
  max-height: 52vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}

</style>
