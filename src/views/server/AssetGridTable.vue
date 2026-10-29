<template>
  <div class="notion-table-wrapper border border-white/10 rounded-xl bg-black/30 overflow-hidden shadow-2xl">
    <table class="w-full text-left text-xs font-mono border-collapse">
      <thead>
        <tr class="table-header-row">
          <th class="col-type">所属分类</th>
          <th class="col-name">资产 / 系统名称</th>
          <th class="col-target">目标地址 / Web URL</th>
          <th class="col-port">端口</th>
          <th class="col-user">登录账号</th>
          <th class="col-pwd">密码凭据</th>
          <th class="col-remark">业务用途 / 备注</th>
          <th class="col-actions text-right">快捷动作</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-slate-200">
        <tr
          v-for="item in assets"
          :key="item.id"
          class="table-data-row group"
          @contextmenu.prevent="$emit('contextmenu', $event, item)"
        >
          <!-- 1. 分类微标 -->
          <td class="col-type">
            <span class="type-badge" :class="getCategoryBadgeClass(getCat(item))">
              {{ getCategoryIconLabel(getCat(item)) }}
            </span>
          </td>

          <!-- 2. 资产名称 -->
          <td class="col-name">
            <span
              class="font-bold text-white font-sans text-xs tracking-wide truncate block max-w-[180px]"
              :title="item.name"
            >
              {{ item.name }}
            </span>
          </td>

          <!-- 3. 目标地址 / URL -->
          <td class="col-target">
            <div v-if="isWebUrl(item.target)" class="flex items-center gap-1.5">
              <span
                class="text-sky-300 font-bold hover:underline cursor-pointer truncate max-w-[230px]"
                :title="item.target"
                @click="$emit('open-url', item.target)"
              >
                {{ item.target }}
              </span>
              <button
                class="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[10px] font-bold flex items-center gap-0.5"
                title="在系统默认浏览器打开"
                @click="$emit('open-url', item.target)"
              >
                <span>直达</span>
                <ExternalLink class="w-2.5 h-2.5" />
              </button>
              <button
                class="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white"
                title="复制 URL"
                @click="$emit('copy-text', item.target, 'URL 地址')"
              >
                <Copy class="w-3 h-3" />
              </button>
            </div>

            <div v-else class="flex items-center gap-1.5">
              <span class="text-teal-300 font-bold select-all">{{ item.target || '-' }}</span>
              <button
                v-if="item.target"
                class="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-teal-300"
                title="复制地址"
                @click="$emit('copy-target', item)"
              >
                <Copy class="w-3 h-3" />
              </button>
              <button
                v-if="getCat(item) === '服务器账号' && item.target"
                class="opacity-0 group-hover:opacity-100 px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold"
                title="复制完整 SSH 命令"
                @click="$emit('copy-ssh', item)"
              >
                SSH
              </button>
            </div>
          </td>

          <!-- 4. 端口 -->
          <td class="col-port text-slate-400">
            {{ item.port || '-' }}
          </td>

          <!-- 5. 登录账号 -->
          <td class="col-user">
            <span
              v-if="item.username"
              class="cursor-pointer hover:text-teal-300 select-all font-bold"
              :title="`单击复制账号: ${item.username}`"
              @click="$emit('copy-text', item.username, '账号')"
            >
              {{ item.username }}
            </span>
            <span v-else class="text-slate-600">-</span>
          </td>

          <!-- 6. 密码凭据策略 -->
          <td class="col-pwd">
            <div v-if="isInheritRoot(item)" class="flex items-center gap-1.5">
              <span
                class="inherit-pwd-badge"
                title="点击一键秒拷全局通用 Root 密码"
                @click="$emit('copy-pwd', item)"
              >
                👑 继承默认Root
              </span>
              <button
                class="opacity-0 group-hover:opacity-100 p-0.5 text-teal-400 hover:text-teal-200"
                title="复制通用 Root 密码"
                @click="$emit('copy-pwd', item)"
              >
                <Copy class="w-3 h-3" />
              </button>
            </div>

            <div v-else-if="item.password" class="flex items-center gap-1.5">
              <span
                class="font-bold select-all"
                :class="isPasswordVisible(item.id) ? 'text-amber-300' : 'text-slate-400 tracking-widest'"
              >
                {{ isPasswordVisible(item.id) ? item.password : '••••••••' }}
              </span>
              <span
                v-if="item.justSynced"
                class="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-sans font-bold"
                :title="`已随 SVN 自动同步最新密码 (旧密码: ${item.previousPassword || '无'})`"
              >
                🔵 刚随SVN更新
              </span>
              <span
                v-else-if="item.anchorKey"
                class="px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[9px] font-sans"
                :title="`已绑定SVN自动同步锚点: ${item.anchorLabel || item.anchorKey}（后续文档改密标蓝将自动更新）`"
              >
                🔗自动同步
              </span>
              <button
                class="p-0.5 text-slate-400 hover:text-white"
                :title="isPasswordVisible(item.id) ? '隐藏' : '显示明文'"
                @click="$emit('toggle-pwd', item.id)"
              >
                <component :is="isPasswordVisible(item.id) ? EyeOff : Eye" class="w-3 h-3" />
              </button>
              <button
                class="p-0.5 text-slate-400 hover:text-amber-300"
                title="复制密码"
                @click="$emit('copy-pwd', item)"
              >
                <Copy class="w-3 h-3" />
              </button>
            </div>

            <span v-else class="text-slate-600">(无密码)</span>
          </td>

          <!-- 7. 业务备注 -->
          <td class="col-remark text-slate-400 font-sans truncate max-w-[240px]" :title="item.remark">
            {{ item.remark || '-' }}
          </td>

          <!-- 8. 操作组 -->
          <td class="col-actions text-right space-x-1 whitespace-nowrap">
            <button
              class="px-2 py-0.5 rounded bg-white/5 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 text-[10px] font-sans transition"
              title="一键复制密码"
              @click="$emit('copy-pwd', item)"
            >
              拷密码
            </button>
            <button
              class="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-teal-300 transition"
              title="编辑此条凭据"
              @click="$emit('edit', item)"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <n-popconfirm
              positive-text="确认移除"
              negative-text="取消"
              @positive-click="$emit('delete', item.id)"
            >
              <template #trigger>
                <button
                  class="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                  title="从日常账本移除"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </template>
              确认从日常账本移除 [{{ item.name }}] 吗？
            </n-popconfirm>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { NPopconfirm } from 'naive-ui'
import { ExternalLink, Copy, Pencil, Trash2, Eye, EyeOff } from 'lucide-vue-next'
import { normalizeItemCategory, getCategoryIconLabel } from '@/composables/useServerCredentials'

defineProps({
  assets: { type: Array, required: true },
  isPasswordVisible: { type: Function, required: true }
})

defineEmits([
  'edit', 'delete', 'open-url', 'copy-text', 'copy-target',
  'copy-ssh', 'copy-pwd', 'toggle-pwd', 'contextmenu'
])

function getCat(item) {
  return normalizeItemCategory(item)
}

function isInheritRoot(item) {
  return Boolean(item.useDefaultPassword || (getCat(item) === '服务器账号' && !item.password))
}

function isWebUrl(str) {
  return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://'))
}

function getCategoryBadgeClass(cat) {
  if (cat === 'Web网站') return 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  if (cat === 'iNode') return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  if (cat === '服务器账号') return 'bg-teal-500/20 text-teal-300 border-teal-500/30'
  return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
}
</script>

<style scoped>
.notion-table-wrapper {
  background: var(--app-card-background);
  border-color: var(--app-card-border);
  backdrop-filter: blur(12px);
}

.table-header-row {
  background-color: var(--app-secondary-background);
  border-bottom: 1px solid var(--app-border);
  color: var(--app-secondary-foreground);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-header-row th {
  padding: 10px 12px;
  font-weight: 600;
}

.table-data-row {
  transition: background-color 0.15s ease;
}
.table-data-row:hover {
  background-color: var(--app-list-hover-background);
}

.table-data-row td {
  padding: 9px 12px;
  vertical-align: middle;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 700;
  border-width: 1px;
  white-space: nowrap;
}

.inherit-pwd-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  border: 1px solid var(--app-accent-teal-border);
  cursor: pointer;
  transition: all 0.15s ease;
}
.inherit-pwd-badge:hover {
  filter: brightness(0.95);
}
</style>
