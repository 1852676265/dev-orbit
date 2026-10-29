<template>
  <div
    :id="'memo-card-' + memo.id"
    draggable="true"
    class="memo-card-fixed group"
    :class="[
      boxStyleClass,
      isActive ? 'is-active-card' : '',
      isDragging ? 'is-dragging' : '',
      isDragOver ? 'is-drag-over' : ''
    ]"
    @click="$emit('select', memo)"
    @dblclick="$emit('dblclick', memo)"
    @contextmenu.prevent="$emit('contextmenu', $event, memo)"
    @dragstart="$emit('dragstart', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @dragleave="$emit('dragleave')"
    @drop="$emit('drop', $event)"
    @dragend="$emit('dragend')"
    title="拖拽可调整位置 · 双击打开全景预览 · 右键更多操作"
  >
    <!-- 卡片顶栏 -->
    <div class="memo-card-top-bar">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="drag-handle-grip" title="按住拖拽调整顺序">⋮⋮</span>
        <span
          v-if="memo.isPinned"
          class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
        >
          📌 常驻
        </span>
        <span
          v-if="memo.tag"
          class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-200"
        >
          {{ memo.tag }}
        </span>
        <span class="text-[10px] font-mono text-slate-400">
          {{ formatTime(memo.createdAt) }}
        </span>
      </div>

      <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
        <button
          type="button"
          class="icon-btn"
          title="复制内容"
          @click.stop="$emit('copy', memo.content)"
        >
          <Copy class="w-3 h-3" />
        </button>
        <button
          type="button"
          class="icon-btn"
          title="置顶常驻"
          @click.stop="$emit('toggle-pin', memo)"
        >
          <Pin class="w-3 h-3" :class="{ 'text-amber-400 fill-amber-400': memo.isPinned }" />
        </button>
        <button
          type="button"
          class="icon-btn hover:text-amber-300"
          title="编辑便签 (右键亦可)"
          @click.stop="$emit('edit', memo)"
        >
          <Pencil class="w-3 h-3" />
        </button>
        <button
          type="button"
          class="icon-btn hover:text-rose-400"
          title="删除便签 (右键亦可)"
          @click.stop="$emit('delete', memo.id)"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- 卡片标题 -->
    <div class="memo-card-title-row">
      <h4 class="memo-card-title" :title="displayTitle">
        {{ displayTitle }}
      </h4>
    </div>

    <!-- 严格固定尺寸的内容主体（无论文字多少，尺寸绝对固定） -->
    <div class="memo-card-body-fixed">
      <template v-if="cardBodyLines.length === 0">
        <span class="text-[11px] text-slate-500 italic opacity-75">（暂无附加详细内容）</span>
      </template>
      <template v-else>
        <template v-for="(line, lineIdx) in cardBodyLines" :key="lineIdx">
          <div
            v-if="line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')"
            class="flex items-start gap-1.5 py-0.5 cursor-pointer select-none"
            @click.stop="$emit('toggle-check', memo, getActualLineIdx(lineIdx))"
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
          <div v-else class="py-0.2">
            {{ line }}
          </div>
        </template>
      </template>

      <!-- 底部渐隐与双击提示 -->
      <div class="memo-bottom-fade" />
      <span class="memo-dbl-hint">双击预览 ↗</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Copy, Pin, Trash2, Pencil } from 'lucide-vue-next'

const props = defineProps({
  memo: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false },
  isDragOver: { type: Boolean, default: false }
})

defineEmits([
  'select', 'dblclick', 'contextmenu', 'copy', 'toggle-pin',
  'edit', 'delete', 'toggle-check', 'dragstart', 'dragover', 'dragleave', 'drop', 'dragend'
])

const displayTitle = computed(() => {
  if (props.memo.title && props.memo.title.trim()) {
    return props.memo.title.trim()
  }
  const first = (props.memo.content || '').split('\n')[0].replace(/^- \[[ x]\]\s*/, '').trim()
  return first || '随手记便签'
})

const cardBodyLines = computed(() => {
  const content = props.memo.content || ''
  if (!content.trim()) return []
  const allLines = content.split('\n')
  // 若未单独设 title 且内容有多行，第一行已提作标题，正文从第二行开始显示更清爽；单行则保留
  if (!props.memo.title && allLines.length > 1) {
    return allLines.slice(1)
  }
  return allLines
})

function getActualLineIdx(viewLineIdx) {
  if (!props.memo.title && (props.memo.content || '').split('\n').length > 1) {
    return viewLineIdx + 1
  }
  return viewLineIdx
}

const boxStyleClass = computed(() => {
  if (props.memo.color === 'amber') return 'memo-box-amber'
  if (props.memo.color === 'teal') return 'memo-box-teal'
  if (props.memo.color === 'sky') return 'memo-box-sky'
  return 'memo-box-default'
})

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return '今天 ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return `${d.getMonth() + 1}/${d.getDate()} ` + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.memo-card-fixed {
  height: 168px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.memo-card-fixed:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.memo-box-amber { background: rgba(36, 28, 14, 0.88); border-color: rgba(245, 158, 11, 0.35); }
.memo-box-teal { background: rgba(11, 36, 32, 0.88); border-color: rgba(20, 184, 166, 0.35); }
.memo-box-sky { background: rgba(14, 29, 46, 0.88); border-color: rgba(2, 132, 199, 0.35); }
.memo-box-default { background: rgba(22, 31, 48, 0.88); border-color: rgba(255, 255, 255, 0.1); }

.is-active-card {
  border-color: rgba(245, 158, 11, 0.7) !important;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35) !important;
}

.is-dragging {
  opacity: 0.35;
  transform: scale(0.96);
}

.is-drag-over {
  border-color: #2dd4bf !important;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.5) !important;
  transform: translateY(-4px);
}

.memo-card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.drag-handle-grip {
  font-size: 13px;
  color: #64748b;
  cursor: grab;
  line-height: 1;
}

.icon-btn {
  padding: 3px;
  border-radius: 4px;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.12s;
}

.icon-btn:hover { color: #f8fafc; }

.memo-card-title-row {
  margin-top: 6px;
  padding-bottom: 4px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.memo-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.memo-card-body-fixed {
  flex: 1;
  min-height: 0;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.6;
  color: #e2e8f0;
  word-break: break-all;
}

.memo-bottom-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent);
  pointer-events: none;
}

.memo-dbl-hint {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 9px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #94a3b8;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}

.memo-card-fixed:hover .memo-dbl-hint {
  opacity: 0.85;
}

</style>
