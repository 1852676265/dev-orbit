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
        <div class="ctx-header-title">
          {{ menu.target?.name || menu.target?.systemName || '凭据节点' }}
        </div>

        <button class="ctx-item" @click="handleAction('copy-target')">
          <Copy class="w-3.5 h-3.5 text-teal-400" />
          <span>复制目标地址</span>
        </button>

        <button class="ctx-item" @click="handleAction('copy-pwd')">
          <KeyRound class="w-3.5 h-3.5 text-amber-400" />
          <span>复制登录密码</span>
        </button>

        <button
          v-if="isServerType"
          class="ctx-item"
          @click="handleAction('copy-ssh')"
        >
          <Terminal class="w-3.5 h-3.5 text-sky-400" />
          <span>复制 SSH 命令</span>
        </button>
        <button
          v-else
          class="ctx-item"
          @click="handleAction('open-url')"
        >
          <ExternalLink class="w-3.5 h-3.5 text-sky-400" />
          <span>在浏览器打开 ↗</span>
        </button>

        <button class="ctx-item" @click="handleAction('edit')">
          <Pencil class="w-3.5 h-3.5 text-slate-300" />
          <span>编辑此凭据</span>
        </button>

        <div class="ctx-divider" />

        <button class="ctx-item is-danger" @click="handleAction('delete')">
          <Trash2 class="w-3.5 h-3.5" />
          <span>删除此凭据</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { Copy, KeyRound, Terminal, ExternalLink, Pencil, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  menu: { type: Object, required: true }
})

const emit = defineEmits(['action', 'close'])

const isServerType = computed(() => {
  const cat = props.menu.target?.category || ''
  return cat === '服务器账号' || !cat
})

function close() {
  emit('close')
}

function handleAction(act) {
  emit('action', act, props.menu.target)
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
  z-index: 10000;
  min-width: 160px;
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

.ctx-header-title {
  padding: 4px 10px 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--app-secondary-foreground);
  border-bottom: 1px solid var(--app-border);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
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
</style>
