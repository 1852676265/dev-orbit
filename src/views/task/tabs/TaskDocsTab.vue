<template>
  <div class="h-full flex flex-col p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
    <!-- 头部工具栏 -->
    <div class="flex items-center justify-between gap-3 border-b border-white/5 pb-3 select-none">
      <h3 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
        <FolderKanban class="w-4 h-4 text-teal-400" />
        <span>需求与交付文档资产 ({{ docsState.currentDocs.value.length }})</span>
      </h3>
      <span class="text-[10px] text-slate-500 font-mono hidden sm:inline">
        单击条目软件内弹窗预览 · 右侧按钮专用启动
      </span>
    </div>

    <!-- 空状态 -->
    <div
      v-if="docsState.currentDocs.value.length === 0"
      class="py-12 text-center rounded-xl border border-white/5 text-xs text-slate-500 bg-black/20 space-y-2"
    >
      <FolderKanban class="w-10 h-10 mx-auto text-slate-600" />
      <p>当前 docs 目录下暂无文档</p>
      <p class="text-[11px] text-slate-600">可将 Word、Excel、需求.md 或 PDF 文件放入任务 docs 目录</p>
    </div>

    <!-- 文档网格卡片 -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
      <div
        v-for="doc in docsState.currentDocs.value"
        :key="doc.fileName"
        @click="$emit('open-file', doc.filePath, doc.fileName, false)"
        @contextmenu.prevent.stop="$emit('doc-contextmenu', $event, doc)"
        class="p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2.5 cursor-pointer transition hover:border-teal-500/50 group bg-black/40 hover:bg-black/60 shadow-sm"
        :title="`点击在软件弹窗中查看 · 右键查看更多操作: ${doc.fileName}`"
      >
        <!-- 文件名与大小 -->
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <FileText v-if="docsState.isWordFile(doc.fileName)" class="w-4 h-4 text-blue-400 flex-shrink-0" />
          <Sheet v-else-if="docsState.isExcelFile(doc.fileName)" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <FileCode v-else-if="docsState.isCodeDoc(doc.fileName)" class="w-4 h-4 text-teal-400 flex-shrink-0" />
          <FileText v-else class="w-4 h-4 text-slate-400 flex-shrink-0" />

          <div class="min-w-0 flex-1">
            <span class="text-xs font-medium font-mono truncate block group-hover:text-teal-300 transition text-slate-200">
              {{ doc.fileName }}
            </span>
            <span v-if="doc.size" class="text-[10px] text-slate-500 font-mono block">
              {{ (doc.size / 1024).toFixed(1) }} KB
            </span>
          </div>
        </div>

        <!-- 专用操作按钮组 (采用 Naive UI 组件化) -->
        <div class="flex items-center gap-1.5 flex-shrink-0" @click.stop>
          <!-- Word 专用启动按钮 -->
          <n-button
            v-if="docsState.isWordFile(doc.fileName)"
            size="tiny"
            type="info"
            secondary
            class="font-bold"
            @click.stop="docsState.openNativeDoc(doc.filePath)"
            title="使用本机 Microsoft Word 打开"
          >
            <template #icon><FileText class="w-3.5 h-3.5" /></template>
            <span>Word打开</span>
          </n-button>

          <!-- Excel 专用启动按钮 -->
          <n-button
            v-else-if="docsState.isExcelFile(doc.fileName)"
            size="tiny"
            type="success"
            secondary
            class="font-bold"
            @click.stop="docsState.openNativeDoc(doc.filePath)"
            title="使用本机 Microsoft Excel 打开"
          >
            <template #icon><Sheet class="w-3.5 h-3.5" /></template>
            <span>Excel打开</span>
          </n-button>

          <!-- 其他通用打开 -->
          <n-button
            v-else
            size="tiny"
            quaternary
            @click.stop="docsState.openNativeDoc(doc.filePath)"
            title="使用系统默认程序打开"
          >
            <template #icon><ExternalLink class="w-3.5 h-3.5" /></template>
          </n-button>

          <!-- 资源管理器定位 -->
          <n-button
            size="tiny"
            quaternary
            @click.stop="$emit('show-in-folder', doc.filePath)"
            title="在资源管理器中定位"
          >
            <template #icon><FolderOpen class="w-3.5 h-3.5" /></template>
          </n-button>

          <!-- 删除此文档 (使用 Naive UI n-popconfirm 气泡确认) -->
          <n-popconfirm
            @positive-click="docsState.deleteDocItem(doc)"
            positive-text="确认删除"
            negative-text="取消"
          >
            <template #trigger>
              <n-button
                size="tiny"
                quaternary
                type="error"
                title="删除该文档 (移入回收站)"
              >
                <template #icon><Trash2 class="w-3.5 h-3.5" /></template>
              </n-button>
            </template>
            确认将文档 [{{ doc.fileName }}] 删除并移入 Windows 系统回收站吗？
          </n-popconfirm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NButton, NPopconfirm } from 'naive-ui'
import {
  FolderKanban,
  FileText,
  Sheet,
  FileCode,
  ExternalLink,
  FolderOpen,
  Trash2
} from 'lucide-vue-next'

defineProps({
  docsState: { type: Object, required: true }
})

defineEmits(['open-file', 'show-in-folder', 'doc-contextmenu'])
</script>
