<div align="center">

# 🌌 DevOrbit (星轨)

**专为后端与全栈研发打造的高效离线开发任务工作台与资产管理套件**

*The local-first developer orbit for code, tasks, notes, and SQL release.*

[![Electron](https://img.shields.io/badge/Electron-31.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Local--First](https://img.shields.io/badge/Architecture-Local--First-10B981)](#-核心架构与理念)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 🌟 核心特性 (Features)

- **🛡️ 纯本地优先 (Local-First)**：零云端数据库依赖，代码、文档、SQL 全部物理归整在你的专属本地硬盘中，绝无任何数据外泄风险。
- **📁 文件夹即工程资产**：不绑定私有格式。每个需求任务都是标准文件夹（包含需求 Markdown、联调笔记、SQL 发布脚本与附件截图），随心移动归档。
- **🎨 全局配色与顶栏侧边栏联动**：
  - **经典色系**：洁白（白昼极简高透）、雾灰、钛灰、钴蓝、青绿（默认）、暖黄、樱粉；
  - **开发工具主题**：VS Code、IntelliJ IDEA、Xcode、JetBrains、Cursor、Claude Code；
  - **自由定制**：内置 Hex 自由色彩拾取器，全软件主按钮、顶栏、侧边栏、高光与光晕实时联动。
- **💎 超透直透背景与自定义壁纸**：支持任意本地壁纸图片上传，独家提供 `💎 超透直透`（0 模糊，文字轮廓高对比增强，背景壁纸高清无死角）、磨砂玻璃与一键沉浸壁纸观赏模式。
- **🗄️ SQL 脚本全生命周期管理**：直观展示 DEV / TEST / PROD 各阶段发布状态，告别微信/文档漏发 SQL 造成的产线故障。
- **⚡ 外部开发工具深度联动**：任务卡片与右键菜单支持一键调起 VS Code、IntelliJ IDEA、Cursor 以及 Windows Terminal / PowerShell 命令行定位工作目录。
- **🚀 GitHub 在线自动更新**：基于 GitHub Releases 开放接口，软件启动自动静默检测或一键手动检查新版本，告别手动传包升级烦恼。

---

## 🚀 快速启动与本地开发 (Quick Start)

### 环境要求
- [Node.js](https://nodejs.org/) (推荐 v18.0 或更高版本)
- npm / yarn / pnpm

### 1. 克隆代码仓库
```bash
git clone https://github.com/1852676265/dev-orbit.git
cd dev-orbit
```

### 2. 安装项目依赖
```bash
npm install
```

### 3. 本地启动开发模式
```bash
npm run dev
```

### 4. 编译打包生成 Windows 可执行程序 (.exe)
```bash
npm run pack:exe
```
打包成功后，可执行程序将生成在 `release/DevOrbit-win32-x64/DevOrbit.exe`。

---

## 📦 GitHub Release 在线更新机制说明

DevOrbit 内置了无服务器依赖的轻量级 GitHub 自动检查更新机制：
1. 当您在 GitHub 仓库发布新的 Release 标签（例如 `v1.2.0`），并上传打包好的 `DevOrbit.exe` 或压缩包；
2. 其他用户打开软件或在 **「系统设置」->「关于软件」** 中点击 **【检查新版本】**；
3. 软件将自动读取最新版本号与更新日志，提示一键前往下载升级。

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源协议。
