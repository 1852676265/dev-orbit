<template>
  <n-config-provider :theme="darkTheme">
    <div
      class="h-screen w-screen flex flex-row relative overflow-hidden font-sans select-none bg-[#090B10] text-slate-100"
      data-theme-mode="dark"
      data-theme-accent="emerald"
    >
    
    <!-- 动态背景画布层 (支持自定义壁纸与系统预设渐变) -->
    <div
      class="absolute inset-0 z-0 pointer-events-none transition-all duration-700 bg-center bg-cover"
      :style="backgroundStyle"
    ></div>

    <!-- 遮罩层 (与【个性化外观设置】的背景暗度遮罩实时无缝联动) -->
    <div
      class="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
      :style="overlayStyle"
    ></div>

    <!-- ===================================================================== -->
    <!-- 全局架构一：左侧 54px 极窄神经轨 (采用 Naive UI 组件化规范)             -->
    <!-- ===================================================================== -->
    <aside
      class="w-14 border-r border-white/10 flex flex-col items-center py-3.5 flex-shrink-0 z-30 space-y-4 backdrop-blur-2xl transition-all duration-300"
      style="background: rgba(11, 14, 23, 0.78); box-shadow: 4px 0 24px rgba(0, 0, 0, 0.45);"
    >
      <!-- 神经轨 Logo (DO / DevOrbit) -->
      <n-avatar
        round
        :size="36"
        class="bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-mono font-black text-xs cursor-pointer shadow-md shadow-emerald-950/50"
        title="DevOrbit 开发者星轨 v1.3"
      >
        DO
      </n-avatar>

      <n-divider class="my-1 w-6 opacity-20" />

      <!-- 核心视图切换主按钮组 (任务 / 随手记 / 服务器) -->
      <div class="flex-1 flex flex-col space-y-3 items-center">
        <!-- 1. 开发任务工作台 -->
        <n-tooltip placement="right" trigger="hover">
          <template #trigger>
            <n-badge :dot="totalPendingProdSqls > 0" type="warning" :offset="[-2, 2]">
              <n-button
                quaternary
                size="medium"
                :type="currentView === 'tasks' ? 'primary' : 'default'"
                :class="currentView === 'tasks' ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40' : 'text-slate-400'"
                @click="currentView = 'tasks'"
              >
                <template #icon>
                  <Layers class="w-4 h-4" />
                </template>
              </n-button>
            </n-badge>
          </template>
          开发任务中枢 ({{ tasks.length }}) · {{ totalPendingProdSqls }} 待发 SQL
        </n-tooltip>

        <!-- 2. 随手记 & 常用命令军火库 -->
        <n-tooltip placement="right" trigger="hover">
          <template #trigger>
            <n-button
              quaternary
              size="medium"
              :type="currentView === 'notes' ? 'primary' : 'default'"
              :class="currentView === 'notes' ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40' : 'text-slate-400'"
              @click="currentView = 'notes'"
            >
              <template #icon>
                <BookMarked class="w-4 h-4" />
              </template>
            </n-button>
          </template>
          随手记 & 常用命令军火库
        </n-tooltip>

        <!-- 3. 服务器矩阵与凭据速查 -->
        <n-tooltip placement="right" trigger="hover">
          <template #trigger>
            <n-button
              quaternary
              size="medium"
              :type="currentView === 'servers' ? 'primary' : 'default'"
              :class="currentView === 'servers' ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40' : 'text-slate-400'"
              @click="currentView = 'servers'"
            >
              <template #icon>
                <Server class="w-4 h-4" />
              </template>
            </n-button>
          </template>
          服务器矩阵与 SVN 凭据速查
        </n-tooltip>
      </div>

      <!-- 神经轨底部功能：外观、设置、工作区心跳指示灯 -->
      <div class="flex flex-col items-center space-y-2.5">
        <n-tooltip placement="right" trigger="hover">
          <template #trigger>
            <n-button quaternary size="small" @click="openThemeModal" class="text-slate-400 hover:text-teal-400">
              <template #icon><Palette class="w-4 h-4" /></template>
            </n-button>
          </template>
          个性化外观与自定义壁纸
        </n-tooltip>

        <n-tooltip placement="right" trigger="hover">
          <template #trigger>
            <n-button quaternary size="small" @click="openSettingsModal" class="text-slate-400 hover:text-teal-400">
              <template #icon><Settings class="w-4 h-4" /></template>
            </n-button>
          </template>
          系统设置中心
        </n-tooltip>

        <!-- 工作区在线心跳指示灯 -->
        <div
          class="w-2 h-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400/80 animate-pulse mt-1"
          :title="`工作区在线: ${workspacePath}`"
        ></div>
      </div>
    </aside>

    <!-- ===================================================================== -->
    <!-- 右侧：全息矩阵主舞台 (通透架构，透出底层自定义壁纸)                      -->
    <!-- ===================================================================== -->
    <div class="flex-1 flex flex-col overflow-hidden relative z-10 bg-transparent">

      <!-- 1. 顶层 Omni-Bar 流光状态条 (采用 Naive UI 组件化) -->
      <header
        class="h-12 border-b border-white/10 px-5 flex items-center justify-between flex-shrink-0 z-20 backdrop-blur-xl"
        style="background: rgba(13, 17, 26, 0.72);"
      >
        <!-- 模块标识与工作区路径 -->
        <div class="flex items-center gap-3">
          <n-tag type="primary" size="small" :bordered="false" class="font-mono font-bold">
            {{ currentViewTitle.badge }}
          </n-tag>

          <span class="text-xs font-semibold text-slate-200">
            {{ currentViewTitle.desc }}
          </span>

          <span class="text-slate-500 opacity-40">|</span>

          <!-- 当前工作区目录 (点击可更换) -->
          <n-button
            size="small"
            quaternary
            @click="changeWorkspace"
            class="font-mono text-xs text-slate-400"
            title="点击更换工作区根目录"
          >
            <template #icon>
              <FolderGit2 class="w-3.5 h-3.5 text-teal-400" />
            </template>
            <span>{{ workspacePath || '选择工作区' }}</span>
          </n-button>
        </div>

        <!-- 右侧：待发 SQL 胶囊、极速搜索、更新中心与沉浸模式 -->
        <div class="flex items-center gap-2.5 text-xs">
          <!-- 待发 SQL 预警标签 -->
          <n-tag
            v-if="totalPendingProdSqls > 0"
            type="warning"
            size="small"
            class="font-mono font-bold"
          >
            <template #icon>
              <Database class="w-3 h-3 text-amber-400" />
            </template>
            {{ totalPendingProdSqls }} 份产线 SQL 待发布
          </n-tag>

          <!-- 全局搜索入口 (Ctrl+K) -->
          <n-button
            size="small"
            secondary
            @click="openSearchModal"
            title="全局搜索任务、SQL与命令 (快捷键 Ctrl+K)"
          >
            <template #icon>
              <Search class="w-3.5 h-3.5 text-teal-400" />
            </template>
            <span>全局搜索...</span>
            <kbd class="ml-1.5 px-1 py-0.2 text-[10px] rounded bg-black/40 border border-white/10 opacity-70">Ctrl K</kbd>
          </n-button>

          <!-- DBX 同款无感更新中心 -->
          <n-button
            size="small"
            type="primary"
            secondary
            @click="openUpdateCenter"
            title="打开更新中心 (DBX 模式在线自动更新)"
          >
            <template #icon>
              <RefreshCw class="w-3 h-3 text-teal-400" />
            </template>
            <span>更新中心</span>
          </n-button>

          <!-- 一键沉浸壁纸模式 -->
          <n-button
            size="small"
            :type="isZenMode ? 'primary' : 'default'"
            quaternary
            @click="toggleZenMode"
            title="沉浸壁纸模式 (隐藏卡片观赏背景，按 Esc 退出)"
          >
            <template #icon>
              <Eye class="w-3.5 h-3.5" />
            </template>
          </n-button>
        </div>
      </header>

      <!-- 2. 主舞台区 (沉浸壁纸模式时淡出，平时通透悬浮) -->
      <main
        class="flex-1 overflow-hidden relative transition-all duration-300"
        :class="isZenMode ? 'opacity-0 pointer-events-none scale-98' : 'opacity-100 scale-100'"
      >
        <TaskBoard
          v-show="currentView === 'tasks'"
          :tasks="tasks"
          :years="years"
          :is-light="false"
          :card-opacity="currentTheme.overlayOpacity ?? 20"
          :card-glass="true"
          @open-new-task="openNewTaskModal"
          @select-task="handleSelectTask"
          @updated="loadTasks"
          @toast="showToast"
        />
        <QuickNotesView
          v-if="currentView === 'notes'"
          :is-light="false"
          @toast="showToast"
        />
        <ServerCredentialsView
          v-if="currentView === 'servers'"
          @toast="showToast"
        />
      </main>

      <!-- 3. 底部全局极客状态条 (Status Bar) -->
      <footer
        class="h-7 border-t border-white/10 px-5 flex items-center justify-between text-[11px] font-mono select-none flex-shrink-0 backdrop-blur-xl"
        style="background: rgba(11, 14, 23, 0.78); color: #94a3b8;"
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
          <span>↑↓ 切换条目</span>
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
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/80 hover:bg-black/95 backdrop-blur-xl border border-white/20 text-xs text-slate-200 cursor-pointer shadow-2xl transition hover:scale-105 select-none"
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
  </n-config-provider>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  NConfigProvider,
  darkTheme,
  NButton,
  NTooltip,
  NBadge,
  NDivider,
  NTag,
  NAvatar
} from 'naive-ui'
import {
  Layers, BookMarked, Server, Search, FolderGit2, Settings, Palette,
  Eye, EyeOff, RefreshCw, Database
} from 'lucide-vue-next'

// 视图层 UI 组件引入
import TaskBoard from '@/views/task/TaskBoard.vue'
import QuickNotesView from '@/views/notes/QuickNotesView.vue'
import ServerCredentialsView from '@/views/server/ServerCredentialsView.vue'
import NewTaskModal from '@/views/modals/NewTaskModal.vue'
import TaskDetailModal from '@/views/modals/TaskDetailModal.vue'
import GlobalSearchModal from '@/views/modals/GlobalSearchModal.vue'
import ThemeModal from '@/views/modals/ThemeModal.vue'
import SettingsModal from '@/views/modals/SettingsModal.vue'
import UpdateCenterModal from '@/views/modals/UpdateCenterModal.vue'
import Toast from '@/views/common/Toast.vue'

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

// 主题配置
const currentTheme = ref({
  colorTheme: 'emerald',
  customPrimaryColor: '#14b8a6',
  type: 'custom',
  presetId: 'aurora',
  customBg: '',
  customBgName: '',
  overlayOpacity: 20,
  blurLevel: 'none',
  cardGlass: true,
  cardOpacity: 18
})

// 预设背景定义
const presetGradients = {
  aurora: 'radial-gradient(at 0% 0%, #059669 0px, transparent 60%), radial-gradient(at 100% 100%, #4338ca 0px, transparent 60%), #020617',
  cyber: 'radial-gradient(at 20% 20%, #7c3aed 0px, transparent 60%), radial-gradient(at 80% 80%, #db2777 0px, transparent 60%), #030712',
  obsidian: 'radial-gradient(circle at 50% 0%, #1e293b 0px, transparent 70%), #020617',
  nebula: 'radial-gradient(at 0% 100%, #0284c7 0px, transparent 60%), radial-gradient(at 100% 0%, #2563eb 0px, transparent 60%), #020617',
  sunset: 'radial-gradient(at 20% 0%, #b45309 0px, transparent 60%), radial-gradient(at 80% 100%, #9f1239 0px, transparent 60%), #030712'
}

// 动态背景样式
const backgroundStyle = computed(() => {
  if (currentTheme.value.type === 'custom' && currentTheme.value.customBg) {
    return {
      backgroundImage: `url("${currentTheme.value.customBg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: getBlurFilter(currentTheme.value.blurLevel)
    }
  }

  const pid = currentTheme.value.presetId || 'aurora'
  const grad = presetGradients[pid] || presetGradients.aurora
  return {
    background: grad,
    filter: getBlurFilter(currentTheme.value.blurLevel)
  }
})

// 遮罩层样式 (动态应用用户的暗度遮罩百分比)
const overlayStyle = computed(() => {
  let op = currentTheme.value.overlayOpacity ?? 20
  return {
    opacity: op / 100,
    backgroundColor: '#000000'
  }
})

function getBlurFilter(blur) {
  if (blur === 'sm') return 'blur(4px)'
  if (blur === 'md') return 'blur(12px)'
  if (blur === 'lg') return 'blur(20px)'
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
    console.log("[App.vue] Requesting getTasks from Electron...")
    const res = await window.electronAPI.getTasks()
    console.log("[App.vue] loadTasks received:", res ? (res.tasks ? res.tasks.length + " tasks" : Array.isArray(res) ? res.length + " tasks" : "non-array res") : "null res")
    if (res && res.tasks) {
      tasks.value = res.tasks
      years.value = res.years || ["2026", "2025"]
    } else if (Array.isArray(res)) {
      tasks.value = res
    }
  } catch (err) {
    console.error("加载任务失败", err)
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
