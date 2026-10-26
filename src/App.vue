<template>
  <div
    class="h-screen w-screen flex flex-row relative overflow-hidden font-sans select-none"
    :style="[rootThemeStyle, { backgroundColor: 'var(--page-bg)', color: 'var(--page-text-main)' }]"
    :data-theme-accent="currentTheme.colorTheme || 'emerald'"
    :data-theme-mode="isCurrentThemeLight ? 'light' : 'dark'"
  >
    
    <!-- 动态背景画布层 (支持自定义壁纸与系统预设渐变) -->
    <div
      class="absolute inset-0 z-0 pointer-events-none transition-all duration-700 bg-center bg-cover"
      :style="backgroundStyle"
    ></div>

    <!-- 遮罩层 (自定义壁纸时按需调节对比度，预设渐变时透明) -->
    <div
      class="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
      :style="overlayStyle"
    ></div>

    <!-- ===================================================================== -->
    <!-- 全局架构一：左侧 52px 极窄神经轨 (Neural Rail)                         -->
    <!-- ===================================================================== -->
    <aside
      class="w-14 border-r flex flex-col items-center py-3.5 flex-shrink-0 z-30 space-y-4 backdrop-blur-2xl transition-all duration-300"
      :class="isLight ? 'bg-white/80 border-slate-300/80 shadow-slate-200/50' : 'bg-slate-950/80 border-slate-800/80 shadow-black/40'"
      style="box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);"
    >
      <!-- 神经轨 Logo (DO / DevOrbit) -->
      <div
        class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-emerald-950/50 cursor-pointer transition hover:scale-105"
        title="DevOrbit 开发者星轨 v1.3"
      >
        <span class="font-mono text-xs font-black tracking-tighter">DO</span>
      </div>

      <div class="w-6 border-t" :class="isLight ? 'border-slate-300' : 'border-slate-800/90'"></div>

      <!-- 核心视图切换主按钮组 (任务 / 随手记 / 服务器) -->
      <div class="flex-1 flex flex-col space-y-2.5">
        <!-- 1. 开发任务工作台 -->
        <button
          @click="currentView = 'tasks'"
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group"
          :class="currentView === 'tasks'
            ? (isLight
                ? 'bg-teal-500/15 text-teal-800 border border-teal-500/40 shadow-sm'
                : 'bg-teal-500/15 text-teal-300 border border-teal-500/35 shadow-lg shadow-teal-950/60 ring-1 ring-teal-500/30')
            : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5')"
          title="开发任务中枢与 SQL 上线工作台"
        >
          <Layers class="w-4 h-4" />
          
          <!-- 待发 SQL 呼吸红点 -->
          <span
            v-if="totalPendingProdSqls > 0"
            class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"
          ></span>
          <span
            v-if="totalPendingProdSqls > 0"
            class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"
          ></span>

          <!-- Tooltip 浮动说明 -->
          <span class="absolute left-13 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-xs text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-2xl font-mono">
            开发任务中枢 ({{ tasks.length }}) · {{ totalPendingProdSqls }} 待发 SQL
          </span>
        </button>

        <!-- 2. 随手记 & 常用命令军火库 -->
        <button
          @click="currentView = 'notes'"
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group"
          :class="currentView === 'notes'
            ? (isLight
                ? 'bg-teal-500/15 text-teal-800 border border-teal-500/40 shadow-sm'
                : 'bg-teal-500/15 text-teal-300 border border-teal-500/35 shadow-lg shadow-teal-950/60 ring-1 ring-teal-500/30')
            : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5')"
          title="随手记 & 常用命令军火库"
        >
          <BookMarked class="w-4 h-4" />
          <span class="absolute left-13 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-xs text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-2xl font-mono">
            随手记 & 常用命令军火库
          </span>
        </button>

        <!-- 3. 服务器矩阵与凭据速查 -->
        <button
          @click="currentView = 'servers'"
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group"
          :class="currentView === 'servers'
            ? (isLight
                ? 'bg-teal-500/15 text-teal-800 border border-teal-500/40 shadow-sm'
                : 'bg-teal-500/15 text-teal-300 border border-teal-500/35 shadow-lg shadow-teal-950/60 ring-1 ring-teal-500/30')
            : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5')"
          title="服务器矩阵与 SVN 凭据速查"
        >
          <Server class="w-4 h-4" />
          <span class="absolute left-13 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-xs text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-2xl font-mono">
            服务器与凭据速查 (SVN Word)
          </span>
        </button>
      </div>

      <!-- 神经轨底部功能：外观、设置、工作区心跳指示灯 -->
      <div class="flex flex-col items-center space-y-2.5">
        <!-- 外观与主题 -->
        <button
          @click="openThemeModal"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-teal-400 hover:bg-white/5 transition"
          title="个性化外观与自定义壁纸 (🎨)"
        >
          <Palette class="w-4 h-4" />
        </button>

        <!-- 系统设置中心 -->
        <button
          @click="openSettingsModal"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-teal-400 hover:bg-white/5 transition"
          title="系统设置中心 (工作区、开发工具、路线图)"
        >
          <Settings class="w-4 h-4" />
        </button>

        <!-- 工作区在线心跳指示灯 -->
        <div
          class="w-2 h-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400/80 animate-pulse mt-1"
          :title="`工作区在线: ${workspacePath}`"
        ></div>
      </div>
    </aside>

    <!-- ===================================================================== -->
    <!-- 右侧：全息矩阵主舞台与 Omni-Bar 流光控制中枢                           -->
    <!-- ===================================================================== -->
    <div class="flex-1 flex flex-col overflow-hidden relative z-10">

      <!-- 1. 顶层 Omni-Bar 流光状态条 (无界融合架构) -->
      <header
        class="h-12 border-b px-5 flex items-center justify-between flex-shrink-0 z-20 backdrop-blur-xl transition-all"
        :class="isLight ? 'bg-white/70 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'"
      >
        <!-- 模块标识与工作区路径 -->
        <div class="flex items-center gap-3">
          <!-- 模块指示胶囊 -->
          <span
            class="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border transition-colors shadow-sm"
            :class="isLight
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-teal-950/70 text-teal-300 border-teal-700/60'"
          >
            {{ currentViewTitle.badge }}
          </span>

          <span class="text-xs font-semibold" :class="isLight ? 'text-slate-800' : 'text-slate-200'">
            {{ currentViewTitle.desc }}
          </span>

          <span class="text-slate-500 opacity-40">|</span>

          <!-- 当前工作区目录 (点击可更换) -->
          <div
            @click="changeWorkspace"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer max-w-[280px] transition group border border-transparent hover:border-slate-700"
            :class="isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'"
            title="点击更换工作区根目录"
          >
            <FolderGit2 class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span class="truncate font-mono text-[11px]">{{ workspacePath || '选择工作区' }}</span>
          </div>
        </div>

        <!-- 右侧：待发 SQL 胶囊、极速搜索、更新中心与沉浸模式 -->
        <div class="flex items-center gap-2.5 text-xs">
          <!-- 待发 SQL 预警胶囊 -->
          <div
            v-if="totalPendingProdSqls > 0"
            class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold flex items-center gap-1.5 border shadow-sm"
            :class="isLight
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-amber-950/70 text-amber-300 border-amber-700/60'"
          >
            <Database class="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span>{{ totalPendingProdSqls }} 份产线 SQL 待发布</span>
          </div>

          <!-- 全局搜索入口 (Ctrl+K) -->
          <button
            @click="openSearchModal"
            class="flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono transition border"
            :class="isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'"
            title="全局搜索任务、SQL与命令 (快捷键 Ctrl+K)"
          >
            <Search class="w-3.5 h-3.5 text-teal-400 opacity-80" />
            <span>全局搜索...</span>
            <kbd class="px-1.5 py-0.2 text-[10px] rounded bg-black/30 border border-white/10 opacity-70">Ctrl K</kbd>
          </button>

          <!-- DBX 同款无感更新中心 -->
          <button
            @click="openUpdateCenter"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition border shadow-sm"
            :class="isLight
              ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
              : 'bg-teal-950/80 text-teal-300 border-teal-700/70 hover:bg-teal-900/80'"
            title="打开更新中心 (DBX 模式在线自动更新)"
          >
            <RefreshCw class="w-3 h-3 text-teal-400" />
            <span>更新中心</span>
          </button>

          <!-- 一键沉浸壁纸模式 -->
          <button
            @click="toggleZenMode"
            class="p-1.5 rounded-xl border transition"
            :class="isZenMode
              ? 'bg-teal-950 text-teal-300 border-teal-600'
              : (isLight ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200')"
            title="沉浸壁纸模式 (按 Esc 退出)"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <!-- 2. 主舞台区 (沉浸壁纸模式时淡出) -->
      <main
        class="flex-1 overflow-hidden relative transition-all duration-300"
        :class="isZenMode ? 'opacity-0 pointer-events-none scale-98' : 'opacity-100 scale-100'"
      >
        <TaskBoard
          v-if="currentView === 'tasks'"
          :tasks="tasks"
          :years="years"
          :is-light="isCurrentThemeLight"
          :card-opacity="currentTheme.cardOpacity ?? 20"
          :card-glass="currentTheme.cardGlass !== false"
          @open-new-task="openNewTaskModal"
          @select-task="handleSelectTask"
          @updated="loadTasks"
          @toast="showToast"
        />
        <QuickNotesView
          v-else-if="currentView === 'notes'"
          :is-light="isCurrentThemeLight"
          @toast="showToast"
        />
        <ServerCredentialsView
          v-else-if="currentView === 'servers'"
          @toast="showToast"
        />
      </main>

      <!-- 3. 底部全局极客状态条 (Status Bar) -->
      <footer
        class="h-7 border-t px-5 flex items-center justify-between text-[11px] font-mono select-none flex-shrink-0 backdrop-blur-xl"
        :class="isLight ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-950/80 border-slate-800/80 text-slate-400'"
      >
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5 text-teal-400 font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            矩阵系统就绪
          </span>
          <span class="text-slate-600">|</span>
          <span class="truncate max-w-sm">当前共加载 {{ tasks.length }} 个任务资产</span>
        </div>

        <div class="flex items-center gap-4 text-[10px]">
          <span>↑↓ 切换任务</span>
          <span>↵ 打开详情</span>
          <span>Ctrl+O 在IDE打开</span>
          <span>Ctrl+E 资源管理器</span>
          <span class="text-teal-400 font-bold">DevOrbit v1.3.0</span>
        </div>
      </footer>

    </div>

    <!-- 沉浸壁纸观赏提示浮条 -->
    <div
      v-if="isZenMode"
      @click="toggleZenMode"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-xl border border-white/20 text-xs text-slate-200 cursor-pointer shadow-2xl transition hover:scale-105 select-none"
      title="点击任意处或按 Esc 恢复工作台"
    >
      <EyeOff class="w-4 h-4 text-teal-400 animate-pulse" />
      <span>壁纸沉浸模式 · 点击屏幕或按 Esc 恢复</span>
    </div>

    <!-- 弹窗集 -->
    <NewTaskModal
      ref="newTaskModalRef"
      @created="onTaskCreated"
    />
    <TaskDetailModal
      ref="taskDetailModalRef"
      @updated="loadTasks"
      @toast="showToast"
    />
    <GlobalSearchModal
      ref="globalSearchModalRef"
      @toast="showToast"
    />
    <ThemeModal
      ref="themeModalRef"
      @update-theme="onThemeUpdate"
      @toast="showToast"
    />
    <SettingsModal
      ref="settingsModalRef"
      :tasks="tasks"
      :years="years"
      @saved="onSettingsSaved"
      @workspace-changed="onWorkspaceChanged"
      @open-theme="openThemeModal"
      @open-update-center="openUpdateCenter"
      @toast="showToast"
    />
    <UpdateCenterModal ref="updateCenterModalRef" @toast="showToast" />
    <Toast ref="toastRef" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Layers, BookMarked, Server, Search, FolderGit2, Settings, Palette,
  Eye, EyeOff, RefreshCw, Database
} from 'lucide-vue-next'

import TaskBoard from './components/TaskBoard.vue'
import QuickNotesView from './components/QuickNotesView.vue'
import ServerCredentialsView from './components/ServerCredentialsView.vue'
import NewTaskModal from './components/NewTaskModal.vue'
import TaskDetailModal from './components/TaskDetailModal.vue'
import GlobalSearchModal from './components/GlobalSearchModal.vue'
import ThemeModal from './components/ThemeModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import UpdateCenterModal from './components/UpdateCenterModal.vue'
import Toast from './components/Toast.vue'
import { getThemeConfig } from './constants/colorThemes'

const currentView = ref('tasks')
const workspacePath = ref('')
const tasks = ref([])
const years = ref(['2026', '2025'])
const isZenMode = ref(false)

const newTaskModalRef = ref(null)
const taskDetailModalRef = ref(null)
const globalSearchModalRef = ref(null)
const themeModalRef = ref(null)
const settingsModalRef = ref(null)
const updateCenterModalRef = ref(null)
const toastRef = ref(null)

// 当前视图标题与描述
const currentViewTitle = computed(() => {
  if (currentView.value === 'tasks') {
    return { badge: '任务中枢', desc: '全流程研发任务流水线 & 线上 SQL 资产合流' }
  } else if (currentView.value === 'notes') {
    return { badge: '军火库', desc: '随手记 & 常用命令、代码片段与运维速查' }
  } else if (currentView.value === 'servers') {
    return { badge: '服务器矩阵', desc: 'SVN Word 凭据智能解析台 & 服务器节点拓扑' }
  }
  return { badge: '工作台', desc: 'DevOrbit 开发者星轨' }
})

// 总待发产线 SQL 统计
const totalPendingProdSqls = computed(() => {
  return tasks.value.reduce((sum, t) => sum + (t.prodPendingCount || 0), 0)
})

// 主题外观与配色主题状态 (默认高端冷翠黑曜风格)
const currentTheme = ref({
  colorTheme: 'emerald',
  customPrimaryColor: '#14b8a6',
  type: 'preset',
  presetId: 'aurora',
  customBg: '',
  customBgName: '',
  overlayOpacity: 35,
  blurLevel: 'sm',
  cardGlass: true,
  cardOpacity: 18
})

// 判断当前主题是否为浅色风格
const isCurrentThemeLight = computed(() => {
  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#14b8a6')
  return !!c.isLight
})

// 实时同步主题模式
watch([() => currentTheme.value.colorTheme, isCurrentThemeLight], ([color, isLight]) => {
  const mode = isLight ? 'light' : 'dark'
  const accent = color || 'emerald'
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme-mode', mode)
    document.documentElement.setAttribute('data-theme-accent', accent)
    if (document.body) {
      document.body.setAttribute('data-theme-mode', mode)
      document.body.setAttribute('data-theme-accent', accent)
    }
  }
}, { immediate: true })

// 全局动态配色主题样式注入
const rootThemeStyle = computed(() => {
  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#14b8a6')
  return {
    '--theme-primary': '#14b8a6',
    '--theme-primary-rgb': '20, 184, 166',
    '--theme-primary-hover': '#2dd4bf',
    '--theme-primary-light': 'rgba(20, 184, 166, 0.16)',
    '--theme-primary-border': 'rgba(20, 184, 166, 0.38)',
    '--theme-primary-glow': 'rgba(20, 184, 166, 0.25)',
    '--page-bg': c.pageBg || '#090b10',
    '--page-gradient': c.pageGradient || 'linear-gradient(135deg, #090b10 0%, #0e121b 100%)',
    '--page-text-main': c.pageTextMain || '#f8fafc',
    '--page-text-muted': c.pageTextMuted || '#94a3b8'
  }
})

const backgroundStyle = computed(() => {
  if (currentTheme.value.type === 'custom' && currentTheme.value.customBg) {
    return {
      backgroundImage: `url("${currentTheme.value.customBg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: currentTheme.value.blurLevel === 'none' || !currentTheme.value.blurLevel ? 'none' : getBlurFilter(currentTheme.value.blurLevel)
    }
  }

  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#14b8a6')
  return {
    background: c.pageGradient || c.pageBg || '#090b10',
    filter: getBlurFilter(currentTheme.value.blurLevel)
  }
})

const overlayStyle = computed(() => {
  if (currentTheme.value.type !== 'custom' || !currentTheme.value.customBg) {
    return { opacity: 0, backgroundColor: 'transparent' }
  }

  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#14b8a6')
  let op = currentTheme.value.overlayOpacity ?? 20
  op = Math.min(op, 30)
  return {
    opacity: op / 100,
    backgroundColor: c.isLight ? '#ffffff' : '#090b10'
  }
})

function getBlurFilter(blur) {
  if (blur === 'sm') return 'blur(4px)'
  if (blur === 'md') return 'blur(12px)'
  if (blur === 'lg') return 'blur(24px)'
  return 'none'
}

onMounted(async () => {
  workspacePath.value = await window.electronAPI.getWorkspacePath()
  await loadTasks()

  try {
    const config = await window.electronAPI.getAppConfig()
    if (config && config.themeSettings) {
      Object.assign(currentTheme.value, config.themeSettings)
    }
  } catch (e) {}

  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', (e) => e.preventDefault())
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(e) {
  if (e.key === 'Escape' && isZenMode.value) {
    isZenMode.value = false
    return
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    openSearchModal()
  }
}

function toggleZenMode() {
  isZenMode.value = !isZenMode.value
  if (isZenMode.value) {
    showToast('已进入沉浸壁纸模式，按 Esc 或点击底部退出', 'info')
  }
}

function onThemeUpdate(newTheme) {
  Object.assign(currentTheme.value, newTheme)
}

function openThemeModal() {
  themeModalRef.value?.open(currentTheme.value)
}

async function loadTasks() {
  try {
    const res = await window.electronAPI.getTasks()
    if (res && res.tasks) {
      tasks.value = res.tasks
      years.value = res.years || ['2026', '2025']
    } else if (Array.isArray(res)) {
      tasks.value = res
    }
  } catch (err) {
    console.error('加载任务失败', err)
  }
}

async function changeWorkspace() {
  const newPath = await window.electronAPI.selectWorkspaceDir()
  if (newPath) {
    workspacePath.value = newPath
    await loadTasks()
    showToast('工作区已切换为: ' + newPath)
  }
}

async function openNewTaskModal(defaultYear = '', defaultProject = '') {
  let preferredYear = defaultYear
  let preferredProject = defaultProject
  try {
    const config = await window.electronAPI.getAppConfig()
    if (!preferredYear && config?.defaultYear) preferredYear = config.defaultYear
    if (!preferredProject && config?.defaultProject) preferredProject = config.defaultProject
  } catch (e) {}

  const projSet = new Set(['MZ', '常规项目'])
  for (const t of tasks.value) {
    if (t.project) projSet.add(t.project.trim())
  }
  newTaskModalRef.value?.open(preferredYear || '2026', preferredProject || 'MZ', Array.from(projSet))
}

function onTaskCreated(task) {
  loadTasks()
  showToast(`任务 [${task.id}] 工作区文件夹创建成功！`)
  taskDetailModalRef.value?.open(task)
}

function handleSelectTask(task) {
  taskDetailModalRef.value?.open(task)
}

function openSearchModal() {
  globalSearchModalRef.value?.open()
}

function openSettingsModal() {
  settingsModalRef.value?.open()
}

function openUpdateCenter() {
  updateCenterModalRef.value?.open()
}

function onSettingsSaved(newConfig) {
  if (newConfig && newConfig.workspacePath && newConfig.workspacePath !== workspacePath.value) {
    workspacePath.value = newConfig.workspacePath
    loadTasks()
  }
  if (newConfig && newConfig.themeSettings) {
    Object.assign(currentTheme.value, newConfig.themeSettings)
  }
}

function onWorkspaceChanged(newPath) {
  workspacePath.value = newPath
  loadTasks()
}

function showToast(msg, type = 'success') {
  toastRef.value?.show(msg, type)
}
</script>

<style scoped>
/* 全局平滑过渡与阴影 */
aside button, header button {
  user-select: none;
}
</style>
