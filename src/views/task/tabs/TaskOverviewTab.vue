<template>
  <div class="overview-container custom-scrollbar">
    <!-- 快捷状态卡片网格 -->
    <div class="cards-grid">
      <!-- 1. 备忘卡片 -->
      <div class="summary-card" @click="$emit('switch-tab', 'notes')">
        <div class="card-header">
          <span class="card-title text-teal">
            <StickyNote class="icon-small text-teal-400" />
            开发备忘
          </span>
          <span class="card-badge text-teal-400">
            {{ notesCount }} 条
          </span>
        </div>
        <p class="card-desc">
          {{ enableSmartParams ? `已提取 ${parsedParameters.length} 个联调参数，点击查看详情` : '智能提取已关闭' }}
        </p>
      </div>

      <!-- 2. SQL 状态卡片 -->
      <div class="summary-card" @click="$emit('switch-tab', 'sqls')">
        <div class="card-header">
          <span class="card-title text-amber">
            <Database class="icon-small text-amber-400" />
            SQL 发布
          </span>
          <span
            class="card-badge"
            :class="pendingSqlCount > 0 ? 'text-amber-400' : 'text-teal-400'"
          >
            {{ pendingSqlCount > 0 ? pendingSqlCount + ' 份待发' : '全部已上线' }}
          </span>
        </div>
        <p class="card-desc">共 {{ sqlsCount }} 份脚本，支持一键合并与事务保护</p>
      </div>

      <!-- 3. 文档资产卡片 -->
      <div class="summary-card" @click="$emit('switch-tab', 'docs')">
        <div class="card-header">
          <span class="card-title text-blue">
            <FolderKanban class="icon-small text-blue-400" />
            文档资产
          </span>
          <span class="card-badge text-blue-400">{{ docsCount }} 份</span>
        </div>
        <p class="card-desc">支持 Word、Excel、Markdown 软件内弹窗或本机打开</p>
      </div>
    </div>

    <!-- 全景看板参数速查区 -->
    <div
      v-if="enableSmartParams && parsedParameters.length > 0"
      class="params-panel"
    >
      <div class="panel-header">
        <span class="panel-title">
          <Sparkles class="icon-small" />
          核心联调参数 ({{ parsedParameters.length }} 项):
        </span>
        <n-button
          size="tiny"
          quaternary
          type="primary"
          @click="$emit('open-more-params')"
        >
          <template #icon>
            <Eye class="icon-tiny" />
          </template>
          <span>完整清单</span>
        </n-button>
      </div>

      <div class="params-list">
        <div
          v-for="(param, pIdx) in parsedParameters"
          :key="pIdx"
          class="param-pill"
          :class="getParamPillClass(param.type)"
        >
          <span class="param-label">{{ param.label }}:</span>
          <span
            class="param-value"
            :title="`完整值: ${param.value} (单击复制)`"
            @click="$emit('copy-param', param.value, param.label)"
          >
            {{ param.value }}
          </span>
          <button
            type="button"
            class="copy-btn"
            title="复制完整值"
            @click="$emit('copy-param', param.value, param.label)"
          >
            <Copy class="icon-tiny" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NButton } from 'naive-ui'
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

function getParamPillClass(type) {
  switch (type) {
    case 'key': return 'param-pill--key'
    case 'secret': return 'param-pill--secret'
    case 'token': return 'param-pill--token'
    case 'network': return 'param-pill--network'
    case 'id': return 'param-pill--id'
    default: return 'param-pill--default'
  }
}
</script>

<style scoped>
.overview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
  user-select: none;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.summary-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(18, 24, 38, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-card:hover {
  border-color: rgba(45, 212, 191, 0.4);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e2e8f0;
}

.card-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
}

.card-desc {
  font-size: 11px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* 参数速查面板 */
.params-panel {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(18, 24, 38, 0.9);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 12px;
  color: #2dd4bf;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.params-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.param-pill {
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
}

.param-pill--key {
  border-color: rgba(45, 212, 191, 0.4);
  background-color: rgba(45, 212, 191, 0.1);
}
.param-pill--secret {
  border-color: rgba(245, 158, 11, 0.4);
  background-color: rgba(245, 158, 11, 0.1);
}
.param-pill--token {
  border-color: rgba(56, 189, 248, 0.4);
  background-color: rgba(56, 189, 248, 0.1);
}
.param-pill--network {
  border-color: rgba(6, 182, 212, 0.4);
  background-color: rgba(6, 182, 212, 0.1);
}
.param-pill--id {
  border-color: rgba(168, 85, 247, 0.4);
  background-color: rgba(168, 85, 247, 0.1);
}
.param-pill--default {
  border-color: rgba(255, 255, 255, 0.1);
}

.param-label {
  font-weight: 700;
  white-space: nowrap;
  color: #5eead4;
}

.param-value {
  color: #e2e8f0;
  max-width: 320px;
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

.icon-small {
  width: 14px;
  height: 14px;
}

.icon-tiny {
  width: 12px;
  height: 12px;
}
</style>
