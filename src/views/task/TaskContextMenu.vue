<template>
  <Teleport to="body">
    <div
      v-if="menu.visible"
      class="context-menu-popover"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
      @click.stop
    >
      <!-- 1. 任务右键 -->
      <template v-if="menu.type === 'task' && menu.task">
        <div class="menu-header">
          任务: {{ menu.task.title }}
        </div>
        <button
          @click="$emit('action', 'open-folder', menu.task)"
          class="menu-item"
        >
          <FolderOpen class="item-icon text-teal-400" />
          <span class="font-medium">在 Windows 资源管理器中打开</span>
        </button>
        <div class="menu-divider" />
        <button
          @click="$emit('action', 'change-project', menu.task)"
          class="menu-item"
        >
          <Tag class="item-icon" />
          <span>修改所属项目名称...</span>
        </button>
        <button
          @click="$emit('action', 'set-status', { task: menu.task, status: 'in-progress' })"
          class="menu-item"
        >
          <span class="status-indicator bg-teal-400"></span>
          <span>标记为: 进行中</span>
        </button>
        <button
          @click="$emit('action', 'set-status', { task: menu.task, status: 'archived' })"
          class="menu-item"
        >
          <span class="status-indicator bg-slate-500"></span>
          <span>标记为: 已上线归档</span>
        </button>
        <div class="menu-divider" />
        <button
          @click="$emit('action', 'delete-task', menu.task)"
          class="menu-item is-danger"
        >
          <Trash2 class="item-icon" />
          <span>删除该任务 (移入回收站)</span>
        </button>
      </template>

      <!-- 2. 项目分类右键 -->
      <template v-else-if="menu.type === 'project' && menu.project">
        <div class="menu-header">
          项目: {{ menu.project.name }}
        </div>
        <button
          @click="$emit('action', 'create-task-in-project', menu.project)"
          class="menu-item"
        >
          <Plus class="item-icon" />
          <span>在此项目下新建任务</span>
        </button>
        <button
          @click="$emit('action', 'rename-project', menu.project)"
          class="menu-item"
        >
          <Pencil class="item-icon" />
          <span>重命名此项目...</span>
        </button>
        <div class="menu-divider" />
        <button
          @click="$emit('action', 'delete-project', menu.project)"
          class="menu-item is-danger"
        >
          <Trash2 class="item-icon" />
          <span>删除该项目 (移入回收站)</span>
        </button>
      </template>

      <!-- 3. SQL 脚本右键 -->
      <template v-else-if="menu.type === 'sql' && menu.sql">
        <div class="menu-header with-icon">
          <Database class="item-icon text-amber-400" />
          <span class="header-truncate">{{ menu.sql.fileName }}</span>
        </div>
        <button
          @click="$emit('action', 'sql-edit', menu.sql)"
          class="menu-item is-highlight text-amber"
        >
          <Pencil class="item-icon" />
          <span>在软件内查看与编辑源码</span>
        </button>
        <button
          @click="$emit('action', 'sql-toggle-prod', menu.sql)"
          class="menu-item"
        >
          <Sparkles class="item-icon text-teal-400" />
          <span>产线状态变更 (当前: {{ menu.sql.prodReleased ? '已发' : '待发' }})</span>
        </button>
        <button
          @click="$emit('action', 'open-folder', menu.sql.filePath)"
          class="menu-item"
        >
          <FolderOpen class="item-icon text-blue-400" />
          <span>在 Windows 资源管理器中定位</span>
        </button>
        <button
          @click="$emit('action', 'copy-path', menu.sql.filePath)"
          class="menu-item"
        >
          <Copy class="item-icon" />
          <span>复制文件绝对路径</span>
        </button>
        <div class="menu-divider" />
        <button
          @click="$emit('action', 'delete-sql', menu.sql)"
          class="menu-item is-danger"
        >
          <Trash2 class="item-icon" />
          <span>删除此 SQL 脚本 (移入回收站)</span>
        </button>
      </template>

      <!-- 4. 文档右键 -->
      <template v-else-if="menu.type === 'doc' && menu.doc">
        <div class="menu-header with-icon">
          <FileText class="item-icon text-teal-400" />
          <span class="header-truncate">{{ menu.doc.fileName }}</span>
        </div>
        <button
          v-if="isWord(menu.doc.fileName)"
          @click="$emit('action', 'open-native', menu.doc.filePath)"
          class="menu-item is-highlight text-blue"
        >
          <FileText class="item-icon text-blue-400" />
          <span>使用 Microsoft Word 打开</span>
        </button>
        <button
          v-else-if="isExcel(menu.doc.fileName)"
          @click="$emit('action', 'open-native', menu.doc.filePath)"
          class="menu-item is-highlight text-emerald"
        >
          <Sheet class="item-icon text-emerald-400" />
          <span>使用 Microsoft Excel 打开</span>
        </button>
        <button
          @click="$emit('action', 'doc-preview', menu.doc)"
          class="menu-item"
        >
          <Eye class="item-icon text-teal-400" />
          <span>在软件内弹窗查看/编辑</span>
        </button>
        <button
          @click="$emit('action', 'open-folder', menu.doc.filePath)"
          class="menu-item"
        >
          <FolderOpen class="item-icon text-blue-400" />
          <span>在 Windows 资源管理器中定位</span>
        </button>
        <button
          @click="$emit('action', 'copy-path', menu.doc.filePath)"
          class="menu-item"
        >
          <Copy class="item-icon" />
          <span>复制文件绝对路径</span>
        </button>
        <div class="menu-divider" />
        <button
          @click="$emit('action', 'delete-doc', menu.doc)"
          class="menu-item is-danger"
        >
          <Trash2 class="item-icon" />
          <span>删除此文档 (移入回收站)</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<script setup>
import {
  FolderOpen,
  Tag,
  Trash2,
  Plus,
  Pencil,
  Database,
  Sparkles,
  Copy,
  FileText,
  Sheet,
  Eye
} from 'lucide-vue-next'

defineProps({
  menu: { type: Object, required: true }
})

defineEmits(['action'])

function isWord(fileName) {
  if (!fileName) return false
  const lower = fileName.toLowerCase()
  return lower.endsWith('.doc') || lower.endsWith('.docx')
}

function isExcel(fileName) {
  if (!fileName) return false
  const lower = fileName.toLowerCase()
  return lower.endsWith('.xls') || lower.endsWith('.xlsx')
}
</script>

<style scoped>
.context-menu-popover {
  position: fixed;
  z-index: 9999;
  border-radius: 12px;
  border: 1px solid #334155;
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.6);
  padding: 6px 0;
  font-size: 12px;
  backdrop-filter: blur(16px);
  min-width: 210px;
  background-color: rgba(15, 23, 42, 0.96);
  color: #e2e8f0;
  user-select: none;
}

.menu-header {
  padding: 4px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
}

.menu-header.with-icon {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-item {
  width: 100%;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #cbd5e1;
  text-align: left;
  transition: all 0.15s ease;
  cursor: pointer;
  font-size: 12px;
}

.menu-item:hover {
  background-color: rgba(45, 212, 191, 0.15);
  color: #5eead4;
}

.menu-item.is-danger {
  color: #f87171;
}
.menu-item.is-danger:hover {
  background-color: rgba(136, 19, 55, 0.5);
  color: #fca5a5;
}

.menu-item.is-highlight.text-amber {
  color: #fcd34d;
  font-weight: 700;
}
.menu-item.is-highlight.text-blue {
  color: #93c5fd;
  font-weight: 700;
}
.menu-item.is-highlight.text-emerald {
  color: #6ee7b7;
  font-weight: 700;
}

.menu-divider {
  margin: 4px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
