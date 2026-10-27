<template>
  <Teleport to="body">
    <div
      v-if="menu.visible"
      class="fixed z-50 rounded-xl border border-slate-700 shadow-2xl py-1.5 text-xs backdrop-blur-xl animate-in fade-in duration-100 min-w-[210px] bg-slate-900/95 text-slate-200 select-none"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
      @click.stop
    >
      <!-- 1. 任务右键 -->
      <template v-if="menu.type === 'task' && menu.task">
        <div class="px-3 py-1 font-mono text-[10px] text-slate-400 border-b border-white/10 truncate font-bold">
          任务: {{ menu.task.title }}
        </div>
        <button
          @click="$emit('action', 'open-folder', menu.task)"
          class="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <FolderOpen class="w-4 h-4 text-teal-400" />
          <span class="font-medium">在 Windows 资源管理器中打开</span>
        </button>
        <div class="my-1 border-t border-white/10"></div>
        <button
          @click="$emit('action', 'change-project', menu.task)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Tag class="w-3.5 h-3.5" />
          <span>修改所属项目名称...</span>
        </button>
        <button
          @click="$emit('action', 'set-status', { task: menu.task, status: 'in-progress' })"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <span class="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>标记为: 进行中</span>
        </button>
        <button
          @click="$emit('action', 'set-status', { task: menu.task, status: 'archived' })"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <span class="w-2 h-2 rounded-full bg-slate-500"></span>
          <span>标记为: 已上线归档</span>
        </button>
        <div class="my-1 border-t border-white/10"></div>
        <button
          @click="$emit('action', 'delete-task', menu.task)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>删除该任务 (移入回收站)</span>
        </button>
      </template>

      <!-- 2. 项目分类右键 -->
      <template v-else-if="menu.type === 'project' && menu.project">
        <div class="px-3 py-1 font-mono text-[10px] text-slate-400 border-b border-white/10 truncate font-bold">
          项目: {{ menu.project.name }}
        </div>
        <button
          @click="$emit('action', 'create-task-in-project', menu.project)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>在此项目下新建任务</span>
        </button>
        <button
          @click="$emit('action', 'rename-project', menu.project)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Pencil class="w-3.5 h-3.5" />
          <span>重命名此项目...</span>
        </button>
        <div class="my-1 border-t border-white/10"></div>
        <button
          @click="$emit('action', 'delete-project', menu.project)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>删除该项目 (移入回收站)</span>
        </button>
      </template>

      <!-- 3. SQL 脚本右键 -->
      <template v-else-if="menu.type === 'sql' && menu.sql">
        <div class="px-3 py-1 font-mono text-[10px] text-slate-400 border-b border-white/10 truncate font-bold flex items-center gap-1.5">
          <Database class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span class="truncate">{{ menu.sql.fileName }}</span>
        </div>
        <button
          @click="$emit('action', 'sql-edit', menu.sql)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer text-amber-300 font-bold"
        >
          <Pencil class="w-3.5 h-3.5" />
          <span>在软件内查看与编辑源码</span>
        </button>
        <button
          @click="$emit('action', 'sql-toggle-prod', menu.sql)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Sparkles class="w-3.5 h-3.5 text-teal-400" />
          <span>产线状态变更 (当前: {{ menu.sql.prodReleased ? '已发' : '待发' }})</span>
        </button>
        <button
          @click="$emit('action', 'open-folder', menu.sql.filePath)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <FolderOpen class="w-3.5 h-3.5 text-blue-400" />
          <span>在 Windows 资源管理器中定位</span>
        </button>
        <button
          @click="$emit('action', 'copy-path', menu.sql.filePath)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Copy class="w-3.5 h-3.5 text-slate-400" />
          <span>复制文件绝对路径</span>
        </button>
        <div class="my-1 border-t border-white/10"></div>
        <button
          @click="$emit('action', 'delete-sql', menu.sql)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>删除此 SQL 脚本 (移入回收站)</span>
        </button>
      </template>

      <!-- 4. 文档右键 -->
      <template v-else-if="menu.type === 'doc' && menu.doc">
        <div class="px-3 py-1 font-mono text-[10px] text-slate-400 border-b border-white/10 truncate font-bold flex items-center gap-1.5">
          <FileText class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
          <span class="truncate">{{ menu.doc.fileName }}</span>
        </div>
        <button
          v-if="isWord(menu.doc.fileName)"
          @click="$emit('action', 'open-native', menu.doc.filePath)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-500/20 hover:text-blue-300 text-left transition cursor-pointer text-blue-300 font-bold"
        >
          <FileText class="w-3.5 h-3.5 text-blue-400" />
          <span>使用 Microsoft Word 打开</span>
        </button>
        <button
          v-else-if="isExcel(menu.doc.fileName)"
          @click="$emit('action', 'open-native', menu.doc.filePath)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-500/20 hover:text-emerald-300 text-left transition cursor-pointer text-emerald-300 font-bold"
        >
          <Sheet class="w-3.5 h-3.5 text-emerald-400" />
          <span>使用 Microsoft Excel 打开</span>
        </button>
        <button
          @click="$emit('action', 'doc-preview', menu.doc)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Eye class="w-3.5 h-3.5 text-teal-400" />
          <span>在软件内弹窗查看/编辑</span>
        </button>
        <button
          @click="$emit('action', 'open-folder', menu.doc.filePath)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <FolderOpen class="w-3.5 h-3.5 text-blue-400" />
          <span>在 Windows 资源管理器中定位</span>
        </button>
        <button
          @click="$emit('action', 'copy-path', menu.doc.filePath)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
        >
          <Copy class="w-3.5 h-3.5 text-slate-400" />
          <span>复制文件绝对路径</span>
        </button>
        <div class="my-1 border-t border-white/10"></div>
        <button
          @click="$emit('action', 'delete-doc', menu.doc)"
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
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
