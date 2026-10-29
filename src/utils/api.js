/**
 * 【逻辑层】底层 Electron 原生 IPC 通信封装
 */
import { parseDocxXmlStructure, parseDocxFromDataUrl } from '@/utils/wordParser'

const DEFAULT_CATEGORIES = ['服务器账号', 'Web网站', 'iNode']

async function getFallbackNotesFilePath(fileName) {
  if (!window.electronAPI?.getWorkspacePath) return ''
  const ws = await window.electronAPI.getWorkspacePath()
  if (!ws) return ''
  return `${ws.replace(/[\\/]$/, '')}/_quick_notes/${fileName}`
}

export const electronApi = {
  // 任务管理
  getTasks: async (refresh = false) => {
    if (!window.electronAPI) return []
    return await window.electronAPI.getTasks(refresh) || []
  },
  createTask: async (payload) => {
    if (!window.electronAPI) return null
    return await window.electronAPI.createTask(payload)
  },
  updateTask: async (taskDir, updates) => {
    if (!window.electronAPI) return null
    return await window.electronAPI.updateTask(taskDir, updates)
  },
  deleteTask: async (taskDir) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.deleteTask(taskDir)
  },

  // 备忘与文件
  getTaskNotes: async (taskDir) => {
    if (!window.electronAPI) return []
    return await window.electronAPI.getTaskNotes(taskDir) || []
  },
  saveTaskNotes: async (taskDir, notes) => {
    if (!window.electronAPI) return false
    const plainNotes = JSON.parse(JSON.stringify(notes))
    return await window.electronAPI.saveTaskNotes(taskDir, plainNotes)
  },
  getTaskFile: async (taskDir, type) => {
    if (!window.electronAPI) return ''
    return await window.electronAPI.getTaskFile(taskDir, type) || ''
  },
  saveTaskFile: async (taskDir, type, content) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.saveTaskFile(taskDir, type, content)
  },
  saveTextFile: async (filePath, content) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.saveTextFile(filePath, content)
  },
  createTextFile: async (dirPath, fileName, defaultContent = '') => {
    if (!window.electronAPI) return null
    return await window.electronAPI.createTextFile(dirPath, fileName, defaultContent)
  },
  deleteFile: async (filePath) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.deleteFile(filePath)
  },

  // SQL 相关
  getSqlFiles: async (taskDir) => {
    if (!window.electronAPI) return []
    if (typeof window.electronAPI.getTaskSqls === 'function') {
      return await window.electronAPI.getTaskSqls(taskDir) || []
    }
    return []
  },
  setSqlReleaseStatus: async (taskDir, fileName, env, isReleased, timestamp = null) => {
    if (!window.electronAPI) return null
    if (typeof window.electronAPI.updateSqlStatus === 'function') {
      const statusStr = isReleased ? 'published' : 'pending'
      return await window.electronAPI.updateSqlStatus(taskDir, fileName, env, statusStr, timestamp)
    }
    return null
  },
  mergeSqlFiles: async (taskDir, options) => {
    if (!window.electronAPI) return null
    return await window.electronAPI.mergeSqlFiles(taskDir, options)
  },
  readSqlContent: async (filePath) => {
    if (window.electronAPI && window.electronAPI.readSqlContent) {
      return await window.electronAPI.readSqlContent(filePath)
    }
    return ''
  },
  saveSqlContent: async (filePath, content) => {
    if (window.electronAPI && window.electronAPI.saveSqlContent) {
      return await window.electronAPI.saveSqlContent(filePath, content)
    }
    return false
  },

  // 目录与文档
  getDirFiles: async (dirPath) => {
    if (!window.electronAPI) return []
    return await window.electronAPI.getDirFiles(dirPath) || []
  },
  searchKeyword: async (query) => {
    if (!window.electronAPI?.searchKeyword) return []
    return await window.electronAPI.searchKeyword(query) || []
  },
  readFileLines: async (filePath) => {
    if (!window.electronAPI?.readFileLines) return { fileName: '', lines: [] }
    return await window.electronAPI.readFileLines(filePath) || { fileName: '', lines: [] }
  },

  // 系统级调用
  openInExplorer: async (targetPath) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.openInExplorer(targetPath)
  },
  openInIDE: async (targetPath) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.openInIDE(targetPath)
  },
  showItemInFolder: async (targetPath) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.showItemInFolder(targetPath)
  },
  copyToClipboard: async (text) => {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      return await window.electronAPI.copyToClipboard(text)
    }
    return await navigator.clipboard.writeText(text)
  },
  openExternalUrl: async (url) => {
    if (window.electronAPI && window.electronAPI.openExternalUrl) {
      return await window.electronAPI.openExternalUrl(url)
    }
    window.open(url, '_blank')
  },

  // 多维服务器与资产凭据 (日常极简账本 + Word交互摘录台)
  getServerCredentials: async () => {
    if (window.electronAPI?.getServerCredentials) {
      return (await window.electronAPI.getServerCredentials()) || []
    }
    const fp = await getFallbackNotesFilePath('server_credentials.json')
    if (fp && window.electronAPI?.readTextFile) {
      const raw = await window.electronAPI.readTextFile(fp)
      if (raw) {
        try { return JSON.parse(raw) || [] } catch (e) { return [] }
      }
    }
    return []
  },
  saveServerCredentials: async (list) => {
    const clean = JSON.parse(JSON.stringify(Array.isArray(list) ? list : []))
    if (window.electronAPI?.saveServerCredentials) {
      return (await window.electronAPI.saveServerCredentials(clean)) || []
    }
    const fp = await getFallbackNotesFilePath('server_credentials.json')
    if (fp && window.electronAPI?.saveTextFile) {
      await window.electronAPI.saveTextFile(fp, JSON.stringify(clean, null, 2))
    }
    return clean
  },
  getCredentialsMeta: async () => {
    let meta = { globalRootPassword: '', svnWordPath: '', categories: [...DEFAULT_CATEGORIES] }
    if (window.electronAPI?.getCredentialsMeta) {
      const res = await window.electronAPI.getCredentialsMeta()
      if (res) meta = { ...meta, ...res }
    } else {
      const fp = await getFallbackNotesFilePath('credentials_meta.json')
      if (fp && window.electronAPI?.readTextFile) {
        const raw = await window.electronAPI.readTextFile(fp)
        if (raw) {
          try { meta = { ...meta, ...JSON.parse(raw) } } catch (e) {}
        }
      }
      if (!meta.svnWordPath && window.electronAPI?.getSvnDocConfig) {
        const svnCfg = await window.electronAPI.getSvnDocConfig()
        if (svnCfg?.svnWordPath) meta.svnWordPath = svnCfg.svnWordPath
      }
    }
    if (!Array.isArray(meta.categories) || meta.categories.length === 0) {
      meta.categories = [...DEFAULT_CATEGORIES]
    }
    return meta
  },
  saveCredentialsMeta: async (metaUpdates) => {
    const plainUpdates = JSON.parse(JSON.stringify(metaUpdates || {}))
    if (window.electronAPI?.saveCredentialsMeta) {
      return (await window.electronAPI.saveCredentialsMeta(plainUpdates)) || plainUpdates
    }
    const current = await electronApi.getCredentialsMeta()
    const merged = { ...current, ...plainUpdates }
    const fp = await getFallbackNotesFilePath('credentials_meta.json')
    if (fp && window.electronAPI?.saveTextFile) {
      await window.electronAPI.saveTextFile(fp, JSON.stringify(merged, null, 2))
    }
    if (plainUpdates.svnWordPath !== undefined && window.electronAPI?.saveSvnDocPath) {
      await window.electronAPI.saveSvnDocPath(plainUpdates.svnWordPath)
    }
    return merged
  },
  selectSvnWordFile: async () => {
    if (!window.electronAPI?.selectSvnWordFile) return null
    return await window.electronAPI.selectSvnWordFile()
  },
  parseWordCredentials: async (filePath) => {
    if (!window.electronAPI?.parseWordCredentials) return null
    const res = await window.electronAPI.parseWordCredentials(filePath)
    if (!res || !res.success) return res

    // 1. 若主进程直接返回了 rawXml，则使用统一解析器提取原位文档流 docBlocks
    if (res.rawXml) {
      const structured = parseDocxXmlStructure(res.rawXml)
      return {
        ...res,
        docBlocks: structured.docBlocks,
        rawParagraphs: structured.rawParagraphs,
        rawTables: structured.rawTables,
        assets: structured.assets
      }
    }

    // 2. 若热更新期间主进程尚未返回 rawXml，通过 readFileDataUrl 在渲染端解压提取
    const targetFile = res.filePath || filePath
    if (targetFile && /\.docx$/i.test(targetFile) && window.electronAPI?.readFileDataUrl) {
      try {
        const dataUrl = await window.electronAPI.readFileDataUrl(targetFile)
        const structured = await parseDocxFromDataUrl(dataUrl)
        if (structured) {
          return {
            ...res,
            docBlocks: structured.docBlocks,
            rawParagraphs: structured.rawParagraphs,
            rawTables: structured.rawTables,
            assets: structured.assets
          }
        }
      } catch (err) {
        console.error('[Credentials] Fallback docx structure parse failed:', err)
      }
    }

    return {
      ...res,
      docBlocks: res.docBlocks || [],
      rawParagraphs: res.rawParagraphs || [],
      rawTables: res.rawTables || []
    }
  },
  updateSvnDoc: async (filePath) => {
    if (!window.electronAPI?.updateSvnDoc) return { success: false }
    return await window.electronAPI.updateSvnDoc(filePath)
  },
  openSvnWordFile: async (filePath) => {
    if (!window.electronAPI?.openSvnWordFile) return false
    return await window.electronAPI.openSvnWordFile(filePath)
  }
}

export const api = electronApi
export default electronApi

