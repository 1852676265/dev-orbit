const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

// 彻底禁用顶部原生 Windows 菜单栏 (File Edit View Window Help)
Menu.setApplicationMenu(null)

process.on('uncaughtException', (err) => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'crash.txt'), err.stack || err.message)

})

let mainWindow = null
const isDev = !app.isPackaged && process.argv.includes('--dev')

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
  svnWordPath: '',
  githubToken: '',
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


function readJsonSafely(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue
    let raw = fs.readFileSync(filePath, 'utf-8')
    if (raw && raw.charCodeAt(0) === 0xFEFF) {
      raw = raw.slice(1)
    }
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read/parse JSON from', filePath, err.message)
    return defaultValue
  }
}

function loadConfig() {
  let loaded = {}
  try {
    if (fs.existsSync(configPath)) {
      loaded = readJsonSafely(configPath, {}) || {}
    } else if (fs.existsSync(legacyConfigPath)) {
      // 自动从旧配置文件 devtaskhub_config.json 迁移
      loaded = readJsonSafely(legacyConfigPath, {}) || {}
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
    mainWindow.loadURL('http://localhost:9527')
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath).catch(err => {
      dialog.showErrorBox('加载页面失败', err.message + '\nPath: ' + indexPath)
    })
  }

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    dialog.showErrorBox('页面加载错误', `Code: ${code}, Desc: ${desc}`)
  })

  // 转发渲染进程的控制台输出至终端
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer L${level}] ${message}`)
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

// 获取有效 GitHub Token（支持用户自定义配置、环境变量以及自动复用本地 GitHub CLI 登录态）
async function getGitHubToken(customToken) {
  if (customToken && customToken.trim()) return customToken.trim()
  const config = loadConfig()
  if (config.githubToken && config.githubToken.trim()) return config.githubToken.trim()
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) return process.env.GITHUB_TOKEN.trim()
  if (process.env.GH_TOKEN && process.env.GH_TOKEN.trim()) return process.env.GH_TOKEN.trim()

  return new Promise((resolve) => {
    const { execFile } = require('child_process')
    const possible = ['C:\\Program Files\\GitHub CLI\\gh.exe', 'gh']
    let settled = false

    const tryNext = (idx) => {
      if (idx >= possible.length) {
        if (!settled) { settled = true; resolve('') }
        return
      }
      const p = possible[idx]
      if (p.includes('\\') && !fs.existsSync(p)) {
        return tryNext(idx + 1)
      }
      execFile(p, ['auth', 'token'], { encoding: 'utf-8', timeout: 5000 }, (err, stdout) => {
        if (settled) return
        if (!err && stdout && stdout.trim()) {
          settled = true
          resolve(stdout.trim())
        } else {
          tryNext(idx + 1)
        }
      })
    }

    tryNext(0)
    setTimeout(() => {
      if (!settled) { settled = true; resolve('') }
    }, 6000)
  })
}

// 检测本地 GitHub CLI 登录状态
ipcMain.handle('detect-github-cli-auth', async () => {
  return new Promise((resolve) => {
    const { execFile } = require('child_process')
    const possible = ['C:\\Program Files\\GitHub CLI\\gh.exe', 'gh']
    let settled = false

    const tryNext = (idx) => {
      if (idx >= possible.length) {
        if (!settled) { settled = true; resolve({ available: false, hasToken: false }) }
        return
      }
      const p = possible[idx]
      if (p.includes('\\') && !fs.existsSync(p)) {
        return tryNext(idx + 1)
      }
      execFile(p, ['auth', 'token'], { encoding: 'utf-8', timeout: 5000 }, (err, tokenOut) => {
        if (settled) return
        if (!err && tokenOut && tokenOut.trim()) {
          execFile(p, ['auth', 'status'], { encoding: 'utf-8', timeout: 5000 }, (sErr, statusOut) => {
            const text = (statusOut || '') + (sErr ? sErr.stderr || '' : '')
            const match = text.match(/Logged in to [^ ]+ account ([^ (\r\n]+)/)
            settled = true
            resolve({
              available: true,
              hasToken: true,
              user: match ? match[1] : '已认证用户',
              token: tokenOut.trim()
            })
          })
        } else {
          tryNext(idx + 1)
        }
      })
    }

    tryNext(0)
    setTimeout(() => {
      if (!settled) { settled = true; resolve({ available: false, hasToken: false }) }
    }, 6000)
  })
})

// 检查 GitHub 仓库最新 Release 版本（支持私密仓库鉴权）
ipcMain.handle('check-github-update', async (event, customRepo, customToken) => {
  const config = loadConfig()
  const repo = (customRepo || config.githubRepo || '1852676265/dev-orbit').trim()
  let currentVersion = '1.3.0'
  try {
    currentVersion = require('../package.json').version || '1.3.0'
  } catch (e) {}

  const token = await getGitHubToken(customToken)

  return new Promise((resolve) => {
    const https = require('https')
    const headers = {
      'User-Agent': 'DevOrbit-Desktop-App',
      'Accept': 'application/vnd.github.v3+json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/releases/latest`,
      headers,
      timeout: 10000
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
              isPrivateAuthorized: !!token,
              currentVersion,
              latestVersion: release.tag_name || latestTag,
              releaseName: release.name || release.tag_name,
              releaseNotes: release.body || '新版本功能迭代与体验优化',
              releaseUrl: release.html_url || `https://github.com/${repo}/releases`,
              publishedAt: release.published_at,
              assets: (release.assets || []).map(a => ({
                id: a.id,
                name: a.name,
                downloadUrl: a.browser_download_url,
                size: a.size
              }))
            })
          } else if (res.statusCode === 404) {
            resolve({
              success: false,
              hasUpdate: false,
              currentVersion,
              isPrivateAuthorized: !!token,
              message: token
                ? `未找到云端 Release (HTTP 404)，请确认仓库 ${repo} 是否已在云端发布 Release。`
                : `未找到 Release (HTTP 404)。当前仓库若已设为私密 (Private)，需配置 GitHub 访问令牌 (Token) 或授权本地 GitHub CLI。`
            })
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            resolve({
              success: false,
              currentVersion,
              isPrivateAuthorized: !!token,
              message: `GitHub 鉴权失败或访问受限 (HTTP ${res.statusCode})，请检查 Token 权限或稍后再试。`
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

// 更新缓存状态
let updateCache = {
  zipPath: '',
  extractDir: '',
  version: '',
  ready: false
}

// 通用流式下载文件（自动跟随 301/302/307 重定向）
function streamDownload(url, destPath, token, onProgress) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const http = require('http')
    const client = url.startsWith('https:') ? https : http
    const headers = {
      'User-Agent': 'DevOrbit-Desktop-App',
      'Accept': 'application/octet-stream'
    }
    // 仅在请求 api.github.com 时传递 Token，重定向至 AWS S3 / objects.githubusercontent 时不带 Token
    if (token && url.includes('api.github.com')) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const req = client.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return streamDownload(res.headers.location, destPath, '', onProgress).then(resolve).catch(reject)
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`下载失败，HTTP 响应码: ${res.statusCode}`))
      }

      const total = parseInt(res.headers['content-length'] || '0', 10)
      let transferred = 0
      let lastTime = Date.now()
      let lastTransferred = 0
      let speed = 0

      const fileStream = fs.createWriteStream(destPath)

      res.on('data', (chunk) => {
        transferred += chunk.length
        const now = Date.now()
        if (now - lastTime >= 400) {
          speed = (transferred - lastTransferred) / ((now - lastTime) / 1000)
          lastTime = now
          lastTransferred = transferred
        }
        if (onProgress && total > 0) {
          onProgress({
            transferred,
            total,
            percent: Math.min(100, Math.round((transferred / total) * 100)),
            speed
          })
        }
      })

      res.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath))
      })

      fileStream.on('error', (err) => {
        try { fs.unlinkSync(destPath) } catch (e) {}
        reject(err)
      })
    })

    req.on('error', (err) => {
      try { fs.unlinkSync(destPath) } catch (e) {}
      reject(err)
    })
    req.setTimeout(60000, () => {
      req.destroy()
      try { fs.unlinkSync(destPath) } catch (e) {}
      reject(new Error('下载超时，请检查网络连接'))
    })
  })
}

// 软件内一键后台下载并自动解压 (DBX 同款无感热更新引擎)
ipcMain.handle('download-update', async (event, payload = {}) => {
  const { assetId, downloadUrl, assetName, version, customToken } = payload
  const token = await getGitHubToken(customToken)
  const tempDir = path.join(app.getPath('temp'), 'devorbit-update')
  const extractDir = path.join(tempDir, 'extracted')

  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true })
    fs.mkdirSync(extractDir, { recursive: true })

    const zipName = assetName || `DevOrbit-update.zip`
    const zipPath = path.join(tempDir, zipName)

    // 优先通过 GitHub API / assetId 下载（支持私密仓库鉴权）
    const downloadTargetUrl = (assetId && token)
      ? `https://api.github.com/repos/1852676265/dev-orbit/releases/assets/${assetId}`
      : (downloadUrl || `https://github.com/1852676265/dev-orbit/releases/download/${version}/${zipName}`)

    await streamDownload(downloadTargetUrl, zipPath, token, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-download-progress', progress)
      }
    })

    // 下载完成后自动调用 Windows 内置极速 tar 或 PowerShell Expand-Archive 解压
    const { execFileSync } = require('child_process')
    try {
      execFileSync('tar.exe', ['-xf', zipPath, '-C', extractDir], { timeout: 30000 })
    } catch (tarErr) {
      execFileSync('powershell.exe', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Path "${zipPath}" -DestinationPath "${extractDir}" -Force`
      ], { timeout: 60000 })
    }

    // 自动寻找解压后 DevOrbit.exe 所在的根目录
    let finalSourceDir = extractDir
    if (!fs.existsSync(path.join(extractDir, 'DevOrbit.exe'))) {
      const subDirs = fs.readdirSync(extractDir, { withFileTypes: true }).filter(d => d.isDirectory())
      for (const d of subDirs) {
        const candidate = path.join(extractDir, d.name)
        if (fs.existsSync(path.join(candidate, 'DevOrbit.exe'))) {
          finalSourceDir = candidate
          break
        }
      }
    }

    updateCache = {
      zipPath,
      extractDir: finalSourceDir,
      version: version || 'latest',
      ready: true
    }

    return {
      success: true,
      message: '更新包已下载并准备就绪',
      version
    }
  } catch (err) {
    console.error('下载或解压更新包失败:', err)
    return {
      success: false,
      message: err.message || '下载更新包失败'
    }
  }
})

// 一键「重启并更新」（DBX 同款：释放文件锁、静默覆盖、自动唤起新版本）
ipcMain.handle('apply-update-and-restart', async () => {
  if (!updateCache.ready || !updateCache.extractDir) {
    return { success: false, message: '尚未下载完成更新包' }
  }

  const sourceDir = updateCache.extractDir
  const currentExe = process.execPath
  const currentAppDir = path.dirname(currentExe)

  // 如果是在开发模式下（npm run dev）
  if (!app.isPackaged) {
    dialog.showMessageBoxSync(mainWindow, {
      type: 'info',
      title: 'DevOrbit 开发环境提示',
      message: '检测到当前处于开发环境。\n新版本更新包已拉取完毕，现在将自动为您重新启动应用。',
      buttons: ['立即重启']
    })
    app.relaunch()
    app.exit(0)
    return { success: true }
  }

  // 生产环境绿色便携包一键静默覆盖
  const batPath = path.join(app.getPath('temp'), 'devorbit-apply-update.bat')
  const batContent = `@echo off
chcp 65001 >nul
title DevOrbit 自动升级中...
echo 正在等待原程序安全退出...
timeout /t 1 /nobreak >nul
taskkill /f /pid ${process.pid} >nul 2>&1
timeout /t 1 /nobreak >nul

echo 正在无感替换最新核心文件...
robocopy "${sourceDir}" "${currentAppDir}" /E /IS /IT /NP /NJH /NJS /R:5 /W:1 >nul

echo 升级完成，正在启动新版本...
start "" "${currentExe}"
timeout /t 1 /nobreak >nul
del "%~f0"
exit
`
  fs.writeFileSync(batPath, batContent, 'utf-8')

  const { spawn } = require('child_process')
  const child = spawn('cmd.exe', ['/c', batPath], {
    detached: true,
    stdio: 'ignore'
  })
  child.unref()

  app.exit(0)
  return { success: true }
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
      meta = readJsonSafely(metaFilePath, null)
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
  try {
    const config = loadConfig()
    const ws = config.workspacePath
    console.log('[Main] get-tasks scanning workspace:', ws)
    if (!fs.existsSync(ws)) {
      console.warn('[Main] Workspace does not exist:', ws)
      return { tasks: [], years: [] }
    }

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
              try {
                const taskObj = parseTaskDir(taskDirPath, entry.name)
                tasks.push(taskObj)
              } catch (taskErr) {
                console.error('[Main] Error parsing task folder:', taskDirPath, taskErr)
              }
            }
          }
        } catch (e) {
          console.error('[Main] Error scanning year folder', entry.name, e)
        }
      } else {
        // 检查根目录下的直接子目录：如果是任务目录（包含 task.json 或 [TASK- 开头）
        const hasTaskJson = fs.existsSync(path.join(subPath, 'task.json'))
        const isTaskNaming = /^\[.*?\]/.test(entry.name)
        if (hasTaskJson || isTaskNaming) {
          try {
            const taskObj = parseTaskDir(subPath, '')
            tasks.push(taskObj)
            if (taskObj.year) yearSet.add(taskObj.year)
          } catch (taskErr) {
            console.error('[Main] Error parsing root task folder:', subPath, taskErr)
          }
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
    console.log(`[Main] get-tasks loaded ${tasks.length} tasks across years:`, sortedYears)
    return { tasks, years: sortedYears }
  } catch (err) {
    console.error('[Main] Fatal error in get-tasks:', err)
    return { tasks: [], years: [] }
  }
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
    meta = readJsonSafely(metaPath, {}) || {}
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
  const meta = readJsonSafely(metaPath, {}) || {}
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
  const meta = readJsonSafely(metaPath, { sqlReleaseRecords: {} }) || { sqlReleaseRecords: {} }
  if (!meta.sqlReleaseRecords) meta.sqlReleaseRecords = {}

  if (!meta.sqlReleaseRecords[fileName]) {
    meta.sqlReleaseRecords[fileName] = {}
  }

  const isReleased = Boolean(status === true || status === 'published');
  if (env === 'test') {
    meta.sqlReleaseRecords[fileName].testReleased = isReleased;
    meta.sqlReleaseRecords[fileName].testReleasedAt = isReleased ? (timestamp || new Date().toLocaleString()) : null;
  } else if (env === 'prod') {
    meta.sqlReleaseRecords[fileName].prodReleased = isReleased;
    meta.sqlReleaseRecords[fileName].prodReleasedAt = isReleased ? (timestamp || new Date().toLocaleString()) : null;
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

  // 若保存的文件是 笔记.md，同步更新对应 task.json
  const baseName = path.basename(filePath)
  if (baseName === '笔记.md') {
    const taskDir = path.dirname(dir)
    const metaPath = path.join(taskDir, 'task.json')
    if (fs.existsSync(metaPath)) {
      let meta = readJsonSafely(metaPath, {}) || {}
      meta.notes = parseMarkdownToNoteCards(content)
      try {
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
      } catch (e) {}
    }
  }
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


// Markdown 笔记解析为卡片结构的统一引擎
function parseMarkdownToNoteCards(rawContent) {
  if (!rawContent || !rawContent.trim()) return []
  const cards = []
  const sections = rawContent.split(/\n\s*---\s*\n/)
  if (sections.length > 1) {
    sections.forEach((sec, idx) => {
      const trimmed = sec.trim()
      if (!trimmed || trimmed.startsWith('# 开发备忘') || trimmed.startsWith('> 本文件由')) return
      const headerMatch = trimmed.match(/^###\s*(?:\[(.*?)\])?\s*([^\n]+)/)
      let category = '配置参数'
      let title = '联调备忘 #' + (idx + 1)
      let body = trimmed
      if (headerMatch) {
        category = headerMatch[1] || '配置参数'
        title = headerMatch[2].trim()
        body = trimmed.substring(headerMatch[0].length).replace(/^>\s*更新时间:[^\n]*\n+/i, '').trim()
      }
      cards.push({
        id: 'note_' + (Date.now() + idx),
        title,
        category,
        content: body,
        updatedAt: new Date().toLocaleString(),
        pinned: idx === 0
      })
    })
  }

  if (cards.length === 0) {
    cards.push({
      id: 'note_' + Date.now(),
      title: '配置参数与公私钥',
      category: '配置参数',
      content: rawContent.replace(/^#\s*[^\n]+\n+/i, '').replace(/^>\s*[^\n]+\n+/i, '').trim(),
      updatedAt: new Date().toLocaleString(),
      pinned: true
    })
  }
  return cards
}

ipcMain.handle('save-task-file', async (event, taskDir, type, content) => {
  const docsDir = path.join(taskDir, 'docs')
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })

  const fileName = type === 'requirement' ? '需求.md' : '笔记.md'
  const filePath = path.join(docsDir, fileName)
  fs.writeFileSync(filePath, content, 'utf-8')

  // 若保存的是笔记.md，同步解析并持久化至 task.json，避免卡片与源码不一致
  if (type === 'note' && taskDir && fs.existsSync(taskDir)) {
    const metaPath = path.join(taskDir, 'task.json')
    let meta = readJsonSafely(metaPath, {}) || {}
    meta.notes = parseMarkdownToNoteCards(content)
    try {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
    } catch (e) {
      console.error('Failed to sync meta.notes in save-task-file:', e)
    }
  }
  return true
})

// 备忘录条目化管理 (支持多条目卡片、置顶、检索与笔记.md双向同步)
ipcMain.handle('get-task-notes', async (event, taskDir) => {
  if (!taskDir || !fs.existsSync(taskDir)) return []
  const metaPath = path.join(taskDir, 'task.json')
  const docsDir = path.join(taskDir, 'docs')
  const notePath = path.join(docsDir, '笔记.md')

  let meta = readJsonSafely(metaPath, {}) || {}
  const hasMetaNotes = Array.isArray(meta.notes) && meta.notes.length > 0
  const noteExists = fs.existsSync(notePath)

  if (noteExists) {
    let noteMtime = 0
    let metaMtime = 0
    try { noteMtime = fs.statSync(notePath).mtimeMs } catch (e) {}
    try { metaMtime = fs.statSync(metaPath).mtimeMs } catch (e) {}

    // 如果 笔记.md 的修改时间更新，或者 task.json 中没有 notes，则以 笔记.md 为准
    if (!hasMetaNotes || noteMtime > metaMtime) {
      const rawContent = fs.readFileSync(notePath, 'utf-8').trim()
      if (rawContent) {
        const cards = parseMarkdownToNoteCards(rawContent)
        if (cards.length > 0) {
          meta.notes = cards
          try { fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8') } catch (e) {}
          return cards
        }
      }
    }
  }

  if (hasMetaNotes) {
    return meta.notes
  }
  return []
})

ipcMain.handle('save-task-notes', async (event, taskDir, notes) => {
  if (!taskDir || !fs.existsSync(taskDir)) return false
  const metaPath = path.join(taskDir, 'task.json')
  let meta = readJsonSafely(metaPath, {}) || {}
  meta.notes = Array.isArray(notes) ? notes : []

  // 同时同步写入 docs/笔记.md，保证外部编辑器与 Git 视图干净整洁
  const docsDir = path.join(taskDir, 'docs')
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })
  const notePath = path.join(docsDir, '笔记.md')

  let mdText = '# 开发备忘与接口联调参数\n\n> 本文件由 DevTaskHub 自动双向同步\n\n'
  for (const n of meta.notes) {
    mdText += '### [' + (n.category || '配置参数') + '] ' + (n.title || '无标题备忘') + '\n'
    if (n.updatedAt) {
      mdText += '> 更新时间: ' + n.updatedAt + '\n\n'
    }
    mdText += (n.content || '') + '\n\n---\n\n'
  }
  fs.writeFileSync(notePath, mdText, 'utf-8')

  // 先写 笔记.md 再写 task.json，确保 metaPath 的 mtime >= notePath 的 mtime，防误触发覆盖
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
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
      return readJsonSafely(noteFile, []) || []
    } catch (e) {
      return []
    }
  }
  return []
})

ipcMain.handle('save-quick-note', async (event, note) => {
  const noteFile = getQuickNotesPath()
  let notes = []
  if (fs.existsSync(noteFile)) {
    try {
      notes = readJsonSafely(noteFile, []) || []
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

ipcMain.handle('save-quick-notes-batch', async (event, newNotes) => {
  const noteFile = getQuickNotesPath()
  let notes = []
  if (fs.existsSync(noteFile)) {
    try {
      notes = readJsonSafely(noteFile, []) || []
    } catch (e) {}
  }
  if (Array.isArray(newNotes) && newNotes.length > 0) {
    const formatted = newNotes.map((n, idx) => ({
      ...n,
      id: 'note_' + Date.now() + '_' + idx,
      createdAt: new Date().toISOString()
    }))
    notes.unshift(...formatted)
    fs.writeFileSync(noteFile, JSON.stringify(notes, null, 2), 'utf-8')
  }
  return notes
})

ipcMain.handle('delete-quick-note', async (event, id) => {
  const noteFile = getQuickNotesPath()
  if (fs.existsSync(noteFile)) {
    let notes = readJsonSafely(noteFile, []) || []
    notes = notes.filter(n => n.id !== id)
    fs.writeFileSync(noteFile, JSON.stringify(notes, null, 2), 'utf-8')
    return notes
  }
  return []
})

function getQuickNotesCategoriesPath() {
  const config = loadConfig()
  const dir = path.join(config.workspacePath, '_quick_notes')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'categories.json')
}

ipcMain.handle('get-quick-note-categories', async () => {
  const catFile = getQuickNotesCategoriesPath()
  if (fs.existsSync(catFile)) {
    try {
      return readJsonSafely(catFile, []) || []
    } catch (e) {
      return []
    }
  }
  return []
})

ipcMain.handle('save-quick-note-categories', async (event, categories) => {
  const catFile = getQuickNotesCategoriesPath()
  fs.writeFileSync(catFile, JSON.stringify(categories, null, 2), 'utf-8')
  return categories
})

// 6.1 随手记 / 备忘录独立存储 (_quick_notes/memos.json)
function getMemosPath() {
  const config = loadConfig()
  const dir = path.join(config.workspacePath, '_quick_notes')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'memos.json')
}

ipcMain.handle('get-memos', async () => {
  const memoFile = getMemosPath()
  if (fs.existsSync(memoFile)) {
    try {
      return readJsonSafely(memoFile, []) || []
    } catch (e) {
      return []
    }
  }
  return []
})

ipcMain.handle('save-memo', async (event, memo) => {
  const memoFile = getMemosPath()
  let memos = []
  if (fs.existsSync(memoFile)) {
    try {
      memos = readJsonSafely(memoFile, []) || []
    } catch (e) {}
  }
  if (memo.id) {
    const idx = memos.findIndex(m => m.id === memo.id)
    if (idx !== -1) {
      memos[idx] = { ...memos[idx], ...memo, updatedAt: new Date().toISOString() }
    } else {
      memos.unshift(memo)
    }
  } else {
    const newMemo = {
      ...memo,
      id: 'memo_' + Date.now(),
      createdAt: new Date().toISOString()
    }
    memos.unshift(newMemo)
  }
  fs.writeFileSync(memoFile, JSON.stringify(memos, null, 2), 'utf-8')
  return memos
})

ipcMain.handle('delete-memo', async (event, id) => {
  const memoFile = getMemosPath()
  if (fs.existsSync(memoFile)) {
    let memos = readJsonSafely(memoFile, []) || []
    memos = memos.filter(m => m.id !== id)
    fs.writeFileSync(memoFile, JSON.stringify(memos, null, 2), 'utf-8')
    return memos
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

// 读取本地文件为 Data URL (支持图片、PDF预览)
ipcMain.handle('read-file-data-url', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return null
  try {
    const ext = path.extname(filePath).toLowerCase()
    let mime = 'application/octet-stream'
    if (ext === '.pdf') mime = 'application/pdf'
    else if (ext === '.png') mime = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg'
    else if (ext === '.gif') mime = 'image/gif'
    else if (ext === '.svg') mime = 'image/svg+xml'
    else if (ext === '.webp') mime = 'image/webp'
    
    const buffer = fs.readFileSync(filePath)
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error('Error reading file as data url:', err)
    return null
  }
})

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


// ==================== SVN Word 服务器凭据解析与同步 ====================
function parseDocxXml(xmlString) {
  const tables = []
  const tblRegex = /<w:tbl[\s\S]*?<\/w:tbl>/g
  let tblMatch
  while ((tblMatch = tblRegex.exec(xmlString)) !== null) {
    const tblXml = tblMatch[0]
    const rows = []
    const trRegex = /<w:tr[\s\S]*?<\/w:tr>/g
    let trMatch
    while ((trMatch = trRegex.exec(tblXml)) !== null) {
      const trXml = trMatch[0]
      const cells = []
      const tcRegex = /<w:tc[\s\S]*?<\/w:tc>/g
      let tcMatch
      while ((tcMatch = tcRegex.exec(trXml)) !== null) {
        const tcXml = tcMatch[0]
        const cleanCell = tcXml.replace(/<[^>]+>/g, '').trim()
        cells.push(cleanCell)
      }
      if (cells.length > 0) {
        rows.push(cells)
      }
    }
    if (rows.length > 0) {
      tables.push(rows)
    }
  }

  const assets = []
  let globalId = 1

  for (const rows of tables) {
    if (rows.length === 0) continue
    const firstRow = rows[0]
    const colMap = {
      name: -1,
      target: -1,
      port: -1,
      env: -1,
      username: -1,
      password: -1,
      remark: -1,
      type: -1
    }

    firstRow.forEach((col, idx) => {
      const c = col.toLowerCase().replace(/\s+/g, '')
      if (c.includes('ip') || c.includes('主机') || c.includes('地址') || c.includes('host') || c.includes('url') || c.includes('网址') || c.includes('链接')) {
        if (colMap.target === -1) colMap.target = idx
      } else if (c.includes('端口') || c.includes('port')) {
        if (colMap.port === -1) colMap.port = idx
      } else if (c.includes('密码') || c.includes('口令') || c.includes('pass') || c.includes('pwd')) {
        if (colMap.password === -1) colMap.password = idx
      } else if (c.includes('用户') || c.includes('账号') || c.includes('user') || c.includes('登录名')) {
        if (colMap.username === -1) colMap.username = idx
      } else if (c.includes('环境') || c.includes('env')) {
        if (colMap.env === -1) colMap.env = idx
      } else if (c.includes('类型') || c.includes('类别') || c.includes('type')) {
        if (colMap.type === -1) colMap.type = idx
      } else if (c.includes('名') || c.includes('系统') || c.includes('服务') || c.includes('项目') || c.includes('应用') || c.includes('用途')) {
        if (colMap.name === -1) colMap.name = idx
      } else if (c.includes('说明') || c.includes('备注') || c.includes('remark') || c.includes('desc')) {
        if (colMap.remark === -1) colMap.remark = idx
      }
    })

    const hasHeader = (colMap.target !== -1 || colMap.username !== -1 || colMap.password !== -1)
    const startIndex = hasHeader ? 1 : 0

    for (let r = startIndex; r < rows.length; r++) {
      const row = rows[r]
      if (row.every(c => !c)) continue

      let name = colMap.name !== -1 ? row[colMap.name] : ''
      let target = colMap.target !== -1 ? row[colMap.target] : ''
      let port = colMap.port !== -1 ? row[colMap.port] : ''
      let env = colMap.env !== -1 ? row[colMap.env] : ''
      let username = colMap.username !== -1 ? row[colMap.username] : ''
      let password = colMap.password !== -1 ? row[colMap.password] : ''
      let remark = colMap.remark !== -1 ? row[colMap.remark] : ''
      let rawType = colMap.type !== -1 ? row[colMap.type] : ''

      if (!hasHeader) {
        row.forEach(cell => {
          if (/^https?:\/\//i.test(cell)) {
            target = cell
          } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(cell)) {
            target = cell
          } else if (/^(root|admin|administrator|oracle|dmdbms|deploy|app)/i.test(cell)) {
            username = cell
          } else if (/^(22|3306|5432|1521|5236|6379|8080|8848|9000|80|443)$/.test(cell)) {
            port = cell
          } else if (/环境|生产|测试|开发|预发|uat|prod|dev|test/i.test(cell)) {
            env = cell
          }
        })
      }

      // 智能识别类型
      let type = 'server'
      const combined = `${name} ${target} ${rawType} ${remark}`.toLowerCase()
      if (/^https?:\/\//i.test(target) || /web|控制台|平台|swagger|nacos|jenkins|dem|portal|前端|后台/i.test(combined)) {
        type = 'web'
      } else if (/inode|vpn|网关|802\.1|校园网|内网认证|拨号/i.test(combined)) {
        type = 'network'
      } else if (/达梦|dm8|dmdbms|oracle|mysql|redis|postgres|db|数据库|中间件/i.test(combined)) {
        type = 'database'
      }

      // 端口提取
      if (target && target.includes(':') && !port) {
        const urlMatch = target.match(/:(\d+)/)
        if (urlMatch) port = urlMatch[1]
      }
      if (type === 'server' && !port) port = '22'
      if (!username) {
        username = type === 'server' ? 'root' : (type === 'web' ? 'admin' : '')
      }

      // 环境归一化
      if (!env) {
        if (/生产|prod|release/i.test(combined)) env = '生产环境'
        else if (/测试|test|qa|uat/i.test(combined)) env = '测试环境'
        else if (/开发|dev/i.test(combined)) env = '开发环境'
        else env = '常规环境'
      }

      const isDefaultPwd = !password || /同上|默认|通用|继承|root/i.test(password.trim())

      assets.push({
        id: 'asset_' + (globalId++),
        type, // 'server' | 'web' | 'network' | 'database'
        name: name || (type === 'server' ? `服务器-${globalId}` : `资产-${globalId}`),
        target: target || '未标注地址',
        port: port || '',
        env: env || '常规环境',
        username: username || '',
        password: isDefaultPwd ? '' : password,
        useDefaultPassword: isDefaultPwd,
        remark: remark || ''
      })
    }
  }

  return assets
}

function parseTextCredentials(rawText) {
  const lines = rawText.split(/\r?\n/)
  const assets = []
  let globalId = 1
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i)
    const ipMatch = trimmed.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?\b/)

    if (urlMatch || ipMatch) {
      if (current) assets.push(current)
      const target = urlMatch ? urlMatch[1] : ipMatch[1]
      const port = urlMatch ? (target.match(/:(\d+)/)?.[1] || '') : (ipMatch[2] || '22')
      const isWeb = Boolean(urlMatch)
      current = {
        id: 'asset_' + (globalId++),
        type: isWeb ? 'web' : 'server',
        name: trimmed.split(/[\s:：]/)[0] || (isWeb ? 'Web系统' : `服务器-${globalId}`),
        target: target,
        port: port,
        env: /生产|prod/i.test(trimmed) ? '生产环境' : /测试|test/i.test(trimmed) ? '测试环境' : '常规环境',
        username: isWeb ? 'admin' : 'root',
        password: '',
        useDefaultPassword: true,
        remark: trimmed
      }
      continue
    }

    if (current) {
      const userMatch = trimmed.match(/(?:账号|用户|user|username)[：:\s]+(\S+)/i)
      if (userMatch) current.username = userMatch[1]
      const pwdMatch = trimmed.match(/(?:密码|口令|password|pwd)[：:\s]+(\S+)/i)
      if (pwdMatch) {
        current.password = pwdMatch[1]
        current.useDefaultPassword = false
      }
      if (/inode|vpn|网络/i.test(trimmed)) current.type = 'network'
      if (/达梦|dm|oracle|mysql|redis/i.test(trimmed)) current.type = 'database'
    }
  }
  if (current) assets.push(current)
  return assets
}

function getCredentialsPath() {
  const config = loadConfig()
  const dir = path.join(config.workspacePath, '_quick_notes')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'server_credentials.json')
}

function getCredentialsMetaPath() {
  const config = loadConfig()
  const dir = path.join(config.workspacePath, '_quick_notes')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'credentials_meta.json')
}

ipcMain.handle('get-server-credentials', async () => {
  const file = getCredentialsPath()
  if (fs.existsSync(file)) {
    return readJsonSafely(file, []) || []
  }
  return []
})

ipcMain.handle('save-server-credentials', async (event, list) => {
  const file = getCredentialsPath()
  const cleanList = Array.isArray(list) ? list : []
  fs.writeFileSync(file, JSON.stringify(cleanList, null, 2), 'utf-8')
  return cleanList
})

ipcMain.handle('get-credentials-meta', async () => {
  const file = getCredentialsMetaPath()
  const cfg = loadConfig()
  const meta = fs.existsSync(file) ? readJsonSafely(file, {}) : {}
  return {
    globalRootPassword: meta.globalRootPassword || '',
    svnWordPath: cfg.svnWordPath || meta.svnWordPath || '',
    categories: Array.isArray(meta.categories) && meta.categories.length > 0
      ? meta.categories
      : ['服务器账号', 'Web网站', 'iNode'],
    inodeAccount: meta.inodeAccount || { username: '', password: '', gateway: '' }
  }
})

ipcMain.handle('save-credentials-meta', async (event, metaUpdates) => {
  const file = getCredentialsMetaPath()
  const existing = fs.existsSync(file) ? readJsonSafely(file, {}) : {}
  const merged = { ...existing, ...metaUpdates }
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf-8')
  if (metaUpdates && metaUpdates.svnWordPath !== undefined) {
    const cfg = loadConfig()
    cfg.svnWordPath = metaUpdates.svnWordPath
    saveConfig(cfg)
  }
  return merged
})

ipcMain.handle('get-svn-doc-config', async () => {
  const cfg = loadConfig()
  return {
    svnWordPath: cfg.svnWordPath || ''
  }
})

ipcMain.handle('save-svn-doc-path', async (event, docPath) => {
  const cfg = loadConfig()
  cfg.svnWordPath = docPath
  saveConfig(cfg)
  return { success: true, svnWordPath: docPath }
})

ipcMain.handle('select-svn-word-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择 SVN 上的服务器账号密码 Word 文档 (.docx)',
    properties: ['openFile'],
    filters: [
      { name: 'Word 文档 (*.docx)', extensions: ['docx'] },
      { name: '所有支持的文件 (*.docx;*.doc;*.txt;*.md)', extensions: ['docx', 'doc', 'txt', 'md'] },
      { name: '所有文件 (*.*)', extensions: ['*'] }
    ]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('update-svn-doc', async (event, targetFile) => {
  const cfg = loadConfig()
  const filePath = targetFile || cfg.svnWordPath
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, message: '未找到已关联的 Word 文件，请先指定正确的本地文件路径。' }
  }

  const dir = path.dirname(filePath)
  const fileName = path.basename(filePath)

  return new Promise((resolve) => {
    exec(`svn update "${fileName}"`, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          message: `未能在命令行直接调用 svn (或此目录非标准 SVN 工作副本)。如果日常使用 TortoiseSVN，可以直接在资源管理器中右键更新。`
        })
      } else {
        resolve({
          success: true,
          message: `SVN 已成功拉取最新！\n${stdout.trim() || '已经是最新版本。'}`
        })
      }
    })
  })
})

ipcMain.handle('parse-word-credentials', async (event, targetPath) => {
  const cfg = loadConfig()
  const filePath = targetPath || cfg.svnWordPath
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, message: '请先配置有效的 Word 账号文档路径。' }
  }

  try {
    const stats = fs.statSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    let servers = []
    let rawXml = ''
    let rawText = ''

    if (ext === '.docx') {
      const AdmZip = require('adm-zip')
      const zip = new AdmZip(filePath)
      const xmlEntry = zip.getEntry('word/document.xml')
      if (!xmlEntry) {
        return { success: false, message: '该 Word 文件未包含标准 word/document.xml 内容' }
      }
      rawXml = zip.readAsText(xmlEntry, 'utf-8')
      servers = parseDocxXml(rawXml)
    } else {
      rawText = fs.readFileSync(filePath, 'utf-8')
      servers = parseTextCredentials(rawText)
    }

    return {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      mtime: stats.mtime.toLocaleString(),
      rawXml,
      rawText,
      assets: servers,
      servers
    }
  } catch (err) {
    return {
      success: false,
      message: '解析失败: ' + err.message
    }
  }
})

ipcMain.handle('open-svn-word-file', async (event, targetPath) => {
  const cfg = loadConfig()
  const filePath = targetPath || cfg.svnWordPath
  if (filePath && fs.existsSync(filePath)) {
    shell.openPath(filePath)
    return true
  }
  return false
})

ipcMain.handle('open-svn-word-dir', async (event, targetPath) => {
  const cfg = loadConfig()
  const filePath = targetPath || cfg.svnWordPath
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath)
    return true
  }
  return false
})
