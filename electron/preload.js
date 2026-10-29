const { contextBridge, ipcRenderer } = require('electron')

function safeClone(data) {
  if (data === undefined || data === null) return data
  if (typeof data !== 'object') return data
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (e) {
    return data
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  // 工作区与配置
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  selectWorkspaceDir: () => ipcRenderer.invoke('select-workspace-dir'),
  setWorkspacePath: (path) => ipcRenderer.invoke('set-workspace-path', path),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  saveAppConfig: (config) => ipcRenderer.invoke('save-app-config', safeClone(config)),
  selectFileDialog: (options) => ipcRenderer.invoke('select-file-dialog', safeClone(options)),
  selectBackgroundImage: () => ipcRenderer.invoke('select-background-image'),
  openConfigFolder: () => ipcRenderer.invoke('open-config-folder'),
  testLaunchIDE: () => ipcRenderer.invoke('test-launch-ide'),
  testLaunchTerminal: () => ipcRenderer.invoke('test-launch-terminal'),

  // 任务管理
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  createTask: (taskData) => ipcRenderer.invoke('create-task', safeClone(taskData)),
  updateTask: (taskDir, updates) => ipcRenderer.invoke('update-task', taskDir, safeClone(updates)),
  deleteTask: (taskDir) => ipcRenderer.invoke('delete-task', taskDir),

  // 系统联动
  openInExplorer: (targetPath) => ipcRenderer.invoke('open-in-explorer', targetPath),
  showItemInFolder: (targetPath) => ipcRenderer.invoke('show-item-in-folder', targetPath),
  openInIDE: (targetPath) => ipcRenderer.invoke('open-in-ide', targetPath),
  openInTerminal: (targetPath) => ipcRenderer.invoke('open-in-terminal', targetPath),

  // SQL 管理
  getTaskSqls: (taskDir) => ipcRenderer.invoke('get-task-sqls', taskDir),
  readSqlContent: (filePath) => ipcRenderer.invoke('read-sql-content', filePath),
  saveSqlContent: (filePath, content) => ipcRenderer.invoke('save-sql-content', filePath, content),
  updateSqlStatus: (taskDir, fileName, env, status, timestamp) => 
    ipcRenderer.invoke('update-sql-status', taskDir, fileName, env, status, timestamp),

  // 通用文件管理 (支持需求、笔记、SQL等多文件读写)
  getDirFiles: (dirPath) => ipcRenderer.invoke('get-dir-files', dirPath),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  saveTextFile: (filePath, content) => ipcRenderer.invoke('save-text-file', filePath, content),
  createTextFile: (dirPath, fileName, defaultContent) => ipcRenderer.invoke('create-text-file', dirPath, fileName, defaultContent),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  copyFilesToDir: (sourcePaths, targetDir) => ipcRenderer.invoke('copy-files-to-dir', sourcePaths, targetDir),
  searchTaskFiles: (taskDir, query) => ipcRenderer.invoke('search-task-files', taskDir, query),

  // 任务文档与笔记 (需求.md / 笔记.md)
  getTaskFile: (taskDir, type) => ipcRenderer.invoke('get-task-file', taskDir, type),
  saveTaskFile: (taskDir, type, content) => ipcRenderer.invoke('save-task-file', taskDir, type, content),
  getTaskNotes: (taskDir) => ipcRenderer.invoke('get-task-notes', taskDir),
  saveTaskNotes: (taskDir, notes) => ipcRenderer.invoke('save-task-notes', taskDir, safeClone(notes)),
  getTaskDoc: (taskDir) => ipcRenderer.invoke('get-task-doc', taskDir),
  saveTaskDoc: (taskDir, content) => ipcRenderer.invoke('save-task-doc', taskDir, content),

  // 随手记 / 常用命令库
  getQuickNotes: () => ipcRenderer.invoke('get-quick-notes'),
  saveQuickNote: (note) => ipcRenderer.invoke('save-quick-note', safeClone(note)),
  saveQuickNotesBatch: (notes) => ipcRenderer.invoke('save-quick-notes-batch', safeClone(notes)),
  deleteQuickNote: (id) => ipcRenderer.invoke('delete-quick-note', id),
  getQuickNoteCategories: () => ipcRenderer.invoke('get-quick-note-categories'),
  saveQuickNoteCategories: (categories) => ipcRenderer.invoke('save-quick-note-categories', safeClone(categories)),

  // 极速随手记 / 备忘录独立存储
  getMemos: () => ipcRenderer.invoke('get-memos'),
  saveMemo: (memo) => ipcRenderer.invoke('save-memo', safeClone(memo)),
  deleteMemo: (id) => ipcRenderer.invoke('delete-memo', id),

  // 智能全文搜索 & 行定位
  searchKeyword: (query) => ipcRenderer.invoke('search-keyword', query),
  readFileLines: (filePath) => ipcRenderer.invoke('read-file-lines', filePath),
  readFileDataUrl: (filePath) => ipcRenderer.invoke('read-file-data-url', filePath),

  // 剪贴板
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),

  // GitHub 在线版本检测与更新中心 (DBX 同款无感热更新)
  checkGitHubUpdate: (repo, token) => ipcRenderer.invoke('check-github-update', repo, token),
  downloadUpdate: (payload) => ipcRenderer.invoke('download-update', safeClone(payload)),
  applyUpdateAndRestart: () => ipcRenderer.invoke('apply-update-and-restart'),
  onUpdateDownloadProgress: (callback) => {
    const handler = (e, data) => callback(data)
    ipcRenderer.on('update-download-progress', handler)
    return () => ipcRenderer.removeListener('update-download-progress', handler)
  },
  detectGitHubCliAuth: () => ipcRenderer.invoke('detect-github-cli-auth'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),

  // SVN Word 服务器账号与多维凭据资产
  getSvnDocConfig: () => ipcRenderer.invoke('get-svn-doc-config'),
  saveSvnDocPath: (docPath) => ipcRenderer.invoke('save-svn-doc-path', docPath),
  selectSvnWordFile: () => ipcRenderer.invoke('select-svn-word-file'),
  updateSvnDoc: (targetFile) => ipcRenderer.invoke('update-svn-doc', targetFile),
  parseWordCredentials: (filePath) => ipcRenderer.invoke('parse-word-credentials', filePath),
  openSvnWordFile: (filePath) => ipcRenderer.invoke('open-svn-word-file', filePath),
  openSvnWordDir: (filePath) => ipcRenderer.invoke('open-svn-word-dir', filePath),
  getServerCredentials: () => ipcRenderer.invoke('get-server-credentials'),
  saveServerCredentials: (list) => ipcRenderer.invoke('save-server-credentials', safeClone(list)),
  getCredentialsMeta: () => ipcRenderer.invoke('get-credentials-meta'),
  saveCredentialsMeta: (meta) => ipcRenderer.invoke('save-credentials-meta', safeClone(meta))
})
