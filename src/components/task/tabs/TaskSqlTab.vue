<template>
  <div class="h-full flex flex-col p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
    <!-- 头部工具栏 -->
    <div class="flex items-center justify-between gap-3 border-b border-white/5 pb-3 flex-wrap select-none">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <Database class="w-4 h-4 text-amber-400" />
          <span>上线 SQL 脚本资产 ({{ sqlsState.currentSqls.value.length }})</span>
        </h3>
        <n-tag
          v-if="pendingCount > 0"
          type="warning"
          size="small"
          class="font-mono font-bold"
        >
          {{ pendingCount }} 份待发产线
        </n-tag>
        <n-tag
          v-else-if="sqlsState.currentSqls.value.length > 0"
          type="success"
          size="small"
          class="font-mono font-bold"
        >
          全部已发产线
        </n-tag>
      </div>

      <div class="flex items-center gap-2">
        <n-button
          v-if="sqlsState.currentSqls.value.length > 0"
          type="primary"
          size="small"
          @click="sqlsState.sqlMergeModalOpen.value = true"
          title="一键按序拼接、包裹事务并生成上线汇总单 (00_merged_all.sql)"
        >
          <template #icon>
            <Sparkles class="w-3.5 h-3.5" />
          </template>
          <span>一键合并上线 SQL</span>
        </n-button>

        <n-button
          size="small"
          quaternary
          @click="sqlsState.createNewSqlFile"
        >
          <template #icon>
            <Plus class="w-3.5 h-3.5 text-teal-400" />
          </template>
          <span>新建 SQL</span>
        </n-button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="sqlsState.loadingSqls.value" class="py-12 text-center text-xs text-slate-400">
      <RefreshCw class="w-4 h-4 animate-spin mx-auto mb-2 text-teal-400" />
      <span>正在扫描任务 SQL 脚本...</span>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="sqlsState.currentSqls.value.length === 0"
      class="py-12 text-center rounded-xl border border-white/5 text-xs text-slate-500 bg-black/20 space-y-2"
    >
      <Database class="w-10 h-10 mx-auto text-slate-600" />
      <p>当前任务暂无 SQL 脚本</p>
      <p class="text-[11px] text-slate-600">可点击上方「新建 SQL」或将 .sql 文件放入 sql 目录</p>
    </div>

    <!-- 脚本条目列表 -->
    <div v-else class="space-y-1.5 flex-1">
      <div
        v-for="sql in sqlsState.currentSqls.value"
        :key="sql.fileName"
        @click="$emit('open-file', sql.filePath, sql.fileName, true)"
        @contextmenu.prevent.stop="$emit('sql-contextmenu', $event, sql)"
        class="p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-3 text-xs transition group bg-black/40 hover:bg-black/60 hover:border-teal-500/40 cursor-pointer"
        :title="`点击在软件内查看与编辑 · 右键查看更多操作: ${sql.fileName}`"
      >
        <!-- 文件名与大小 -->
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <Database class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span
            class="font-mono font-bold truncate text-slate-200 group-hover:text-teal-300 transition"
            :title="sql.fileName"
          >
            {{ sql.fileName }}
          </span>
          <span class="text-[10px] text-slate-500 font-mono flex-shrink-0">
            ({{ (sql.size / 1024).toFixed(1) }} KB)
          </span>
        </div>

        <!-- 操作区 -->
        <div class="flex items-center gap-1.5 flex-shrink-0" @click.stop>
          <!-- 产线状态变更按钮 -->
          <button
            type="button"
            @click.stop="sqlsState.promptToggleProdStatus(sql)"
            class="px-2 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 cursor-pointer font-bold"
            :class="sql.prodReleased
              ? 'bg-teal-950/70 text-teal-300 border border-teal-700/60 hover:bg-teal-900/60'
              : 'bg-amber-950/70 text-amber-300 border border-amber-600/60 animate-pulse hover:bg-amber-900/60'"
            :title="`当前状态: ${sql.prodReleased ? '已发' : '待发'} (点击确认变更)`"
          >
            <span>产线: {{ sql.prodReleased ? '已发' : '待发' }}</span>
          </button>

          <!-- 弹窗查看源码 (预览) -->
          <button
            type="button"
            @click.stop="$emit('open-file', sql.filePath, sql.fileName, false)"
            class="p-1 rounded text-slate-400 hover:text-teal-300 cursor-pointer"
            title="在软件弹框中查看 SQL"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>

          <!-- 弹窗编辑源码 (编辑) -->
          <button
            type="button"
            @click.stop="$emit('open-file', sql.filePath, sql.fileName, true)"
            class="p-1 rounded text-slate-400 hover:text-amber-300 cursor-pointer"
            title="在软件弹框中直接编辑 SQL"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>

          <!-- 在资源管理器中定位 -->
          <button
            type="button"
            @click.stop="$emit('show-in-folder', sql.filePath)"
            class="p-1 rounded text-slate-400 hover:text-teal-300 cursor-pointer"
            title="在 Windows 资源管理器中定位"
          >
            <FolderOpen class="w-3 h-3" />
          </button>

          <!-- 复制 SQL 路径 -->
          <button
            type="button"
            @click.stop="$emit('copy-path', sql.filePath)"
            class="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            title="复制绝对路径"
          >
            <Copy class="w-3 h-3" />
          </button>

          <!-- 删除 SQL 脚本 (移入回收站) -->
          <button
            type="button"
            @click.stop="sqlsState.deleteSqlItem(sql)"
            class="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="删除此 SQL (移入系统回收站)"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NButton, NTag } from 'naive-ui'
import {
  Database,
  Sparkles,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  FolderOpen,
  Copy,
  Trash2
} from 'lucide-vue-next'

const props = defineProps({
  sqlsState: { type: Object, required: true }
})

defineEmits(['open-file', 'show-in-folder', 'copy-path', 'sql-contextmenu'])

const pendingCount = computed(() => {
  return props.sqlsState.currentSqls.value.filter(s => !s.prodReleased).length
})
</script>
