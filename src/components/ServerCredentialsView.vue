<template>
  <div class="h-full w-full flex flex-col p-3 md:p-4 overflow-hidden select-none relative font-sans text-slate-100">
    
    <!-- ===================================================================== -->
    <!-- 极客全息矩阵中枢 (统一双翼骨架 - 服务器矩阵与凭据速查中枢)               -->
    <!-- ===================================================================== -->
    <div
      class="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 bg-[#0E131F]/85"
      style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 10px 40px rgba(0,0,0,0.5);"
    >

      <!-- 1. 顶层速战一体指挥栏 (Command Bar) -->
      <div
        class="h-13 px-5 border-b border-white/5 flex items-center justify-between gap-4 flex-shrink-0 z-20 bg-[#121826]/70"
      >
        <!-- 搜索过滤框 -->
        <div class="flex items-center gap-3 flex-1 max-w-md relative">
          <Server class="w-4 h-4 text-teal-400 flex-shrink-0 animate-pulse" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="穿透检索主机名称、IP 地址、账号或用途... (按 / 聚焦，↑↓ 切换)"
            class="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="text-slate-400 hover:text-slate-200 p-1"
          >
            <X class="w-3.5 h-3.5" />
          </button>
          <kbd
            v-else
            class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border border-white/10 bg-white/5 text-slate-400 opacity-60"
          >
            /
          </kbd>
        </div>

        <!-- 环境分流胶囊流 -->
        <div class="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          <div class="flex items-center p-0.5 rounded-xl border border-white/10 bg-black/40 text-xs">
            <button
              @click="selectedEnv = 'all'"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition"
              :class="selectedEnv === 'all'
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'"
            >
              全部 ({{ serverList.length }})
            </button>
            <button
              v-for="env in availableEnvs"
              :key="env"
              @click="selectedEnv = env"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              :class="selectedEnv === env
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'"
            >
              <span>{{ env }}</span>
              <span class="text-[10px] font-mono opacity-60">({{ getEnvCount(env) }})</span>
            </button>
          </div>
        </div>

        <!-- Word 原档关联与一键 SVN 更新操作 -->
        <div class="flex items-center gap-2">
          <!-- 关联路径胶囊 -->
          <div
            v-if="currentDocPath"
            @click="selectWordFile"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 text-xs cursor-pointer max-w-[200px] transition text-slate-300"
            :title="`已关联 Word: ${currentDocPath}\n点击更换`"
          >
            <FileText class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span class="truncate font-mono text-[11px]">{{ docMeta.fileName || '已绑定 Word' }}</span>
          </div>
          <button
            v-else
            @click="selectWordFile"
            class="px-3 py-1.5 text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <FolderOpen class="w-3.5 h-3.5" />
            <span>关联 SVN Word</span>
          </button>

          <!-- 一键 SVN Update -->
          <button
            v-if="currentDocPath"
            @click="handleSvnUpdate"
            :disabled="isUpdatingSvn"
            class="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-teal-950/40 disabled:opacity-50"
            title="执行 svn update 拉取最新服务器凭据"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isUpdatingSvn }" />
            <span>{{ isUpdatingSvn ? '拉取中...' : 'SVN Update' }}</span>
          </button>

          <!-- 用 Word/WPS 打开原件 -->
          <button
            v-if="currentDocPath"
            @click="openInNativeWord"
            class="p-2 rounded-xl text-xs transition border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            title="在本地 Word / WPS 中打开原件"
          >
            <ExternalLink class="w-3.5 h-3.5" />
          </button>

          <!-- 重新解析 -->
          <button
            v-if="currentDocPath"
            @click="loadAndParseDoc"
            :disabled="isLoading"
            class="p-2 rounded-xl text-xs transition border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            title="重新解析当前文件内容"
          >
            <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>

      <!-- 2. 双屏极客中枢架构 (左翼：超高密服务器条目 36% + 右翼：全息服务器行动舱 64%) -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- ==================== 左翼：超高密度服务器索引流 ==================== -->
        <div
          class="w-5/12 max-w-md min-w-[320px] border-r border-white/5 flex flex-col overflow-hidden transition-all duration-300 bg-black/30"
        >
          <!-- 统计与说明 -->
          <div
            class="h-8 px-4 border-b border-white/5 flex items-center justify-between text-[11px] font-mono flex-shrink-0 bg-white/[0.02] text-slate-400"
          >
            <span class="flex items-center gap-1.5">
              <Server class="w-3.5 h-3.5 text-teal-400" />
              <span>服务器节点 ({{ filteredServers.length }})</span>
            </span>
            <span class="text-teal-400 font-medium">
              SVN Word 智能结构化
            </span>
          </div>

          <!-- 节点列表 (一屏容纳 15+ 项，按上下键秒级切换) -->
          <div
            ref="serverListContainerRef"
            class="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar"
          >
            <div
              v-if="filteredServers.length === 0"
              class="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500"
            >
              <Database class="w-10 h-10 mb-2 opacity-40" />
              <p class="text-xs font-medium">未找到符合当前条件的服务器节点</p>
              <button v-if="searchQuery" @click="searchQuery = ''" class="mt-2 text-xs text-teal-400 underline">清除搜索条件</button>
            </div>

            <!-- 节点条目卡片 (统一黑曜微晶质感，左边缘光条) -->
            <div
              v-for="(srv, idx) in filteredServers"
              :key="srv.id"
              :id="`server-item-${idx}`"
              @click="focusedIndex = idx"
              class="p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative select-none"
              :class="focusedIndex === idx
                ? 'bg-teal-950/40 border-teal-500/70 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/30 text-white'
                : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-300'"
            >
              <!-- 聚焦高亮左边缘晶体微光条 -->
              <div
                v-if="focusedIndex === idx"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4/5 bg-teal-400 rounded-r shadow-md shadow-teal-400"
              ></div>

              <!-- 左侧：环境标签 + 主机名称 + IP -->
              <div class="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 pl-1">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span
                      class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border"
                      :class="getEnvStyle(srv.env)"
                    >
                      {{ srv.env || '常规环境' }}
                    </span>
                    <span class="text-[10px] text-slate-500 font-mono truncate">
                      SSH: {{ srv.port || '22' }}
                    </span>
                  </div>

                  <!-- 主机名称 -->
                  <h3
                    class="text-xs font-semibold leading-snug truncate transition"
                    :class="focusedIndex === idx ? 'text-teal-200 font-bold' : 'text-slate-200 group-hover:text-teal-300'"
                  >
                    {{ srv.name }}
                  </h3>

                  <!-- 主机 IP / 标号 -->
                  <div class="text-[11px] font-mono text-teal-300/80 truncate mt-0.5 select-all">
                    {{ srv.ip }}
                  </div>
                </div>
              </div>

              <!-- 右侧：账号与一键复制 -->
              <div class="flex-shrink-0 flex items-center gap-1.5">
                <span class="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 hidden sm:inline">
                  {{ srv.username || 'root' }}
                </span>
                <ChevronRight
                  class="w-3.5 h-3.5 transition"
                  :class="focusedIndex === idx ? 'text-teal-400 translate-x-0.5' : 'text-slate-600 opacity-40'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== 右翼：全息服务器中枢舱 (免弹窗生产力) ==================== -->
        <div
          v-if="currentServer"
          class="flex-1 flex flex-col overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar transition-all duration-300 bg-black/20"
        >
          <!-- 1. 服务器头部全景看板 -->
          <div
            class="p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition shadow-sm bg-[#121826]/80"
          >
            <div class="space-y-1.5 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  :class="getEnvStyle(currentServer.env)"
                >
                  ● {{ currentServer.env || '常规环境' }}
                </span>
                <span class="text-[10px] font-mono text-slate-500">
                  端口: {{ currentServer.port || '22' }}
                </span>
                <span v-if="docMeta.fileName" class="text-[10px] font-mono text-slate-500">
                  来源: {{ docMeta.fileName }}
                </span>
              </div>

              <!-- 主机名 -->
              <h2 class="text-base font-bold leading-relaxed text-white">
                {{ currentServer.name }}
              </h2>

              <!-- IP 地址 -->
              <div class="flex items-center gap-2 text-xs font-mono text-teal-300">
                <Server class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span class="font-bold select-all tracking-wider">{{ currentServer.ip }}</span>
                <button
                  @click="copyText(currentServer.ip, 'IP 地址')"
                  class="text-slate-400 hover:text-white transition"
                  title="复制 IP"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 快捷工具按钮 -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <!-- 一键拉起终端 -->
              <button
                @click="openSshTerminal(currentServer)"
                class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-teal-950/40"
              >
                <Terminal class="w-3.5 h-3.5" />
                <span>一键拉起 SSH</span>
              </button>

              <!-- 复制连接命令 -->
              <button
                @click="copySshCommand(currentServer)"
                class="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition flex items-center gap-1.5"
                title="复制完整 SSH 命令"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>复制连接命令</span>
              </button>
            </div>
          </div>

          <!-- 2. 核心登录凭据与账号密码卡片 (支持明文/密文一键切换) -->
          <div
            class="p-4 rounded-xl border border-white/5 space-y-3 transition shadow-sm bg-[#121826]/80"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 flex items-center gap-2">
                <KeyRound class="w-4 h-4 text-teal-400" />
                <span>登录凭据明细</span>
              </span>
              <button
                @click="toggleGlobalPasswordMask"
                class="text-[11px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <component :is="showAllPasswords ? EyeOff : Eye" class="w-3.5 h-3.5" />
                <span>{{ showAllPasswords ? '密文隐藏' : '明文显示密码' }}</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <!-- 用户名 -->
              <div class="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-500 block mb-0.5">登录用户名</span>
                  <span class="text-slate-100 font-bold select-all text-xs">{{ currentServer.username || 'root' }}</span>
                </div>
                <button
                  @click="copyText(currentServer.username || 'root', '用户名')"
                  class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="复制用户名"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- 密码 -->
              <div class="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-500 block mb-0.5">登录密码</span>
                  <span
                    class="font-bold select-all text-xs"
                    :class="isPasswordVisible(currentServer.id) ? 'text-teal-300' : 'text-slate-400 tracking-widest'"
                  >
                    {{ getDisplayPassword(currentServer) }}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click="toggleSinglePassword(currentServer.id)"
                    class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                    :title="isPasswordVisible(currentServer.id) ? '隐藏' : '显示'"
                  >
                    <component :is="isPasswordVisible(currentServer.id) ? EyeOff : Eye" class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="copyText(currentServer.password, '密码')"
                    class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-teal-300 transition"
                    title="复制密码"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 备注与用途说明抽屉 -->
          <div
            v-if="currentServer.remark"
            class="p-4 rounded-xl border border-white/5 space-y-2 transition shadow-sm bg-[#121826]/80"
          >
            <div class="text-xs font-bold text-slate-200 flex items-center gap-2">
              <FileText class="w-4 h-4 text-amber-400" />
              <span>节点用途与业务说明</span>
            </div>
            <div class="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed font-mono">
              {{ currentServer.remark }}
            </div>
          </div>

        </div>

        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500"
        >
          <Server class="w-12 h-12 text-slate-600 mb-3" />
          <p class="text-sm font-medium">请从左侧选择一个服务器节点</p>
          <p class="text-xs text-slate-600 mt-1">支持通过 ↑ ↓ 键盘方向键无缝切换速览</p>
        </div>

      </div>

      <!-- 3. 底部状态与快捷键提示行 -->
      <div
        class="h-8 px-5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono flex-shrink-0 select-none bg-black/40 text-slate-400"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5 text-teal-400 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            服务器矩阵就绪
          </span>
          <span class="hidden md:inline text-slate-500 opacity-40">|</span>
          <span class="hidden md:inline truncate max-w-sm">
            {{ currentServer ? `${currentServer.name} (${currentServer.ip})` : '未选择服务器' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <span class="hidden sm:inline">↑↓ 切换服务器</span>
          <span class="hidden sm:inline">Ctrl+C 复制IP</span>
          <span class="text-teal-400/90 font-bold">SVN Word Matrix</span>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Server, X, RefreshCw, Copy, ChevronRight, Terminal, KeyRound,
  FileText, ExternalLink, RotateCw, FolderOpen, Database, Eye, EyeOff
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const serverList = ref([])
const searchQuery = ref('')
const selectedEnv = ref('all')
const focusedIndex = ref(0)
const searchInputRef = ref(null)

const currentDocPath = ref('')
const docMeta = ref({ fileName: '', mtime: '' })
const isLoading = ref(false)
const isUpdatingSvn = ref(false)

const showAllPasswords = ref(false)
const visiblePasswordIds = ref(new Set())

const availableEnvs = computed(() => {
  const set = new Set()
  for (const s of serverList.value) {
    if (s.env) set.add(s.env.trim())
  }
  return Array.from(set)
})

function getEnvCount(env) {
  return serverList.value.filter(s => (s.env || '常规环境').trim() === env).length
}

const filteredServers = computed(() => {
  return serverList.value.filter(s => {
    if (selectedEnv.value !== 'all' && (s.env || '常规环境').trim() !== selectedEnv.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const inName = (s.name || '').toLowerCase().includes(q)
      const inIp = (s.ip || '').toLowerCase().includes(q)
      const inUser = (s.username || '').toLowerCase().includes(q)
      const inRemark = (s.remark || '').toLowerCase().includes(q)
      if (!inName && !inIp && !inUser && !inRemark) return false
    }
    return true
  })
})

const currentServer = computed(() => {
  if (filteredServers.value.length === 0) return null
  const idx = Math.min(focusedIndex.value, filteredServers.value.length - 1)
  return filteredServers.value[idx] || null
})

watch(filteredServers, (newList) => {
  if (newList.length === 0) {
    focusedIndex.value = 0
  } else if (focusedIndex.value >= newList.length) {
    focusedIndex.value = newList.length - 1
  }
})

onMounted(async () => {
  await loadDocConfig()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

async function loadDocConfig() {
  if (!window.electronAPI || !window.electronAPI.getSvnDocConfig) return
  try {
    const config = await window.electronAPI.getSvnDocConfig()
    if (config && config.docPath) {
      currentDocPath.value = config.docPath
      await loadAndParseDoc()
    }
  } catch (e) {
    console.error('加载 SVN Word 配置失败', e)
  }
}

async function loadAndParseDoc() {
  if (!currentDocPath.value || !window.electronAPI || !window.electronAPI.parseWordCredentials) return
  isLoading.value = true
  try {
    const res = await window.electronAPI.parseWordCredentials(currentDocPath.value)
    if (res && res.servers) {
      serverList.value = res.servers
      docMeta.value = {
        fileName: res.fileName || currentDocPath.value.split(/[\\/]/).pop(),
        mtime: res.mtime || ''
      }
      emit('toast', `已成功解析 ${serverList.value.length} 台服务器凭据！`, 'success')
    }
  } catch (e) {
    emit('toast', '解析 Word 失败: ' + e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

async function selectWordFile() {
  if (!window.electronAPI || !window.electronAPI.selectSvnWordFile) return
  try {
    const selected = await window.electronAPI.selectSvnWordFile()
    if (selected) {
      currentDocPath.value = selected
      await window.electronAPI.saveSvnDocPath(selected)
      await loadAndParseDoc()
    }
  } catch (e) {
    emit('toast', '选择文件失败: ' + e.message, 'error')
  }
}

async function handleSvnUpdate() {
  if (!currentDocPath.value || !window.electronAPI || !window.electronAPI.updateSvnDoc) return
  isUpdatingSvn.value = true
  try {
    const res = await window.electronAPI.updateSvnDoc(currentDocPath.value)
    if (res && res.success) {
      await loadAndParseDoc()
      emit('toast', 'SVN Update 成功，已同步最新版本！', 'success')
    } else {
      emit('toast', 'SVN Update 提示: ' + (res?.message || '未知状态'), 'info')
    }
  } catch (e) {
    emit('toast', 'SVN Update 异常: ' + e.message, 'error')
  } finally {
    isUpdatingSvn.value = false
  }
}

function openInNativeWord() {
  if (currentDocPath.value && window.electronAPI && window.electronAPI.openSvnWordFile) {
    window.electronAPI.openSvnWordFile(currentDocPath.value)
    emit('toast', '正在调用本地 Word / WPS 打开原件...')
  }
}

function getEnvStyle(env) {
  const e = (env || '').trim()
  if (e.includes('生产') || e.includes('产线')) return 'bg-rose-950/70 text-rose-300 border-rose-700/60'
  if (e.includes('测试')) return 'bg-teal-950/70 text-teal-300 border-teal-700/60'
  if (e.includes('开发')) return 'bg-sky-950/70 text-sky-300 border-sky-700/60'
  if (e.includes('中间件') || e.includes('库')) return 'bg-amber-950/70 text-amber-300 border-amber-700/60'
  return 'bg-white/10 text-slate-300 border-white/15'
}

function isPasswordVisible(id) {
  return showAllPasswords.value || visiblePasswordIds.value.has(id)
}

function getDisplayPassword(srv) {
  if (!srv.password) return '(无)'
  if (isPasswordVisible(srv.id)) return srv.password
  return '••••••••••••'
}

function toggleSinglePassword(id) {
  if (visiblePasswordIds.value.has(id)) {
    visiblePasswordIds.value.delete(id)
  } else {
    visiblePasswordIds.value.add(id)
  }
}

function toggleGlobalPasswordMask() {
  showAllPasswords.value = !showAllPasswords.value
}

async function copyText(text, label) {
  if (!text) return
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(text)
    } else {
      await navigator.clipboard.writeText(text)
    }
    emit('toast', `已复制 ${label}: ${text}`, 'success')
  } catch (e) {
    emit('toast', '复制失败', 'error')
  }
}

function copySshCommand(srv) {
  const cmd = `ssh ${srv.username || 'root'}@${srv.ip} -p ${srv.port || '22'}`
  copyText(cmd, 'SSH 命令')
}

function openSshTerminal(srv) {
  const cmd = `ssh ${srv.username || 'root'}@${srv.ip} -p ${srv.port || '22'}`
  if (window.electronAPI && window.electronAPI.openInTerminal) {
    window.electronAPI.openInTerminal('')
    copyText(cmd, 'SSH 命令')
    emit('toast', `已在终端打开，按 Ctrl+V 粘贴执行: ${cmd}`, 'info')
  }
}

function handleKeydown(e) {
  const tag = e.target.tagName.toLowerCase()
  if (tag === 'textarea' || (tag === 'input' && e.key !== 'Escape')) {
    if (e.key === 'Escape') e.target.blur()
    return
  }

  if (e.key === '/') {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (focusedIndex.value < filteredServers.value.length - 1) {
      focusedIndex.value++
      scrollToActive()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (focusedIndex.value > 0) {
      focusedIndex.value--
      scrollToActive()
    }
  } else if (e.key === 'Enter') {
    if (currentServer.value) {
      e.preventDefault()
      copyText(currentServer.value.ip, 'IP 地址')
    }
  }
}

function scrollToActive() {
  nextTick(() => {
    const el = document.getElementById(`server-item-${focusedIndex.value}`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.25);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 184, 166, 0.55);
}
</style>
