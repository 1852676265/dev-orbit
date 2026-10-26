<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    @click.self="close"
  >
    <div
      class="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-slate-100 transition-colors"
    >
      <!-- 1. 顶部标题栏 (DBX 同款设计) -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isChecking }" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold tracking-tight">更新中心</h2>
              <span
                class="px-2 py-0.5 text-[11px] font-semibold rounded-full"
                :class="hasUpdate
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
              >
                {{ hasUpdate ? '1 项可用更新' : '已是最新版本' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="hasUpdate && downloadStatus !== 'downloaded'"
            type="button"
            @click="startDownload"
            :disabled="downloadStatus === 'downloading'"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download class="w-3.5 h-3.5" />
            <span>{{ downloadStatus === 'downloading' ? '正在下载...' : '更新全部' }}</span>
          </button>
          <button
            type="button"
            @click="close"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 2. 分类 Tabs 导航栏 -->
      <div class="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40 text-xs">
        <button
          type="button"
          @click="activeTab = 'devorbit'"
          class="flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition"
          :class="activeTab === 'devorbit'
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
        >
          <span>DevOrbit</span>
          <span
            v-if="hasUpdate"
            class="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center leading-none"
          >1</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'extensions'"
          class="flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition"
          :class="activeTab === 'extensions'
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
        >
          <span>配置与扩展</span>
          <span class="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center leading-none">0</span>
        </button>
      </div>

      <!-- 3. 主体内容展示区 -->
      <div class="p-6 overflow-y-auto flex-1 space-y-4 text-xs leading-relaxed custom-scrollbar">
        <!-- Tab 1: DevOrbit 主程序更新 -->
        <div v-if="activeTab === 'devorbit'" class="space-y-4">
          <!-- 版本说明标题 -->
          <div class="flex items-center justify-between">
            <p class="text-sm text-slate-700 dark:text-slate-300 font-medium">
              <span v-if="hasUpdate">
                <b>DevOrbit {{ releaseInfo?.latestVersion }}</b> 已发布，当前版本为
                <span class="font-mono text-slate-500">v{{ currentVersion }}</span>。
              </span>
              <span v-else>
                当前已是最新版 <b>v{{ currentVersion }}</b>，云端暂无更高更新。
              </span>
            </p>
            <button
              type="button"
              @click="checkUpdate"
              :disabled="isChecking"
              class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isChecking }" />
              <span>重新检测</span>
            </button>
          </div>

          <!-- 新功能卡片 (DBX 同款滚动展示) -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-emerald-500" />
              <span>新功能与主要优化</span>
            </h4>
            <div class="max-h-56 overflow-y-auto pr-1 text-slate-600 dark:text-slate-300 space-y-2 text-[12px] leading-relaxed custom-scrollbar">
              <div v-if="releaseInfo?.releaseNotes" class="whitespace-pre-line font-mono text-[11px] opacity-90">
                {{ releaseInfo.releaseNotes }}
              </div>
              <ul v-else class="list-disc pl-4 space-y-1.5">
                <li><b>SQL 脚本一键合并导出</b>：支持对多份上线 SQL 自动按序拼接，生成带时间戳注释的交付汇总文件。</li>
                <li><b>SVN Word 服务器与账号凭据速查</b>：直接读取解析 Word 协议文档，一键拷贝账号密码与服务器信息。</li>
                <li><b>随手记常用命令库</b>：左右高密双栏布局、技术栈彩色体系、支持一键单行复制与批量智能粘贴入库。</li>
                <li><b>系统自适应浅色高透与弹窗优化</b>：全面解决浅色白昼模式下弹窗暗黑与选中变黑问题。</li>
                <li><b>私密 (Private) 仓库自动鉴权</b>：自动复用本地 GitHub CLI 凭据，私密仓库免密一键检查与更新。</li>
              </ul>
            </div>
          </div>

          <!-- 下载与进度条反馈区 -->
          <div v-if="downloadStatus === 'downloading'" class="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span class="flex items-center gap-1.5">
                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                正在高速下载更新包...
              </span>
              <span>{{ progressData.percent }}%</span>
            </div>
            <!-- 进度条 -->
            <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200 rounded-full"
                :style="{ width: progressData.percent + '%' }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{{ formatSize(progressData.transferred) }} / {{ formatSize(progressData.total) }}</span>
              <span>速度: {{ formatSpeed(progressData.speed) }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: 扩展与配置 -->
        <div v-else-if="activeTab === 'extensions'" class="p-6 text-center text-slate-400 space-y-2">
          <CheckCircle2 class="w-8 h-8 text-emerald-500 mx-auto" />
          <p class="font-medium">所有本地配置、环境参数与工作区扩展均已是最新状态。</p>
        </div>
      </div>

      <!-- 4. 底部操作状态栏 (完全复刻 DBX 交互体验) -->
      <div class="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
        <!-- 左侧状态提示 -->
        <div>
          <!-- 核心状态：新版本已下载，重启即可更新 -->
          <div v-if="downloadStatus === 'downloaded'" class="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
            <CheckCircle2 class="w-4 h-4" />
            <span>新版本 {{ releaseInfo?.latestVersion }} 已下载，重启即可更新</span>
          </div>

          <!-- 下载中状态 -->
          <div v-else-if="downloadStatus === 'downloading'" class="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
            <span>下载中，请稍候...</span>
          </div>

          <!-- 检测到新版本但尚未下载 -->
          <div v-else-if="hasUpdate" class="flex items-center gap-1.5 text-xs text-slate-500">
            <Download class="w-3.5 h-3.5 text-emerald-500" />
            <span>发现新版本，点击右侧按钮立即开始下载。</span>
          </div>

          <!-- 已经最新 -->
          <div v-else class="flex items-center gap-1.5 text-xs text-slate-400">
            <Check class="w-3.5 h-3.5 text-emerald-500" />
            <span>当前已是最新版 (v{{ currentVersion }})</span>
          </div>
        </div>

        <!-- 右侧交互按钮组 -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="close"
            class="px-3.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            忽略此版本
          </button>

          <button
            v-if="releaseInfo?.releaseUrl"
            type="button"
            @click="openDownloadPage"
            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
          >
            打开下载页
          </button>

          <!-- 核心主按钮 1: 重启并更新 (下载完成后出现) -->
          <button
            v-if="downloadStatus === 'downloaded'"
            type="button"
            @click="applyUpdateAndRestart"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/20 transition scale-100 active:scale-95"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>重启并更新</span>
          </button>

          <!-- 核心主按钮 2: 立即下载更新 (未下载时出现) -->
          <button
            v-else-if="hasUpdate && downloadStatus !== 'downloading'"
            type="button"
            @click="startDownload"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Download class="w-3.5 h-3.5" />
            <span>立即下载更新</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  RefreshCw, Download, Sparkles, CheckCircle2,
  Check, X, Loader2
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const isOpen = ref(false)
const activeTab = ref('devorbit')
const isChecking = ref(false)
const downloadStatus = ref('idle') // 'idle' | 'downloading' | 'downloaded' | 'error'
const releaseInfo = ref(null)
const currentVersion = ref('1.3.0')

const progressData = ref({
  percent: 0,
  transferred: 0,
  total: 0,
  speed: 0
})

let removeProgressListener = null

const hasUpdate = computed(() => {
  return !!(releaseInfo.value && releaseInfo.value.hasUpdate)
})

function formatSize(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1000 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB'
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec) return '0 KB/s'
  const kb = bytesPerSec / 1024
  return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB/s' : Math.round(kb) + ' KB/s'
}

async function open() {
  isOpen.value = true
  await checkUpdate()
}

function close() {
  isOpen.value = false
}

async function checkUpdate() {
  isChecking.value = true
  try {
    const res = await window.electronAPI.checkGitHubUpdate()
    releaseInfo.value = res
    if (res && res.currentVersion) {
      currentVersion.value = res.currentVersion
    }
  } catch (err) {
    emit('toast', '检查更新失败: ' + err.message, 'error')
  } finally {
    isChecking.value = false
  }
}

async function startDownload() {
  if (!releaseInfo.value || !releaseInfo.value.assets || releaseInfo.value.assets.length === 0) {
    emit('toast', '未找到可用的安装包资产', 'error')
    return
  }

  // 匹配 Windows x64 zip
  const asset = releaseInfo.value.assets.find(a => a.name.endsWith('.zip')) || releaseInfo.value.assets[0]

  downloadStatus.value = 'downloading'
  progressData.value = { percent: 0, transferred: 0, total: asset.size || 0, speed: 0 }

  try {
    const res = await window.electronAPI.downloadUpdate({
      assetId: asset.id,
      downloadUrl: asset.downloadUrl,
      assetName: asset.name,
      version: releaseInfo.value.latestVersion
    })

    if (res.success) {
      downloadStatus.value = 'downloaded'
      emit('toast', '🎉 新版本已下载完毕，点击【重启并更新】即可无感生效！', 'success')
    } else {
      downloadStatus.value = 'error'
      emit('toast', '下载失败: ' + res.message, 'error')
    }
  } catch (err) {
    downloadStatus.value = 'error'
    emit('toast', '下载更新出错: ' + err.message, 'error')
  }
}

function openDownloadPage() {
  if (releaseInfo.value?.releaseUrl) {
    window.electronAPI.openExternalUrl(releaseInfo.value.releaseUrl)
  }
}

async function applyUpdateAndRestart() {
  try {
    emit('toast', '正在准备重启并应用更新...', 'info')
    await window.electronAPI.applyUpdateAndRestart()
  } catch (err) {
    emit('toast', '应用更新失败: ' + err.message, 'error')
  }
}

onMounted(() => {
  if (window.electronAPI?.onUpdateDownloadProgress) {
    removeProgressListener = window.electronAPI.onUpdateDownloadProgress((progress) => {
      progressData.value = progress
    })
  }
})

onUnmounted(() => {
  if (removeProgressListener) removeProgressListener()
})

defineExpose({
  open,
  close,
  checkUpdate
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}
</style>
