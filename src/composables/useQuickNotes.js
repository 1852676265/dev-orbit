import { ref, computed } from 'vue'

export function useQuickNotes(emit) {
  // 1. 顶级主标签页切换 ('commands' | 'memos')
  const activeMainTab = ref('commands')

  // ---------------------------------------------------------------------------
  // 2. 常用命令军火库状态
  // ---------------------------------------------------------------------------
  const notes = ref([])
  const cmdSearchQuery = ref('')
  const selectedCmdCategory = ref('all') // 'all' | 'pinned' | 具体分类名
  const cmdViewMode = ref('spotlight') // 'spotlight' | 'grid' | 'list'
  const selectedCommandId = ref(null)
  const customCategories = ref([])

  // 命令新增/编辑表单
  const showCmdModal = ref(false)
  const editingCmdId = ref(null)
  const cmdForm = ref({ tag: '', title: '', command: '' })

  // TXT 批量导入
  const showTxtImportModal = ref(false)
  const importRawText = ref('')
  const importTargetCategory = ref('自定义分类')
  const customImportCategoryName = ref('发布脚本')
  const parsedPreviewList = ref([])

  function getCmd(item) {
    return (item?.command || item?.content || '').trim()
  }

  const allCategories = computed(() => {
    const names = new Set(customCategories.value)
    for (const n of notes.value) {
      const t = (n.tag || '').trim()
      if (t && t !== '通用') names.add(t)
    }
    return Array.from(names).map(name => {
      const count = notes.value.filter(n => (n.tag || '').trim() === name).length
      return { name, count, canDelete: count === 0 }
    })
  })

  const pinnedCmdCount = computed(() => notes.value.filter(n => n.isPinned).length)

  function getCategoryIcon(name) {
    const t = (name || '').toLowerCase()
    if (t.includes('发布') || t.includes('deploy')) return '🚀'
    if (t.includes('docker') || t.includes('k8s')) return '🐳'
    if (t.includes('sql') || t.includes('dm8') || t.includes('oracle')) return '🗄️'
    if (t.includes('git') || t.includes('svn')) return '🌿'
    if (t.includes('linux')) return '🐧'
    if (t.includes('nginx')) return '🌐'
    if (t.includes('redis')) return '⚡'
    return '📁'
  }

  function getTagColor(tag) {
    const t = (tag || '').toLowerCase()
    if (t.includes('发布') || t.includes('deploy')) return '#2DD4BF'
    if (t.includes('docker') || t.includes('k8s')) return '#38BDF8'
    if (t.includes('git') || t.includes('svn')) return '#FB923C'
    if (t.includes('linux')) return '#A3E635'
    if (t.includes('sql') || t.includes('dm8') || t.includes('oracle')) return '#FBBF24'
    if (t.includes('nginx')) return '#F472B6'
    return '#94A3B8'
  }

  const filteredNotes = computed(() => {
    return notes.value
      .filter(n => {
        if (selectedCmdCategory.value === 'pinned') {
          if (!n.isPinned) return false
        } else if (selectedCmdCategory.value !== 'all') {
          if ((n.tag || '').trim() !== selectedCmdCategory.value) return false
        }
        if (cmdSearchQuery.value.trim()) {
          const q = cmdSearchQuery.value.trim().toLowerCase()
          const inTitle = (n.title || '').toLowerCase().includes(q)
          const inCmd = getCmd(n).toLowerCase().includes(q)
          const inTag = (n.tag || '').toLowerCase().includes(q)
          if (!inTitle && !inCmd && !inTag) return false
        }
        return true
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return 0
      })
  })

  const groupedCommandList = computed(() => {
    const map = new Map()
    for (const item of filteredNotes.value) {
      const tag = (item.tag || '通用').trim()
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag).push(item)
    }
    return Array.from(map.entries()).map(([tag, items]) => ({ tag, items }))
  })

  const activeCommand = computed(() => {
    if (filteredNotes.value.length === 0) return null
    return filteredNotes.value.find(n => n.id === selectedCommandId.value) || filteredNotes.value[0]
  })

  const sameCategoryCommands = computed(() => {
    if (!activeCommand.value) return []
    const tag = (activeCommand.value.tag || '通用').trim()
    return notes.value.filter(n => (n.tag || '通用').trim() === tag && n.id !== activeCommand.value.id)
  })

  async function loadNotes() {
    if (!window.electronAPI?.getQuickNotes) return
    try {
      const data = await window.electronAPI.getQuickNotes()
      notes.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('加载命令库失败', e)
      notes.value = []
    }
  }

  async function loadCategories() {
    if (!window.electronAPI?.getQuickNoteCategories) return
    try {
      const data = await window.electronAPI.getQuickNoteCategories()
      if (Array.isArray(data)) customCategories.value = data
    } catch (e) {}
  }

  async function saveCategories() {
    if (!window.electronAPI?.saveQuickNoteCategories) return
    try {
      await window.electronAPI.saveQuickNoteCategories(JSON.parse(JSON.stringify(customCategories.value)))
    } catch (e) {}
  }

  function addCategory(name) {
    const clean = (name || '').trim()
    if (!clean) return
    if (!customCategories.value.includes(clean)) {
      customCategories.value.push(clean)
      saveCategories()
      selectedCmdCategory.value = clean
      emit('toast', `已新建分类: ${clean}`, 'success')
    }
  }

  function deleteCategory(catName) {
    customCategories.value = customCategories.value.filter(c => c !== catName)
    saveCategories()
    if (selectedCmdCategory.value === catName) selectedCmdCategory.value = 'all'
    emit('toast', `已删除分类: ${catName}`, 'info')
  }

  async function copyCommand(cmd) {
    if (!cmd) return
    try {
      if (window.electronAPI?.copyToClipboard) {
        await window.electronAPI.copyToClipboard(cmd)
      } else {
        await navigator.clipboard.writeText(cmd)
      }
      emit('toast', '已成功复制命令至剪贴板！', 'success')
    } catch (e) {
      emit('toast', '复制失败: ' + e.message, 'error')
    }
  }

  function openAddCmd(defaultTag = '') {
    editingCmdId.value = null
    let tag = defaultTag || '常用'
    if (!defaultTag && selectedCmdCategory.value !== 'all' && selectedCmdCategory.value !== 'pinned') {
      tag = selectedCmdCategory.value
    } else if (!defaultTag && allCategories.value.length > 0) {
      tag = allCategories.value[0].name
    }
    cmdForm.value = { tag, title: '', command: '' }
    showCmdModal.value = true
  }

  function openEditCmd(item) {
    editingCmdId.value = item.id
    cmdForm.value = {
      tag: item.tag || '常用',
      title: item.title,
      command: getCmd(item)
    }
    showCmdModal.value = true
  }

  async function togglePinCommand(item) {
    item.isPinned = !item.isPinned
    if (window.electronAPI?.saveQuickNote) {
      await window.electronAPI.saveQuickNote(JSON.parse(JSON.stringify(item)))
    }
    emit('toast', item.isPinned ? '已置顶命令' : '已取消置顶', 'info')
  }

  async function saveCommand() {
    if (!window.electronAPI?.saveQuickNote) return
    try {
      const payload = {
        id: editingCmdId.value || undefined,
        tag: cmdForm.value.tag.trim() || '常用',
        title: cmdForm.value.title.trim(),
        command: cmdForm.value.command.trim(),
        content: cmdForm.value.command.trim()
      }
      await window.electronAPI.saveQuickNote(JSON.parse(JSON.stringify(payload)))
      showCmdModal.value = false
      await loadNotes()
      emit('toast', '命令已保存！', 'success')
    } catch (e) {
      emit('toast', '保存失败: ' + e.message, 'error')
    }
  }

  async function deleteCommand(id) {
    try {
      await window.electronAPI?.deleteQuickNote(id)
      await loadNotes()
      emit('toast', '已成功删除命令', 'info')
    } catch (e) {
      emit('toast', '删除失败', 'error')
    }
  }

  // ---------------------------------------------------------------------------
  // 3. 极速随手记状态与拖拽排序
  // ---------------------------------------------------------------------------
  const memos = ref([])
  const memoSearchQuery = ref('')
  const selectedMemoTag = ref('all')
  const selectedMemoId = ref(null)

  // 拖拽排序状态
  const draggedMemoIdx = ref(null)
  const dragOverMemoIdx = ref(null)

  // 双击预览全景弹窗
  const previewModal = ref({ visible: false, memo: null })

  const memoColors = [
    { name: 'obsidian', hex: '#161f30', accent: '#334155', title: '默认黑曜' },
    { name: 'amber', hex: '#292211', accent: '#f59e0b', title: '琥珀暖黄' },
    { name: 'teal', hex: '#0e2b26', accent: '#14b8a6', title: '薄荷极客' },
    { name: 'sky', hex: '#0f243a', accent: '#0284c7', title: '蔚蓝天空' }
  ]

  const commonTagChips = computed(() => memoTagList.value.map(t => t.name).slice(0, 8))
  const pinnedMemosCount = computed(() => memos.value.filter(m => m.isPinned).length)

  const memoTagList = computed(() => {
    const map = new Map()
    for (const m of memos.value) {
      if (m.tag) map.set(m.tag, (map.get(m.tag) || 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  })

  const filteredMemos = computed(() => {
    return memos.value
      .filter(m => {
        if (selectedMemoTag.value === 'pinned') {
          if (!m.isPinned) return false
        } else if (selectedMemoTag.value !== 'all') {
          if (m.tag !== selectedMemoTag.value) return false
        }
        if (memoSearchQuery.value.trim()) {
          const q = memoSearchQuery.value.trim().toLowerCase()
          const inContent = (m.content || '').toLowerCase().includes(q)
          const inTitle = (m.title || '').toLowerCase().includes(q)
          const inTag = (m.tag || '').toLowerCase().includes(q)
          return inContent || inTitle || inTag
        }
        return true
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return (a.order ?? 0) - (b.order ?? 0)
      })
  })

  const activeMemo = computed(() => {
    if (filteredMemos.value.length === 0) return null
    return filteredMemos.value.find(m => m.id === selectedMemoId.value) || filteredMemos.value[0]
  })

  function getMemoFirstLine(text) {
    if (!text) return '空便签'
    const first = text.split('\n')[0].replace(/^- \[[ x]\]\s*/, '').trim()
    return first || '随手记便签'
  }

  function getMemoTitle(memo) {
    if (!memo) return '空便签'
    if (memo.title && memo.title.trim()) return memo.title.trim()
    return getMemoFirstLine(memo.content)
  }

  function formatMemoTime(isoStr) {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return '今天 ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${d.getMonth() + 1}/${d.getDate()} ` + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function getMemoBoxStyle(memo) {
    if (memo.color === 'amber') return 'memo-box-amber'
    if (memo.color === 'teal') return 'memo-box-teal'
    if (memo.color === 'sky') return 'memo-box-sky'
    return 'memo-box-default'
  }

  async function loadMemos() {
    if (window.electronAPI?.getMemos) {
      try {
        const data = await window.electronAPI.getMemos()
        if (Array.isArray(data)) {
          memos.value = data.map((m, idx) => ({ ...m, order: m.order ?? idx }))
          return
        }
      } catch (e) {}
    }
    const local = localStorage.getItem('dev_task_hub_memos')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed)) {
          memos.value = parsed.map((m, idx) => ({ ...m, order: m.order ?? idx }))
          return
        }
      } catch (e) {}
    }
    memos.value = []
  }

  async function saveMemoToStorage(memo) {
    const clean = JSON.parse(JSON.stringify(memo))
    if (clean.id) {
      const idx = memos.value.findIndex(m => m.id === clean.id)
      if (idx !== -1) memos.value[idx] = { ...memos.value[idx], ...clean }
      else memos.value.unshift(clean)
    } else {
      clean.id = 'memo_' + Date.now()
      clean.order = 0
      // 其他往后挪
      memos.value.forEach(m => { m.order = (m.order ?? 0) + 1 })
      memos.value.unshift(clean)
    }

    if (window.electronAPI?.saveMemo) {
      try {
        await window.electronAPI.saveMemo(clean)
      } catch (e) {}
    }
    localStorage.setItem('dev_task_hub_memos', JSON.stringify(memos.value))
  }

  async function submitNewMemo({ title, text, isPinned, color }) {
    const t = (title || '').trim()
    const c = (text || '').trim()
    if (!t && !c) return
    const match = (t + ' ' + c).match(/#([\u4e00-\u9fa5a-zA-Z0-9_-]+)/)
    const tag = match ? '#' + match[1] : null
    const payload = {
      title: t,
      content: c,
      tag,
      isPinned: Boolean(isPinned),
      color: color || 'obsidian',
      createdAt: new Date().toISOString()
    }
    await saveMemoToStorage(payload)
    emit('toast', '已成功记录一条随手记！', 'success')
  }

  // 编辑随手记弹窗与表单
  const showMemoEditModal = ref(false)
  const memoEditForm = ref({
    id: null,
    title: '',
    content: '',
    tag: '',
    isPinned: false,
    color: 'obsidian'
  })

  function openEditMemo(memo) {
    if (!memo) return
    memoEditForm.value = {
      id: memo.id,
      title: memo.title || '',
      content: memo.content || '',
      tag: memo.tag || '',
      isPinned: Boolean(memo.isPinned),
      color: memo.color || 'obsidian'
    }
    showMemoEditModal.value = true
  }

  async function saveMemoEdit() {
    const form = memoEditForm.value
    if (!form.id) return
    const t = (form.title || '').trim()
    const c = (form.content || '').trim()
    if (!t && !c) {
      emit('toast', '标题或内容不能均为空', 'warning')
      return
    }
    let tag = (form.tag || '').trim()
    if (tag && !tag.startsWith('#')) {
      tag = '#' + tag
    }
    if (!tag) {
      const match = (t + ' ' + c).match(/#([\u4e00-\u9fa5a-zA-Z0-9_-]+)/)
      if (match) tag = '#' + match[1]
    }

    const memo = memos.value.find(m => m.id === form.id)
    if (memo) {
      memo.title = t
      memo.content = c
      memo.tag = tag || null
      memo.isPinned = form.isPinned
      memo.color = form.color
      memo.updatedAt = new Date().toISOString()
      await saveMemoToStorage(memo)
      if (previewModal.value.visible && previewModal.value.memo?.id === memo.id) {
        previewModal.value.memo = { ...memo }
      }
      emit('toast', '随手记已更新！', 'success')
    }
    showMemoEditModal.value = false
  }

  async function togglePinMemo(memo) {
    memo.isPinned = !memo.isPinned
    await saveMemoToStorage(memo)
    emit('toast', memo.isPinned ? '已置顶便签' : '已取消置顶', 'info')
  }

  async function toggleChecklistLine(memo, lineIndex) {
    const lines = memo.content.split('\n')
    if (lines[lineIndex]) {
      if (lines[lineIndex].trim().startsWith('- [ ] ')) {
        lines[lineIndex] = lines[lineIndex].replace('- [ ] ', '- [x] ')
      } else if (lines[lineIndex].trim().startsWith('- [x] ')) {
        lines[lineIndex] = lines[lineIndex].replace('- [x] ', '- [ ] ')
      }
      memo.content = lines.join('\n')
      await saveMemoToStorage(memo)
    }
  }

  async function deleteMemoItem(id) {
    if (window.electronAPI?.deleteMemo) {
      memos.value = await window.electronAPI.deleteMemo(id)
    } else {
      memos.value = memos.value.filter(m => m.id !== id)
      localStorage.setItem('dev_task_hub_memos', JSON.stringify(memos.value))
    }
    emit('toast', '已删除便签', 'info')
  }

  async function changeMemoColor(memo, color) {
    memo.color = color
    await saveMemoToStorage(memo)
    emit('toast', '便签底色已变更', 'info')
  }

  // 随意改动位置（拖拽重排持久化）
  function onMemoDragStart(e, memo, idx) {
    draggedMemoIdx.value = idx
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  function onMemoDragOver(e, idx) {
    dragOverMemoIdx.value = idx
  }

  function onMemoDragLeave(idx) {
    if (dragOverMemoIdx.value === idx) dragOverMemoIdx.value = null
  }

  async function onMemoDrop(e, targetIdx) {
    const fromIdx = draggedMemoIdx.value
    if (fromIdx === null || fromIdx === targetIdx) {
      onMemoDragEnd()
      return
    }

    const currentList = [...filteredMemos.value]
    const [moved] = currentList.splice(fromIdx, 1)
    currentList.splice(targetIdx, 0, moved)

    // 重置每个卡片的 order 属性
    currentList.forEach((m, idx) => { m.order = idx })
    memos.value = currentList

    localStorage.setItem('dev_task_hub_memos', JSON.stringify(memos.value))
    if (window.electronAPI?.saveMemo) {
      for (const m of currentList) {
        try { await window.electronAPI.saveMemo(JSON.parse(JSON.stringify(m))) } catch (e) {}
      }
    }

    onMemoDragEnd()
    emit('toast', '便签位置已更新！', 'success')
  }

  function onMemoDragEnd() {
    draggedMemoIdx.value = null
    dragOverMemoIdx.value = null
  }

  // 双击预览
  function openMemoPreview(memo) {
    previewModal.value = { visible: true, memo }
  }

  function closeMemoPreview() {
    previewModal.value = { visible: false, memo: null }
  }

  // ---------------------------------------------------------------------------
  // 4. 右键上下文菜单状态 (右键删除/操作)
  // ---------------------------------------------------------------------------
  const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    type: 'cmd', // 'cmd' | 'memo'
    target: null
  })

  function openContextMenu(e, type, item) {
    e.preventDefault()
    e.stopPropagation()
    contextMenu.value = {
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 200),
      type,
      target: item
    }
  }

  function closeContextMenu() {
    contextMenu.value.visible = false
  }

  return {
    activeMainTab,
    // Commands
    notes,
    cmdSearchQuery,
    selectedCmdCategory,
    cmdViewMode,
    selectedCommandId,
    showCmdModal,
    editingCmdId,
    cmdForm,
    showTxtImportModal,
    importRawText,
    importTargetCategory,
    customImportCategoryName,
    parsedPreviewList,
    allCategories,
    pinnedCmdCount,
    filteredNotes,
    groupedCommandList,
    activeCommand,
    sameCategoryCommands,
    getCmd,
    getCategoryIcon,
    getTagColor,
    loadNotes,
    loadCategories,
    addCategory,
    deleteCategory,
    copyCommand,
    openAddCmd,
    openEditCmd,
    togglePinCommand,
    saveCommand,
    deleteCommand,
    // Memos
    memos,
    memoSearchQuery,
    selectedMemoTag,
    selectedMemoId,
    draggedMemoIdx,
    dragOverMemoIdx,
    previewModal,
    memoColors,
    commonTagChips,
    pinnedMemosCount,
    memoTagList,
    filteredMemos,
    activeMemo,
    getMemoFirstLine,
    getMemoTitle,
    formatMemoTime,
    getMemoBoxStyle,
    loadMemos,
    submitNewMemo,
    showMemoEditModal,
    memoEditForm,
    openEditMemo,
    saveMemoEdit,
    togglePinMemo,
    toggleChecklistLine,
    deleteMemoItem,
    changeMemoColor,
    onMemoDragStart,
    onMemoDragOver,
    onMemoDragLeave,
    onMemoDrop,
    onMemoDragEnd,
    openMemoPreview,
    closeMemoPreview,
    // Context Menu
    contextMenu,
    openContextMenu,
    closeContextMenu
  }
}
