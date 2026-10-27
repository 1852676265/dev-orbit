<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div class="app-modal-dialog bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
      <!-- 弹窗顶栏 -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
              SQL 脚本一键合并导出
              <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                已选 {{ selectedCount }} / {{ sqlItems.length }} 份
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              任务: <span class="text-slate-200 font-medium">{{ task?.title }}</span>
              · 自动按指定次序拼接、注入元数据头并可选包裹事务
            </p>
          </div>
        </div>
        <button
          @click="close"
          class="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          title="关闭"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 主体内容：双栏左右拆分 (左侧：排序与勾选，右侧：合并结果代码预览) -->
      <div class="flex-1 overflow-hidden grid grid-cols-12 min-h-[460px]">
        <!-- 左侧：脚本排序与选项面板 (5 列) -->
        <div class="col-span-5 border-r border-slate-800/80 p-4 flex flex-col bg-slate-900/60 overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ListOrdered class="w-4 h-4 text-indigo-400" />
              脚本执行次序 (上下调整)
            </span>
            <div class="flex items-center gap-1 text-[11px]">
              <button
                @click="selectAll(true)"
                class="px-1.5 py-0.5 text-slate-400 hover:text-indigo-300 transition"
              >
                全选
              </button>
              <span class="text-slate-600">|</span>
              <button
                @click="selectAll(false)"
                class="px-1.5 py-0.5 text-slate-400 hover:text-indigo-300 transition"
              >
                全不选
              </button>
            </div>
          </div>

          <!-- 脚本列表 (支持上下调整执行次序) -->
          <div class="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <div
              v-for="(item, idx) in sqlItems"
              :key="item.fileName"
              class="p-2.5 rounded-xl border transition flex items-center justify-between gap-2 text-xs"
              :class="item.selected ? 'bg-slate-800/80 border-indigo-500/30' : 'bg-slate-900/40 border-slate-800 opacity-60'"
            >
              <!-- 勾选与次序号 -->
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <input
                  type="checkbox"
                  v-model="item.selected"
                  @change="triggerRegenerate"
                  class="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <span class="w-5 text-center font-mono text-[11px] font-bold text-indigo-400/80 bg-slate-950/80 rounded px-1 py-0.5">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="font-mono text-slate-200 truncate font-medium" :title="item.fileName">
                    {{ item.fileName }}
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{{ formatFileSize(item.size) }}</span>
                    <span v-if="item.testReleased" class="text-emerald-400">● 测试已发</span>
                    <span v-else class="text-amber-400">○ 待发测试</span>
                  </div>
                </div>
              </div>

              <!-- 上下排序按钮 -->
              <div class="flex items-center gap-0.5 flex-shrink-0">
                <button
                  @click="moveItem(idx, -1)"
                  :disabled="idx === 0"
                  class="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="上移此脚本"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="moveItem(idx, 1)"
                  :disabled="idx === sqlItems.length - 1"
                  class="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="下移此脚本"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- 合并参数开关面板 -->
          <div class="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
            <span class="text-[11px] font-bold text-slate-400 block mb-1">包装与事务选项:</span>
            
            <label class="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                v-model="options.wrapTransaction"
                @change="triggerRegenerate"
                class="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-0"
              />
              <span>事务包裹 (<code class="text-indigo-300 font-mono text-[11px]">START TRANSACTION; ... COMMIT;</code>)</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                v-model="options.includeHeader"
                @change="triggerRegenerate"
                class="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-0"
              />
              <span>注入任务上线元数据头 (含日期、清单、开发者)</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                v-model="options.includeDividers"
                @change="triggerRegenerate"
                class="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-0"
              />
              <span>单脚本之间插入清晰分割线与文件名</span>
            </label>
          </div>
        </div>

        <!-- 右侧：实时合并结果代码预览 (7 列) -->
        <div class="col-span-7 flex flex-col p-4 bg-slate-950/70 overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Code2 class="w-4 h-4 text-indigo-400" />
                合并生成预览
              </span>
              <span class="text-[11px] font-mono text-slate-500">
                (共 {{ previewLines }} 行 · {{ formatFileSize(previewBytes) }})
              </span>
            </div>
            <button
              @click="regenerateSql"
              class="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition"
              title="重新拼接合并"
            >
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isGenerating }" />
              重新生成
            </button>
          </div>

          <!-- 代码高亮预览框 -->
          <div class="flex-1 relative rounded-xl border border-slate-800/80 bg-slate-900/90 overflow-hidden">
            <div v-if="isGenerating" class="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
              <div class="flex items-center gap-2 text-xs text-indigo-300">
                <RefreshCw class="w-4 h-4 animate-spin text-indigo-400" />
                正在智能拼接脚本内容...
              </div>
            </div>

            <textarea
              v-model="mergedSql"
              readonly
              class="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-indigo-600/40 custom-scrollbar"
              placeholder="请勾选左侧需要合并的 SQL 脚本..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 弹窗底部操作栏 -->
      <div class="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div class="text-xs text-slate-400 flex items-center gap-1.5">
          <Info class="w-3.5 h-3.5 text-indigo-400" />
          <span>合并导出后可直接复制发给 DBA，或保存到当前任务作为发版总单</span>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            @click="close"
            class="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition"
          >
            取消
          </button>

          <!-- 一键复制全文 -->
          <button
            @click="copyMergedSql"
            :disabled="!mergedSql.trim() || isGenerating"
            class="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-40"
          >
            <Copy class="w-3.5 h-3.5 text-indigo-400" />
            <span>一键复制全文 (发版提测)</span>
          </button>

          <!-- 另存为任务目录脚本 00_merged_all.sql -->
          <button
            @click="saveMergedToFile"
            :disabled="!mergedSql.trim() || isSaving || isGenerating"
            class="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition disabled:opacity-40"
          >
            <Save class="w-3.5 h-3.5" :class="{ 'animate-spin': isSaving }" />
            <span>另存为 00_merged_all.sql</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue'
import {
  Layers, X, ListOrdered, ArrowUp, ArrowDown, Code2,
  RefreshCw, Copy, Save, Info
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  task: { type: Object, default: () => ({}) },
  sqlList: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'updated', 'toast'])

// 脚本排序及选择状态项
const sqlItems = ref([])
const isGenerating = ref(false)
const isSaving = ref(false)
const mergedSql = ref('')

// 合并选项配置
const options = reactive({
  wrapTransaction: true,
  includeHeader: true,
  includeDividers: true
})

// 监听弹窗打开时初始化数据
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initItems()
  }
})

function initItems() {
  // 排除已存在的合并文件本身，避免死循环自我合并
  const rawList = (props.sqlList || []).filter(item => item.fileName !== '00_merged_all.sql')
  
  sqlItems.value = rawList.map(item => ({
    ...item,
    selected: true
  }))

  nextTick(() => {
    regenerateSql()
  })
}

const selectedCount = computed(() => sqlItems.value.filter(s => s.selected).length)
const previewLines = computed(() => mergedSql.value ? mergedSql.value.split('\n').length : 0)
const previewBytes = computed(() => new TextEncoder().encode(mergedSql.value).length)

function selectAll(val) {
  sqlItems.value.forEach(s => { s.selected = val })
  triggerRegenerate()
}

function moveItem(index, offset) {
  const targetIndex = index + offset
  if (targetIndex < 0 || targetIndex >= sqlItems.value.length) return
  const item = sqlItems.value.splice(index, 1)[0]
  sqlItems.value.splice(targetIndex, 0, item)
  triggerRegenerate()
}

function triggerRegenerate() {
  regenerateSql()
}

// 核心：读取各 SQL 内容并拼接
async function regenerateSql() {
  isGenerating.value = true
  const selected = sqlItems.value.filter(s => s.selected)

  if (selected.length === 0) {
    mergedSql.value = '-- [提示] 请在左侧勾选至少一份 SQL 脚本进行合并。\n'
    isGenerating.value = false
    return
  }

  try {
    const pieces = []
    const fileNames = selected.map(s => s.fileName)
    const nowStr = new Date().toLocaleString()
    const taskTitle = props.task?.title || '未命名任务'
    const project = props.task?.project || '常规项目'

    // 1. 生成元数据头注释
    if (options.includeHeader) {
      pieces.push(`-- ====================================================================`)
      pieces.push(`--  DevOrbit (星轨) · SQL 脚本统一合并上线总单`)
      pieces.push(`-- ====================================================================`)
      pieces.push(`-- 需求任务 : ${taskTitle}`)
      pieces.push(`-- 所属系统 : ${project}`)
      pieces.push(`-- 生成时间 : ${nowStr}`)
      pieces.push(`-- 脚本总数 : 共 ${selected.length} 份文件`)
      pieces.push(`-- 执行清单 :`)
      selected.forEach((s, idx) => {
        pieces.push(`--   [${idx + 1}] ${s.fileName}`)
      })
      pieces.push(`-- ====================================================================\n`)
    }

    // 2. 事务开头
    if (options.wrapTransaction) {
      pieces.push(`-- >>> [事务开始] 防止部分 SQL 失败导致脏读，请确保支持 DDL 事务 (MySQL 推荐谨慎分段)`)
      pieces.push(`START TRANSACTION;\n`)
    }

    // 3. 读取并拼接每个脚本
    for (let i = 0; i < selected.length; i++) {
      const item = selected[i]
      let fileContent = ''
      try {
        if (window.electronAPI && window.electronAPI.readSqlContent) {
          fileContent = await window.electronAPI.readSqlContent(item.filePath)
        }
      } catch (err) {
        fileContent = `-- [读取此文件失败: ${err.message}]`
      }

      if (options.includeDividers) {
        pieces.push(`-- --------------------------------------------------------------------`)
        pieces.push(`-- [${i + 1}/${selected.length}] File: ${item.fileName}`)
        pieces.push(`-- --------------------------------------------------------------------`)
      }

      pieces.push(fileContent.trim())
      pieces.push('\n')
    }

    // 4. 事务提交
    if (options.wrapTransaction) {
      pieces.push(`-- >>> [事务提交] 脚本全部按序执行完成`)
      pieces.push(`COMMIT;\n`)
    }

    mergedSql.value = pieces.join('\n')
  } catch (err) {
    mergedSql.value = `-- 生成合并 SQL 出现异常: ${err.message}`
  } finally {
    isGenerating.value = false
  }
}

// 复制到剪贴板
async function copyMergedSql() {
  if (!mergedSql.value) return
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(mergedSql.value)
    } else {
      await navigator.clipboard.writeText(mergedSql.value)
    }
    emit('toast', `🎉 已成功复制合并 SQL (${selectedCount.value} 份脚本，共 ${previewLines.value} 行)！`, 'success')
  } catch (e) {
    emit('toast', '复制失败: ' + e.message, 'error')
  }
}

// 另存为 00_merged_all.sql
async function saveMergedToFile() {
  if (!mergedSql.value || !props.task?.fullPath) return
  isSaving.value = true
  try {
    const savePath = `${props.task.fullPath}/sql/00_merged_all.sql`
    if (window.electronAPI && window.electronAPI.saveSqlContent) {
      await window.electronAPI.saveSqlContent(savePath, mergedSql.value)
    }
    emit('toast', `✅ 已将合并总单保存为 [00_merged_all.sql]！`, 'success')
    emit('updated')
    close()
  } catch (err) {
    emit('toast', '保存合并文件失败: ' + err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

function close() {
  emit('close')
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.6);
}
</style>
