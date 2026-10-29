<template>
  <n-config-provider :theme="isDarkMode ? darkTheme : null">
    <div
      class="app-container"
      :data-theme-mode="isDarkMode ? 'dark' : 'light'"
      :data-theme-accent="isDarkMode ? 'emerald' : 'white'"
    >
      <!-- 动态背景画布层 (支持自定义壁纸与系统预设渐变) -->
      <div class="bg-canvas" :style="backgroundStyle" />

      <!-- 遮罩层 (与【个性化外观设置】的背景暗度遮罩实时无缝联动) -->
      <div class="bg-overlay" :style="overlayStyle" />

      <!-- ===================================================================== -->
      <!-- 全局架构：方案 6 Spotlight 玻璃流光顶栏 + 居中胶囊导航 + 双浮岛主舞台    -->
      <!-- ===================================================================== -->
      <div class="main-stage-wrapper">
        <!-- 1. 顶层悬浮玻璃导航栏 (左：品牌与工作区 | 中：居中胶囊切换 | 右：搜索与全局工具) -->
        <header class="omni-bar-header glass-island">
          <div class="header-left">
            <div class="brand-box" title="DevOrbit 开发者星轨 v1.3">
              <div class="brand-logo-orb">DO</div>
              <span class="brand-title">DevOrbit</span>
            </div>

            <n-button
              size="small"
              quaternary
              @click="changeWorkspace"
              class="workspace-path-btn"
              title="点击更换工作区根目录"
            >
              <template #icon>
                <FolderGit2 class="icon-small text-teal-400" />
              </template>
              <span>{{ workspacePath || '选择工作区' }}</span>
            </n-button>
          </div>

          <!-- 居中毛玻璃分段胶囊导航 (取代原左上角切页，支持键盘 1 / 2 / 3 快速切换) -->
          <nav class="center-nav-pill">
            <button
              type="button"
              class="nav-pill-item"
              :class="{ 'is-active': currentView === 'tasks' }"
              @click="currentView = 'tasks'"
            >
              <Layers class="icon-small" />
              <span>开发任务</span>
              <span class="pill-count">{{ tasks.length }}</span>
              <kbd class="pill-kbd">1</kbd>
            </button>

            <button
              type="button"
              class="nav-pill-item"
              :class="{ 'is-active': currentView === 'notes' }"
              @click="currentView = 'notes'"
            >
              <BookMarked class="icon-small" />
              <span>命令 & 随手记</span>
              <kbd class="pill-kbd">2</kbd>
            </button>

            <button
              type="button"
              class="nav-pill-item"
              :class="{ 'is-active': currentView === 'servers' }"
              @click="currentView = 'servers'"
            >
              <Server class="icon-small" />
              <span>服务器与凭据</span>
              <kbd class="pill-kbd">3</kbd>
            </button>
          </nav>

          <!-- 右侧：紧凑玻璃搜索框、待发 SQL 跨任务合并入口、新建任务与系统工具 -->
          <div class="header-right">
            <button
              type="button"
              class="omni-search-pill"
              @click="openSearchModal"
              title="全局穿透搜索任务、SQL、命令与服务器 (Ctrl+K)"
            >
              <Search class="icon-small text-teal-400" />
              <span>搜索任务、SQL、命令...</span>
              <kbd class="shortcut-badge">Ctrl K</kbd>
            </button>

            <!-- 全局常驻操作工具组（一键明暗切换、系统设置、检查更新、沉浸模式） -->
            <div class="header-tools-group">
              <!-- 1. JeikCode 同款：一键明亮/暗黑主题切换 -->
              <n-tooltip placement="bottom" trigger="hover">
                <template #trigger>
                  <button
                    type="button"
                    class="tool-icon-btn"
                    @click="toggleThemeMode"
                    :title="isDarkMode ? '当前暗黑模式，点击切换至明亮模式' : '当前明亮模式，点击切换至暗黑模式'"
                  >
                    <Sun v-if="isDarkMode" class="w-4 h-4 text-amber-300 hover:rotate-45 transition-transform duration-300" />
                    <Moon v-else class="w-4 h-4 text-indigo-500 hover:-rotate-12 transition-transform duration-300" />
                  </button>
                </template>
                <span>{{ isDarkMode ? '切换至明亮模式' : '切换至暗黑模式' }}</span>
              </n-tooltip>

              <!-- 2. 系统设置中心入口 (恢复且常驻不可挤压) -->
              <n-tooltip placement="bottom" trigger="hover">
                <template #trigger>
                  <button
                    type="button"
                    class="tool-icon-btn"
                    @click="openSettingsModal"
                    title="系统设置中心"
                  >
                    <Settings class="w-4 h-4" />
                  </button>
                </template>
                <span>系统设置</span>
              </n-tooltip>

              <!-- 3. 更新中心 -->
              <n-tooltip placement="bottom" trigger="hover">
                <template #trigger>
                  <button
                    type="button"
                    class="tool-icon-btn"
                    @click="openUpdateCenter"
                    title="更新中心 (GitHub 热更新)"
                  >
                    <RefreshCw class="w-4 h-4" />
                  </button>
                </template>
                <span>检查更新</span>
              </n-tooltip>

              <!-- 4. 沉浸壁纸观赏模式 -->
              <n-tooltip placement="bottom" trigger="hover">
                <template #trigger>
                  <button
                    type="button"
                    class="tool-icon-btn"
                    :class="{ 'is-active': isZenMode }"
                    @click="toggleZenMode"
                    title="沉浸壁纸观赏模式 (Esc 恢复)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </template>
                <span>沉浸模式</span>
              </n-tooltip>
            </div>
          </div>
        </header>

        <!-- 2. 主舞台区 (沉浸壁纸模式时淡出，平时通透悬浮) -->
        <main
          class="stage-content"
          :class="{ 'is-zen': isZenMode }"
        >
          <TaskBoard
            ref="taskBoardRef"
            v-show="currentView === 'tasks'"
            :tasks="tasks"
            :years="years"
            :is-light="!isDarkMode"
            :card-opacity="currentTheme.overlayOpacity ?? 20"
            :card-glass="true"
            @open-new-task="openNewTaskModal"
            @updated="loadTasks"
            @toast="showToast"
          />
          <QuickNotesView
            ref="quickNotesViewRef"
            v-show="currentView === 'notes'"
            :is-light="!isDarkMode"
            @toast="showToast"
          />
          <ServerCredentialsView
            v-show="currentView === 'servers'"
            @toast="showToast"
          />
        </main>
      </div>

      <!-- 沉浸壁纸观赏提示浮条 -->
      <div
        v-if="isZenMode"
        @click="toggleZenMode"
        class="zen-floating-pill"
        title="点击任意处或按 Esc 恢复工作台"
      >
        <EyeOff class="icon-small text-teal-400" />
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
      @navigate="handleGlobalSearchNavigate"
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
  Eye, EyeOff, RefreshCw, Database, Sun, Moon
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

const taskBoardRef = ref(null)
const quickNotesViewRef = ref(null)
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

// 主题配置与极简日夜间模式
const isDarkMode = ref(localStorage.getItem('devorbit_theme_mode') !== 'light')

watch(
  isDarkMode,
  (dark) => {
    const mode = dark ? 'dark' : 'light'
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme-mode', mode)
      document.documentElement.setAttribute('data-theme-accent', dark ? 'emerald' : 'white')
      document.documentElement.classList.toggle('light', !dark)
      document.documentElement.classList.toggle('dark', dark)
    }
  },
  { immediate: true }
)

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
  cardOpacity: 18,
  mode: isDarkMode.value ? 'dark' : 'light'
})

function toggleThemeMode() {
  isDarkMode.value = !isDarkMode.value
  const mode = isDarkMode.value ? 'dark' : 'light'
  localStorage.setItem('devorbit_theme_mode', mode)
  currentTheme.value.mode = mode
  try {
    window.electronAPI?.saveAppConfig({
      themeSettings: { ...currentTheme.value, mode }
    })
  } catch (e) {}
  showToast(isDarkMode.value ? '已切换至暗黑模式' : '已切换至明亮模式', 'info')
}

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
  if (!isDarkMode.value) {
    return {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
    }
  }

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
  if (!isDarkMode.value) {
    return { opacity: 0 }
  }
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
      if (config.themeSettings.mode) {
        isDarkMode.value = config.themeSettings.mode !== 'light'
      }
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
    return
  }
  const tag = (e.target?.tagName || '').toLowerCase()
  if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key === '1') currentView.value = 'tasks'
    else if (e.key === '2') currentView.value = 'notes'
    else if (e.key === '3') currentView.value = 'servers'
  }
}

function openCrossTaskSqlMerge() {
  currentView.value = 'tasks'
  taskBoardRef.value?.openCrossTaskMerge?.()
}

function toggleZenMode() {
  isZenMode.value = !isZenMode.value
  if (isZenMode.value) {
    showToast('已进入沉浸壁纸模式，按 Esc 或点击底部退出', 'info')
  }
}

function onThemeUpdate(newTheme) {
  Object.assign(currentTheme.value, newTheme)
  if (newTheme && newTheme.mode) {
    isDarkMode.value = newTheme.mode !== 'light'
    localStorage.setItem('devorbit_theme_mode', newTheme.mode)
  }
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


function openSearchModal() {
  globalSearchModalRef.value?.open()
}

async function handleGlobalSearchNavigate(item) {
  if (!item) return
  const relPath = (item.relativePath || '').replace(/\\/g, '/')
  const filePath = (item.filePath || '').replace(/\\/g, '/')
  const lowerName = (item.fileName || '').toLowerCase()

  // 1. 若属于随手记/常用命令 (即 _quick_notes 目录，如 memos.json 或 commands.json)
  if (relPath.includes('_quick_notes') || filePath.includes('_quick_notes') || lowerName.includes('memo') || lowerName.includes('command')) {
    currentView.value = 'notes'
    await nextTick()
    quickNotesViewRef.value?.locateMemoOrCommand?.(item)
    return
  }

  // 2. 若属于开发任务目录中的文件
  if (tasks.value && tasks.value.length > 0) {
    const sortedTasks = [...tasks.value].sort((a, b) => (b.fullPath || '').length - (a.fullPath || '').length)
    let matchedTask = sortedTasks.find(t => {
      if (!t.fullPath) return false
      const normTaskPath = t.fullPath.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '')
      const normFilePath = filePath.toLowerCase()
      return normFilePath === normTaskPath || normFilePath.startsWith(normTaskPath + '/')
    })

    if (!matchedTask) {
      const pathSegments = relPath.toLowerCase().split('/')
      matchedTask = sortedTasks.find(t => {
        if (!t.dirName) return false
        const dn = t.dirName.toLowerCase()
        return pathSegments.includes(dn) || normFilePath.includes('/' + dn + '/')
      })
    }

    if (matchedTask) {
      currentView.value = 'tasks'
      await nextTick()
      taskBoardRef.value?.locateTaskAndFile?.(matchedTask, item.filePath, item.fileName, item.lineNum)
      if (lowerName.endsWith('.sql')) {
        showToast(`已在软件内跳转至任务 [${matchedTask.title || matchedTask.dirName}] 的上线 SQL 资产并打开`)
      } else {
        showToast(`已在软件内定位至任务 [${matchedTask.title || matchedTask.dirName}] 并打开文件`)
      }
      return
    }
  }

  // 3. 通用其他文件：若不在已知任务中，直接在软件内打开全屏文件编辑器
  currentView.value = 'tasks'
  await nextTick()
  taskBoardRef.value?.openFilePreviewDirectly?.(item.filePath, item.fileName, item.lineNum)
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
    if (newConfig.themeSettings.mode) {
      isDarkMode.value = newConfig.themeSettings.mode !== 'light'
      localStorage.setItem('devorbit_theme_mode', newConfig.themeSettings.mode)
    }
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
.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
  position: relative;
  overflow: hidden;
  user-select: none;
  background-color: #090b10;
  color: #f1f5f9;
}

.bg-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transition: all 0.7s ease;
  background-position: center;
  background-size: cover;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* 左侧 54px 极窄神经轨 */
.rail-sidebar {
  width: 54px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0;
  flex-shrink: 0;
  z-index: 30;
  gap: 16px;
  backdrop-filter: blur(24px);
  background: rgba(11, 14, 23, 0.78);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.45);
}

.rail-logo-avatar {
  background: linear-gradient(to top right, #14b8a6, #10b981, #06b6d4);
  color: #020617;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(6, 78, 59, 0.5);
}

.rail-divider {
  margin: 4px 0;
  width: 24px;
  opacity: 0.2;
}

.view-switch-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.is-active-btn {
  background-color: rgba(20, 184, 166, 0.2) !important;
  color: #5eead4 !important;
  box-shadow: 0 0 0 1px rgba(20, 184, 166, 0.4);
}

.rail-bottom-tools {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.tool-btn {
  color: #94a3b8;
}
.tool-btn:hover {
  color: #2dd4bf;
}

.heartbeat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #2dd4bf;
  box-shadow: 0 0 6px rgba(45, 212, 191, 0.8);
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  margin-top: 4px;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* 主舞台区（方案6 玻璃悬浮岛外框） */
.main-stage-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 14px;
  gap: 12px;
  overflow: hidden;
  position: relative;
  z-index: 10;
  background-color: transparent;
}

.omni-bar-header {
  height: 54px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-shrink: 0;
  z-index: 20;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 9px;
}

.brand-logo-orb {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: linear-gradient(135deg, #14b8a6, #6366f1);
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 900;
  font-size: 12px;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.35);
}

.brand-title {
  font-weight: 800;
  font-size: 15px;
  letter-spacing: -0.02em;
  color: #f8fafc;
}

.center-nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-pill-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  color: #94a3b8;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.nav-pill-item:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.06);
}

.nav-pill-item.is-active {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(99, 102, 241, 0.22));
  color: #5eead4;
  border-color: rgba(45, 212, 191, 0.45);
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.18);
}

.pill-count {
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.pill-kbd {
  padding: 0 5px;
  font-size: 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.omni-search-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.omni-search-pill:hover {
  border-color: rgba(45, 212, 191, 0.5);
  color: #f1f5f9;
  background: rgba(2, 6, 23, 0.65);
}

.pending-sql-btn {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-desc {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.bar-divider {
  color: #64748b;
  opacity: 0.4;
}

.workspace-path-btn {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #94a3b8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  flex-shrink: 0;
}

.header-tools-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.tool-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
  outline: none;
}

.tool-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(45, 212, 191, 0.4);
  color: #f1f5f9;
}

.tool-icon-btn.is-active {
  background: rgba(20, 184, 166, 0.2);
  border-color: rgba(45, 212, 191, 0.45);
  color: #5eead4;
}

.shortcut-badge {
  margin-left: 6px;
  padding: 2px 4px;
  font-size: 10px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.7;
}

.stage-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  opacity: 1;
  transform: scale(1);
}

.stage-content.is-zen {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.98);
}

/* 沉浸壁纸浮条 */
.zen-floating-pill {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 9999px;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  color: #e2e8f0;
  cursor: pointer;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
  user-select: none;
}
.zen-floating-pill:hover {
  background-color: rgba(0, 0, 0, 0.95);
  transform: translateX(-50%) scale(1.05);
}

.icon-nav {
  width: 16px;
  height: 16px;
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
