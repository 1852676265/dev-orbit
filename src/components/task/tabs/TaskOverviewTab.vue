<template>
  <div class="h-full flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar select-none">
    <!-- 快捷状态卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- 1. 备忘卡片 -->
      <div
        @click="$emit('switch-tab', 'notes')"
        class="p-4 rounded-xl border border-white/5 bg-[#121826]/90 hover:border-teal-500/40 cursor-pointer transition shadow-sm space-y-1 group"
      >
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5 group-hover:text-teal-300 transition">
            <StickyNote class="w-3.5 h-3.5 text-teal-400" /> 开发备忘
          </span>
          <span class="font-mono text-xs font-bold text-teal-400">
            {{ notesCount }} 条
          </span>
        </div>
        <p class="text-[11px] text-slate-500">
          {{ enableSmartParams ? `已提取 ${parsedParameters.length} 个联调参数，点击查看详情` : '智能提取已关闭' }}
        </p>
      </div>

      <!-- 2. SQL 状态卡片 -->
      <div
        @click="$emit('switch-tab', 'sqls')"
        class="p-4 rounded-xl border border-white/5 bg-[#121826]/90 hover:border-amber-500/40 cursor-pointer transition shadow-sm space-y-1 group"
      >
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5 group-hover:text-amber-300 transition">
            <Database class="w-3.5 h-3.5 text-amber-400" /> SQL 发布
          </span>
          <span
            class="font-mono text-xs font-bold"
            :class="pendingSqlCount > 0 ? 'text-amber-400' : 'text-teal-400'"
          >
            {{ pendingSqlCount > 0 ? pendingSqlCount + ' 份待发' : '全部已上线' }}
          </span>
        </div>
        <p class="text-[11px] text-slate-500">共 {{ sqlsCount }} 份脚本，支持一键合并与事务保护</p>
      </div>

      <!-- 3. 文档资产卡片 -->
      <div
        @click="$emit('switch-tab', 'docs')"
        class="p-4 rounded-xl border border-white/5 bg-[#121826]/90 hover:border-blue-500/40 cursor-pointer transition shadow-sm space-y-1 group"
      >
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5 group-hover:text-blue-300 transition">
            <FolderKanban class="w-3.5 h-3.5 text-teal-400" /> 文档资产
          </span>
          <span class="font-mono text-xs font-bold text-blue-400">{{ docsCount }} 份</span>
        </div>
        <p class="text-[11px] text-slate-500">支持 Word、Excel、Markdown 软件内弹窗或本机打开</p>
      </div>
    </div>

    <!-- 全景看板参数速查区 -->
    <div
      v-if="enableSmartParams && parsedParameters.length > 0"
      class="p-3.5 rounded-xl border border-white/10 bg-[#121826]/90 space-y-2.5"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs text-teal-400 font-bold flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5" /> 核心联调参数 ({{ parsedParameters.length }} 项):
        </span>
        <button
          type="button"
          @click="$emit('open-more-params')"
          class="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer"
        >
          <Eye class="w-3.5 h-3.5" />
          <span>完整清单</span>
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div
          v-for="(param, pIdx) in parsedParameters"
          :key="pIdx"
          class="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-2 transition group bg-black/50 hover:bg-black/75 shadow-sm"
          :class="getParamPillColor(param.type)"
        >
          <span class="font-bold whitespace-nowrap text-teal-300 flex-shrink-0">{{ param.label }}:</span>
          <span
            class="text-slate-200 group-hover:text-white font-mono break-all max-w-[280px] sm:max-w-[360px] truncate select-all cursor-text"
            :title="`完整值: ${param.value} (单击复制)`"
            @click="$emit('copy-param', param.value, param.label)"
          >
            {{ param.value }}
          </span>
          <button
            type="button"
            @click="$emit('copy-param', param.value, param.label)"
            class="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-teal-300 transition cursor-pointer flex-shrink-0"
            title="复制完整值"
          >
            <Copy class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  StickyNote,
  Database,
  FolderKanban,
  Sparkles,
  Eye,
  Copy
} from 'lucide-vue-next'

defineProps({
  notesCount: { type: Number, default: 0 },
  sqlsCount: { type: Number, default: 0 },
  pendingSqlCount: { type: Number, default: 0 },
  docsCount: { type: Number, default: 0 },
  enableSmartParams: { type: Boolean, default: true },
  parsedParameters: { type: Array, default: () => [] }
})

defineEmits(['switch-tab', 'open-more-params', 'copy-param'])

function getParamPillColor(type) {
  switch (type) {
    case 'key': return 'border-teal-500/40 text-teal-300 bg-teal-500/10 hover:border-teal-400'
    case 'secret': return 'border-amber-500/40 text-amber-300 bg-amber-500/10 hover:border-amber-400'
    case 'token': return 'border-sky-500/40 text-sky-300 bg-sky-500/10 hover:border-sky-400'
    case 'network': return 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:border-cyan-400'
    case 'id': return 'border-purple-500/40 text-purple-300 bg-purple-500/10 hover:border-purple-400'
    default: return 'border-white/10 text-slate-300 bg-black/40 hover:border-white/20'
  }
}
</script>
