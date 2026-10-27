/**
 * 【逻辑层】底层 Electron 原生 IPC 通信封装
 */

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

  // 目录与文档
  getDirFiles: async (dirPath) => {
    if (!window.electronAPI) return []
    return await window.electronAPI.getDirFiles(dirPath) || []
  },

  // 系统级调用
  openInExplorer: async (targetPath) => {
    if (!window.electronAPI) return false
    return await window.electronAPI.openInExplorer(targetPath)
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
  }
}
