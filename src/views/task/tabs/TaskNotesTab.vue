<template>
  <div class="h-full flex flex-col p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
    <!-- 1. 智能提取参数速查栏 -->
    <div
      v-if="notesState.enableSmartParams.value && notesState.parsedParameters.value.length > 0"
      class="p-2.5 rounded-xl border border-white/10 bg-[#121826]/90 transition-all duration-200"
    >
      <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5 select-none">
        <div class="flex items-center gap-2">
          <n-button
            size="tiny"
            type="primary"
            secondary
            @click="isMoreParamsOpen = true"
            :title="`打开参数全景清单 (${notesState.parsedParameters.value.length} 项)`"
          >
            <template #icon>
              <Sparkles class="w-3.5 h-3.5" />
            </template>
            <span>速拷核心参数 ({{ notesState.parsedParameters.value.length }})</span>
          </n-button>
          <span class="text-[11px] text-slate-400 hidden sm:inline font-mono">
            {{ notesState.paramViewMode.value === 'wrap' ? '当前为平铺完整模式 (无截断)' : '当前为单行紧凑模式' }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 text-xs">
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
            <EyeOff class="w-3 h-3 text-slate-400" />
          </n-button>
        </div>
      </div>

      <!-- 参数胶囊展示区 -->
      <div
        class="gap-1.5 py-0.5 custom-scrollbar"
        :class="notesState.paramViewMode.value === 'wrap'
          ? 'flex flex-wrap items-center'
          : 'flex items-center overflow-x-auto whitespace-nowrap scroll-smooth'"
      >
        <div
          v-for="(param, pIdx) in notesState.parsedParameters.value"
          :key="pIdx"
          class="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-2 transition group bg-black/40 hover:bg-black/75 shadow-sm flex-shrink-0"
          :class="getParamPillColor(param.type)"
        >
          <span class="font-bold text-teal-300 flex-shrink-0">{{ param.label }}:</span>
          <span
            class="text-slate-200 group-hover:text-white font-mono break-all max-w-[260px] truncate select-all cursor-text"
            :title="`完整值: ${param.value} (单击复制)`"
            @click="notesState.copyParamText(param.value, param.label)"
          >
            {{ param.value }}
          </span>
          <button
            type="button"
            @click="notesState.copyParamText(param.value, param.label)"
            class="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-teal-300 transition cursor-pointer flex-shrink-0"
            title="复制此项完整值"
          >
            <Copy class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 备忘录工具栏 -->
    <div class="flex items-center justify-between gap-2 flex-wrap border-b border-white/5 pb-2.5 select-none">
      <!-- 分类标签过滤器 -->
      <div class="flex items-center gap-1.5 flex-wrap">
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
      <div class="flex items-center gap-2">
        <n-input
          v-if="notesState.noteViewMode.value === 'cards'"
          v-model:value="notesState.noteSearchQuery.value"
          size="small"
          placeholder="搜索备忘内容..."
          clearable
          class="w-40 sm:w-48"
        >
          <template #prefix>
            <Search class="w-3.5 h-3.5 text-slate-500" />
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
            <Plus class="w-3.5 h-3.5" />
          </template>
          <span>新建备忘</span>
        </n-button>
      </div>
    </div>

    <!-- 3. 卡片视图 -->
    <div v-if="notesState.noteViewMode.value === 'cards'" class="space-y-2.5 flex-1">
      <!-- 新增卡片就地输入框 -->
      <div
        v-if="notesState.isAddingNote.value"
        class="p-3.5 rounded-xl border border-teal-500/40 bg-[#151C2C] space-y-2.5 shadow-xl animate-in fade-in"
      >
        <div class="flex items-center gap-2">
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
            class="w-32"
          />
        </div>
        <n-input
          v-model:value="notesState.newNoteForm.value.content"
          type="textarea"
          size="small"
          placeholder="在此粘贴参数、YAML、SQL片段或接口文档..."
          :rows="4"
        />
        <div class="flex items-center justify-between">
          <n-checkbox v-model:checked="notesState.newNoteForm.value.pinned">
            置顶显示
          </n-checkbox>
          <div class="flex items-center gap-2">
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
        class="py-12 text-center rounded-xl border border-white/5 bg-black/20 text-slate-500 space-y-2"
      >
        <StickyNote class="w-10 h-10 mx-auto text-slate-600" />
        <p class="text-xs">当前任务暂无开发备忘卡片</p>
        <p class="text-[11px] text-slate-600">可点击右上角「新建备忘」随时记录联调参数与配置</p>
      </div>

      <!-- 备忘卡片列表 -->
      <div
        v-for="note in notesState.filteredTaskNotes.value"
        :key="note.id"
        class="p-3.5 rounded-xl border transition-all duration-150 group relative bg-black/40 hover:bg-black/60 border-white/5 hover:border-teal-500/40"
      >
        <!-- 编辑状态 -->
        <div v-if="notesState.editingNoteId.value === note.id" class="space-y-2.5">
          <div class="flex items-center gap-2">
            <n-input
              v-model:value="notesState.editingNoteForm.value.title"
              size="small"
              class="flex-1"
            />
            <n-select
              v-model:value="notesState.editingNoteForm.value.category"
              size="small"
              :options="categoryOptions"
              class="w-32"
            />
          </div>
          <n-input
            v-model:value="notesState.editingNoteForm.value.content"
            type="textarea"
            size="small"
            :rows="5"
          />
          <div class="flex items-center justify-between">
            <n-checkbox v-model:checked="notesState.editingNoteForm.value.pinned">
              置顶显示
            </n-checkbox>
            <div class="flex items-center gap-2">
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
        <div v-else class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span
                v-if="note.pinned"
                class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0"
              >
                置顶
              </span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30 flex-shrink-0">
                {{ note.category || '配置参数' }}
              </span>
              <h4 class="text-xs font-bold text-slate-100 truncate">
                {{ note.title }}
              </h4>
            </div>

            <!-- 卡片操作按钮 -->
            <div class="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
              <button
                type="button"
                @click="notesState.togglePinNote(note)"
                class="p-1 rounded text-slate-400 hover:text-amber-300 cursor-pointer"
                :title="note.pinned ? '取消置顶' : '置顶此条'"
              >
                <Pin class="w-3.5 h-3.5" :class="note.pinned ? 'text-amber-400 fill-amber-400' : ''" />
              </button>
              <button
                type="button"
                @click="notesState.startEditNote(note)"
                class="p-1 rounded text-slate-400 hover:text-teal-300 cursor-pointer"
                title="编辑此备忘"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="notesState.copyParamText(note.content, note.title)"
                class="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title="复制卡片内容"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="notesState.deleteNote(note.id)"
                class="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                title="删除备忘卡片"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 内容预览区 (等宽代码字体，支持选中) -->
          <pre class="p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap break-all select-text selection:bg-teal-500/30">{{ note.content }}</pre>

          <div class="text-[10px] text-slate-500 font-mono text-right">
            更新于: {{ note.updatedAt }}
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Markdown 源码视图 -->
    <div v-else class="flex-1 flex flex-col space-y-2">
      <div class="flex items-center justify-between text-xs text-slate-400">
        <span>与本地任务目录 <b class="text-slate-200 font-mono">docs/笔记.md</b> 实时双向同步</span>
        <n-button size="small" type="primary" secondary @click="notesState.saveRawNote">
          <template #icon>
            <Save class="w-3.5 h-3.5" />
          </template>
          <span>保存源码</span>
        </n-button>
      </div>
      <n-input
        v-model:value="notesState.rawNoteContent.value"
        type="textarea"
        class="flex-1 font-mono text-xs"
        placeholder="# 在此输入 Markdown 格式的开发备忘..."
      />
    </div>

    <!-- 全景参数清单模态框 -->
    <n-modal
      v-model:show="isMoreParamsOpen"
      preset="card"
      title="联调核心参数全景清单"
      class="max-w-2xl bg-[#111726] border border-slate-700"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-400 font-mono">从备忘中智能提取了 {{ notesState.parsedParameters.value.length }} 项配置</span>
          <n-button size="tiny" type="primary" secondary @click="notesState.copyAllParamsAsYaml">
            一键复制 YAML 格式
          </n-button>
        </div>
        <div class="max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <div
            v-for="(p, idx) in notesState.parsedParameters.value"
            :key="idx"
            class="p-2.5 rounded-lg border border-white/10 bg-black/40 flex items-center justify-between gap-3 text-xs font-mono"
          >
            <div class="min-w-0 flex-1">
              <span class="text-teal-400 font-bold block">{{ p.label }}</span>
              <span class="text-slate-200 select-all break-all block mt-0.5">{{ p.value }}</span>
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
  NModal
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
