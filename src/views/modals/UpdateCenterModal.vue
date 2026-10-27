<template>
  <n-modal
    :show="isOpen"
    preset="card"
    title="更新中心"
    class="update-center-modal"
    @update:show="(val) => { if (!val) close() }"
  >
    <template #header-extra>
      <div class="header-extra-row">
        <n-tag
          size="small"
          :type="hasUpdate ? 'warning' : 'success'"
          :bordered="false"
          class="font-mono"
        >
          {{ hasUpdate ? '1 项可用更新' : '已是最新版本' }}
        </n-tag>
        <n-button
          v-if="hasUpdate && downloadStatus !== 'downloaded'"
          size="tiny"
          type="primary"
          :loading="downloadStatus === 'downloading'"
          @click="startDownload"
        >
          <template #icon><Download class="icon-tiny" /></template>
          <span>{{ downloadStatus === 'downloading' ? '正在下载...' : '更新全部' }}</span>
        </n-button>
      </div>
    </template>

    <div class="update-modal-body">
      <!-- 分类 Tabs 导航栏 -->
      <div class="update-tabs-bar">
        <n-button
          size="small"
          :type="activeTab === 'devorbit' ? 'primary' : 'default'"
          :secondary="activeTab === 'devorbit'"
          :quaternary="activeTab !== 'devorbit'"
          @click="activeTab = 'devorbit'"
        >
          <span>DevOrbit</span>
          <n-badge v-if="hasUpdate" value="1" type="warning" class="ml-1" />
        </n-button>

        <n-button
          size="small"
          :type="activeTab === 'extensions' ? 'primary' : 'default'"
          :secondary="activeTab === 'extensions'"
          :quaternary="activeTab !== 'extensions'"
          @click="activeTab = 'extensions'"
        >
          <span>配置与扩展</span>
        </n-button>
      </div>

      <!-- 主体内容展示区 -->
      <div class="tab-content custom-scrollbar">
        <!-- Tab 1: DevOrbit 主程序更新 -->
        <div v-if="activeTab === 'devorbit'" class="release-panel">
          <div class="version-summary-row">
            <p class="summary-desc">
              <span v-if="hasUpdate">
                <b>DevOrbit {{ releaseInfo?.latestVersion }}</b> 已发布，当前版本为
                <span class="font-mono text-muted">v{{ currentVersion }}</span>。
              </span>
              <span v-else>
                当前已是最新版 <b>v{{ currentVersion }}</b>，云端暂无更高更新。
              </span>
            </p>
            <n-button
              size="tiny"
              quaternary
              :loading="isChecking"
              @click="checkUpdate"
            >
              <template #icon><RefreshCw class="icon-tiny" /></template>
              <span>检查更新</span>
            </n-button>
          </div>

          <!-- 下载进度条卡片 -->
          <div v-if="downloadStatus === 'downloading'" class="download-progress-card">
            <div class="progress-info-row">
              <span class="progress-status-text">
                <Loader2 class="icon-small animate-spin text-teal-400" />
                正在从官方源下载最新全量包...
              </span>
              <span class="progress-percent font-mono">
                {{ progressData.percent }}%
              </span>
            </div>
            <n-progress
              type="line"
              status="info"
              :percentage="progressData.percent"
              :show-indicator="false"
              processing
            />
            <div class="progress-details font-mono">
              <span>已下载: {{ formatSize(progressData.transferred) }} / {{ formatSize(progressData.total) }}</span>
              <span>速度: {{ formatSpeed(progressData.speed) }}</span>
            </div>
          </div>

          <!-- 发版说明与更新日志卡片 -->
          <div v-if="releaseInfo" class="release-notes-card">
            <div class="release-card-header">
              <span class="release-title">
                <Sparkles class="icon-small text-teal-400" />
                v{{ releaseInfo.latestVersion }} 更新日志与新特性
              </span>
              <span class="release-date font-mono">
                发布于: {{ releaseInfo.publishedAt ? new Date(releaseInfo.publishedAt).toLocaleDateString() : '近期' }}
              </span>
            </div>
            <div class="release-body custom-scrollbar">
              <div v-if="releaseInfo.body" class="release-body-text">
                {{ releaseInfo.body }}
              </div>
              <div v-else class="release-body-fallback">
                ✦ 全面升级两翼现代化极客视觉与黑曜微晶质感<br>
                ✦ 引入 Vue 3 SFC 规范化结构与 Naive UI 纯净组件库<br>
                ✦ 解决目录层级与样式混乱，提供毫秒级冷启动体验
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: 配置与扩展 -->
        <div v-else class="extensions-panel">
          <div class="ext-item-row">
            <div class="ext-item-info">
              <div class="ext-title">核心词库与高频 SQL 模板集</div>
              <div class="ext-desc">包含常用 DDL、DML、慢查定位与数据迁移标准脚本</div>
            </div>
            <n-tag size="small" type="success" :bordered="false">已是最新</n-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗底部操作条 -->
    <template #action>
      <div class="update-action-footer">
        <n-button
          size="small"
          quaternary
          @click="openDownloadPage"
        >
          打开下载页
        </n-button>

        <!-- 核心主按钮 1: 重启并更新 -->
        <n-button
          v-if="downloadStatus === 'downloaded'"
          size="small"
          type="primary"
          @click="applyUpdateAndRestart"
        >
          <template #icon><RefreshCw class="icon-small" /></template>
          <span>重启并更新</span>
        </n-button>

        <!-- 核心主按钮 2: 立即下载更新 -->
        <n-button
          v-else-if="hasUpdate && downloadStatus !== 'downloading'"
          size="small"
          type="primary"
          @click="startDownload"
        >
          <template #icon><Download class="icon-small" /></template>
          <span>立即下载更新</span>
        </n-button>

        <n-button
          v-else
          size="small"
          quaternary
          @click="close"
        >
          关闭
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NModal, NButton, NTag, NBadge, NProgress } from 'naive-ui'
import {
  RefreshCw, Download, Sparkles, Loader2
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const isOpen = ref(false)
const activeTab = ref('devorbit')
const isChecking = ref(false)
const downloadStatus = ref('idle')
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
.update-center-modal {
  width: 90vw;
  max-width: 680px;
  background-color: #0f172a;
  border: 1px solid #334155;
}

.header-extra-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
}

.tab-content {
  max-height: 55vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.release-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.summary-desc {
  font-size: 13px;
  color: #cbd5e1;
  margin: 0;
}

.text-muted {
  color: #94a3b8;
}

.download-progress-card {
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.progress-status-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2dd4bf;
}

.progress-percent {
  font-weight: 700;
  color: #e2e8f0;
}

.progress-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
}

.release-notes-card {
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.release-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 6px;
}

.release-title {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.release-date {
  font-size: 11px;
  color: #64748b;
}

.release-body {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
  max-height: 180px;
  overflow-y: auto;
}

.release-body-text {
  white-space: pre-wrap;
}

.release-body-fallback {
  line-height: 1.8;
  color: #cbd5e1;
}

.extensions-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ext-item-row {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ext-title {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.ext-desc {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.update-action-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
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
