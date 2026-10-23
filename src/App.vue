<template>
  <div
    class="h-screen w-screen flex flex-col relative overflow-hidden font-sans select-none"
    :style="[rootThemeStyle, { backgroundColor: 'var(--page-bg)', color: 'var(--page-text-main)' }]"
    :data-theme-accent="currentTheme.colorTheme || 'emerald'"
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

    <!-- 顶部应用导航栏 (动态主题联动与磨砂玻璃质感) -->
    <header class="h-14 app-header backdrop-blur-xl px-6 flex items-center justify-between flex-shrink-0 select-none z-20">
      <!-- Logo 与标题 -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-400/30">
          <TerminalSquare class="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 class="text-sm font-bold tracking-tight flex items-center gap-2">
            DevOrbit
            <span class="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">v1.1</span>
          </h1>
        </div>
      </div>

      <!-- 视图切换 Tabs (胶囊分段选择器) -->
      <div class="flex items-center app-nav-tabs backdrop-blur-md p-1 rounded-xl shadow-inner">
        <button
          @click="currentView = 'tasks'"
          class="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="currentView === 'tasks' ? 'app-nav-tab-active' : 'app-nav-tab-inactive'"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>开发任务工作台</span>
        </button>
        <button
          @click="currentView = 'notes'"
          class="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="currentView === 'notes' ? 'app-nav-tab-active' : 'app-nav-tab-inactive'"
        >
          <BookMarked class="w-3.5 h-3.5" />
          <span>随手记 & 常用命令</span>
        </button>
      </div>

      <!-- 右侧：工作区路径、外观设置与系统配置 -->
      <div class="flex items-center gap-2.5">
        <!-- 全局极速搜索入口 (Ctrl+K) -->
        <button
          @click="openSearchModal"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl app-header-item text-xs backdrop-blur-sm transition shadow-sm"
          title="搜索所有任务文档、SQL与命令 (快捷键 Ctrl+K)"
        >
          <Search class="w-3.5 h-3.5 text-current opacity-70" />
          <span>搜索文件与命令...</span>
          <kbd class="px-1.5 py-0.5 text-[10px] font-mono app-header-kbd rounded">Ctrl K</kbd>
        </button>

        <!-- 当前工作区目录 -->
        <div
          @click="changeWorkspace"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl app-header-item text-xs cursor-pointer max-w-[240px] backdrop-blur-sm transition shadow-sm"
          title="点击更换工作区根目录"
        >
          <FolderGit2 class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span class="truncate font-mono text-[11px]">{{ workspacePath || '选择工作区' }}</span>
        </div>

        <!-- 🎨 配色主题选择器 (顶栏一键直切经典与开发工具色调) -->
        <ColorThemeDropdown
          v-model="currentTheme.colorTheme"
          v-model:custom-color="currentTheme.customPrimaryColor"
          size="sm"
          align="right"
          @change="onColorThemeChange"
        />

        <!-- 👁️ 一键沉浸壁纸模式 (隐藏卡片观赏背景) -->
        <button
          @click="toggleZenMode"
          class="flex items-center justify-center p-2 rounded-xl app-header-item backdrop-blur-sm transition shadow-sm"
          :class="isZenMode ? '!text-emerald-400 !bg-emerald-950/80 ring-1 ring-emerald-500/50' : ''"
          title="一键沉浸壁纸模式 (隐藏卡片尽览壁纸，按 Esc 恢复)"
        >
          <Eye class="w-4 h-4" />
        </button>

        <!-- 🎨 个性化外观与自定义壁纸入口 -->
        <button
          @click="openThemeModal"
          class="flex items-center justify-center p-2 rounded-xl app-header-item backdrop-blur-sm transition shadow-sm"
          title="个性化外观与自定义背景壁纸 (🎨)"
        >
          <Palette class="w-4 h-4 text-emerald-400" />
        </button>

        <!-- ⚙️ 系统设置中心入口 -->
        <button
          @click="openSettingsModal"
          class="flex items-center justify-center p-2 rounded-xl app-header-item backdrop-blur-sm transition shadow-sm"
          title="系统设置中心 (工作区、开发工具、偏好与路线图)"
        >
          <Settings class="w-4 h-4 opacity-80 hover:opacity-100" />
        </button>
      </div>
    </header>

    <!-- 主工作区内容 (沉浸壁纸模式时淡出隐藏，露出全景背景) -->
    <main
      class="flex-1 overflow-hidden relative z-10 transition-all duration-500"
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
        @toast="showToast"
      />
    </main>

    <!-- 沉浸壁纸观赏提示浮条 -->
    <div
      v-if="isZenMode"
      @click="toggleZenMode"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-xl border border-white/20 text-xs text-slate-200 cursor-pointer shadow-2xl transition hover:scale-105 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
      title="点击任意处或按 Esc 恢复工作台"
    >
      <EyeOff class="w-4 h-4 text-emerald-400 animate-pulse" />
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
      @toast="showToast"
    />
    <Toast ref="toastRef" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  TerminalSquare, Layers, BookMarked, Search, FolderGit2, Settings, Palette,
  Eye, EyeOff
} from 'lucide-vue-next'

import TaskBoard from './components/TaskBoard.vue'
import QuickNotesView from './components/QuickNotesView.vue'
import NewTaskModal from './components/NewTaskModal.vue'
import TaskDetailModal from './components/TaskDetailModal.vue'
import GlobalSearchModal from './components/GlobalSearchModal.vue'
import ThemeModal from './components/ThemeModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import Toast from './components/Toast.vue'
import ColorThemeDropdown from './components/ColorThemeDropdown.vue'
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
const toastRef = ref(null)

// 主题外观与配色主题状态 (默认经典青绿高透，绝不遮挡壁纸美景)
const currentTheme = ref({
  colorTheme: 'emerald',
  customPrimaryColor: '#10b981',
  type: 'preset',
  presetId: 'aurora',
  customBg: '',
  customBgName: '',
  overlayOpacity: 35,
  blurLevel: 'sm',
  cardGlass: true,
  cardOpacity: 18
})

// 判断当前主题是否为浅色明亮风格 (如洁白、雾灰)
const isCurrentThemeLight = computed(() => {
  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#10b981')
  return !!c.isLight
})

// 全局动态配色主题样式注入 (CSS 变量)
const rootThemeStyle = computed(() => {
  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#10b981')
  return {
    '--theme-primary': c.primaryHex,
    '--theme-primary-rgb': c.primaryRgb,
    '--theme-primary-hover': c.primaryHover,
    '--theme-primary-light': `rgba(${c.primaryRgb}, 0.16)`,
    '--theme-primary-border': `rgba(${c.primaryRgb}, 0.38)`,
    '--theme-primary-glow': `rgba(${c.primaryRgb}, 0.25)`,
    // 全局页面背景与文字
    '--page-bg': c.pageBg || '#020617',
    '--page-gradient': c.pageGradient || 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    '--page-text-main': c.pageTextMain || '#f8fafc',
    '--page-text-muted': c.pageTextMuted || '#94a3b8',
    // 任务卡片外观
    '--card-bg': c.cardBg || 'rgba(15, 23, 42, 0.75)',
    '--card-border': c.cardBorder || 'rgba(255, 255, 255, 0.1)',
    '--card-shadow': c.cardShadow || '0 4px 20px rgba(0, 0, 0, 0.25)',
    '--card-hover-border': c.cardHoverBorder || 'rgba(255, 255, 255, 0.25)',
    '--card-title-color': c.cardTitleColor || '#f8fafc',
    '--card-subtext-color': c.cardSubtextColor || '#94a3b8',
    '--card-tag-bg': c.cardTagBg || 'rgba(15, 23, 42, 0.6)',
    '--card-tag-text': c.cardTagText || '#94a3b8',
    '--card-tag-border': c.cardTagBorder || 'rgba(255, 255, 255, 0.08)',
    // 过滤与状态栏
    '--filter-bar-bg': c.filterBarBg || 'rgba(15, 23, 42, 0.75)',
    '--filter-bar-border': c.filterBarBorder || 'rgba(255, 255, 255, 0.1)',
    '--filter-bar-item-bg': c.filterBarItemBg || 'rgba(15, 23, 42, 0.6)',
    '--filter-bar-item-text': c.filterBarItemText || '#94a3b8',
    '--filter-bar-item-active-bg': c.filterBarItemActiveBg || 'rgba(255, 255, 255, 0.15)',
    '--filter-bar-item-active-text': c.filterBarItemActiveText || '#ffffff',
    '--year-pill-bg': c.yearPillBg || 'rgba(15, 23, 42, 0.6)',
    '--year-pill-text': c.yearPillText || '#94a3b8',
    '--year-pill-border': c.yearPillBorder || 'rgba(255, 255, 255, 0.1)',
    // Chrome Header (顶栏)
    '--chrome-header-bg': c.headerBg,
    '--chrome-header-border': c.headerBorder,
    '--chrome-header-text': c.headerText,
    '--chrome-header-item-bg': c.headerItemBg,
    '--chrome-header-item-border': c.headerItemBorder,
    '--chrome-header-item-text': c.headerItemText,
    '--chrome-header-item-hover': c.headerItemHover,
    '--chrome-header-item-kbd-bg': c.headerItemKbdBg,
    // Tabs
    '--chrome-tabs-bg': c.tabsBg,
    '--chrome-tabs-border': c.tabsBorder,
    '--chrome-tab-active-bg': c.tabActiveBg,
    '--chrome-tab-active-text': c.tabActiveText,
    '--chrome-tab-active-border': c.tabActiveBorder,
    '--chrome-tab-inactive-text': c.tabInactiveText,
    // Chrome Sidebar (左侧边栏)
    '--chrome-sidebar-bg': c.sidebarBg,
    '--chrome-sidebar-border': c.sidebarBorder,
    '--chrome-sidebar-title': c.sidebarTitle,
    '--chrome-sidebar-text': c.sidebarText,
    '--chrome-sidebar-item-hover': c.sidebarItemHover,
    '--chrome-sidebar-item-active-bg': c.sidebarItemActiveBg,
    '--chrome-sidebar-item-active-border': c.sidebarItemActiveBorder,
    '--chrome-sidebar-item-active-text': c.sidebarItemActiveText,
    '--chrome-sidebar-badge-bg': c.sidebarBadgeBg,
    '--chrome-sidebar-badge-text': c.sidebarBadgeText,
    '--chrome-sidebar-badge-active-bg': c.sidebarBadgeActiveBg,
    '--chrome-sidebar-badge-active-text': c.sidebarBadgeActiveText,
    '--chrome-sidebar-footer-btn-bg': c.sidebarFooterBtnBg,
    '--chrome-sidebar-footer-btn-border': c.sidebarFooterBtnBorder,
    '--chrome-sidebar-footer-btn-text': c.sidebarFooterBtnText
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

  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#10b981')
  
  // 浅色主题（如洁白、雾灰）或默认情况直接启用对应主题专属全景渐变
  if (c.isLight || !currentTheme.value.presetId || currentTheme.value.presetId === 'aurora') {
    return {
      background: c.pageGradient || c.pageBg,
      filter: getBlurFilter(currentTheme.value.blurLevel)
    }
  }

  const pId = currentTheme.value.presetId || 'aurora'
  let grad = c.pageGradient || '#020617'
  if (pId === 'cyber') {
    grad = 'radial-gradient(at 10% 20%, rgba(139, 92, 246, 0.5) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(244, 63, 94, 0.4) 0px, transparent 55%), radial-gradient(at 50% 50%, rgba(30, 27, 75, 0.5) 0px, transparent 70%), #030712'
  } else if (pId === 'obsidian') {
    grad = 'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.7) 0px, transparent 70%), #020617'
  } else if (pId === 'nebula') {
    grad = 'radial-gradient(at 0% 100%, rgba(14, 165, 233, 0.45) 0px, transparent 55%), radial-gradient(at 100% 20%, rgba(59, 130, 246, 0.4) 0px, transparent 50%), radial-gradient(at 50% 0%, rgba(15, 23, 42, 0.8) 0px, transparent 60%), #020617'
  } else if (pId === 'sunset') {
    grad = 'radial-gradient(at 20% 0%, rgba(217, 119, 6, 0.4) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(159, 18, 57, 0.45) 0px, transparent 55%), radial-gradient(at 100% 0%, rgba(76, 29, 149, 0.5) 0px, transparent 60%), #030712'
  }
  return {
    background: grad,
    filter: getBlurFilter(currentTheme.value.blurLevel)
  }
})

const overlayStyle = computed(() => {
  if (currentTheme.value.type !== 'custom') {
    return {
      opacity: 0,
      backgroundColor: 'transparent'
    }
  }

  const c = getThemeConfig(currentTheme.value.colorTheme || 'emerald', currentTheme.value.customPrimaryColor || '#10b981')
  let op = currentTheme.value.overlayOpacity ?? 20
  op = Math.min(op, 30)
  return {
    opacity: op / 100,
    backgroundColor: c.isLight ? '#ffffff' : '#020617'
  }
})

function getBlurFilter(blur) {
  if (blur === 'sm') return 'blur(4px)'
  if (blur === 'md') return 'blur(12px)'
  if (blur === 'lg') return 'blur(24px)'
  return 'none'
}

onMounted(async () => {
  // 获取当前工作区
  workspacePath.value = await window.electronAPI.getWorkspacePath()
  await loadTasks()

  // 读取主题背景配置
  try {
    const config = await window.electronAPI.getAppConfig()
    if (config && config.themeSettings) {
      Object.assign(currentTheme.value, config.themeSettings)
    }
  } catch (e) {}

  // 绑定全局键盘快捷键 Ctrl + K 呼出搜索
  window.addEventListener('keydown', handleGlobalKeydown)

  // 阻止全窗口默认的拖拽外部文件事件 (防止覆盖导航)
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

async function onColorThemeChange(cfg) {
  showToast(`已应用配色主题: ${cfg.name}`, 'info')
  try {
    await window.electronAPI.saveAppConfig({
      themeSettings: { ...currentTheme.value }
    })
  } catch (e) {}
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
  // 自动打开该任务详情
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
