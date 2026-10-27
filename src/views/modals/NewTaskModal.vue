<template>
  <n-modal
    v-model:show="isOpen"
    preset="card"
    title="新建开发任务工作区"
    class="new-task-modal"
  >
    <template #header-extra>
      <FolderPlus class="icon-medium text-teal-400" />
    </template>

    <form @submit.prevent="handleSubmit" class="modal-form">
      <div class="form-grid-top">
        <!-- 归属年份 -->
        <div class="field-year">
          <label class="field-label">
            归属年份 <span class="required-star">*</span>
          </label>
          <n-input
            v-model:value="form.year"
            size="small"
            placeholder="如: 2026"
            class="font-mono"
          />
        </div>

        <!-- 所属项目 -->
        <div class="field-project">
          <div class="project-label-row">
            <label class="field-label">
              所属项目 <span class="required-star">*</span>
            </label>
            <n-button
              v-if="!isCustomProject"
              size="tiny"
              quaternary
              type="primary"
              @click="switchToCustomProject"
            >
              + 输入新项目
            </n-button>
            <n-button
              v-else
              size="tiny"
              quaternary
              type="primary"
              @click="isCustomProject = false"
            >
              ← 返回已有项目
            </n-button>
          </div>

          <!-- 下拉选择已有项目 -->
          <n-select
            v-if="!isCustomProject"
            v-model:value="form.project"
            size="small"
            :options="projectSelectOptions"
            @update:value="handleProjectSelectChange"
          />

          <!-- 手动输入新项目名称 -->
          <n-input
            v-else
            ref="customProjectInputRef"
            v-model:value="customProjectName"
            size="small"
            placeholder="输入新项目名称，如: 电商中台、OA系统"
          />

          <!-- 快捷候选标签药丸 -->
          <div v-if="availableProjects.length > 0" class="project-quick-tags">
            <span class="quick-hint">快捷选择:</span>
            <n-tag
              v-for="p in availableProjects"
              :key="p"
              size="tiny"
              :type="form.project === p && !isCustomProject ? 'primary' : 'default'"
              :bordered="false"
              class="quick-pill cursor-pointer"
              @click="selectProjectTag(p)"
            >
              {{ p }}
            </n-tag>
          </div>
        </div>
      </div>

      <div class="field-block">
        <label class="field-label">
          任务 / 需求名称 <span class="required-star">*</span>
        </label>
        <n-input
          v-model:value="form.title"
          size="small"
          placeholder="如: 考勤流程接口对接、5G短信推送"
        />
      </div>

      <!-- 自动生成的工作区预览说明 -->
      <div class="workspace-preview-box">
        <p class="preview-title">
          <CheckCircle2 class="icon-small text-teal-400" />
          将在本地自动生成对应工作区：
        </p>
        <div class="preview-tree">
          📁 {{ form.year || '2026' }}/{{ form.title || '任务名称' }}/ <span class="project-highlight">({{ currentProjectDisplay }})</span><br>
          &nbsp;&nbsp;├── 📁 docs/ (需求.md、笔记.md、Word/Excel 需求文档)<br>
          &nbsp;&nbsp;├── 📁 sql/ (存放 SQL 脚本，支持单行管理与发布追踪)<br>
          &nbsp;&nbsp;└── 📁 attachments/ (存放原型图、抓包、原始附件)
        </div>
      </div>

      <div class="modal-footer">
        <n-button size="small" quaternary @click="close">
          取消
        </n-button>
        <n-button
          size="small"
          type="primary"
          :loading="loading"
          attr-type="submit"
        >
          立即创建工作区
        </n-button>
      </div>
    </form>
  </n-modal>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { NModal, NInput, NSelect, NButton, NTag } from 'naive-ui'
import { FolderPlus, CheckCircle2 } from 'lucide-vue-next'

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

const projectSelectOptions = computed(() => {
  const opts = availableProjects.value.map(p => ({
    label: `📁 ${p}`,
    value: p
  }))
  opts.push({ label: '➕ 输入新项目名称...', value: '__custom__' })
  return opts
})

function handleProjectSelectChange(val) {
  if (val === '__custom__') {
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

<style scoped>
.new-task-modal {
  max-width: 520px;
  background-color: #111726;
  border: 1px solid #334155;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.form-grid-top {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}

.field-year,
.field-project,
.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
}

.required-star {
  color: #f87171;
}

.project-quick-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.quick-hint {
  font-size: 10px;
  color: #64748b;
}

.quick-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.workspace-preview-box {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-title {
  font-weight: 500;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.preview-tree {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #94a3b8;
  padding-left: 20px;
  font-size: 11px;
  line-height: 1.6;
}

.project-highlight {
  color: #2dd4bf;
  font-family: sans-serif;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.icon-medium {
  width: 18px;
  height: 18px;
}

.icon-small {
  width: 14px;
  height: 14px;
}
</style>
