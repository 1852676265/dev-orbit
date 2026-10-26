<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">
    <!-- 顶部状态栏与核心动作区 -->
    <div class="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80 flex-wrap">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
          <Server class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-100 flex items-center gap-2.5">
            服务器与凭据速查中心
            <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              SVN Word 智能结构化速览
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>自动解析 Word 中密密麻麻的服务器表格，提供毫秒级搜索、环境过滤与密码一键直拷</span>
            <span v-if="docMeta.mtime" class="text-slate-500 font-mono text-[11px]">
              (最近修改: {{ docMeta.mtime }})
            </span>
          </p>
        </div>
      </div>

      <!-- 右侧：文件绑定、一键 SVN Update、原生打开与操作 -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- 当前绑定的文件路径提示 -->
        <div
          v-if="currentDocPath"
          @click="selectWordFile"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs cursor-pointer max-w-[280px] transition text-slate-300"
          :title="`点击更换绑定的 Word 文档\n路径: ${currentDocPath}`"
        >
          <FileText class="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span class="truncate font-mono text-[11px]">{{ docMeta.fileName || '已绑定 Word 文档' }}</span>
          <span class="text-[10px] text-cyan-400/80 hover:text-cyan-300 ml-1">更换</span>
        </div>

        <button
          v-else
          @click="selectWordFile"
          class="px-3 py-1.5 text-xs bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium rounded-xl flex items-center gap-1.5 shadow transition"
        >
          <FolderOpen class="w-3.5 h-3.5" />
          <span>关联 SVN Word 文档</span>
        </button>

        <!-- 一键 SVN 拉取更新 -->
        <button
          v-if="currentDocPath"
          @click="handleSvnUpdate"
          :disabled="isUpdatingSvn"
          class="px-3 py-1.5 text-xs bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-40"
          title="在后台自动执行 svn update 拉取最新版本"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isUpdatingSvn }" />
          <span>{{ isUpdatingSvn ? '正在拉取...' : 'SVN Update 拉取最新' }}</span>
        </button>

        <!-- 原生 Word / WPS 打开 -->
        <button
          v-if="currentDocPath"
          @click="openInNativeWord"
          class="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition"
          title="在本地 Word / WPS 中打开原件（方便追加或编辑）"
        >
          <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
          <span>用 Word/WPS 打开</span>
        </button>

        <!-- 打开文件所在目录 -->
        <button
          v-if="currentDocPath"
          @click="openInFolder"
          class="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700"
          title="在 Windows 资源管理器中定位此文件"
        >
          <FolderGit2 class="w-4 h-4" />
        </button>

        <!-- 刷新解析 -->
        <button
          v-if="currentDocPath"
          @click="loadAndParseDoc"
          :disabled="isLoading"
          class="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          title="重新解析当前文件内容"
        >
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </div>

    <!-- 检索与过滤条 (搜索、环境分流、视图切换) -->
    <div v-if="currentDocPath" class="pt-4 pb-3 flex items-center justify-between gap-4 flex-wrap">
      <!-- 搜索框与环境标签筛选 -->
      <div class="flex items-center gap-3 flex-1 min-w-[320px] flex-wrap">
        <!-- 搜索框 -->
        <div class="relative w-72">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索 IP、服务器名、账号、用途..."
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- 环境分流胶囊按钮 -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            v-for="env in environmentList"
            :key="env.key"
            @click="selectedEnv = env.key"
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            :class="selectedEnv === env.key ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
          >
            <span>{{ env.label }}</span>
            <span class="text-[10px] font-mono px-1 rounded-full" :class="selectedEnv === env.key ? 'bg-white/20' : 'bg-slate-800'">
              {{ env.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- 右侧：视图切换与全局明文密码开关 -->
      <div class="flex items-center gap-2.5">
        <!-- 全局密码明密文一键切换 -->
        <button
          @click="showAllPasswords = !showAllPasswords"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 transition"
          :title="showAllPasswords ? '隐藏所有明文密码' : '一键显示所有密码'"
        >
          <component :is="showAllPasswords ? EyeOff : Eye" class="w-3.5 h-3.5 text-cyan-400" />
          <span>{{ showAllPasswords ? '隐藏密码' : '明文显示密码' }}</span>
        </button>

        <!-- 视图切换：卡片 vs 表格 -->
        <div class="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            @click="viewMode = 'grid'"
            class="p-1.5 rounded-lg transition"
            :class="viewMode === 'grid' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'"
            title="卡片看板视图"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'table'"
            class="p-1.5 rounded-lg transition"
            :class="viewMode === 'table' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'"
            title="紧凑表格视图"
          >
            <Table class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 列表展示区 -->
    <div class="flex-1 overflow-y-auto pr-1 pt-2 custom-scrollbar">
      <!-- 状态 A: 未配置 Word 文档引导 -->
      <div v-if="!currentDocPath" class="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
        <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
          <ShieldAlert class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-slate-200 mb-1">尚未关联 SVN Word 凭据文档</h3>
        <p class="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          绑定你们团队在 SVN 上存放服务器账号密码的 Word 文档（.docx），软件将自动提取全部表格并渲染为高密搜索看板，支持一键 SVN 更新。
        </p>
        <div class="flex items-center gap-3">
          <button
            @click="selectWordFile"
            class="px-5 py-2.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition"
          >
            <FolderOpen class="w-4 h-4" />
            <span>选择本地 SVN 检出的 Word 文档 (.docx)</span>
          </button>
          <button
            @click="generateMockDocxAndLoad"
            class="px-4 py-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl flex items-center gap-2 transition"
          >
            <Sparkles class="w-4 h-4 text-cyan-400" />
            <span>生成一份演示测试文档体验</span>
          </button>
        </div>
      </div>

      <!-- 状态 B: 加载中 -->
      <div v-else-if="isLoading" class="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw class="w-6 h-6 animate-spin text-cyan-400" />
        <span class="text-xs">正在深入解析 Word 文档表格与服务器信息...</span>
      </div>

      <!-- 状态 C: 暂无匹配记录 -->
      <div v-else-if="filteredServers.length === 0" class="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Database class="w-8 h-8 text-slate-600" />
        <span class="text-xs">未找到符合当前条件的服务器记录</span>
        <button
          v-if="searchQuery || selectedEnv !== 'all'"
          @click="resetFilter"
          class="text-xs text-cyan-400 hover:underline mt-1"
        >
          清空搜索条件
        </button>
      </div>

      <!-- 状态 D1: 卡片看板视图 (Grid) -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
        <div
          v-for="srv in filteredServers"
          :key="srv.id"
          class="group rounded-2xl border border-slate-800/90 bg-slate-900/70 hover:border-cyan-500/40 p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-cyan-500/5 relative overflow-hidden"
        >
          <!-- 顶部：环境标签与服务器名称 -->
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-full font-mono flex items-center gap-1 border"
                :class="getEnvStyle(srv.env)"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ srv.env }}
              </span>
              <span class="text-[11px] font-mono text-slate-500">
                端口: {{ srv.port || '22' }}
              </span>
            </div>

            <!-- 服务器名称 -->
            <h4 class="text-xs font-bold text-slate-100 truncate mb-3" :title="srv.name">
              {{ srv.name }}
            </h4>

            <!-- 主机 IP 行 (带直拷) -->
            <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2.5 flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <span class="text-[10px] text-slate-500 block mb-0.5">主机 IP 地址</span>
                <span class="font-mono text-xs font-semibold text-cyan-300 tracking-wide select-all">
                  {{ srv.ip }}
                </span>
              </div>
              <button
                @click="copyText(srv.ip, 'IP 地址')"
                class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
                title="复制 IP"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- 账号与密码区域 -->
            <div class="space-y-1.5 text-xs">
              <!-- 用户名 -->
              <div class="flex items-center justify-between gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-800/50">
                <span class="text-slate-400 text-[11px]">用户名:</span>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-slate-200 font-medium">{{ srv.username || 'root' }}</span>
                  <button
                    @click="copyText(srv.username || 'root', '用户名')"
                    class="text-slate-500 hover:text-slate-300 transition"
                    title="复制账号"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <!-- 密码 (可掩码/明文，独立直拷) -->
              <div class="flex items-center justify-between gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-800/50">
                <span class="text-slate-400 text-[11px]">密　码:</span>
                <div class="flex items-center gap-1.5">
                  <span
                    class="font-mono text-[11px] font-medium"
                    :class="isPasswordVisible(srv.id) ? 'text-emerald-400' : 'text-slate-400 tracking-widest'"
                  >
                    {{ getDisplayPassword(srv) }}
                  </span>
                  <!-- 单行眼睛开关 -->
                  <button
                    @click="toggleSinglePassword(srv.id)"
                    class="text-slate-500 hover:text-slate-300 transition"
                    :title="isPasswordVisible(srv.id) ? '隐藏' : '显示'"
                  >
                    <component :is="isPasswordVisible(srv.id) ? EyeOff : Eye" class="w-3 h-3" />
                  </button>
                  <!-- 复制密码 -->
                  <button
                    @click="copyText(srv.password, '密码')"
                    class="text-slate-500 hover:text-emerald-400 transition"
                    title="复制密码"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部备注/用途说明 -->
          <div v-if="srv.remark" class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 truncate" :title="srv.remark">
            <span class="text-slate-500">备注:</span> {{ srv.remark }}
          </div>
        </div>
      </div>

      <!-- 状态 D2: 紧凑表格视图 (Table，适合一屏速查几十台) -->
      <div v-else class="rounded-xl border border-slate-800/90 bg-slate-900/60 overflow-hidden pb-4">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <th class="py-3 px-4 w-12 text-center">#</th>
              <th class="py-3 px-4 w-28">环境</th>
              <th class="py-3 px-4">服务器名称 / 业务系统</th>
              <th class="py-3 px-4 font-mono">IP 地址 : 端口</th>
              <th class="py-3 px-4 font-mono">账号</th>
              <th class="py-3 px-4 font-mono">密码</th>
              <th class="py-3 px-4">备注与说明</th>
              <th class="py-3 px-4 w-24 text-right">快捷操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="(srv, idx) in filteredServers"
              :key="srv.id"
              class="hover:bg-slate-800/40 transition group text-slate-200"
            >
              <td class="py-2.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                {{ idx + 1 }}
              </td>
              <td class="py-2.5 px-4">
                <span
                  class="px-2 py-0.5 text-[10px] font-bold rounded-full font-mono inline-flex items-center gap-1 border"
                  :class="getEnvStyle(srv.env)"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ srv.env }}
                </span>
              </td>
              <td class="py-2.5 px-4 font-medium text-slate-100">
                {{ srv.name }}
              </td>
              <td class="py-2.5 px-4 font-mono text-cyan-300">
                <div class="flex items-center gap-1.5">
                  <span>{{ srv.ip }}<span v-if="srv.port" class="text-slate-500">:{{ srv.port }}</span></span>
                  <button
                    @click="copyText(srv.ip, 'IP 地址')"
                    class="opacity-0 group-hover:opacity-100 p-1 hover:text-cyan-200 transition"
                    title="复制 IP"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td class="py-2.5 px-4 font-mono">
                <div class="flex items-center gap-1.5">
                  <span>{{ srv.username || 'root' }}</span>
                  <button
                    @click="copyText(srv.username || 'root', '账号')"
                    class="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-100 transition text-slate-400"
                    title="复制账号"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td class="py-2.5 px-4 font-mono">
                <div class="flex items-center gap-1.5">
                  <span :class="isPasswordVisible(srv.id) ? 'text-emerald-400' : 'text-slate-500 tracking-wider'">
                    {{ getDisplayPassword(srv) }}
                  </span>
                  <button
                    @click="toggleSinglePassword(srv.id)"
                    class="p-1 text-slate-500 hover:text-slate-300 transition"
                    :title="isPasswordVisible(srv.id) ? '隐藏' : '显示'"
                  >
                    <component :is="isPasswordVisible(srv.id) ? EyeOff : Eye" class="w-3 h-3" />
                  </button>
                  <button
                    @click="copyText(srv.password, '密码')"
                    class="p-1 text-slate-500 hover:text-emerald-400 transition"
                    title="复制密码"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td class="py-2.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" :title="srv.remark">
                {{ srv.remark || '-' }}
              </td>
              <td class="py-2.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="copyFullServerInfo(srv)"
                    class="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="复制整卡信息（IP、账号、密码）"
                  >
                    复制整卡
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Server, FileText, FolderOpen, RefreshCw, ExternalLink,
  FolderGit2, RotateCw, Search, X, Eye, EyeOff, LayoutGrid,
  Table, ShieldAlert, Sparkles, Database, Copy
} from 'lucide-vue-next'

const emit = defineEmits(['toast'])

const currentDocPath = ref('')
const docMeta = ref({ fileName: '', mtime: '' })
const servers = ref([])
const isLoading = ref(false)
const isUpdatingSvn = ref(false)

// 视图与筛选状态
const searchQuery = ref('')
const selectedEnv = ref('all')
const viewMode = ref('grid') // 'grid' | 'table'
const showAllPasswords = ref(false)
const visiblePasswordIds = ref(new Set())

onMounted(async () => {
  await loadSvnConfig()
  if (currentDocPath.value) {
    await loadAndParseDoc()
  }
})

async function loadSvnConfig() {
  if (window.electronAPI && window.electronAPI.getSvnDocConfig) {
    try {
      const res = await window.electronAPI.getSvnDocConfig()
      if (res && res.svnWordPath) {
        currentDocPath.value = res.svnWordPath
      }
    } catch (e) {}
  }
}

// 选择新的 Word 文档
async function selectWordFile() {
  if (!window.electronAPI || !window.electronAPI.selectSvnWordFile) return
  const selected = await window.electronAPI.selectSvnWordFile()
  if (selected) {
    currentDocPath.value = selected
    await window.electronAPI.saveSvnDocPath(selected)
    emit('toast', `已绑定 Word 文档: ${selected}`, 'success')
    await loadAndParseDoc()
  }
}

// 解析文档内容
async function loadAndParseDoc() {
  if (!currentDocPath.value) return
  isLoading.value = true
  try {
    const res = await window.electronAPI.parseWordCredentials(currentDocPath.value)
    if (res.success) {
      docMeta.value = {
        fileName: res.fileName,
        mtime: res.mtime
      }
      servers.value = res.servers || []
      emit('toast', `已成功解析 ${servers.value.length} 台服务器凭据！`, 'success')
    } else {
      emit('toast', res.message || '解析文档失败', 'error')
    }
  } catch (err) {
    emit('toast', '解析出错: ' + err.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// 一键 SVN Update
async function handleSvnUpdate() {
  if (!currentDocPath.value) return
  isUpdatingSvn.value = true
  try {
    const res = await window.electronAPI.updateSvnDoc(currentDocPath.value)
    if (res.success) {
      emit('toast', '🎉 ' + res.message, 'success')
      // 自动重新解析
      await loadAndParseDoc()
    } else {
      emit('toast', res.message, 'info')
    }
  } catch (e) {
    emit('toast', 'SVN 更新异常: ' + e.message, 'error')
  } finally {
    isUpdatingSvn.value = false
  }
}

// 原生 Word 打开
async function openInNativeWord() {
  if (!currentDocPath.value) return
  await window.electronAPI.openSvnWordFile(currentDocPath.value)
  emit('toast', '已唤起本地 Word / WPS 打开原件', 'info')
}

// 打开所在目录
async function openInFolder() {
  if (!currentDocPath.value) return
  await window.electronAPI.openSvnWordDir(currentDocPath.value)
}

// 统计环境列表
const environmentList = computed(() => {
  const envMap = {
    all: { key: 'all', label: '全部', count: servers.value.length },
    prod: { key: '生产环境', label: '生产', count: 0 },
    test: { key: '测试环境', label: '测试', count: 0 },
    dev: { key: '开发环境', label: '开发', count: 0 },
    middleware: { key: '数据库/中间件', label: '中间件/库', count: 0 }
  }

  for (const s of servers.value) {
    const env = s.env || ''
    if (/生产|prod/i.test(env)) envMap.prod.count++
    else if (/测试|test|uat/i.test(env)) envMap.test.count++
    else if (/开发|dev/i.test(env)) envMap.dev.count++
    else if (/库|db|oracle|mysql|dm/i.test(env)) envMap.middleware.count++
  }

  return Object.values(envMap)
})

// 过滤后的服务器
const filteredServers = computed(() => {
  let list = servers.value

  // 环境筛选
  if (selectedEnv.value !== 'all') {
    list = list.filter(s => {
      const e = s.env || ''
      if (selectedEnv.value === '生产环境') return /生产|prod/i.test(e)
      if (selectedEnv.value === '测试环境') return /测试|test|uat/i.test(e)
      if (selectedEnv.value === '开发环境') return /开发|dev/i.test(e)
      if (selectedEnv.value === '数据库/中间件') return /库|db|oracle|mysql|dm/i.test(e)
      return e === selectedEnv.value
    })
  }

  // 搜索关键字
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(s => {
      return (s.name && s.name.toLowerCase().includes(q)) ||
        (s.ip && s.ip.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        (s.remark && s.remark.toLowerCase().includes(q)) ||
        (s.env && s.env.toLowerCase().includes(q))
    })
  }

  return list
})

function resetFilter() {
  searchQuery.value = ''
  selectedEnv.value = 'all'
}

// 密码可见性逻辑
function isPasswordVisible(id) {
  return showAllPasswords.value || visiblePasswordIds.value.has(id)
}

function toggleSinglePassword(id) {
  if (visiblePasswordIds.value.has(id)) {
    visiblePasswordIds.value.delete(id)
  } else {
    visiblePasswordIds.value.add(id)
  }
}

function getDisplayPassword(srv) {
  if (!srv.password) return '(无)'
  if (isPasswordVisible(srv.id)) return srv.password
  return '••••••••'
}

// 复制文本
async function copyText(text, label = '内容') {
  if (!text) {
    emit('toast', `该条目未填写${label}`, 'info')
    return
  }
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(text)
    } else {
      await navigator.clipboard.writeText(text)
    }
    emit('toast', `已复制 ${label}: ${text}`, 'success')
  } catch (e) {
    emit('toast', '复制失败: ' + e.message, 'error')
  }
}

// 复制整卡信息
async function copyFullServerInfo(srv) {
  const text = `【${srv.name}】\n环境: ${srv.env}\nIP: ${srv.ip}:${srv.port || '22'}\n账号: ${srv.username || 'root'}\n密码: ${srv.password || '(无)'}\n备注: ${srv.remark || '-'}`
  await copyText(text, '完整服务器信息')
}

// 标签样式
function getEnvStyle(env = '') {
  if (/生产|prod/i.test(env)) {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  }
  if (/测试|test|uat/i.test(env)) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  }
  if (/开发|dev/i.test(env)) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }
  return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
}

// 生成 Mock 文档供快速测试体验
async function generateMockDocxAndLoad() {
  emit('toast', '正在为你生成测试服务器 Word 文档...', 'info')
  const defaultDir = 'D:\\工作测试目录'
  const mockPath = `${defaultDir}\\服务器账号清单_示例.docx`
  
  // 创建后直接加载
  currentDocPath.value = mockPath
  if (window.electronAPI && window.electronAPI.saveSvnDocPath) {
    await window.electronAPI.saveSvnDocPath(mockPath)
  }
  await loadAndParseDoc()
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
  background: rgba(6, 182, 212, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.6);
}
</style>
