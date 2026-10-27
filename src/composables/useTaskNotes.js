import { ref, computed } from 'vue'
import { electronApi } from '../api/electronApi'

export function useTaskNotes(currentTask, emitToast, emitUpdated) {
  const taskNotes = ref([])
  const currentNoteContent = ref('')
  const rawNoteContent = ref('')
  const noteSearchQuery = ref('')
  const selectedNoteCategory = ref('all')
  const noteViewMode = ref('cards') // 'cards' | 'raw'
  const isSavingNote = ref(false)
  const noteSavedNotice = ref(false)
  const copiedNoteId = ref(null)

  // 增改表单
  const isAddingNote = ref(false)
  const newNoteForm = ref({ title: '', category: '配置参数', content: '', pinned: false })
  const editingNoteId = ref(null)
  const editingNoteForm = ref({ title: '', category: '配置参数', content: '', pinned: false })

  // 智能参数提取
  const enableSmartParams = ref(localStorage.getItem('devorbit_enable_smart_params') !== 'false')
  const paramViewMode = ref(localStorage.getItem('devorbit_param_view_mode') || 'wrap')
  const isMoreParamsOpen = ref(false)

  function toggleSmartParams(val) {
    enableSmartParams.value = val !== undefined ? val : !enableSmartParams.value
    try {
      localStorage.setItem('devorbit_enable_smart_params', enableSmartParams.value ? 'true' : 'false')
    } catch (e) {}
    if (emitToast) {
      emitToast(enableSmartParams.value ? '已开启智能提取参数栏' : '已关闭智能提取参数栏', enableSmartParams.value ? 'success' : 'info')
    }
  }

  function toggleParamViewMode() {
    paramViewMode.value = paramViewMode.value === 'wrap' ? 'compact' : 'wrap'
    try {
      localStorage.setItem('devorbit_param_view_mode', paramViewMode.value)
    } catch (e) {}
  }

  // 参数正则提取
  function extractParametersFromText(text) {
    if (!text || typeof text !== 'string') return []
    const list = []
    const seenValues = new Set()

    function addParam(label, value, type = 'general') {
      const trimmedVal = (value || '').trim().replace(/^["']|["']$/g, '').replace(/[,;]$/, '')
      if (!trimmedVal || seenValues.has(trimmedVal)) return
      if (/^(true|false|null|undefined|\{|\}|\[\])$/i.test(trimmedVal)) return
      if (trimmedVal.length < 3) return
      seenValues.add(trimmedVal)
      list.push({ label, value: trimmedVal, type })
    }

    const lines = text.split('\n')
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue

      const cleanLine = line.split('#')[0].trim()
      const kvMatch = cleanLine.match(/^([a-zA-Z0-9_\u4e00-\u9fa5-]+)\s*[:=]\s*(.+)$/)
      if (kvMatch) {
        const rawKey = kvMatch[1].trim()
        let rawVal = kvMatch[2].trim()
        let label = rawKey
        let type = 'general'

        const lowerKey = rawKey.toLowerCase()
        if (lowerKey.includes('public-key') || lowerKey.includes('publickey') || lowerKey.includes('公钥')) {
          label = 'SM2公钥'
          type = 'key'
        } else if (lowerKey.includes('private-key') || lowerKey.includes('privatekey') || lowerKey.includes('私钥')) {
          label = 'SM2私钥'
          type = 'key'
        } else if (lowerKey.includes('sm4') || lowerKey.includes('aes') || lowerKey.includes('secret')) {
          label = 'SM4密钥'
          type = 'secret'
        } else if (lowerKey.includes('credit-code') || lowerKey.includes('creditcode') || lowerKey.includes('信用代码')) {
          label = '信用代码'
          type = 'id'
        } else if (lowerKey.includes('token') || lowerKey.includes('auth')) {
          label = '认证Token'
          type = 'token'
        } else if (lowerKey.includes('url') || lowerKey.includes('ip') || lowerKey.includes('host')) {
          label = '服务地址'
          type = 'network'
        } else if (lowerKey.includes('user') || lowerKey.includes('account') || lowerKey.includes('账号')) {
          label = '测试账号'
          type = 'account'
        } else if (lowerKey.includes('pwd') || lowerKey.includes('password') || lowerKey.includes('密码')) {
          label = '密码'
          type = 'secret'
        }

        addParam(label, rawVal, type)
      }
    }

    const ipMatches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g)
    if (ipMatches) {
      for (const ip of ipMatches) {
        addParam('服务IP', ip, 'network')
      }
    }

    const tokenMatches = text.match(/Bearer\s+[A-Za-z0-9._-]+/ig)
    if (tokenMatches) {
      for (const tk of tokenMatches) {
        addParam('Bearer Token', tk, 'token')
      }
    }

    const apiMatches = text.match(/\/(?:api|v1|v2|mz|sys)\/[a-zA-Z0-9_\-/]+/g)
    if (apiMatches) {
      for (const api of apiMatches) {
        addParam('接口Endpoint', api, 'network')
      }
    }

    return list
  }

  const parsedParameters = computed(() => {
    if (!enableSmartParams.value) return []

    let textToParse = ''
    if (noteViewMode.value === 'cards') {
      const texts = taskNotes.value.map(n => {
        if (editingNoteId.value && n.id === editingNoteId.value) {
          return (editingNoteForm.value.title || '') + '\n' + (editingNoteForm.value.content || '')
        }
        return (n.title || '') + '\n' + (n.content || '')
      })
      textToParse = texts.join('\n')
    } else {
      textToParse = rawNoteContent.value || ''
    }

    return extractParametersFromText(textToParse)
  })

  // 备忘卡片筛选与排序
  const filteredTaskNotes = computed(() => {
    let list = taskNotes.value || []
    if (selectedNoteCategory.value !== 'all') {
      list = list.filter(n => (n.category || '配置参数') === selectedNoteCategory.value)
    }
    if (noteSearchQuery.value && noteSearchQuery.value.trim()) {
      const q = noteSearchQuery.value.trim().toLowerCase()
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.category && n.category.toLowerCase().includes(q))
      )
    }
    return list.slice().sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (b.updatedAt || '').localeCompare(a.updatedAt || '')
    })
  })

  // 加载备忘录数据
  async function loadNoteForTask(taskPath) {
    if (!taskPath) {
      taskNotes.value = []
      currentNoteContent.value = ''
      rawNoteContent.value = ''
      return
    }

    try {
      const notes = await electronApi.getTaskNotes(taskPath)
      taskNotes.value = Array.isArray(notes) ? notes : []

      const content = await electronApi.getTaskFile(taskPath, 'note')
      currentNoteContent.value = content || ''
      rawNoteContent.value = content || ''

      if (taskNotes.value.length === 0 && rawNoteContent.value) {
        let mdText = '# 开发备忘与接口联调参数\n\n'
        for (const n of taskNotes.value) {
          mdText += `### [${n.category || '配置参数'}] ${n.title || '无标题'}\n${n.content || ''}\n\n---\n\n`
        }
      }
    } catch (err) {
      console.error('加载任务备忘录失败', err)
      taskNotes.value = []
    }
  }

  // 持久化笔记（同步更新 Markdown 与 JSON）
  async function persistNotes() {
    if (!currentTask.value) return
    isSavingNote.value = true
    try {
      let mdText = ''
      for (const n of taskNotes.value) {
        mdText += `### [${n.category || '配置参数'}] ${n.title || '无标题备忘'}\n`
        if (n.updatedAt) mdText += `> 更新时间: ${n.updatedAt}\n\n`
        mdText += `${n.content || ''}\n\n---\n\n`
      }
      rawNoteContent.value = mdText.trim()
      currentNoteContent.value = rawNoteContent.value

      await electronApi.saveTaskNotes(currentTask.value.fullPath, taskNotes.value)
      noteSavedNotice.value = true
      setTimeout(() => { noteSavedNotice.value = false }, 2000)
    } catch (err) {
      console.error('保存备忘失败', err)
    } finally {
      isSavingNote.value = false
    }
  }

  // 保存源码模式下的原始 Markdown
  async function saveRawNote() {
    if (!currentTask.value) return
    isSavingNote.value = true
    try {
      await electronApi.saveTaskFile(currentTask.value.fullPath, 'note', rawNoteContent.value)
      await loadNoteForTask(currentTask.value.fullPath)
      noteSavedNotice.value = true
      if (emitUpdated) emitUpdated()
      setTimeout(() => { noteSavedNotice.value = false }, 2000)
      if (emitToast) emitToast('源码笔记已保存并同步至卡片！', 'success')
    } catch (err) {
      if (emitToast) emitToast('保存失败: ' + err.message, 'error')
    } finally {
      isSavingNote.value = false
    }
  }

  // 自动将当前正在编辑的笔记或源码写入磁盘（换任务或关程序前自动刷盘）
  async function autoFlushCurrentTaskEdits() {
    if (editingNoteId.value) {
      const idx = taskNotes.value.findIndex(n => n.id === editingNoteId.value)
      if (idx !== -1) {
        taskNotes.value[idx] = {
          ...taskNotes.value[idx],
          ...editingNoteForm.value,
          updatedAt: new Date().toLocaleString()
        }
        await persistNotes()
      }
      editingNoteId.value = null
    }

    if (noteViewMode.value === 'raw' && rawNoteContent.value !== currentNoteContent.value) {
      await saveRawNote()
    }
  }

  // 卡片操作逻辑
  function startAddNote() {
    newNoteForm.value = { title: '', category: '配置参数', content: '', pinned: false }
    isAddingNote.value = true
  }

  async function saveNewNote() {
    if (!newNoteForm.value.title && !newNoteForm.value.content) {
      isAddingNote.value = false
      return
    }
    const note = {
      id: Date.now().toString(),
      title: newNoteForm.value.title.trim() || '无标题备忘',
      category: newNoteForm.value.category || '配置参数',
      content: newNoteForm.value.content.trim(),
      pinned: !!newNoteForm.value.pinned,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    }
    taskNotes.value.unshift(note)
    isAddingNote.value = false
    await persistNotes()
    if (emitToast) emitToast('已新建备忘卡片', 'success')
  }

  function startEditNote(note) {
    editingNoteId.value = note.id
    editingNoteForm.value = {
      title: note.title,
      category: note.category || '配置参数',
      content: note.content,
      pinned: !!note.pinned
    }
  }

  async function saveEditNote() {
    const idx = taskNotes.value.findIndex(n => n.id === editingNoteId.value)
    if (idx !== -1) {
      taskNotes.value[idx] = {
        ...taskNotes.value[idx],
        ...editingNoteForm.value,
        updatedAt: new Date().toLocaleString()
      }
      await persistNotes()
      if (emitToast) emitToast('备忘卡片已更新', 'success')
    }
    editingNoteId.value = null
  }

  async function deleteNote(noteId) {
    const idx = taskNotes.value.findIndex(n => n.id === noteId)
    if (idx !== -1) {
      const removed = taskNotes.value.splice(idx, 1)[0]
      await persistNotes()
      if (emitToast) emitToast(`已删除备忘 [${removed.title}]`, 'info')
    }
  }

  async function togglePinNote(note) {
    note.pinned = !note.pinned
    note.updatedAt = new Date().toLocaleString()
    await persistNotes()
  }

  async function copyParamText(text, label = '') {
    if (!text) return
    try {
      await electronApi.copyToClipboard(text)
      if (emitToast) emitToast(`已复制 ${label || '参数'}: ${text.length > 20 ? text.slice(0, 20) + '...' : text}`, 'success')
    } catch (e) {
      if (emitToast) emitToast('复制失败: ' + e.message, 'error')
    }
  }

  async function copyAllParamsAsYaml() {
    if (!parsedParameters.value || parsedParameters.value.length === 0) return
    let text = ''
    for (const p of parsedParameters.value) {
      text += `${p.label}: "${p.value}"\n`
    }
    try {
      await electronApi.copyToClipboard(text.trim())
      if (emitToast) emitToast(`已复制全部 ${parsedParameters.value.length} 个参数为 YAML 格式！`, 'success')
    } catch (e) {
      if (emitToast) emitToast('复制失败: ' + e.message, 'error')
    }
  }

  return {
    taskNotes,
    filteredTaskNotes,
    currentNoteContent,
    rawNoteContent,
    noteSearchQuery,
    selectedNoteCategory,
    noteViewMode,
    isSavingNote,
    noteSavedNotice,
    copiedNoteId,
    isAddingNote,
    newNoteForm,
    editingNoteId,
    editingNoteForm,
    enableSmartParams,
    paramViewMode,
    isMoreParamsOpen,
    parsedParameters,
    toggleSmartParams,
    toggleParamViewMode,
    loadNoteForTask,
    persistNotes,
    saveRawNote,
    autoFlushCurrentTaskEdits,
    startAddNote,
    saveNewNote,
    startEditNote,
    saveEditNote,
    deleteNote,
    togglePinNote,
    copyParamText,
    copyAllParamsAsYaml
  }
}
