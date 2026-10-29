<template>
  <div class="docs-tab-container hide-scrollbar">
    <!-- 头部工具栏 -->
    <div class="docs-toolbar">
      <h3 class="toolbar-title">
        <FolderKanban class="icon-medium text-teal-400" />
        <span>需求与交付文档资产 ({{ docsState.currentDocs.value.length }})</span>
      </h3>
      <span class="toolbar-hint">
        单击条目软件内弹窗预览 · 右侧按钮专用启动
      </span>
    </div>

    <!-- 空状态 -->
    <div
      v-if="docsState.currentDocs.value.length === 0"
      class="docs-empty-state"
    >
      <FolderKanban class="empty-icon" />
      <p class="empty-text">当前 docs 目录下暂无文档</p>
      <p class="empty-subtext">可将 Word、Excel、需求.md 或 PDF 文件放入任务 docs 目录</p>
    </div>

    <!-- 文档网格卡片 -->
    <div v-else class="docs-grid">
      <div
        v-for="doc in docsState.currentDocs.value"
        :key="doc.fileName"
        @click="$emit('open-file', doc.filePath, doc.fileName, false)"
        @contextmenu.prevent.stop="$emit('doc-contextmenu', $event, doc)"
        class="doc-card"
        :title="`点击在软件弹窗中查看 · 右键查看更多操作: ${doc.fileName}`"
      >
        <!-- 文件名与大小 -->
        <div class="doc-info">
          <FileText v-if="docsState.isWordFile(doc.fileName)" class="icon-medium text-blue-400" />
          <Sheet v-else-if="docsState.isExcelFile(doc.fileName)" class="icon-medium text-emerald-400" />
          <FileCode v-else-if="docsState.isCodeDoc(doc.fileName)" class="icon-medium text-teal-400" />
          <FileText v-else class="icon-medium text-slate-400" />

          <div class="doc-name-group">
            <span class="doc-filename">
              {{ doc.fileName }}
            </span>
            <span v-if="doc.size" class="doc-filesize">
              {{ (doc.size / 1024).toFixed(1) }} KB
            </span>
          </div>
        </div>

        <!-- 专用操作按钮组 (采用 Naive UI 组件化) -->
        <div class="doc-actions" @click.stop>
          <!-- Word 专用启动按钮 -->
          <n-button
            v-if="docsState.isWordFile(doc.fileName)"
            size="tiny"
            type="info"
            secondary
            class="action-btn font-bold"
            @click.stop="docsState.openNativeDoc(doc.filePath)"
            title="使用本机 Microsoft Word 打开"
          >
            <template #icon><FileText class="icon-small" /></template>
            <span>Word打开</span>
          </n-button>

          <!-- Excel 专用启动按钮 -->
          <n-button
            v-else-if="docsState.isExcelFile(doc.fileName)"
            size="tiny"
            type="success"
            secondary
            class="action-btn font-bold"
            @click.stop="docsState.openNativeDoc(doc.filePath)"
            title="使用本机 Microsoft Excel 打开"
          >
            <template #icon><Sheet class="icon-small" /></template>
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
            <template #icon><ExternalLink class="icon-small" /></template>
          </n-button>

          <!-- 资源管理器定位 -->
          <n-button
            size="tiny"
            quaternary
            @click.stop="$emit('show-in-folder', doc.filePath)"
            title="在资源管理器中定位"
          >
            <template #icon><FolderOpen class="icon-small" /></template>
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
                <template #icon><Trash2 class="icon-small" /></template>
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

<style scoped>
.docs-tab-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.docs-tab-container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 头部工具栏 */
.docs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 8px;
  user-select: none;
}

.toolbar-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--app-primary-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.toolbar-hint {
  font-size: 11px;
  color: var(--app-muted-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  display: none;
}
@media (min-width: 640px) {
  .toolbar-hint {
    display: inline;
  }
}

/* 空状态 */
.docs-empty-state {
  padding: 48px 16px;
  text-align: center;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background-color: var(--app-subcard-background);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--app-muted-foreground);
}

.empty-text {
  font-size: 12px;
  color: var(--app-secondary-foreground);
  margin: 0;
}

.empty-subtext {
  font-size: 11px;
  color: var(--app-muted-foreground);
  margin: 0;
}

/* 文档网格卡片 */
.docs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  align-content: start;
}
@media (min-width: 640px) {
  .docs-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.doc-card {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--app-card-border);
  background-color: var(--app-subcard-background);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-width: 0;
}

.doc-card:hover {
  background-color: var(--app-list-hover-background);
  border-color: var(--app-accent-teal-border);
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.doc-name-group {
  min-width: 0;
  flex: 1;
}

.doc-filename {
  font-size: 12px;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--app-primary-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  transition: color 0.15s ease;
}

.doc-card:hover .doc-filename {
  color: var(--app-accent-teal);
}

.doc-filesize {
  font-size: 10px;
  color: var(--app-muted-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  display: block;
  margin-top: 2px;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.icon-medium {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.icon-small {
  width: 14px;
  height: 14px;
}
</style>
