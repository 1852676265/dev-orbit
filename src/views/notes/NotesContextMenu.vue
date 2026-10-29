<template>
  <Teleport to="body">
    <div
      v-if="menu.visible"
      class="context-menu-mask"
      @click="close"
      @contextmenu.prevent="close"
    >
      <div
        class="context-menu-box"
        :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
        @click.stop
      >
        <!-- 命令右键项 -->
        <template v-if="menu.type === 'cmd'">
          <button class="ctx-item" @click="handleAction('copy-cmd')">
            <Copy class="w-3.5 h-3.5 text-teal-400" />
            <span>复制命令</span>
          </button>
          <button class="ctx-item" @click="handleAction('pin-cmd')">
            <Pin class="w-3.5 h-3.5 text-amber-400" />
            <span>{{ menu.target?.isPinned ? '取消置顶' : '设为置顶' }}</span>
          </button>
          <button class="ctx-item" @click="handleAction('edit-cmd')">
            <Pencil class="w-3.5 h-3.5 text-sky-400" />
            <span>编辑命令</span>
          </button>
          <div class="ctx-divider" />
          <button class="ctx-item is-danger" @click="handleAction('delete-cmd')">
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除命令</span>
          </button>
        </template>

        <!-- 随手记右键项 -->
        <template v-else-if="menu.type === 'memo'">
          <button class="ctx-item" @click="handleAction('preview-memo')">
            <Maximize2 class="w-3.5 h-3.5 text-sky-400" />
            <span>全景预览 (双击)</span>
          </button>
          <button class="ctx-item" @click="handleAction('edit-memo')">
            <Pencil class="w-3.5 h-3.5 text-amber-400" />
            <span>编辑便签</span>
          </button>
          <button class="ctx-item" @click="handleAction('copy-memo')">
            <Copy class="w-3.5 h-3.5 text-teal-400" />
            <span>复制内容</span>
          </button>
          <button class="ctx-item" @click="handleAction('pin-memo')">
            <Pin class="w-3.5 h-3.5 text-amber-400" />
            <span>{{ menu.target?.isPinned ? '取消常驻' : '置顶常驻' }}</span>
          </button>
          <div class="ctx-color-row">
            <span class="text-[10px] text-slate-400 font-mono">底色:</span>
            <div class="flex items-center gap-1.5">
              <button
                v-for="c in colors"
                :key="c.name"
                class="w-3.5 h-3.5 rounded-full border border-white/20 transition hover:scale-125"
                :style="{ backgroundColor: c.accent }"
                :title="c.title"
                @click="handleAction('color-memo', c.name)"
              />
            </div>
          </div>
          <div class="ctx-divider" />
          <button class="ctx-item is-danger" @click="handleAction('delete-memo')">
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除便签</span>
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Copy, Pin, Pencil, Trash2, Maximize2 } from 'lucide-vue-next'

const props = defineProps({
  menu: { type: Object, required: true },
  colors: { type: Array, default: () => [] }
})

const emit = defineEmits(['action', 'close'])

function close() {
  emit('close')
}

function handleAction(act, extra = null) {
  emit('action', act, props.menu.target, extra)
  close()
}
</script>

<style scoped>
.context-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
}

.context-menu-box {
  position: fixed;
  z-index: 9999;
  min-width: 170px;
  padding: 6px;
  border-radius: 12px;
  background: var(--app-card-background);
  backdrop-filter: blur(20px);
  border: 1px solid var(--app-card-border);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 2px;
  user-select: none;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--app-primary-foreground);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.12s ease;
  text-align: left;
}

.ctx-item:hover {
  background: var(--app-list-hover-background);
  color: var(--app-primary-foreground);
}

.ctx-item.is-danger {
  color: #e11d48;
}

.ctx-item.is-danger:hover {
  background: rgba(244, 63, 94, 0.15);
  color: #be123c;
}

.ctx-divider {
  height: 1px;
  background: var(--app-border);
  margin: 3px 0;
}

.ctx-color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
}
</style>
