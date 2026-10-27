<template>
  <div class="notes-tab-container hide-scrollbar">
    <!-- 1. 智能提取参数速查栏 -->
    <div
      v-if="notesState.enableSmartParams.value && notesState.parsedParameters.value.length > 0"
      class="smart-params-panel"
    >
      <div class="params-header">
        <div class="header-left">
          <n-button
            size="tiny"
            type="primary"
            secondary
            @click="isMoreParamsOpen = true"
            :title="`打开参数全景清单 (${notesState.parsedParameters.value.length} 项)`"
          >
            <template #icon>
              <Sparkles class="icon-small" />
            </template>
            <span>速拷核心参数 ({{ notesState.parsedParameters.value.length }})</span>
          </n-button>
          <span class="view-mode-hint">
            {{ notesState.paramViewMode.value === 'wrap' ? '当前为平铺完整模式 (无截断)' : '当前为单行紧凑模式' }}
          </span>
        </div>

        <div class="header-actions">
          <n-button
            size="tiny"
            quaternary
            @click="notesState.toggleParamViewMode"
          >
            {{ notesState.paramViewMode.value === 'wrap' ? '切换单行滚轮' : '切换平铺展开' }}
          </n-button>
          <n-button
            size="tiny"
            type="primary"
            secondary
            @click="notesState.copyAllParamsAsYaml"
          >
            一键复制全部 YAML
          </n-button>
          <n-button
            size="tiny"
            quaternary
            @click="notesState.toggleSmartParams(false)"
            title="关闭智能参数栏"
          >
            <EyeOff class="icon-tiny text-slate-400" />
          </n-button>
        </div>
      </div>

      <!-- 参数胶囊展示区 -->
      <div
        class="params-pill-list custom-scrollbar"
        :class="{ 'is-wrap': notesState.paramViewMode.value === 'wrap' }"
      >
        <div
          v-for="(param, pIdx) in notesState.parsedParameters.value"
          :key="pIdx"
          class="param-capsule"
          :class="getParamCapsuleClass(param.type)"
        >
          <span class="capsule-label">{{ param.label }}:</span>
          <span
            class="capsule-value"
            :title="`完整值: ${param.value} (单击复制)`"
            @click="notesState.copyParamText(param.value, param.label)"
          >
            {{ param.value }}
          </span>
          <button
            type="button"
            class="copy-btn"
            title="复制此项完整值"
            @click="notesState.copyParamText(param.value, param.label)"
          >
            <Copy class="icon-tiny" />
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 备忘录工具栏 -->
    <div class="notes-toolbar">
      <!-- 分类标签过滤器 -->
      <div class="category-filters">
        <n-button
          size="tiny"
          :type="notesState.selectedNoteCategory.value === 'all' ? 'primary' : 'default'"
          :secondary="notesState.selectedNoteCategory.value === 'all'"
          :quaternary="notesState.selectedNoteCategory.value !== 'all'"
          @click="notesState.selectedNoteCategory.value = 'all'"
        >
          全部 ({{ notesState.taskNotes.value.length }})
        </n-button>
        <n-button
          v-for="cat in ['配置参数', '接口地址', '联调日志', '账号凭证']"
          :key="cat"
          size="tiny"
          :type="notesState.selectedNoteCategory.value === cat ? 'primary' : 'default'"
          :secondary="notesState.selectedNoteCategory.value === cat"
          :quaternary="notesState.selectedNoteCategory.value !== cat"
          @click="notesState.selectedNoteCategory.value = cat"
        >
          {{ cat }}
        </n-button>
      </div>

      <!-- 右侧视图切换与新建 -->
      <div class="toolbar-right">
        <n-input
          v-if="notesState.noteViewMode.value === 'cards'"
          v-model:value="notesState.noteSearchQuery.value"
          size="small"
          placeholder="搜索备忘内容..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <Search class="icon-small text-slate-500" />
          </template>
        </n-input>

        <!-- 卡片与源码切换 -->
        <n-button-group size="small">
          <n-button
            :type="notesState.noteViewMode.value === 'cards' ? 'primary' : 'default'"
            :secondary="notesState.noteViewMode.value === 'cards'"
            @click="switchViewMode('cards')"
          >
            卡片流
          </n-button>
          <n-button
            :type="notesState.noteViewMode.value === 'raw' ? 'primary' : 'default'"
            :secondary="notesState.noteViewMode.value === 'raw'"
            @click="switchViewMode('raw')"
          >
            Markdown 源码
          </n-button>
        </n-button-group>

        <!-- 新建备忘卡片按钮 -->
        <n-button
          v-if="notesState.noteViewMode.value === 'cards'"
          size="small"
          type="primary"
          @click="notesState.startAddNote"
        >
          <template #icon>
            <Plus class="icon-small" />
          </template>
          <span>新建备忘</span>
        </n-button>
      </div>
    </div>

    <!-- 3. 卡片视图 -->
    <div v-if="notesState.noteViewMode.value === 'cards'" class="cards-view-container">
      <!-- 新增卡片就地输入框 -->
      <div v-if="notesState.isAddingNote.value" class="note-editor-card">
        <div class="editor-header-row">
          <n-input
            v-model:value="notesState.newNoteForm.value.title"
            size="small"
            placeholder="备忘标题 (如: 预算系统联调公私钥)"
            class="flex-1"
          />
          <n-select
            v-model:value="notesState.newNoteForm.value.category"
            size="small"
            :options="categoryOptions"
            class="category-select"
          />
        </div>
        <n-input
          v-model:value="notesState.newNoteForm.value.content"
          type="textarea"
          size="small"
          placeholder="在此粘贴参数、YAML、SQL片段或接口文档..."
          :rows="4"
        />
        <div class="editor-footer-row">
          <n-checkbox v-model:checked="notesState.newNoteForm.value.pinned">
            置顶显示
          </n-checkbox>
          <div class="action-btn-group">
            <n-button size="small" quaternary @click="notesState.isAddingNote.value = false">
              取消
            </n-button>
            <n-button size="small" type="primary" @click="notesState.saveNewNote">
              保存备忘
            </n-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="notesState.filteredTaskNotes.value.length === 0 && !notesState.isAddingNote.value"
        class="notes-empty-state"
      >
        <StickyNote class="empty-icon" />
        <p class="empty-text">当前任务暂无开发备忘卡片</p>
        <p class="empty-subtext">可点击右上角「新建备忘」随时记录联调参数与配置</p>
      </div>

      <!-- 备忘卡片列表 -->
      <div
        v-for="note in notesState.filteredTaskNotes.value"
        :key="note.id"
        class="note-card"
      >
        <!-- 编辑状态 -->
        <div v-if="notesState.editingNoteId.value === note.id" class="card-edit-mode">
          <div class="editor-header-row">
            <n-input
              v-model:value="notesState.editingNoteForm.value.title"
              size="small"
              class="flex-1"
            />
            <n-select
              v-model:value="notesState.editingNoteForm.value.category"
              size="small"
              :options="categoryOptions"
              class="category-select"
            />
          </div>
          <n-input
            v-model:value="notesState.editingNoteForm.value.content"
            type="textarea"
            size="small"
            :rows="5"
          />
          <div class="editor-footer-row">
            <n-checkbox v-model:checked="notesState.editingNoteForm.value.pinned">
              置顶显示
            </n-checkbox>
            <div class="action-btn-group">
              <n-button size="small" quaternary @click="notesState.editingNoteId.value = null">
                取消
              </n-button>
              <n-button size="small" type="primary" @click="notesState.saveEditNote">
                更新保存
              </n-button>
            </div>
          </div>
        </div>

        <!-- 正常阅读卡片 -->
        <div v-else class="card-view-mode">
          <div class="card-header">
            <div class="header-info">
              <n-tag
                v-if="note.pinned"
                size="tiny"
                type="warning"
                :bordered="false"
                class="tag-pinned"
              >
                置顶
              </n-tag>
              <n-tag
                size="tiny"
                type="info"
                :bordered="false"
                class="tag-category"
              >
                {{ note.category || '配置参数' }}
              </n-tag>
              <h4 class="card-title">
                {{ note.title }}
              </h4>
            </div>

            <!-- 卡片操作按钮 (采用 Naive UI 组件化 n-button 与 n-popconfirm) -->
            <div class="card-actions">
              <n-button
                size="tiny"
                quaternary
                @click="notesState.togglePinNote(note)"
                :title="note.pinned ? '取消置顶' : '置顶此条'"
              >
                <template #icon>
                  <Pin class="icon-small" :class="{ 'is-pinned': note.pinned }" />
                </template>
              </n-button>
              <n-button
                size="tiny"
                quaternary
                @click="notesState.startEditNote(note)"
                title="编辑此备忘"
              >
                <template #icon><Pencil class="icon-small" /></template>
              </n-button>
              <n-button
                size="tiny"
                quaternary
                @click="notesState.copyParamText(note.content, note.title)"
                title="复制卡片内容"
              >
                <template #icon><Copy class="icon-small" /></template>
              </n-button>
              <n-popconfirm
                @positive-click="notesState.deleteNote(note.id)"
                positive-text="确认删除"
                negative-text="取消"
              >
                <template #trigger>
                  <n-button
                    size="tiny"
                    quaternary
                    type="error"
                    title="删除备忘卡片"
                  >
                    <template #icon><Trash2 class="icon-small" /></template>
                  </n-button>
                </template>
                确认删除备忘 [{{ note.title }}] 吗？
              </n-popconfirm>
            </div>
          </div>

          <!-- 内容预览区 (等宽代码字体，支持选中) -->
          <pre class="note-preview-content">{{ note.content }}</pre>

          <div class="note-time-footer">
            更新于: {{ note.updatedAt }}
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Markdown 源码视图 -->
    <div v-else class="raw-view-container">
      <div class="raw-header">
        <span>与本地任务目录 <b class="sync-file-path">docs/笔记.md</b> 实时双向同步</span>
        <n-button size="small" type="primary" secondary @click="notesState.saveRawNote">
          <template #icon>
            <Save class="icon-small" />
          </template>
          <span>保存源码</span>
        </n-button>
      </div>
      <n-input
        v-model:value="notesState.rawNoteContent.value"
        type="textarea"
        class="raw-textarea"
        placeholder="# 在此输入 Markdown 格式的开发备忘..."
      />
    </div>

    <!-- 全景参数清单模态框 -->
    <n-modal
      v-model:show="isMoreParamsOpen"
      preset="card"
      title="联调核心参数全景清单"
      class="params-modal"
    >
      <div class="params-modal-body">
        <div class="modal-summary-row">
          <span class="summary-text">从备忘中智能提取了 {{ notesState.parsedParameters.value.length }} 项配置</span>
          <n-button size="tiny" type="primary" secondary @click="notesState.copyAllParamsAsYaml">
            一键复制 YAML 格式
          </n-button>
        </div>
        <div class="params-modal-list custom-scrollbar">
          <div
            v-for="(p, idx) in notesState.parsedParameters.value"
            :key="idx"
            class="modal-param-card"
          >
            <div class="param-card-left">
              <span class="param-card-label">{{ p.label }}</span>
              <span class="param-card-value">{{ p.value }}</span>
            </div>
            <n-button size="tiny" secondary @click="notesState.copyParamText(p.value, p.label)">
              复制
            </n-button>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  NButton,
  NButtonGroup,
  NInput,
  NSelect,
  NCheckbox,
  NModal,
  NPopconfirm,
  NTag
} from 'naive-ui'
import {
  Sparkles,
  EyeOff,
  Copy,
  Search,
  Plus,
  StickyNote,
  Pin,
  Pencil,
  Trash2,
  Save
} from 'lucide-vue-next'

const props = defineProps({
  notesState: { type: Object, required: true }
})

const isMoreParamsOpen = ref(false)

const categoryOptions = [
  { label: '配置参数', value: '配置参数' },
  { label: '接口地址', value: '接口地址' },
  { label: '联调日志', value: '联调日志' },
  { label: '账号凭证', value: '账号凭证' }
]

async function switchViewMode(mode) {
  if (mode === props.notesState.noteViewMode.value) return
  if (mode === 'cards') {
    if (props.notesState.rawNoteContent.value) {
      await props.notesState.saveRawNote()
    }
  } else if (mode === 'raw') {
    let mdText = '# 开发备忘与接口联调参数\n\n'
    for (const n of props.notesState.taskNotes.value) {
      mdText += `### [${n.category || '配置参数'}] ${n.title || '无标题备忘'}\n`
      if (n.updatedAt) mdText += `> 更新时间: ${n.updatedAt}\n\n`
      mdText += `${n.content || ''}\n\n---\n\n`
    }
    props.notesState.rawNoteContent.value = mdText.trim()
  }
  props.notesState.noteViewMode.value = mode
}

function getParamCapsuleClass(type) {
  switch (type) {
    case 'key': return 'capsule--key'
    case 'secret': return 'capsule--secret'
    case 'token': return 'capsule--token'
    case 'network': return 'capsule--network'
    case 'id': return 'capsule--id'
    default: return 'capsule--default'
  }
}
</script>

<style scoped>
.notes-tab-container {
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

.notes-tab-container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 顶部智能参数面板 */
.smart-params-panel {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(18, 24, 38, 0.9);
  transition: all 0.2s ease;
}

.params-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-mode-hint {
  font-size: 11px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.params-pill-list {
  display: flex;
  align-items: center;
  overflow-x: auto;
  gap: 6px;
  padding: 2px 0;
}

.params-pill-list.is-wrap {
  flex-wrap: wrap;
  overflow-x: visible;
}

.param-capsule {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  background-color: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.capsule--key {
  border-color: rgba(45, 212, 191, 0.4);
  background-color: rgba(45, 212, 191, 0.1);
}
.capsule--secret {
  border-color: rgba(245, 158, 11, 0.4);
  background-color: rgba(245, 158, 11, 0.1);
}
.capsule--token {
  border-color: rgba(56, 189, 248, 0.4);
  background-color: rgba(56, 189, 248, 0.1);
}
.capsule--network {
  border-color: rgba(6, 182, 212, 0.4);
  background-color: rgba(6, 182, 212, 0.1);
}
.capsule--id {
  border-color: rgba(168, 85, 247, 0.4);
  background-color: rgba(168, 85, 247, 0.1);
}
.capsule--default {
  border-color: rgba(255, 255, 255, 0.1);
}

.capsule-label {
  font-weight: 700;
  color: #5eead4;
  white-space: nowrap;
}

.capsule-value {
  color: #e2e8f0;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
  user-select: all;
}

.copy-btn {
  background: none;
  border: none;
  padding: 2px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 4px;
}
.copy-btn:hover {
  color: #2dd4bf;
  background-color: rgba(255, 255, 255, 0.1);
}

/* 备忘录工具栏 */
.notes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
  user-select: none;
}

.category-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 160px;
}
@media (min-width: 640px) {
  .search-input {
    width: 200px;
  }
}

/* 卡片视图区 */
.cards-view-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

/* 新增就地输入卡片 */
.note-editor-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(45, 212, 191, 0.4);
  background-color: #151c2c;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.editor-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-select {
  width: 128px;
}

.editor-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-btn-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 备忘卡片 */
.note-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.4);
  transition: all 0.15s ease-in-out;
}

.note-card:hover {
  background-color: rgba(0, 0, 0, 0.6);
  border-color: rgba(45, 212, 191, 0.35);
}

.card-view-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tag-pinned {
  font-weight: 700;
}

.tag-category {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.note-card:hover .card-actions {
  opacity: 1;
}

.is-pinned {
  color: #f59e0b;
  fill: #f59e0b;
}

.note-preview-content {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #e2e8f0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}

.note-time-footer {
  font-size: 10px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: right;
}

.card-edit-mode {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 空状态 */
.notes-empty-state {
  padding: 48px 16px;
  text-align: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: #475569;
}

.empty-text {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.empty-subtext {
  font-size: 11px;
  color: #475569;
  margin: 0;
}

/* 源码视图 */
.raw-view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.raw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.sync-file-path {
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.raw-textarea {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

/* 弹窗样式 */
.params-modal {
  max-width: 640px;
  background-color: #111726;
  border: 1px solid #334155;
}

.params-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-text {
  font-size: 12px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.params-modal-list {
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.modal-param-card {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.param-card-left {
  min-width: 0;
  flex: 1;
}

.param-card-label {
  color: #2dd4bf;
  font-weight: 700;
  display: block;
}

.param-card-value {
  color: #e2e8f0;
  user-select: all;
  word-break: break-all;
  display: block;
  margin-top: 2px;
}

.icon-small {
  width: 14px;
  height: 14px;
}

.icon-tiny {
  width: 12px;
  height: 12px;
}
</style>
