const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

// 彻底禁用顶部原生 Windows 菜单栏 (File Edit View Window Help)
Menu.setApplicationMenu(null)

process.on('uncaughtException', (err) => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'crash.txt'), err.stack || err.message)
  fs.writeFileSync('C:\\Users\\LiSB\\.gemini\\antigravity\\scratch\\dev-task-hub\\crash.txt', err.stack || err.message)
})

let mainWindow = null
const isDev = !app.isPackaged

// 配置文件路径 (存储在用户数据目录，避免随着exe移动丢失)
const configPath = path.join(app.getPath('userData'), 'devorbit_config.json')
const legacyConfigPath = path.join(app.getPath('userData'), 'devtaskhub_config.json')

const DEFAULT_CONFIG = {
  workspacePath: path.join(app.getPath('documents'), 'DevWorkspaces'),
  ideType: 'code', // 'code' | 'idea' | 'custom'
  customIdePath: '',
  terminalType: 'powershell', // 'powershell' | 'cmd' | 'wt'
  dbToolName: 'Navicat / DM管理工具',
  customDbToolPath: '',
  developerName: 'LiSB',
  defaultProject: 'MZ',
  defaultYear: '2026',
  useTrashCan: true,
  githubRepo: '1852676265/dev-orbit',
  themeSettings: {
    colorTheme: 'emerald',
    customPrimaryColor: '#10b981',
    type: 'preset',
    presetId: 'aurora',
    customBg: '',
    customBgName: '',
    overlayOpacity: 45,
    blurLevel: 'sm',
    cardGlass: true,
    cardOpacity: 25
  }
}

function loadConfig() {
  let loaded = {}
  try {
    if (fs.existsSync(configPath)) {
      loaded = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } else if (fs.existsSync(legacyConfigPath)) {
      // 自动从旧配置文件 devtaskhub_config.json 迁移
      loaded = JSON.parse(fs.readFileSync(legacyConfigPath, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load config', e)
  }
  const merged = {
    ...DEFAULT_CONFIG,
    ...loaded,
    themeSettings: {
      ...DEFAULT_CONFIG.themeSettings,
      ...(loaded.themeSettings || {})
    }
  }
  // 确保工作区目录存在
  if (!fs.existsSync(merged.workspacePath)) {
    try {
      fs.mkdirSync(merged.workspacePath, { recursive: true })
    } catch (e) {}
  }
  return merged
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save config', e)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'DevOrbit - 开发者工作台',
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 彻底移除窗口菜单，杜绝 File Edit View 菜单栏
  mainWindow.setMenu(null)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath).catch(err => {
      dialog.showErrorBox('加载页面失败', err.message + '\nPath: ' + indexPath)
    })
  }

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    dialog.showErrorBox('页面加载错误', `Code: ${code}, Desc: ${desc}`)
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ==================== IPC 接口实现 ====================

// 1. 工作区与配置
ipcMain.handle('get-workspace-path', async () => {
  const config = loadConfig()
  return config.workspacePath
})

ipcMain.handle('select-workspace-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: '选择你的开发工作区根目录'
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const selected = result.filePaths[0]
    const config = loadConfig()
    config.workspacePath = selected
    saveConfig(config)
    return selected
  }
  return null
})

ipcMain.handle('set-workspace-path', async (event, newPath) => {
  const config = loadConfig()
  config.workspacePath = newPath
  saveConfig(config)
  return true
})

ipcMain.handle('get-app-config', async () => {
  return loadConfig()
})

ipcMain.handle('save-app-config', async (event, newConfig) => {
  const current = loadConfig()
  const updated = {
    ...current,
    ...newConfig,
    themeSettings: {
      ...(current.themeSettings || {}),
      ...(newConfig.themeSettings || {})
    }
  }
  saveConfig(updated)
  return updated
})

function compareSemver(v1, v2) {
  const p1 = (v1 || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0)
  const p2 = (v2 || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0
    const num2 = p2[i] || 0
    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }
  return 0
}

// 检查 GitHub 仓库最新 Release 版本
ipcMain.handle('check-github-update', async (event, customRepo) => {
  const config = loadConfig()
  const repo = (customRepo || config.githubRepo || '1852676265/dev-orbit').trim()
  let currentVersion = '1.1.1'
  try {
    currentVersion = require('../package.json').version || '1.1.1'
  } catch (e) {}
  return new Promise((resolve) => {
    const https = require('https')
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/releases/latest`,
      headers: {
        'User-Agent': 'DevOrbit-Desktop-App',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 8000
    }
    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const release = JSON.parse(data)
            const latestTag = (release.tag_name || '').replace(/^v/, '').trim()
            const hasUpdate = compareSemver(latestTag, currentVersion) > 0
            resolve({
              success: true,
              hasUpdate,
              currentVersion,
              latestVersion: release.tag_name || latestTag,
              releaseNotes: release.body || '新版本功能迭代与体验优化',
              releaseUrl: release.html_url || `https://github.com/${repo}/releases`,
              publishedAt: release.published_at,
              assets: (release.assets || []).map(a => ({
                name: a.name,
                downloadUrl: a.browser_download_url,
                size: a.size
              }))
            })
          } else if (res.statusCode === 404) {
            resolve({
              success: true,
              hasUpdate: false,
              currentVersion,
              latestVersion: currentVersion,
              message: '暂无公开的 Release 版本'
            })
          } else {
            resolve({
              success: false,
              currentVersion,
              message: `GitHub API 响应码: ${res.statusCode}`
            })
          }
        } catch (e) {
          resolve({ success: false, currentVersion, message: e.message })
        }
      })
    })
    req.on('error', (err) => {
      resolve({ success: false, currentVersion, message: err.message })
    })
    req.on('timeout', () => {
      req.destroy()
      resolve({ success: false, currentVersion, message: '请求超时，请检查网络连接' })
    })
  })
})

ipcMain.handle('open-external-url', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url)
  }
})

ipcMain.handle('select-file-dialog', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: options.title || '选择程序或文件',
    filters: options.filters || [
      { name: '可执行程序 (*.exe)', extensions: ['exe'] },
      { name: '所有文件 (*.*)', extensions: ['*'] }
    ]
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('select-background-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: '选择自定义背景壁纸图片',
    filters: [
      { name: '图片文件 (*.jpg, *.jpeg, *.png, *.webp)', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const buffer = fs.readFileSync(filePath)
    const base64 = `data:${mime};base64,${buffer.toString('base64')}`
    return {
      filePath,
      fileName: path.basename(filePath),
      dataUrl: base64
    }
  }
  return null
})

ipcMain.handle('open-config-folder', async () => {
  const dir = app.getPath('userData')
  if (fs.existsSync(dir)) {
    shell.openPath(dir)
    return dir
  }
  return null
})

ipcMain.handle('test-launch-ide', async () => {
  const config = loadConfig()
  const targetPath = config.workspacePath
  if (config.ideType === 'custom' && config.customIdePath && fs.existsSync(config.customIdePath)) {
    exec(`"${config.customIdePath}" "${targetPath}"`)
    return { success: true, message: `已成功调起自定义程序: ${path.basename(config.customIdePath)}` }
  } else if (config.ideType === 'idea') {
    exec(`idea64 "${targetPath}"`, (err) => {
      if (err) exec(`idea "${targetPath}"`)
    })
    return { success: true, message: '已执行 IntelliJ IDEA (idea64/idea) 启动命令' }
  } else {
    exec(`code "${targetPath}"`, (err) => {
      if (err) shell.openPath(targetPath)
    })
    return { success: true, message: '已执行 Visual Studio Code (code) 启动命令' }
  }
})

ipcMain.handle('test-launch-terminal', async () => {
  const config = loadConfig()
  const targetPath = config.workspacePath
  const terminalType = config.terminalType || 'powershell'
  if (terminalType === 'powershell') {
    exec(`start powershell.exe -NoExit -Command "Set-Location -LiteralPath '${targetPath}'"`)
  } else if (terminalType === 'wt') {
    exec(`wt -d "${targetPath}"`, (err) => {
      if (err) exec(`start cmd.exe /k "cd /d \"${targetPath}\""`)
    })
  } else {
    exec(`start cmd.exe /k "cd /d \"${targetPath}\""`)
  }
  return { success: true, message: `已调起 ${terminalType.toUpperCase()} 终端并在工作区就绪` }
})

// 2. 任务管理 (自动扫描与物理目录操作，支持按年份如 2025/2026 分层归集)
function parseTaskDir(taskDirPath, fallbackYear) {
  const dirName = path.basename(taskDirPath)
  const metaFilePath = path.join(taskDirPath, 'task.json')
  let meta = null

  if (fs.existsSync(metaFilePath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'))
    } catch (e) {
      console.error('Error parsing task.json in', dirName, e)
    }
  }

  let stats = null
  try {
    stats = fs.statSync(taskDirPath)
  } catch (e) {}

  if (!meta) {
    // 兼容用户原有已有文件夹：自动解析 [TASK-xxx] 需求名 或普通文件夹名
    let id = dirName
    let title = dirName
    const match = dirName.match(/^\[(.*?)\]\s*(.*)$/)
    if (match) {
      id = match[1]
      title = match[2] || match[1]
    }
    meta = {
      id,
      title,
      status: 'developing',
      project: '常规项目',
      createdAt: stats ? stats.birthtime.toISOString() : new Date().toISOString(),
      sqlReleaseRecords: {}
    }
  }

  // 统计 SQL 数量和发布状态
  const sqlDirPath = path.join(taskDirPath, 'sql')
  let sqlCount = 0
  let testPendingCount = 0
  let prodPendingCount = 0

  if (fs.existsSync(sqlDirPath)) {
    try {
      const sqlFiles = fs.readdirSync(sqlDirPath).filter(f => f.endsWith('.sql'))
      sqlCount = sqlFiles.length
      const records = meta.sqlReleaseRecords || {}
      for (const file of sqlFiles) {
        const r = records[file] || {}
        if (!r.testReleased) testPendingCount++
        if (!r.prodReleased) prodPendingCount++
      }
    } catch (e) {}
  }

  // 推断年份：优先使用元数据，其次使用父级目录年份，最后根据创建时间
  let inferredYear = meta.year || fallbackYear
  if (!inferredYear) {
    const createDate = new Date(meta.createdAt || Date.now())
    inferredYear = createDate.getFullYear().toString()
  }

  return {
    ...meta,
    year: inferredYear,
    dirName,
    fullPath: taskDirPath,
    sqlCount,
    testPendingCount,
    prodPendingCount
  }
}

ipcMain.handle('get-tasks', async () => {
  const config = loadConfig()
  const ws = config.workspacePath
  if (!fs.existsSync(ws)) return { tasks: [], years: [] }

  const entries = fs.readdirSync(ws, { withFileTypes: true })
  const tasks = []
  const yearSet = new Set()

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) {
      continue
    }

    const subPath = path.join(ws, entry.name)

    // 判断是否是 4 位数字年份文件夹 (如 2025, 2026)
    if (/^\d{4}$/.test(entry.name)) {
      yearSet.add(entry.name)
      // 遍历年份目录下的所有任务子目录
      try {
        const yearEntries = fs.readdirSync(subPath, { withFileTypes: true })
        for (const yEntry of yearEntries) {
          if (yEntry.isDirectory() && !yEntry.name.startsWith('_') && !yEntry.name.startsWith('.')) {
            const taskDirPath = path.join(subPath, yEntry.name)
            tasks.push(parseTaskDir(taskDirPath, entry.name))
          }
        }
      } catch (e) {
        console.error('Error scanning year folder', entry.name, e)
      }
    } else {
      // 检查根目录下的直接子目录：如果是任务目录（包含 task.json 或 [TASK- 开头）
      const hasTaskJson = fs.existsSync(path.join(subPath, 'task.json'))
      const isTaskNaming = /^\[.*?\]/.test(entry.name)
      if (hasTaskJson || isTaskNaming) {
        const taskObj = parseTaskDir(subPath, '')
        tasks.push(taskObj)
        if (taskObj.year) yearSet.add(taskObj.year)
      }
    }
  }

  // 默认加上当前年份
  const currentYear = new Date().getFullYear().toString()
  yearSet.add(currentYear)

  // 年份列表倒序排列 (如 2026, 2025, ...)
  const sortedYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a))

  // 按创建时间倒序
  tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  return { tasks, years: sortedYears }
})

ipcMain.handle('create-task', async (event, taskData) => {
  const config = loadConfig()
  const ws = config.workspacePath
  const year = (taskData.year || new Date().getFullYear().toString()).trim()
  
  // 年份目录（如 D:\工作\2026）
  const yearDirPath = path.join(ws, year)
  if (!fs.existsSync(yearDirPath)) {
    fs.mkdirSync(yearDirPath, { recursive: true })
  }

  // 纯任务/需求名称作为文件夹名
  const cleanTitle = (taskData.title || '新开发任务').replace(/[\\/:*?"<>|]/g, '').trim()
  const dirName = cleanTitle
  const taskDirPath = path.join(yearDirPath, dirName)

  if (fs.existsSync(taskDirPath)) {
    throw new Error(`在 ${year} 年份目录下，该任务文件夹已存在: ${dirName}`)
  }

  // 创建标准脚手架子文件夹
  fs.mkdirSync(taskDirPath, { recursive: true })
  fs.mkdirSync(path.join(taskDirPath, 'docs'), { recursive: true })
  fs.mkdirSync(path.join(taskDirPath, 'sql'), { recursive: true })
  fs.mkdirSync(path.join(taskDirPath, 'attachments'), { recursive: true })

  // 创建初始化【需求.md】
  const reqContent = `# ${cleanTitle} - 任务需求\n\n` +
    `> 归属年份: ${year} 年\n` +
    `> 所属系统/模块: ${taskData.project || '常规项目'}\n` +
    `> 创建日期: ${new Date().toLocaleDateString()}\n\n` +
    `## 一、 需求背景与业务目标\n- 请在此记录产品/领导提出的业务需求要点与预期目标...\n\n` +
    `## 二、 核心功能清单与验收标准\n1. 功能点一：...\n2. 功能点二：...\n\n` +
    `## 三、 关联原型/接口文档链接\n- 原型地址、PRD链接等...\n`
  fs.writeFileSync(path.join(taskDirPath, 'docs', '需求.md'), reqContent, 'utf-8')

  // 创建初始化【笔记.md】
  const noteContent = `# ${cleanTitle} - 开发笔记与联调备忘\n\n` +
    `## 1. 服务与接口信息\n- 服务名: \n- 核心接口: \n- 测试账号 / Token: \n\n` +
    `## 2. 本地开发与踩坑记录\n- 联调入参出参示例、报错排查记录...\n\n` +
    `## 3. 上线部署检查项\n- 配置文件修改、依赖中间件等...\n`
  fs.writeFileSync(path.join(taskDirPath, 'docs', '笔记.md'), noteContent, 'utf-8')

  // 创建元数据 task.json
  const meta = {
    id: cleanTitle,
    title: cleanTitle,
    project: taskData.project || '常规项目',
    year,
    status: 'developing', // developing | testing | release_ready | archived
    createdAt: new Date().toISOString(),
    sqlReleaseRecords: {}
  }
  fs.writeFileSync(path.join(taskDirPath, 'task.json'), JSON.stringify(meta, null, 2), 'utf-8')

  return { ...meta, dirName, fullPath: taskDirPath, sqlCount: 0, testPendingCount: 0, prodPendingCount: 0 }
})

ipcMain.handle('update-task', async (event, taskDir, updates) => {
  const metaPath = path.join(taskDir, 'task.json')
  let meta = {}
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  }
  const updated = { ...meta, ...updates }
  fs.writeFileSync(metaPath, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
})

ipcMain.handle('delete-task', async (event, taskDir) => {
  if (fs.existsSync(taskDir)) {
    const config = loadConfig()
    if (config.useTrashCan !== false) {
      // 默认安全移入回收站
      await shell.trashItem(taskDir)
    } else {
      // 彻底粉碎删除
      fs.rmSync(taskDir, { recursive: true, force: true })
    }
    return true
  }
  return false
})

// 3. 系统级联动入口
ipcMain.handle('open-in-explorer', async (event, targetPath) => {
  if (fs.existsSync(targetPath)) {
    shell.openPath(targetPath)
    return true
  }
  return false
})

ipcMain.handle('show-item-in-folder', async (event, targetPath) => {
  if (fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath)
    return true
  }
  return false
})

ipcMain.handle('open-in-ide', async (event, targetPath) => {
  if (fs.existsSync(targetPath)) {
    const config = loadConfig()
    if (config.ideType === 'custom' && config.customIdePath && fs.existsSync(config.customIdePath)) {
      exec(`"${config.customIdePath}" "${targetPath}"`, (err) => {
        if (err) shell.openPath(targetPath)
      })
      return true
    } else if (config.ideType === 'idea') {
      exec(`idea64 "${targetPath}"`, (err) => {
        if (err) {
          exec(`idea "${targetPath}"`, (err2) => {
            if (err2) shell.openPath(targetPath)
          })
        }
      })
      return true
    } else {
      // 默认 VS Code
      exec(`code "${targetPath}"`, (err) => {
        if (err) {
          shell.openPath(targetPath)
        }
      })
      return true
    }
  }
  return false
})

ipcMain.handle('open-in-terminal', async (event, targetPath) => {
  if (fs.existsSync(targetPath)) {
    const config = loadConfig()
    const terminalType = config.terminalType || 'powershell'
    if (terminalType === 'powershell') {
      exec(`start powershell.exe -NoExit -Command "Set-Location -LiteralPath '${targetPath}'"`)
    } else if (terminalType === 'wt') {
      exec(`wt -d "${targetPath}"`, (err) => {
        if (err) exec(`start cmd.exe /k "cd /d \"${targetPath}\""`)
      })
    } else {
      exec(`start cmd.exe /k "cd /d \"${targetPath}\""`)
    }
    return true
  }
  return false
})

// 4. SQL 脚本与发布追踪
ipcMain.handle('get-task-sqls', async (event, taskDir) => {
  const sqlDir = path.join(taskDir, 'sql')
  const metaPath = path.join(taskDir, 'task.json')
  let meta = {}
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  }
  const records = meta.sqlReleaseRecords || {}

  if (!fs.existsSync(sqlDir)) return []

  const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'))
  const result = []

  for (const file of files) {
    const filePath = path.join(sqlDir, file)
    const stats = fs.statSync(filePath)
    const record = records[file] || {}

    // 读取前100行供简易快速预览
    let preview = ''
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      preview = content.slice(0, 300)
    } catch (e) {}

    result.push({
      fileName: file,
      filePath,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
      preview,
      testReleased: !!record.testReleased,
      testReleasedAt: record.testReleasedAt || null,
      prodReleased: !!record.prodReleased,
      prodReleasedAt: record.prodReleasedAt || null
    })
  }

  // 按文件名排序
  result.sort((a, b) => a.fileName.localeCompare(b.fileName))
  return result
})

ipcMain.handle('read-sql-content', async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8')
  }
  return ''
})

ipcMain.handle('save-sql-content', async (event, filePath, content) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
})

ipcMain.handle('update-sql-status', async (event, taskDir, fileName, env, status, timestamp) => {
  const metaPath = path.join(taskDir, 'task.json')
  let meta = { sqlReleaseRecords: {} }
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    if (!meta.sqlReleaseRecords) meta.sqlReleaseRecords = {}
  }

  if (!meta.sqlReleaseRecords[fileName]) {
    meta.sqlReleaseRecords[fileName] = {}
  }

  if (env === 'test') {
    meta.sqlReleaseRecords[fileName].testReleased = status
    meta.sqlReleaseRecords[fileName].testReleasedAt = status ? (timestamp || new Date().toLocaleString()) : null
  } else if (env === 'prod') {
    meta.sqlReleaseRecords[fileName].prodReleased = status
    meta.sqlReleaseRecords[fileName].prodReleasedAt = status ? (timestamp || new Date().toLocaleString()) : null
  }

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  return meta.sqlReleaseRecords[fileName]
})

// 5. 通用文件读写与目录文件列表 (支持需求、笔记、SQL等多文件管理)
ipcMain.handle('get-dir-files', async (event, dirPath) => {
  if (!fs.existsSync(dirPath)) return []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isFile() && !entry.name.startsWith('.')) {
      const full = path.join(dirPath, entry.name)
      const stats = fs.statSync(full)
      files.push({
        fileName: entry.name,
        filePath: full,
        size: stats.size,
        updatedAt: stats.mtime.toLocaleString()
      })
    }
  }
  files.sort((a, b) => a.fileName.localeCompare(b.fileName))
  return files
})

ipcMain.handle('read-text-file', async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8')
  }
  return ''
})

ipcMain.handle('save-text-file', async (event, filePath, content) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
})

ipcMain.handle('create-text-file', async (event, dirPath, fileName, defaultContent = '') => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
  const targetPath = path.join(dirPath, fileName)
  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, defaultContent, 'utf-8')
  }
  return targetPath
})

ipcMain.handle('delete-file', async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    await shell.trashItem(filePath)
    return true
  }
  return false
})

// 拖拽文件直接保存/拷贝至目标目录
ipcMain.handle('copy-files-to-dir', async (event, sourcePaths, targetDir) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  const copiedFiles = []
  if (Array.isArray(sourcePaths)) {
    for (const src of sourcePaths) {
      if (src && fs.existsSync(src)) {
        try {
          const stats = fs.statSync(src)
          if (stats.isFile()) {
            const fileName = path.basename(src)
            const dest = path.join(targetDir, fileName)
            fs.copyFileSync(src, dest)
            copiedFiles.push(fileName)
          }
        } catch (e) {
          console.error('Error copying file:', src, e)
        }
      }
    }
  }
  return copiedFiles
})

// 针对当前任务的全文搜索与行号定位
ipcMain.handle('search-task-files', async (event, taskDir, query) => {
  if (!query || !query.trim() || !fs.existsSync(taskDir)) return []
  const keyword = query.trim().toLowerCase()
  const results = []
  const textExtensions = ['.txt', '.md', '.sql', '.json', '.yaml', '.yml', '.xml', '.html', '.css', '.js', '.ts', '.java', '.py', '.sh', '.bat', '.properties', '.conf', '.ini']

  function scanFolder(folderPath, category) {
    if (!fs.existsSync(folderPath)) return
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith('.')) {
        const ext = path.extname(entry.name).toLowerCase()
        if (!textExtensions.includes(ext)) {
          continue // 忽略二进制文档，避免读入乱码
        }
        const full = path.join(folderPath, entry.name)
        try {
          const content = fs.readFileSync(full, 'utf-8')
          const lines = content.split(/\r?\n/)
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(keyword)) {
              results.push({
                category,
                fileName: entry.name,
                filePath: full,
                lineNum: i + 1,
                lineContent: lines[i].trim()
              })
              if (results.length >= 50) return
            }
          }
        } catch (e) {}
      }
    }
  }

  scanFolder(path.join(taskDir, 'docs'), '文档')
  scanFolder(path.join(taskDir, 'sql'), 'SQL')
  return results
})

// 兼容旧接口
ipcMain.handle('get-task-file', async (event, taskDir, type) => {
  const docsDir = path.join(taskDir, 'docs')
  if (!fs.existsSync(docsDir)) return ''

  if (type === 'requirement') {
    // 优先读取 需求.md，其次兼容旧项目的 README.md
    const reqPath = path.join(docsDir, '需求.md')
    if (fs.existsSync(reqPath)) return fs.readFileSync(reqPath, 'utf-8')
    const readmePath = path.join(docsDir, 'README.md')
    if (fs.existsSync(readmePath)) return fs.readFileSync(readmePath, 'utf-8')
    return ''
  } else if (type === 'note') {
    const notePath = path.join(docsDir, '笔记.md')
    if (fs.existsSync(notePath)) return fs.readFileSync(notePath, 'utf-8')
    return ''
  }
  return ''
})

ipcMain.handle('save-task-file', async (event, taskDir, type, content) => {
  const docsDir = path.join(taskDir, 'docs')
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })

  const fileName = type === 'requirement' ? '需求.md' : '笔记.md'
  const filePath = path.join(docsDir, fileName)
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
})

// 兼容旧接口
ipcMain.handle('get-task-doc', async (event, taskDir) => {
  const docPath = path.join(taskDir, 'docs', 'README.md')
  if (fs.existsSync(docPath)) return fs.readFileSync(docPath, 'utf-8')
  const reqPath = path.join(taskDir, 'docs', '需求.md')
  if (fs.existsSync(reqPath)) return fs.readFileSync(reqPath, 'utf-8')
  return ''
})

ipcMain.handle('save-task-doc', async (event, taskDir, content) => {
  const docPath = path.join(taskDir, 'docs', '需求.md')
  const dir = path.dirname(docPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(docPath, content, 'utf-8')
  return true
})

// 6. 随手记 / 常用命令库 (存储在工作区的 _quick_notes/notes.json)
function getQuickNotesPath() {
  const config = loadConfig()
  const dir = path.join(config.workspacePath, '_quick_notes')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'notes.json')
}

ipcMain.handle('get-quick-notes', async () => {
  const noteFile = getQuickNotesPath()
  if (fs.existsSync(noteFile)) {
    try {
      return JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    } catch (e) {
      return []
    }
  }
  // 预置几条常见的默认命令作为示例
  const defaultNotes = [
    {
      id: 'n1',
      title: 'Docker 查看指定容器实时日志',
      tag: 'Docker',
      content: 'docker logs -f --tail 100 <container_id>',
      createdAt: new Date().toISOString()
    },
    {
      id: 'n2',
      title: 'Git 撤销最近一次未推送的 commit 且保留修改',
      tag: 'Git',
      content: 'git reset --soft HEAD~1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'n3',
      title: 'Linux 查找占用指定端口的进程并杀死',
      tag: 'Linux',
      content: 'netstat -tulnp | grep :8080\nkill -9 <PID>',
      createdAt: new Date().toISOString()
    }
  ]
  fs.writeFileSync(noteFile, JSON.stringify(defaultNotes, null, 2), 'utf-8')
  return defaultNotes
})

ipcMain.handle('save-quick-note', async (event, note) => {
  const noteFile = getQuickNotesPath()
  let notes = []
  if (fs.existsSync(noteFile)) {
    try {
      notes = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    } catch (e) {}
  }

  if (note.id) {
    // 更新
    const idx = notes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...note, updatedAt: new Date().toISOString() }
    } else {
      notes.unshift(note)
    }
  } else {
    // 新增
    const newNote = {
      ...note,
      id: 'note_' + Date.now(),
      createdAt: new Date().toISOString()
    }
    notes.unshift(newNote)
  }

  fs.writeFileSync(noteFile, JSON.stringify(notes, null, 2), 'utf-8')
  return notes
})

ipcMain.handle('delete-quick-note', async (event, id) => {
  const noteFile = getQuickNotesPath()
  if (fs.existsSync(noteFile)) {
    let notes = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    notes = notes.filter(n => n.id !== id)
    fs.writeFileSync(noteFile, JSON.stringify(notes, null, 2), 'utf-8')
    return notes
  }
  return []
})

// 7. 智能全文检索 & 关键字精准行定位 (秒搜 .txt, .md, .sql)
ipcMain.handle('search-keyword', async (event, query) => {
  if (!query || !query.trim()) return []
  const config = loadConfig()
  const ws = config.workspacePath
  const keyword = query.trim().toLowerCase()
  const results = []

  // 递归收集文本文件
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) scanDir(full)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (['.txt', '.md', '.sql', '.json', '.sh', '.bat'].includes(ext)) {
          searchInFile(full)
        }
      }
    }
  }

  function searchInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.toLowerCase().includes(keyword)) {
          const relPath = path.relative(ws, filePath)
          results.push({
            filePath,
            fileName: path.basename(filePath),
            relativePath: relPath,
            lineNum: i + 1,
            lineContent: line.trim(),
            context: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n')
          })
          if (results.length >= 100) return // 最多返回100条以保证极速流畅
        }
      }
    } catch (e) {}
  }

  scanDir(ws)
  return results
})

// 读取文件全部行（供行定位查看器）
ipcMain.handle('read-file-lines', async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    return {
      fileName: path.basename(filePath),
      lines: content.split(/\r?\n/)
    }
  }
  return { fileName: '', lines: [] }
})

// 剪贴板复制
ipcMain.handle('copy-to-clipboard', async (event, text) => {
  clipboard.writeText(text)
  return true
})
