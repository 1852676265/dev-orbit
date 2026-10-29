import { ref, computed } from 'vue'
import { electronApi } from '@/utils/api'
import { syncCuratedAssetsWithWord } from '@/utils/wordParser'

export const BUILTIN_CATEGORIES = ['服务器账号', 'Web网站', 'iNode']

export function normalizeItemCategory(item) {
  if (item?.category) return item.category
  const t = item?.type || 'server'
  if (t === 'web') return 'Web网站'
  if (t === 'network') return 'iNode'
  return '服务器账号'
}

export function getCategoryIconLabel(cat) {
  if (cat === '服务器账号') return '🖥️ 服务器账号'
  if (cat === 'Web网站') return '🌐 Web网站'
  if (cat === 'iNode') return '📶 iNode'
  return `🏷️ ${cat}`
}

export function useServerCredentials(emit) {
  // 视图双态切换: 'daily' (平时看的极简日常账本) | 'excerpt' (去 Word 文档摘录工作台)
  const viewMode = ref('daily')

  const assetList = ref([])
  const categories = ref([...BUILTIN_CATEGORIES])
  const selectedCategory = ref('all')
  const selectedEnv = ref('全部环境')
  const searchQuery = ref('')

  const globalRootPassword = ref('')
  const isGlobalPasswordVisible = ref(false)
  const isEditingGlobalPassword = ref(false)
  const editingGlobalPasswordValue = ref('')

  const currentDocPath = ref('')
  const docMeta = ref({ fileName: '', mtime: '' })
  const wordDocData = ref({ docBlocks: [], rawParagraphs: [], rawTables: [] })

  const isLoading = ref(false)
  const isUpdatingSvn = ref(false)
  const visiblePasswordIds = ref(new Set())

  const availableEnvs = ['全部环境', '生产环境', '测试环境', '开发环境', '常规环境']

  // 统计各分类下的精选凭据数量
  const categoryCounts = computed(() => {
    const counts = { all: assetList.value.length }
    for (const c of categories.value) {
      counts[c] = 0
    }
    for (const item of assetList.value) {
      const cat = normalizeItemCategory(item)
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  })

  // 日常账本过滤后的列表
  const filteredAssets = computed(() => {
    return assetList.value.filter(item => {
      const cat = normalizeItemCategory(item)
      if (selectedCategory.value !== 'all' && cat !== selectedCategory.value) {
        return false
      }

      if (selectedEnv.value !== '全部环境' && selectedEnv.value !== 'all') {
        const itemEnv = (item.env || '常规环境').trim()
        if (!itemEnv.includes(selectedEnv.value.replace('环境', ''))) {
          return false
        }
      }

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase()
        const matchName = (item.name || '').toLowerCase().includes(q)
        const matchTarget = (item.target || item.ip || '').toLowerCase().includes(q)
        const matchUser = (item.username || '').toLowerCase().includes(q)
        const matchRemark = (item.remark || '').toLowerCase().includes(q)
        const matchCat = cat.toLowerCase().includes(q)
        if (!matchName && !matchTarget && !matchUser && !matchRemark && !matchCat) {
          return false
        }
      }
      return true
    })
  })

  // 保存全局元数据 (Root 密码、Word 路径、自定义分类列表)
  async function persistMeta() {
    await electronApi.saveCredentialsMeta({
      globalRootPassword: globalRootPassword.value,
      svnWordPath: currentDocPath.value,
      categories: categories.value
    })
  }

  // 保存精选日常账本列表
  async function saveAssets(newList) {
    const normalized = (Array.isArray(newList) ? newList : []).map(item => ({
      ...item,
      category: normalizeItemCategory(item)
    }))
    assetList.value = normalized
    try {
      await electronApi.saveServerCredentials(normalized)
    } catch (e) {
      console.error('[Credentials] 保存精选账本失败:', e)
    }
  }

  // 仅解析 Word 原档结构，并基于已存条目的动态锚点 (anchorKey) 自动同步最新标蓝/行尾密码
  async function loadWordStructureOnly(showSuccessToast = false) {
    if (!currentDocPath.value) return false
    isLoading.value = true
    try {
      const res = await electronApi.parseWordCredentials(currentDocPath.value)
      if (res && res.success) {
        wordDocData.value = {
          docBlocks: res.docBlocks || [],
          rawParagraphs: res.rawParagraphs || [],
          rawTables: res.rawTables || []
        }
        docMeta.value = {
          fileName: res.fileName || currentDocPath.value.split(/[\\/]/).pop(),
          mtime: res.mtime || ''
        }

        // 🔗 自动对比已摘录账本的锚点，若有标蓝新密码或改密则无感同步更新
        if (assetList.value.length > 0 || globalRootPassword.value) {
          const syncRes = syncCuratedAssetsWithWord(
            assetList.value,
            wordDocData.value,
            globalRootPassword.value
          )
          if (syncRes.newGlobalRootPwd && syncRes.newGlobalRootPwd !== globalRootPassword.value) {
            globalRootPassword.value = syncRes.newGlobalRootPwd
            await persistMeta()
          }
          if (syncRes.updatedCount > 0) {
            await saveAssets(syncRes.updatedList)
            emit?.(
              'toast',
              `🔄 检测到 Word 原档密码更新（含🔵标蓝密码），已自动为您同步 ${syncRes.updatedCount} 项凭据，无需二次摘录！`,
              'success'
            )
            return true
          }
        }

        if (showSuccessToast) {
          emit?.(
            'toast',
            `已同步读取 Word 原档（${wordDocData.value.rawParagraphs.length} 处段落 + ${wordDocData.value.rawTables.length} 张表格），所有已绑锚点密码均为最新`,
            'success'
          )
        }
        return true
      } else {
        if (showSuccessToast) {
          emit?.('toast', res?.message || '读取 Word 文档失败', 'error')
        }
        return false
      }
    } catch (e) {
      console.error('[Credentials] 解析 Word 结构异常:', e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 初始化加载
  async function loadData() {
    isLoading.value = true
    try {
      const meta = await electronApi.getCredentialsMeta()
      globalRootPassword.value = meta.globalRootPassword || ''
      currentDocPath.value = meta.svnWordPath || ''

      if (Array.isArray(meta.categories) && meta.categories.length > 0) {
        const mergedCats = [...BUILTIN_CATEGORIES]
        for (const c of meta.categories) {
          if (c && !mergedCats.includes(c)) mergedCats.push(c)
        }
        categories.value = mergedCats
      }

      const list = await electronApi.getServerCredentials()
      if (Array.isArray(list)) {
        // 清理之前旧版自动全量导入的 34 条脏数据（id 为 asset_1..asset_34 或名称为麒麟鲲鹏），保证账本只留用户手动摘录项
        const cleanList = list
          .filter(item => item && item.name !== '麒麟鲲鹏 V10' && !/^asset_\d+$/.test(String(item.id)))
          .map(item => ({
            ...item,
            category: normalizeItemCategory(item)
          }))
        assetList.value = cleanList
        if (cleanList.length !== list.length) {
          await saveAssets(cleanList)
        }
      } else {
        assetList.value = []
      }

      // 若已关联 Word 文档，静默加载其原档结构备查，但不塞入 assetList
      if (currentDocPath.value) {
        await loadWordStructureOnly(false)
      }
    } catch (err) {
      console.error('[Credentials] 加载失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 新建自定义分类
  async function addCategory(rawName) {
    const name = (rawName || '').trim()
    if (!name) return false
    if (categories.value.includes(name)) {
      emit?.('toast', `分类「${name}」已存在`, 'warning')
      return false
    }
    categories.value.push(name)
    await persistMeta()
    emit?.('toast', `已创建分类「${name}」`, 'success')
    return true
  }

  // 删除自定义分类
  async function deleteCategory(catName) {
    if (BUILTIN_CATEGORIES.includes(catName)) {
      emit?.('toast', '系统内置分类不可删除', 'warning')
      return
    }
    categories.value = categories.value.filter(c => c !== catName)
    if (selectedCategory.value === catName) {
      selectedCategory.value = 'all'
    }
    await persistMeta()
    emit?.('toast', `已移除自定义分类「${catName}」`, 'info')
  }

  // 保存全局通用 Root 密码
  async function saveGlobalPassword(newPwd) {
    globalRootPassword.value = (newPwd || '').trim()
    isEditingGlobalPassword.value = false
    try {
      await persistMeta()
      emit?.('toast', '已更新全局通用 Root 口令', 'success')
    } catch (e) {
      emit?.('toast', '保存通用口令失败', 'error')
    }
  }

  function startEditGlobalPassword() {
    editingGlobalPasswordValue.value = globalRootPassword.value
    isEditingGlobalPassword.value = true
  }

  // 选择并绑定 Word 文件，随后直接打开「去 Word 文档摘录」工作台
  async function selectWordFile(enterExcerptAfter = true) {
    try {
      const selected = await electronApi.selectSvnWordFile()
      if (selected) {
        currentDocPath.value = selected
        await persistMeta()
        const ok = await loadWordStructureOnly(true)
        if (ok && enterExcerptAfter) {
          viewMode.value = 'excerpt'
        }
      }
    } catch (e) {
      emit?.('toast', '选择文件失败: ' + e.message, 'error')
    }
  }

  // 打开「去 Word 文档摘录」工作台
  async function openExcerptWorkbench() {
    if (!currentDocPath.value) {
      await selectWordFile(true)
      return
    }
    if (
      !wordDocData.value.docBlocks ||
      wordDocData.value.docBlocks.length === 0
    ) {
      await loadWordStructureOnly(true)
    }
    viewMode.value = 'excerpt'
  }

  // SVN 更新文档原件
  async function handleSvnUpdate() {
    if (!currentDocPath.value) return
    isUpdatingSvn.value = true
    try {
      const res = await electronApi.updateSvnDoc(currentDocPath.value)
      await loadWordStructureOnly(false)
      if (res && res.success) {
        emit?.('toast', 'SVN Update 成功，摘录台已同步最新原档！', 'success')
      } else {
        emit?.('toast', res?.message || '已重新读取本地 Word 原档', 'info')
      }
    } catch (e) {
      emit?.('toast', 'SVN Update 失败: ' + e.message, 'error')
    } finally {
      isUpdatingSvn.value = false
    }
  }

  function openInNativeWord() {
    if (currentDocPath.value) {
      electronApi.openSvnWordFile(currentDocPath.value)
      emit?.('toast', '正在拉起系统 Word / WPS 打开原件...', 'info')
    }
  }

  // 新增或更新单条日常账本记录
  async function upsertAsset(item) {
    const category = normalizeItemCategory(item)
    if (category && !categories.value.includes(category)) {
      categories.value.push(category)
      await persistMeta()
    }

    const list = [...assetList.value]
    const cleanItem = {
      ...item,
      category,
      useDefaultPassword:
        category === '服务器账号' && item.useDefaultPassword && !item.password
    }

    if (cleanItem.id) {
      const idx = list.findIndex(a => a.id === cleanItem.id)
      if (idx !== -1) list[idx] = { ...list[idx], ...cleanItem }
      else list.unshift(cleanItem)
    } else {
      list.unshift({
        ...cleanItem,
        id: 'asset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      })
    }
    await saveAssets(list)
    emit?.('toast', `已存入「${category}」账本`, 'success')
  }

  async function deleteAsset(id) {
    const nextList = assetList.value.filter(a => a.id !== id)
    await saveAssets(nextList)
    emit?.('toast', '已从日常账本中移除', 'success')
  }

  async function clearAllAssets() {
    await saveAssets([])
    emit?.('toast', '已清空日常账本，可前往 Word 摘录台重新精选', 'info')
  }

  function isPasswordVisible(id) {
    return visiblePasswordIds.value.has(id)
  }

  function toggleSinglePassword(id) {
    const next = new Set(visiblePasswordIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    visiblePasswordIds.value = next
  }

  async function copyText(text, label) {
    if (!text) {
      emit?.('toast', `${label}为空`, 'warning')
      return
    }
    await electronApi.copyToClipboard(text)
    emit?.('toast', `已复制 ${label}: ${text}`, 'success')
  }

  function copyPassword(asset) {
    const isInherit = asset.useDefaultPassword || (normalizeItemCategory(asset) === '服务器账号' && !asset.password)
    const pwd = isInherit ? globalRootPassword.value : asset.password
    copyText(pwd, isInherit ? '全局通用 Root 密码' : `${asset.name} 密码`)
  }

  function copyTarget(asset) {
    copyText(asset.target || asset.ip, '地址')
  }

  function copySshCommand(asset) {
    const target = asset.target || asset.ip || ''
    const port = asset.port || '22'
    const user = asset.username || 'root'
    copyText(`ssh ${user}@${target} -p ${port}`, 'SSH 命令')
  }

  function openTargetUrl(url) {
    if (!url) return
    electronApi.openExternalUrl(url)
    emit?.('toast', `已在默认浏览器打开: ${url}`, 'info')
  }

  return {
    viewMode,
    assetList,
    categories,
    selectedCategory,
    selectedEnv,
    searchQuery,
    globalRootPassword,
    isGlobalPasswordVisible,
    isEditingGlobalPassword,
    editingGlobalPasswordValue,
    currentDocPath,
    docMeta,
    wordDocData,
    isLoading,
    isUpdatingSvn,
    availableEnvs,
    categoryCounts,
    filteredAssets,
    loadData,
    saveAssets,
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
    clearAllAssets,
    isPasswordVisible,
    toggleSinglePassword,
    copyText,
    copyPassword,
    copyTarget,
    copySshCommand,
    openTargetUrl
  }
}
