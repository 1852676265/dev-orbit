<template>
  <div v-if="isOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="app-modal-dialog bg-slate-800 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-4 border-b border-slate-700/80">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <FolderPlus class="w-5 h-5 text-emerald-400" />
          新建开发任务工作区
        </h3>
        <button @click="close" class="text-slate-400 hover:text-slate-200 transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <!-- 归属年份 -->
          <div class="col-span-1">
            <label class="block text-xs font-medium text-slate-300 mb-1">
              归属年份 <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="form.year"
              type="text"
              required
              placeholder="如: 2026"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <!-- 所属项目 (支持下拉选择已有项目或输入新项目) -->
          <div class="col-span-2">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-slate-300">
                所属项目 <span class="text-rose-400">*</span>
              </label>
              <button
                v-if="!isCustomProject"
                type="button"
                @click="switchToCustomProject"
                class="text-[11px] text-emerald-400 hover:text-emerald-300 font-normal transition"
              >
                + 输入新项目
              </button>
              <button
                v-else
                type="button"
                @click="isCustomProject = false"
                class="text-[11px] text-emerald-400 hover:text-emerald-300 font-normal transition"
              >
                ← 返回已有项目
              </button>
            </div>

            <!-- 下拉选择已有项目 -->
            <div v-if="!isCustomProject" class="relative">
              <select
                v-model="form.project"
                @change="handleProjectSelectChange"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none font-medium"
              >
                <option v-for="p in availableProjects" :key="p" :value="p">
                  📁 {{ p }}
                </option>
                <option value="__custom__">
                  ➕ 输入新项目名称...
                </option>
              </select>
              <ChevronDown class="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <!-- 手动输入新项目名称 -->
            <div v-else>
              <input
                ref="customProjectInputRef"
                v-model="customProjectName"
                type="text"
                required
                placeholder="输入新项目名称，如: 电商中台、OA系统"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- 快捷候选标签药丸 (点击一键直选) -->
            <div v-if="availableProjects.length > 0" class="flex items-center gap-1.5 flex-wrap mt-2">
              <span class="text-[10px] text-slate-500">快捷选择:</span>
              <button
                v-for="p in availableProjects"
                :key="p"
                type="button"
                @click="selectProjectTag(p)"
                class="px-2 py-0.5 rounded text-[11px] font-mono transition border"
                :class="form.project === p && !isCustomProject
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'"
              >
                {{ p }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            任务 / 需求名称 <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="如: 考勤流程接口对接、5G短信推送"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50 text-xs text-slate-400 space-y-1">
          <p class="font-medium text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            将在本地自动生成对应工作区：
          </p>
          <div class="font-mono text-slate-400 pl-5 text-[11px] leading-relaxed">
            📁 {{ form.year || '2026' }}/{{ form.title || '任务名称' }}/ <span class="text-emerald-400 font-sans font-medium">({{ currentProjectDisplay }})</span><br>
            &nbsp;&nbsp;├── 📁 docs/ (需求.md、笔记.md、Word/Excel 需求文档)<br>
            &nbsp;&nbsp;├── 📁 sql/ (存放 SQL 脚本，支持单行管理与发布追踪)<br>
            &nbsp;&nbsp;└── 📁 attachments/ (存放原型图、抓包、原始附件)
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/60 rounded-lg transition"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-950/40 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <span>{{ loading ? '创建中...' : '立即创建工作区' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { FolderPlus, X, CheckCircle2, Loader2, ChevronDown } from 'lucide-vue-next'

const emit = defineEmits(['created'])

const isOpen = ref(false)
const loading = ref(false)
const isCustomProject = ref(false)
const customProjectName = ref('')
const customProjectInputRef = ref(null)

const availableProjects = ref(['MZ', '常规项目'])

const form = reactive({
  title: '',
  year: '2026',
  project: 'MZ'
})

const currentProjectDisplay = computed(() => {
  return isCustomProject.value ? (customProjectName.value || '新项目') : (form.project || 'MZ')
})

function handleProjectSelectChange() {
  if (form.project === '__custom__') {
    switchToCustomProject()
  }
}

async function switchToCustomProject() {
  isCustomProject.value = true
  customProjectName.value = ''
  await nextTick()
  customProjectInputRef.value?.focus()
}

function selectProjectTag(p) {
  form.project = p
  isCustomProject.value = false
}

function open(defaultYear = '', defaultProject = '', existingProjects = []) {
  const d = new Date()
  const currentYear = d.getFullYear().toString()
  form.year = defaultYear && defaultYear !== 'all' ? defaultYear : currentYear
  form.title = ''

  // 整理所有已有项目
  const pList = Array.isArray(existingProjects) && existingProjects.length > 0
    ? Array.from(new Set(existingProjects.filter(Boolean)))
    : ['MZ', '常规项目']
  
  if (!pList.includes('MZ')) pList.unshift('MZ')
  if (!pList.includes('常规项目')) pList.push('常规项目')
  availableProjects.value = pList

  // 默认选中项目
  if (defaultProject && defaultProject !== 'all') {
    form.project = defaultProject
    isCustomProject.value = false
  } else if (availableProjects.value.includes('MZ')) {
    form.project = 'MZ'
    isCustomProject.value = false
  } else {
    form.project = availableProjects.value[0] || 'MZ'
    isCustomProject.value = false
  }

  customProjectName.value = ''
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function handleSubmit() {
  const finalProject = isCustomProject.value ? customProjectName.value.trim() : form.project.trim()
  if (!finalProject) {
    alert('请选择或输入所属项目')
    return
  }
  loading.value = true
  try {
    const res = await window.electronAPI.createTask({
      title: form.title.trim(),
      year: form.year.trim(),
      project: finalProject
    })
    emit('created', res)
    close()
  } catch (err) {
    alert('创建任务失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
