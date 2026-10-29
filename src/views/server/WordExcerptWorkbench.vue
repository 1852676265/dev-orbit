<template>
  <div class="excerpt-workbench">
    <!-- 左侧 (占比 60%): 原汁原味的 Word 原档真实排版画布 (保持原顺序、原表格、原标蓝与高亮) -->
    <div class="doc-source-pane">
      <!-- 顶部工具栏 -->
      <div class="source-header">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5" />
            <span>Word 原档真实视图（直接鼠标划选任意文字，或点表格行即可摘录）</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- 纸张底色切换：深色护眼 vs 经典白底 Word -->
          <button
            class="paper-mode-btn"
            @click="isLightPaper = !isLightPaper"
          >
            {{ isLightPaper ? '🌙 切换深色纸张' : '📄 切换白底 Word' }}
          </button>

          <div class="relative w-44">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
            <input
              v-model="docSearch"
              type="text"
              placeholder="在文档中查找..."
              class="doc-search-input"
            />
          </div>

          <button
            class="reselect-doc-btn"
            title="更换绑定的 Word 文档"
            @click="$emit('select-doc')"
          >
            <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            <span>更换文档</span>
          </button>
        </div>
      </div>

      <!-- 鼠标自由划选后的顶部常驻快捷赋权条 -->
      <div v-if="selectedText" class="floating-selection-bar">
        <div class="flex items-center gap-1.5 truncate">
          <span class="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">已划选</span>
          <span class="font-mono text-xs text-amber-200 font-bold truncate max-w-[220px]" :title="selectedText">
            "{{ selectedText }}"
          </span>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0 flex-wrap">
          <button class="sel-action-btn" @click="fillSelectedTo('name')">设为名称</button>
          <button class="sel-action-btn sky" @click="fillSelectedTo('target')">设为IP/网址</button>
          <button class="sel-action-btn purple" @click="fillSelectedTo('username')">设为账号</button>
          <button class="sel-action-btn amber" @click="fillSelectedTo('password')">设为密码(绑锚点)</button>
          <button
            v-if="canSplitUserPwd(selectedText)"
            class="sel-action-btn emerald"
            title="自动按 \ 或 / 或空格拆分为账号+密码"
            @click="splitSelectedToUserAndPwd"
          >
            ⚡ 拆分账号+密码
          </button>
          <button class="sel-action-btn teal" @click="$emit('save-global-pwd', selectedText)">
            👑 设为全局Root
          </button>
        </div>
      </div>

      <!-- Word 原档纸张滚动区 (完全还原段落与表格原始穿插顺序) -->
      <div
        class="source-body custom-scrollbar"
        :class="{ 'light-word-paper': isLightPaper }"
        @mouseup="handleTextSelection"
      >
        <div v-if="filteredBlocks.length === 0" class="empty-doc-box">
          <FileText class="w-10 h-10 text-amber-400/40 mb-2" />
          <p class="text-xs font-bold text-slate-300">尚未载入 Word 文档内容</p>
          <p class="text-[11px] text-slate-500 mt-1">
            请选择本地 SVN Word 文档 (.docx)，系统将按原排版完整展示文档供自由划词摘录
          </p>
          <button class="pick-doc-primary-btn mt-3" @click="$emit('select-doc')">
            选择 Word 文档 (.docx)
          </button>
        </div>

        <div v-else class="word-page-sheet" :class="{ 'is-light': isLightPaper }">
          <template v-for="block in filteredBlocks" :key="block.id">
            <!-- 1. 原位段落 <w:p> (还原标题层级、加粗、标蓝与高亮，不做破坏性拆词) -->
            <div
              v-if="block.type === 'paragraph'"
              class="word-paragraph"
              :class="{
                'is-heading': block.isHeading,
                'text-center': block.align === 'center',
                'text-right': block.align === 'right'
              }"
              :data-anchor-key="block.anchorKey"
              :data-anchor-label="`段落 [${block.sectionTitle || block.text.slice(0, 14)}]`"
              :data-full-text="block.text"
            >
              <template v-for="(run, rIdx) in block.runs" :key="rIdx">
                <span
                  :class="[
                    { 'font-bold': run.bold || block.isHeading },
                    run.isBlue ? 'word-blue-run' : ''
                  ]"
                  :style="{
                    color: !run.isBlue && run.colorHex ? run.colorHex : undefined,
                    backgroundColor: run.bgHighlight || undefined,
                    fontSize: run.fontSizePt ? `${Math.min(18, Math.max(12, run.fontSizePt))}px` : undefined
                  }"
                  :title="run.isBlue ? '🔵 Word原档标蓝文字（点击可直接填入密码并绑定锚点）' : undefined"
                  @click="run.isBlue ? handleBlueRunClick(run.text, block) : null"
                >{{ run.text }}</span>
              </template>
            </div>

            <!-- 2. 原位表格 <w:tbl> (紧跟在对应年份/模块标题下方，保留多行单元格与合并列) -->
            <div v-else-if="block.type === 'table'" class="word-table-container my-3">
              <table class="word-native-table">
                <thead v-if="block.isHeader">
                  <tr>
                    <th v-for="(h, hIdx) in block.headers" :key="hIdx">
                      {{ h }}
                    </th>
                    <th class="w-20 text-center">快捷摘录</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in block.rows"
                    :key="row.id"
                    :class="{ 'row-already-picked': isRowPicked(row.draft) }"
                    :data-anchor-key="row.draft?.anchorKey"
                    :data-anchor-label="row.draft?.anchorLabel"
                  >
                    <td
                      v-for="(richLines, cIdx) in row.cellRichLines"
                      :key="cIdx"
                      :colspan="row.cellColspans?.[cIdx] || 1"
                      class="word-td"
                      @click="applyCellText(row.cells[cIdx], block.headers[cIdx], row.draft)"
                    >
                      <div
                        v-for="(lineRuns, lIdx) in richLines"
                        :key="lIdx"
                        class="leading-relaxed"
                      >
                        <span
                          v-for="(run, rIdx) in lineRuns"
                          :key="rIdx"
                          :class="[
                            { 'font-bold': run.bold },
                            run.isBlue ? 'word-blue-run' : ''
                          ]"
                          :style="{
                            color: !run.isBlue && run.colorHex ? run.colorHex : undefined,
                            backgroundColor: run.bgHighlight || undefined
                          }"
                        >{{ run.text }}</span>
                      </div>
                    </td>
                    <td class="word-td text-center whitespace-nowrap">
                      <button
                        class="table-pick-btn"
                        :class="{ 'picked': isRowPicked(row.draft) }"
                        @click.stop="applyDraft(row.draft)"
                      >
                        {{ isRowPicked(row.draft) ? '✓ 已摘' : '摘此行 →' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 右侧 (占比 40%): 🎯 自由摘录组装台 (始终固定在右侧可见) -->
    <div class="assembly-slot-pane">
      <div class="slot-header">
        <div>
          <h3 class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <span>🎯 自由摘录组装台</span>
            <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-mono">
              当前账本 {{ assetList.length }} 项
            </span>
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            在左侧原档中<b class="text-amber-300">用鼠标划选任意文字</b>或点<b class="text-sky-300">🔵标蓝密码/表格行</b>即可填入
          </p>
        </div>
        <button class="reset-slot-btn" @click="resetDraft">清空</button>
      </div>

      <div class="slot-form custom-scrollbar">
        <!-- 1. 归属分类 (支持默认3类 + 自由新建自定义分类) -->
        <div class="slot-field">
          <div class="flex items-center justify-between">
            <label class="slot-label">1. 归入分类（可自定义创建）</label>
            <button
              class="new-cat-toggle-btn"
              @click="showNewCatInput = !showNewCatInput"
            >
              {{ showNewCatInput ? '取消新建' : '+ 新建分类' }}
            </button>
          </div>

          <div v-if="showNewCatInput" class="flex items-center gap-1.5 mt-1">
            <input
              v-model="newCatName"
              type="text"
              placeholder="输入新分类名，如：防篡改 / 堡垒机 / 数据库"
              class="slot-input flex-1"
              @keydown.enter="handleCreateCategory"
            />
            <button class="confirm-cat-btn" @click="handleCreateCategory">创建</button>
          </div>

          <div class="flex flex-wrap gap-1.5 mt-1">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="cat-choice-pill"
              :class="{ 'is-selected': draft.category === cat }"
              @click="selectDraftCategory(cat)"
            >
              {{ getCategoryIconLabel(cat) }}
            </button>
          </div>
        </div>

        <!-- 2. 名称 / 用途说明 -->
        <div class="slot-field">
          <label class="slot-label">2. 资产名称 / 用途说明 <span class="text-rose-400">*</span></label>
          <input
            v-model="draft.name"
            type="text"
            placeholder="在左侧划选文字点「设为名称」或直接输入..."
            class="slot-input font-sans font-bold"
          />
        </div>

        <!-- 3. 目标地址与端口 -->
        <div class="grid grid-cols-3 gap-2">
          <div class="slot-field col-span-2">
            <label class="slot-label">3. 目标地址 (IP 或 Web URL)</label>
            <input
              v-model="draft.target"
              type="text"
              placeholder="172.31.x.x 或 https://..."
              class="slot-input text-sky-300"
            />
          </div>
          <div class="slot-field">
            <label class="slot-label">端口</label>
            <input
              v-model="draft.port"
              type="text"
              placeholder="22 / 443"
              class="slot-input"
            />
          </div>
        </div>

        <!-- 4. 登录账号与密码 -->
        <div class="grid grid-cols-2 gap-2">
          <div class="slot-field">
            <label class="slot-label">4. 登录账号 (Username)</label>
            <input
              v-model="draft.username"
              type="text"
              placeholder="如 root / MSMZSW"
              class="slot-input text-teal-300 font-bold"
            />
          </div>
          <div class="slot-field">
            <div class="flex items-center justify-between">
              <label class="slot-label">5. 登录密码</label>
              <button
                v-if="draft.password"
                type="button"
                class="set-global-root-link"
                title="将此密码直接设为全局通用 Root 口令"
                @click="$emit('save-global-pwd', draft.password)"
              >
                👑 设为全局Root
              </button>
            </div>
            <input
              v-model="draft.password"
              type="text"
              placeholder="留空则继承通用Root口令"
              class="slot-input text-amber-300 font-bold"
            />
          </div>
        </div>

        <!-- 5. 备注说明 -->
        <div class="slot-field">
          <label class="slot-label">6. 备注 / 环境附加信息（选填）</label>
          <input
            v-model="draft.remark"
            type="text"
            placeholder="例如：政务外网 | EIP: 10.86.139.182"
            class="slot-input font-sans text-slate-300"
          />
        </div>

        <!-- 6. SVN 更新自动同步锚点配置 -->
        <div class="svn-anchor-card">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-sky-300">
              🔗 SVN 更新自动同步（无需二次摘录）
            </span>
            <span class="anchor-tag">
              {{ draft.anchorLabel || '划选或点选后自动绑定' }}
            </span>
          </div>
          <p v-if="draft.beforePrefix" class="text-[10px] text-slate-400 font-mono mt-1 truncate">
            已记忆左邻前缀: "{{ draft.beforePrefix }}" ➔ 后续改密自动原位提取
          </p>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="text-[10px] text-slate-400 flex-shrink-0">同步规则:</span>
            <select v-model="draft.syncRule" class="sync-rule-select">
              <option value="blue_first">🔵 优先取该处【标蓝】密码，无标蓝则按原位置提取</option>
              <option value="prefix_exact">📍 严格按划选时的左邻前缀位置提取新密码</option>
            </select>
          </div>
        </div>

        <!-- 提交存入按钮 -->
        <button
          type="button"
          class="save-to-ledger-btn"
          :disabled="!draft.name.trim() && !draft.target.trim()"
          @click="submitDraftToLedger"
        >
          <Check class="w-4 h-4" />
          <span>存入我的精简账本（归入「{{ draft.category }}」）</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, FolderOpen, FileText, Check } from 'lucide-vue-next'
import { getCategoryIconLabel } from '@/composables/useServerCredentials'

const props = defineProps({
  wordDocData: {
    type: Object,
    default: () => ({ docBlocks: [], rawParagraphs: [], rawTables: [] })
  },
  categories: {
    type: Array,
    required: true
  },
  assetList: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'save-item',
  'add-category',
  'save-global-pwd',
  'select-doc'
])

const docSearch = ref('')
const isLightPaper = ref(false)
const showNewCatInput = ref(false)
const newCatName = ref('')

const selectedText = ref('')
const selectedAnchorKey = ref('')
const selectedAnchorLabel = ref('')
const selectedFullLineText = ref('')

const draft = ref({
  category: '服务器账号',
  name: '',
  target: '',
  port: '22',
  env: '生产环境',
  username: 'root',
  password: '',
  useDefaultPassword: true,
  remark: '',
  anchorKey: '',
  anchorLabel: '',
  beforePrefix: '',
  syncRule: 'blue_first'
})

const docBlocks = computed(() => props.wordDocData?.docBlocks || [])

const filteredBlocks = computed(() => {
  const q = docSearch.value.trim().toLowerCase()
  if (!q) return docBlocks.value
  return docBlocks.value.filter(b => {
    if (b.type === 'paragraph') {
      return b.text.toLowerCase().includes(q)
    }
    if (b.type === 'table') {
      return b.rows.some(r => r.cells.some(c => (c || '').toLowerCase().includes(q)))
    }
    return false
  })
})

function isRowPicked(rowDraft) {
  if (!rowDraft) return false
  return props.assetList.some(
    a =>
      (rowDraft.target && a.target === rowDraft.target && a.name === rowDraft.name) ||
      (rowDraft.name && a.name === rowDraft.name && a.target === rowDraft.target)
  )
}

function selectDraftCategory(cat) {
  draft.value.category = cat
  if (cat === '服务器账号' && !draft.value.username) {
    draft.value.username = 'root'
    draft.value.port = '22'
  }
}

function canSplitUserPwd(str = '') {
  return /^[^\s/\\:]+[\\/\s:]+[^\s/\\:]+$/.test(str.trim())
}

function splitSelectedToUserAndPwd() {
  const raw = selectedText.value.trim()
  const m = raw.match(/^([^\s/\\:]+)[\\/\s:]+(.+)$/)
  if (m) {
    draft.value.username = m[1].trim()
    draft.value.password = m[2].trim()
    draft.value.useDefaultPassword = false
    bindSelectionAnchor(m[2].trim())
    selectedText.value = ''
  }
}

function handleBlueRunClick(blueText, paraBlock) {
  const clean = (blueText || '').trim()
  if (!clean) return
  draft.value.password = clean
  draft.value.useDefaultPassword = false
  draft.value.anchorKey = paraBlock.anchorKey
  draft.value.anchorLabel = `段落 [${paraBlock.sectionTitle || paraBlock.text.slice(0, 12)}]`
  draft.value.syncRule = 'blue_first'
  if (!draft.value.name && paraBlock.sectionTitle) {
    draft.value.name = paraBlock.sectionTitle
  }
}

function applyCellText(cellText, headerName = '', rowDraft = null) {
  const text = (cellText || '').trim()
  if (!text) return
  if (rowDraft?.anchorKey) {
    draft.value.anchorKey = rowDraft.anchorKey
    draft.value.anchorLabel = rowDraft.anchorLabel || `表格行 [${rowDraft.target || rowDraft.name}]`
  }
  const firstLine = text.split(/\r?\n|\s*\/\s*/)[0].trim()
  if (/^https?:\/\//i.test(firstLine) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(firstLine)) {
    draft.value.target = firstLine
  } else if (/账号|用户|密码/i.test(headerName)) {
    const m = text.match(/^([^\s/\\]+)[/\\](.+)$/)
    if (m) {
      draft.value.username = m[1].trim()
      draft.value.password = m[2].trim()
      draft.value.useDefaultPassword = false
    } else {
      draft.value.password = text
      draft.value.useDefaultPassword = false
    }
  } else if (/用途|名称|主机/i.test(headerName)) {
    draft.value.name = text.replace(/\n/g, ' ')
  } else {
    const clean = text.replace(/\n/g, ' ')
    draft.value.remark = draft.value.remark ? `${draft.value.remark} | ${clean}` : clean
  }
  if (!draft.value.name && rowDraft?.name) {
    draft.value.name = rowDraft.name
  }
}

function applyDraft(sourceDraft) {
  if (!sourceDraft) return
  draft.value = {
    category: sourceDraft.category || '服务器账号',
    name: sourceDraft.name || '',
    target: sourceDraft.target || '',
    port: sourceDraft.port || (sourceDraft.category === '服务器账号' ? '22' : ''),
    env: sourceDraft.env || '生产环境',
    username: sourceDraft.username || (sourceDraft.category === '服务器账号' ? 'root' : ''),
    password: sourceDraft.password || '',
    useDefaultPassword: Boolean(sourceDraft.category === '服务器账号' && !sourceDraft.password),
    remark: sourceDraft.remark || '',
    anchorKey: sourceDraft.anchorKey || '',
    anchorLabel: sourceDraft.anchorLabel || '',
    beforePrefix: '',
    syncRule: sourceDraft.syncRule || 'blue_first'
  }
}

function resetDraft() {
  draft.value = {
    category: draft.value.category || '服务器账号',
    name: '',
    target: '',
    port: draft.value.category === '服务器账号' ? '22' : '',
    env: '生产环境',
    username: draft.value.category === '服务器账号' ? 'root' : '',
    password: '',
    useDefaultPassword: true,
    remark: '',
    anchorKey: '',
    anchorLabel: '',
    beforePrefix: '',
    syncRule: 'blue_first'
  }
}

function handleTextSelection() {
  const selection = window.getSelection()
  const sel = selection?.toString().trim() || ''
  if (sel && sel.length >= 1 && sel.length <= 160) {
    selectedText.value = sel
    const node = selection?.anchorNode
    const el = node?.nodeType === 1 ? node : node?.parentElement
    const anchorEl = el?.closest?.('[data-anchor-key]')
    if (anchorEl) {
      selectedAnchorKey.value = anchorEl.getAttribute('data-anchor-key') || ''
      selectedAnchorLabel.value = anchorEl.getAttribute('data-anchor-label') || ''
      selectedFullLineText.value = anchorEl.getAttribute('data-full-text') || ''
    }
  }
}

function bindSelectionAnchor(targetPwdStr) {
  if (selectedAnchorKey.value) {
    draft.value.anchorKey = selectedAnchorKey.value
    draft.value.anchorLabel = selectedAnchorLabel.value
  }
  if (selectedFullLineText.value && targetPwdStr) {
    const idx = selectedFullLineText.value.indexOf(targetPwdStr)
    if (idx > 0) {
      draft.value.beforePrefix = selectedFullLineText.value.slice(0, idx)
    }
  }
}

function fillSelectedTo(field) {
  if (!selectedText.value) return
  const val = selectedText.value.trim()
  draft.value[field] = val
  if (field === 'target' && /^https?:\/\//i.test(val)) {
    draft.value.category = 'Web网站'
    draft.value.port = ''
  }
  if (field === 'password') {
    draft.value.useDefaultPassword = false
    bindSelectionAnchor(val)
  } else if (selectedAnchorKey.value && !draft.value.anchorKey) {
    draft.value.anchorKey = selectedAnchorKey.value
    draft.value.anchorLabel = selectedAnchorLabel.value
  }
  selectedText.value = ''
}

function handleCreateCategory() {
  const name = newCatName.value.trim()
  if (!name) return
  emit('add-category', name)
  draft.value.category = name
  newCatName.value = ''
  showNewCatInput.value = false
}

function submitDraftToLedger() {
  if (!draft.value.name.trim() && !draft.value.target.trim()) return
  const finalName = draft.value.name.trim() || draft.value.target.trim()
  const isDefaultPwd = draft.value.category === '服务器账号' && !draft.value.password.trim()
  emit('save-item', {
    ...draft.value,
    name: finalName,
    password: draft.value.password.trim(),
    useDefaultPassword: isDefaultPwd
  })
  resetDraft()
}
</script>

<style scoped>
.excerpt-workbench {
  display: flex;
  gap: 14px;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 12px 16px;
}

.doc-source-pane {
  flex: 7;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--app-card-border);
  background: var(--app-card-background);
}

.source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-secondary-background);
}

.paper-mode-btn {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--app-tool-background);
  color: var(--app-primary-foreground);
  border: 1px solid var(--app-card-border);
}
.paper-mode-btn:hover {
  background: var(--app-list-hover-background);
}

.doc-search-input {
  width: 100%;
  padding: 4px 10px 4px 28px;
  border-radius: 8px;
  background: var(--app-input-background);
  border: 1px solid var(--app-input-border);
  font-size: 11px;
  color: var(--app-input-foreground);
}
.doc-search-input:focus {
  outline: none;
  border-color: #f59e0b;
}

.reselect-doc-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 11px;
  background: var(--app-tool-background);
  color: var(--app-secondary-foreground);
  border: 1px solid var(--app-card-border);
}

.floating-selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 14px;
  background: rgba(245, 158, 11, 0.16);
  border-bottom: 1px solid rgba(245, 158, 11, 0.45);
}

.sel-action-btn {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.sel-action-btn:hover {
  filter: brightness(1.15);
}
.sel-action-btn.sky {
  background: rgba(14, 165, 233, 0.25);
  color: #7dd3fc;
  border-color: rgba(14, 165, 233, 0.5);
}
.sel-action-btn.purple {
  background: rgba(168, 85, 247, 0.25);
  color: #d8b4fe;
  border-color: rgba(168, 85, 247, 0.5);
}
.sel-action-btn.amber {
  background: rgba(245, 158, 11, 0.28);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.6);
}
.sel-action-btn.emerald {
  background: rgba(16, 185, 129, 0.28);
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.6);
}
.sel-action-btn.teal {
  background: rgba(20, 184, 166, 0.25);
  color: #5eead4;
  border-color: rgba(20, 184, 166, 0.5);
}

.source-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  user-select: text;
}
.source-body.light-word-paper {
  background: #e2e8f0;
}

/* 还原真实 Word 纸张流式排版 */
.word-page-sheet {
  max-width: 100%;
  padding: 20px 24px;
  border-radius: 10px;
  background: #0f1624;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 13px;
  line-height: 1.8;
}
.word-page-sheet.is-light {
  background: #ffffff;
  color: #1e293b;
  border-color: #cbd5e1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.word-paragraph {
  margin-bottom: 6px;
  word-break: break-all;
}
.word-paragraph.is-heading {
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #5eead4;
}
.word-page-sheet.is-light .word-paragraph.is-heading {
  color: #0f172a;
}

.word-blue-run {
  color: #38bdf8;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(14, 165, 233, 0.15);
  border-bottom: 2px dashed #38bdf8;
  cursor: pointer;
}
.word-page-sheet.is-light .word-blue-run {
  color: #0066cc;
  background: rgba(0, 102, 204, 0.1);
  border-bottom-color: #0066cc;
}

/* 还原真实 Word 网格表格 */
.word-native-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.word-native-table th,
.word-native-table td {
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 6px 8px;
  vertical-align: middle;
}
.word-page-sheet.is-light .word-native-table th,
.word-page-sheet.is-light .word-native-table td {
  border-color: #94a3b8;
}
.word-native-table th {
  background: rgba(255, 255, 255, 0.06);
  font-weight: 700;
  color: #94a3b8;
}
.word-page-sheet.is-light .word-native-table th {
  background: #f1f5f9;
  color: #334155;
}
.word-td {
  cursor: pointer;
}
.word-td:hover {
  background: rgba(245, 158, 11, 0.1);
}
.row-already-picked {
  background: rgba(16, 185, 129, 0.08);
}

.table-pick-btn {
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}
.word-page-sheet.is-light .table-pick-btn {
  background: #ecfdf5;
  color: #059669;
  border-color: #10b981;
}

.empty-doc-box {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.pick-doc-primary-btn {
  padding: 6px 14px;
  border-radius: 10px;
  background: #f59e0b;
  color: #090d16;
  font-size: 12px;
  font-weight: 700;
}

/* 右侧固定组装台 */
.assembly-slot-pane {
  flex: 5;
  min-width: 340px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--app-card-border);
  background: var(--app-card-background);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.slot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 11px 14px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-accent-teal-bg);
}

.reset-slot-btn {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--app-secondary-foreground);
  background: var(--app-tool-background);
}

.slot-form {
  flex: 1;
  overflow-y: auto;
  padding: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slot-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-label {
  font-size: 11px;
  color: var(--app-secondary-foreground);
  font-weight: 600;
}

.slot-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--app-input-background);
  border: 1px solid var(--app-input-border);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--app-input-foreground);
}
.slot-input:focus {
  outline: none;
  border-color: #10b981;
}

.new-cat-toggle-btn {
  font-size: 11px;
  color: var(--app-accent-teal);
  font-weight: 700;
}

.confirm-cat-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: #10b981;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.cat-choice-pill {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--app-tool-background);
  color: var(--app-secondary-foreground);
  border: 1px solid var(--app-card-border);
}
.cat-choice-pill.is-selected {
  background: var(--app-accent-teal-bg);
  color: var(--app-accent-teal);
  border-color: var(--app-accent-teal-border);
  font-weight: 700;
}

.set-global-root-link {
  font-size: 10px;
  color: var(--app-accent-amber);
  font-weight: 700;
}

.svn-anchor-card {
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--app-accent-sky-bg);
  border: 1px solid var(--app-accent-sky-border);
}
.anchor-tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: var(--app-accent-sky-bg);
  color: var(--app-accent-sky);
}
.sync-rule-select {
  flex: 1;
  padding: 3px 6px;
  border-radius: 6px;
  background: var(--app-input-background);
  border: 1px solid var(--app-accent-sky-border);
  font-size: 10px;
  color: var(--app-accent-sky);
}

.save-to-ledger-btn {
  margin-top: 2px;
  width: 100%;
  padding: 9px 14px;
  border-radius: 10px;
  background: linear-gradient(to right, #10b981, #14b8a6);
  color: var(--app-primary-btn-text);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.save-to-ledger-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
