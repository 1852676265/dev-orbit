<template>
  <div class="credentials-spotlight-shell">
    <!-- 方案 6 Spotlight 双毛玻璃悬浮岛：左凭据列表岛 (360px) + 右逐字段复制详情 / Word原档摘录台 -->
    <div class="srv-islands-wrap">
      <!-- =================================================================== -->
      <!-- 左侧毛玻璃悬浮岛：通用Root口令 + 搜索/分类筛选 + 分组凭据列表 + 底部SVN栏 -->
      <!-- =================================================================== -->
      <aside class="srv-left-island glass-island">
        <div class="srv-left-tools">
          <!-- 👑 全局通用 Root 口令胶囊 -->
          <div class="root-pwd-capsule">
            <span class="text-teal-400 font-bold font-mono text-xs">👑 通用Root</span>

            <div v-if="isEditingGlobalPassword" class="flex items-center gap-1 ml-auto">
              <input
                v-model="editingGlobalPasswordValue"
                type="text"
                class="root-pwd-input"
                placeholder="输入全局Root密码"
                @keydown.enter="confirmSaveGlobalPassword"
                @keydown.esc="isEditingGlobalPassword = false"
              />
              <button class="mini-save-btn" @click="confirmSaveGlobalPassword">保存</button>
              <button class="mini-cancel-btn" @click="isEditingGlobalPassword = false">取消</button>
            </div>

            <div v-else class="flex items-center gap-1.5 font-mono ml-auto">
              <span
                class="font-bold text-xs select-all"
                :class="isGlobalPasswordVisible ? 'text-teal-300' : 'text-slate-400 tracking-widest'"
              >
                {{ globalRootPassword ? (isGlobalPasswordVisible ? globalRootPassword : '••••••••••') : '(未设置)' }}
              </span>
              <button
                v-if="globalRootPassword"
                class="icon-ghost-btn"
                :title="isGlobalPasswordVisible ? '隐藏密码' : '显示明文'"
                @click="isGlobalPasswordVisible = !isGlobalPasswordVisible"
              >
                <component :is="isGlobalPasswordVisible ? EyeOff : Eye" class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="globalRootPassword"
                class="copy-root-btn"
                title="一键复制全局通用 Root 密码"
                @click="copyText(globalRootPassword, '全局通用Root密码')"
              >
                秒拷
              </button>
              <button
                class="icon-ghost-btn"
                title="修改通用 Root 密码"
                @click="startEditGlobalPassword"
              >
                <Pencil class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 搜索输入框 -->
          <div class="srv-search-wrap">
            <Search class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="搜索名称 / IP / URL (按 / 聚焦)..."
              class="srv-search-input"
            />
            <button
              v-if="searchQuery"
              class="text-slate-400 hover:text-white"
              @click="searchQuery = ''"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <!-- 分类胶囊条 -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              class="nav-tab-btn"
              :class="{ 'is-active': selectedCategory === 'all' }"
              @click="selectedCategory = 'all'"
            >
              <span>全部</span>
              <span class="count-tag">{{ categoryCounts.all || 0 }}</span>
            </button>

            <button
              v-for="cat in categories"
              :key="cat"
              class="nav-tab-btn"
              :class="{ 'is-active': selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              <span>{{ getCategoryIconLabel(cat) }}</span>
              <span class="count-tag">{{ categoryCounts[cat] || 0 }}</span>
              <span
                v-if="!BUILTIN_CATEGORIES.includes(cat)"
                class="del-cat-dot"
                title="删除此自定义分类"
                @click.stop="deleteCategory(cat)"
              >×</span>
            </button>

            <div v-if="isCreatingCat" class="flex items-center gap-1">
              <input
                v-model="newCategoryInput"
                type="text"
                placeholder="分类名称"
                class="new-cat-inline-input"
                @keydown.enter="confirmCreateCategory"
                @keydown.esc="isCreatingCat = false"
              />
              <button class="mini-save-btn" @click="confirmCreateCategory">确定</button>
              <button class="mini-cancel-btn" @click="isCreatingCat = false">取消</button>
            </div>
            <button
              v-else
              class="create-cat-btn"
              @click="isCreatingCat = true"
            >
              + 分类
            </button>
          </div>
        </div>

        <!-- 左侧分组凭据列表 -->
        <div class="srv-list-scroll custom-scrollbar">
          <div v-if="filteredAssets.length === 0" class="left-empty-state">
            <Database class="w-8 h-8 opacity-30 text-teal-400 mb-2" />
            <span>当前分类暂无凭据</span>
          </div>

          <template v-else>
            <div
              v-for="group in groupedAssets"
              :key="group.cat"
              class="srv-group-block"
            >
              <div class="srv-group-title">
                <span>{{ getCategoryIconLabel(group.cat) }} · {{ group.items.length }}</span>
              </div>

              <div
                v-for="item in group.items"
                :key="item.id"
                class="srv-list-item"
                :class="{ 'is-active': viewMode === 'daily' && activeAsset?.id === item.id }"
                @click="selectAssetItem(item)"
                @contextmenu.prevent="openContextMenu($event, item)"
              >
                <span class="srv-item-ico">🖥️</span>
                <div class="srv-item-meta">
                  <div class="srv-item-name">{{ item.name || item.systemName || '未命名节点' }}</div>
                  <div class="srv-item-target font-mono">{{ item.ip || item.url || item.target || '—' }}</div>
                </div>
                <span v-if="item.env" class="srv-env-tag font-mono">{{ item.env }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 左侧底部 SVN 同步与 Word 原档摘录操作栏 -->
        <div class="srv-left-footer">
          <div v-if="currentDocPath" class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span class="truncate max-w-[220px]" :title="currentDocPath">📘 {{ docMeta.fileName || '已关联 SVN 文档' }}</span>
            <button class="icon-ghost-btn" title="使用系统 Word 打开原件" @click="openInNativeWord">
              <ExternalLink class="w-3 h-3" />
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              v-if="currentDocPath"
              :disabled="isUpdatingSvn"
              class="srv-foot-btn is-svn"
              title="拉取最新 SVN Word 文档并自动同步标蓝密码"
              @click="handleSvnUpdate"
            >
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isUpdatingSvn }" />
              <span>SVN 同步</span>
            </button>

            <button
              class="srv-foot-btn"
              :class="{ 'is-active': viewMode === 'excerpt' }"
              @click="viewMode === 'daily' ? openExcerptWorkbench() : (viewMode = 'daily')"
            >
              <BookOpen class="w-3 h-3" />
              <span>{{ viewMode === 'daily' ? 'Word 原档摘录' : '返回日常账本' }}</span>
            </button>

            <button
              class="srv-foot-btn is-primary"
              @click="openAddModal"
            >
              <Plus class="w-3 h-3" />
              <span>手动新建</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- =================================================================== -->
      <!-- 右侧毛玻璃悬浮岛：逐字段一键复制详情 + 极简账本表格 / Word原档摘录工作台 -->
      <!-- =================================================================== -->
      <section class="srv-right-island glass-island">
        <template v-if="viewMode === 'daily'">
          <!-- 右岛顶栏 -->
          <div class="srv-right-header">
            <div class="flex items-center gap-2 text-xs text-slate-300">
              <Database class="w-4 h-4 text-teal-400" />
              <span class="font-bold">凭据详情与精选账本</span>
              <span class="badge-count">{{ filteredAssets.length }} 项</span>
            </div>

            <div class="right-view-seg">
              <button
                type="button"
                class="r-seg-btn"
                :class="{ 'is-on': rightPaneMode === 'spotlight' }"
                @click="rightPaneMode = 'spotlight'"
              >
                详情 + 账本
              </button>
              <button
                type="button"
                class="r-seg-btn"
                :class="{ 'is-on': rightPaneMode === 'table' }"
                @click="rightPaneMode = 'table'"
              >
                全屏表格
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            <!-- 空状态 -->
            <div v-if="filteredAssets.length === 0" class="empty-ledger-state">
              <Database class="w-10 h-10 mb-2 opacity-30 text-teal-400" />
              <p class="text-xs font-bold text-slate-200">当前分类下暂无已摘录的凭据</p>
              <p class="text-[11px] text-slate-400 mt-1">
                请点击下方按钮去 Word 原档点选摘录，或点击手动新建。
              </p>
              <div class="flex gap-2.5 mt-4">
                <button class="excerpt-mode-btn" @click="openExcerptWorkbench">
                  <BookOpen class="w-3.5 h-3.5" />
                  <span>📖 去 Word 文档按需摘录</span>
                </button>
                <button class="add-manual-btn" @click="openAddModal">
                  <Plus class="w-3.5 h-3.5" />
                  <span>+ 手动新建凭据</span>
                </button>
              </div>
            </div>

            <template v-else>
              <!-- 1. 方案 6 Spotlight 选中凭据逐字段复制详情卡 -->
              <div
                v-if="rightPaneMode === 'spotlight' && activeAsset"
                class="spotlight-detail-card"
                @contextmenu.prevent="openContextMenu($event, activeAsset)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="badge-count">{{ activeAsset.category || '服务器账号' }}</span>
                    <span v-if="activeAsset.env" class="srv-env-tag font-mono">{{ activeAsset.env }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="(activeAsset.category || '服务器账号') === '服务器账号'"
                      type="button"
                      class="srv-foot-btn is-primary px-3 py-1"
                      @click="copySshCommand(activeAsset)"
                    >
                      复制 SSH 命令
                    </button>
                    <button
                      v-else
                      type="button"
                      class="srv-foot-btn is-primary px-3 py-1"
                      @click="openTargetUrl(activeAsset)"
                    >
                      打开网页 ↗
                    </button>
                    <button type="button" class="srv-foot-btn px-2.5 py-1" @click="openEditModal(activeAsset)">
                      ✏️ 编辑
                    </button>
                    <button type="button" class="srv-foot-btn px-2.5 py-1 hover:text-rose-400" @click="deleteAsset(activeAsset.id)">
                      🗑️ 删除
                    </button>
                  </div>
                </div>

                <h2 class="text-lg font-bold text-white mt-2 mb-3">
                  {{ activeAsset.name || activeAsset.systemName || '未命名节点' }}
                </h2>

                <div class="kv-grid">
                  <div class="kv-row">
                    <span class="kv-label">目标地址</span>
                    <code class="kv-val font-mono select-all">{{ activeAsset.ip || activeAsset.url || activeAsset.target || '—' }}</code>
                    <button type="button" class="kv-copy-btn" @click="copyTarget(activeAsset)">复制</button>
                  </div>
                  <div class="kv-row">
                    <span class="kv-label">端口</span>
                    <code class="kv-val font-mono">{{ activeAsset.port || '22 / 默认' }}</code>
                    <button
                      v-if="activeAsset.port"
                      type="button"
                      class="kv-copy-btn"
                      @click="copyText(String(activeAsset.port), '端口')"
                    >
                      复制
                    </button>
                    <span v-else />
                  </div>
                  <div class="kv-row">
                    <span class="kv-label">登录账号</span>
                    <code class="kv-val font-mono select-all">{{ activeAsset.username || activeAsset.account || 'root' }}</code>
                    <button
                      type="button"
                      class="kv-copy-btn"
                      @click="copyText(activeAsset.username || activeAsset.account || 'root', '账号')"
                    >
                      复制
                    </button>
                  </div>
                  <div class="kv-row">
                    <span class="kv-label">认证口令</span>
                    <div class="flex items-center gap-2">
                      <span v-if="activeAsset.useGlobalRoot || !activeAsset.password" class="badge-count">
                        👑 继承全局 Root 口令
                      </span>
                      <code v-else class="kv-val font-mono select-all">
                        {{ isPasswordVisible(activeAsset.id) ? activeAsset.password : '••••••••••' }}
                      </code>
                      <button
                        v-if="activeAsset.password && !activeAsset.useGlobalRoot"
                        type="button"
                        class="icon-ghost-btn"
                        @click="toggleSinglePassword(activeAsset.id)"
                      >
                        <component :is="isPasswordVisible(activeAsset.id) ? EyeOff : Eye" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button type="button" class="kv-copy-btn" @click="copyPassword(activeAsset)">复制</button>
                  </div>
                </div>
              </div>

              <!-- 2. 精选凭据全量表格 -->
              <AssetGridTable
                :assets="filteredAssets"
                :is-password-visible="isPasswordVisible"
                @edit="openEditModal"
                @delete="deleteAsset"
                @open-url="openTargetUrl"
                @copy-text="copyText"
                @copy-target="copyTarget"
                @copy-ssh="copySshCommand"
                @copy-pwd="copyPassword"
                @toggle-pwd="toggleSinglePassword"
                @contextmenu="openContextMenu"
              />
            </template>
          </div>
        </template>

        <!-- 状态二：Word 原档交互式摘录工作台 -->
        <div v-else class="flex-1 overflow-hidden">
          <WordExcerptWorkbench
            :word-doc-data="wordDocData"
            :categories="categories"
            :asset-list="assetList"
            @save-item="upsertAsset"
            @add-category="addCategory"
            @save-global-pwd="saveGlobalPassword"
            @select-doc="selectWordFile(true)"
          />
        </div>
      </section>
    </div>

    <!-- 手动编辑/新建弹窗 -->
    <AssetEditModal
      v-model:show="showEditModal"
      :edit-item="currentEditAsset"
      :categories="categories"
      :global-root-password="globalRootPassword"
      @save="upsertAsset"
      @add-category="addCategory"
    />

    <!-- 右键操作菜单 (支持右键删除凭据、复制IP/密码/SSH、编辑) -->
    <ServerContextMenu
      :menu="serverContextMenu"
      @action="handleContextMenuAction"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Database, Plus, Search, X, Pencil, Eye, EyeOff,
  ExternalLink, FileText, RefreshCw, BookOpen, ArrowLeft
} from 'lucide-vue-next'
import {
  useServerCredentials,
  BUILTIN_CATEGORIES,
  getCategoryIconLabel
} from '@/composables/useServerCredentials'
import AssetGridTable from './AssetGridTable.vue'
import AssetEditModal from './AssetEditModal.vue'
import WordExcerptWorkbench from './WordExcerptWorkbench.vue'
import ServerContextMenu from './ServerContextMenu.vue'

const emit = defineEmits(['toast'])

const {
  viewMode,
  assetList,
  categories,
  selectedCategory,
  searchQuery,
  globalRootPassword,
  isGlobalPasswordVisible,
  isEditingGlobalPassword,
  editingGlobalPasswordValue,
  currentDocPath,
  docMeta,
  wordDocData,
  isUpdatingSvn,
  categoryCounts,
  filteredAssets,
  loadData,
  addCategory,
  deleteCategory,
  saveGlobalPassword,
  startEditGlobalPassword,
  selectWordFile,
  openExcerptWorkbench,
  handleSvnUpdate,
  openInNativeWord,
  upsertAsset,
  deleteAsset,
  isPasswordVisible,
  toggleSinglePassword,
  copyText,
  copyPassword,
  copyTarget,
  copySshCommand,
  openTargetUrl
} = useServerCredentials(emit)

const searchInputRef = ref(null)
const showEditModal = ref(false)
const currentEditAsset = ref(null)
const isCreatingCat = ref(false)
const newCategoryInput = ref('')
const selectedAssetId = ref(null)
const rightPaneMode = ref('spotlight')

const serverContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  target: null
})

function openContextMenu(e, item) {
  e.preventDefault()
  e.stopPropagation()
  serverContextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 180),
    y: Math.min(e.clientY, window.innerHeight - 240),
    target: item
  }
}

function closeContextMenu() {
  serverContextMenu.value.visible = false
}

function confirmDeleteAsset(item) {
  if (!item) return
  const label = item.name || item.systemName || item.target || '此节点'
  if (confirm(`确认删除凭据 [${label}] 吗？`)) {
    deleteAsset(item.id)
    if (activeAsset.value?.id === item.id) {
      selectedAssetId.value = null
    }
  }
}

function handleContextMenuAction(act, target) {
  if (!target) return
  if (act === 'copy-target') copyTarget(target)
  else if (act === 'copy-pwd') copyPassword(target)
  else if (act === 'copy-ssh') copySshCommand(target)
  else if (act === 'open-url') openTargetUrl(target)
  else if (act === 'edit') openEditModal(target)
  else if (act === 'delete') confirmDeleteAsset(target)
}

const groupedAssets = computed(() => {
  const map = new Map()
  for (const item of filteredAssets.value) {
    const cat = item.category || '服务器账号'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(item)
  }
  return Array.from(map.entries()).map(([cat, items]) => ({ cat, items }))
})

const activeAsset = computed(() => {
  if (filteredAssets.value.length === 0) return null
  return filteredAssets.value.find(a => a.id === selectedAssetId.value) || filteredAssets.value[0]
})

function selectAssetItem(item) {
  selectedAssetId.value = item.id
  viewMode.value = 'daily'
}

function openAddModal() {
  currentEditAsset.value = null
  showEditModal.value = true
}

function openEditModal(item) {
  currentEditAsset.value = { ...item }
  showEditModal.value = true
}

function confirmSaveGlobalPassword() {
  saveGlobalPassword(editingGlobalPasswordValue.value)
}

async function confirmCreateCategory() {
  const ok = await addCategory(newCategoryInput.value)
  if (ok) {
    selectedCategory.value = newCategoryInput.value.trim()
    newCategoryInput.value = ''
    isCreatingCat.value = false
  }
}

function handleGlobalKeydown(e) {
  const tag = e.target.tagName.toLowerCase()
  if (tag === 'textarea' || (tag === 'input' && e.key !== 'Escape')) {
    if (e.key === 'Escape') e.target.blur()
    return
  }
  if (e.key === 'Escape') {
    closeContextMenu()
  }
  if (e.key === '/' && viewMode.value === 'daily') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(async () => {
  await loadData()
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.credentials-spotlight-shell {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  color: var(--app-primary-foreground);
}

.srv-islands-wrap {
  flex: 1;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.srv-left-island,
.srv-right-island {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.srv-left-tools {
  padding: 12px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-secondary-background);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.srv-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--app-input-background);
  border: 1px solid var(--app-input-border);
}

.srv-search-input {
  flex: 1;
  background: transparent;
  font-size: 12px;
  color: var(--app-input-foreground);
  outline: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.srv-search-input::placeholder {
  color: var(--app-input-placeholder);
}

.srv-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px 10px;
}

.left-empty-state {
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--app-muted-foreground);
}

.srv-group-block {
  margin-bottom: 6px;
}

.srv-group-title {
  padding: 8px 8px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--app-secondary-foreground);
}

.srv-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 3px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.srv-list-item:hover {
  background: var(--app-list-hover-background);
}

.srv-list-item.is-active {
  background: var(--app-list-active-background);
  border-color: var(--app-list-active-border);
}

.srv-item-ico {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--app-accent-teal-bg);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.srv-item-meta {
  min-width: 0;
  flex: 1;
}

.srv-item-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-primary-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.srv-list-item.is-active .srv-item-name {
  color: var(--app-list-active-foreground);
  font-weight: 700;
}

.srv-item-target {
  font-size: 11px;
  color: var(--app-secondary-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.srv-env-tag {
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  background: var(--app-tool-background);
  color: var(--app-secondary-foreground);
  border: 1px solid var(--app-border);
}

.srv-left-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--app-border);
  background: var(--app-secondary-background);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.srv-foot-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--app-primary-foreground);
  background: var(--app-card-background);
  border: 1px solid var(--app-card-border);
  transition: all 0.15s ease;
}

.srv-foot-btn:hover {
  background: var(--app-list-hover-background);
}

.srv-foot-btn.is-svn {
  color: var(--app-accent-sky);
  border-color: var(--app-accent-sky-border);
  background: var(--app-accent-sky-bg);
}

.srv-foot-btn.is-active {
  color: var(--app-accent-amber);
  border-color: var(--app-accent-amber-border);
  background: var(--app-accent-amber-bg);
}

.srv-foot-btn.is-primary {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  border-color: transparent;
  color: var(--app-primary-btn-text);
  font-weight: 700;
}

.srv-right-header {
  height: 46px;
  padding: 0 18px;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-header-background);
}

.right-view-seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--app-input-secondary-background);
  border: 1px solid var(--app-border);
}

.r-seg-btn {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--app-secondary-foreground);
}

.r-seg-btn.is-on {
  background: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  font-weight: 700;
}

.spotlight-detail-card {
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--app-subcard-background);
  border: 1px solid var(--app-card-border);
}

.kv-grid {
  display: flex;
  flex-direction: column;
}

.kv-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--app-border);
  font-size: 12px;
}

.kv-row:last-child {
  border-bottom: none;
}

.kv-label {
  color: var(--app-secondary-foreground);
}

.kv-val {
  color: var(--app-primary-foreground);
  font-weight: 600;
}

.kv-copy-btn {
  padding: 2px 9px;
  border-radius: 6px;
  font-size: 11px;
  background: var(--app-card-background);
  border: 1px solid var(--app-card-border);
  color: var(--app-secondary-foreground);
}

.kv-copy-btn:hover {
  border-color: var(--app-accent-teal-border);
  color: var(--app-accent-teal);
}

.badge-count {
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  border: 1px solid var(--app-accent-teal-border);
}

.root-pwd-capsule {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 10px;
  background: var(--app-input-background);
  border: 1px solid var(--app-accent-teal-border);
  color: var(--app-primary-foreground);
  font-size: 12px;
}

.root-pwd-input {
  width: 130px;
  padding: 2px 6px;
  background: var(--app-card-background);
  border: 1px solid #14b8a6;
  border-radius: 4px;
  font-size: 12px;
  color: var(--app-primary-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.mini-save-btn {
  padding: 2px 7px;
  border-radius: 4px;
  background: #14b8a6;
  color: #ffffff;
  font-weight: 700;
  font-size: 10px;
}

.mini-cancel-btn {
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--app-tool-background);
  color: var(--app-secondary-foreground);
  font-size: 10px;
}

.icon-ghost-btn {
  padding: 3px;
  color: var(--app-secondary-foreground);
  transition: color 0.15s;
}
.icon-ghost-btn:hover {
  color: var(--app-primary-foreground);
}

.copy-root-btn {
  padding: 2px 8px;
  border-radius: 5px;
  background: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  font-weight: 700;
  font-size: 10px;
  border: 1px solid var(--app-accent-teal-border);
}
.copy-root-btn:hover {
  filter: brightness(0.95);
}

.svn-doc-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 10px;
  background: var(--app-subcard-background);
  border: 1px solid var(--app-border);
  font-size: 12px;
  color: var(--app-secondary-foreground);
}

.excerpt-mode-btn {
  padding: 6px 12px;
  border-radius: 10px;
  background: var(--app-accent-amber-bg);
  border: 1px solid var(--app-accent-amber-border);
  color: var(--app-accent-amber);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.excerpt-mode-btn:hover {
  filter: brightness(0.95);
}

.back-daily-btn {
  padding: 6px 14px;
  border-radius: 10px;
  background: #10b981;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-manual-btn {
  padding: 6px 12px;
  border-radius: 10px;
  background: var(--app-tool-background);
  border: 1px solid var(--app-card-border);
  color: var(--app-primary-foreground);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}
.add-manual-btn:hover {
  background: var(--app-list-hover-background);
}

.filter-toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-secondary-background);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nav-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;
  color: var(--app-secondary-foreground);
  border: 1px solid transparent;
  white-space: nowrap;
}
.nav-tab-btn:hover {
  color: var(--app-primary-foreground);
  background-color: var(--app-list-hover-background);
}
.nav-tab-btn.is-active {
  background-color: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  border-color: var(--app-accent-teal-border);
  font-weight: 700;
}

.count-tag {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background-color: var(--app-tool-background);
  color: var(--app-secondary-foreground);
}

.del-cat-dot {
  margin-left: 2px;
  padding: 0 3px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--app-muted-foreground);
}
.del-cat-dot:hover {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.15);
}

.create-cat-btn {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px dashed var(--app-card-border);
  font-size: 11px;
  color: var(--app-secondary-foreground);
  transition: all 0.15s;
}
.create-cat-btn:hover {
  color: var(--app-accent-teal);
  border-color: var(--app-accent-teal-border);
}

.new-cat-inline-input {
  width: 130px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--app-input-background);
  border: 1px solid #14b8a6;
  font-size: 11px;
  color: var(--app-input-foreground);
}

.search-box-input {
  width: 100%;
  padding: 4px 24px 4px 28px;
  border-radius: 8px;
  background: var(--app-input-background);
  border: 1px solid var(--app-input-border);
  font-size: 11px;
  color: var(--app-input-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.search-box-input:focus {
  outline: none;
  border-color: #14b8a6;
}

.empty-ledger-state {
  height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.bottom-status-bar {
  height: 32px;
  padding: 0 16px;
  border-top: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  flex-shrink: 0;
  background: var(--app-secondary-background);
  color: var(--app-secondary-foreground);
}
</style>
