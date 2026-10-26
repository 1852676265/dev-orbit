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
  getTaskDoc: (taskDir) => ipcRenderer.invoke('get-task-doc', taskDir),
  saveTaskDoc: (taskDir, content) => ipcRenderer.invoke('save-task-doc', taskDir, content),

  // 随手记 / 常用命令库
  getQuickNotes: () => ipcRenderer.invoke('get-quick-notes'),
  saveQuickNote: (note) => ipcRenderer.invoke('save-quick-note', safeClone(note)),
  saveQuickNotesBatch: (notes) => ipcRenderer.invoke('save-quick-notes-batch', safeClone(notes)),
  deleteQuickNote: (id) => ipcRenderer.invoke('delete-quick-note', id),
  getQuickNoteCategories: () => ipcRenderer.invoke('get-quick-note-categories'),
  saveQuickNoteCategories: (categories) => ipcRenderer.invoke('save-quick-note-categories', safeClone(categories)),

  // 智能全文搜索 & 行定位
  searchKeyword: (query) => ipcRenderer.invoke('search-keyword', query),
  readFileLines: (filePath) => ipcRenderer.invoke('read-file-lines', filePath),

  // 剪贴板
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),

  // GitHub 在线版本检测与更新
  checkGitHubUpdate: (repo) => ipcRenderer.invoke('check-github-update', repo),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  // SVN Word 服务器账号与凭据速查
  getSvnDocConfig: () => ipcRenderer.invoke('get-svn-doc-config'),
  saveSvnDocPath: (docPath) => ipcRenderer.invoke('save-svn-doc-path', docPath),
  selectSvnWordFile: () => ipcRenderer.invoke('select-svn-word-file'),
  updateSvnDoc: (targetFile) => ipcRenderer.invoke('update-svn-doc', targetFile),
  parseWordCredentials: (filePath) => ipcRenderer.invoke('parse-word-credentials', filePath),
  openSvnWordFile: (filePath) => ipcRenderer.invoke('open-svn-word-file', filePath),
  openSvnWordDir: (filePath) => ipcRenderer.invoke('open-svn-word-dir', filePath),
})
