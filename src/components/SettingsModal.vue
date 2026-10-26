<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
    <div class="app-modal-dialog bg-slate-900 border border-slate-700/80 w-full max-w-4xl h-[660px] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
      
      <!-- 弹窗顶栏 -->
      <div class="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950 flex-shrink-0 select-none">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Settings class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              系统与工作台设置
              <span class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Settings</span>
            </h2>
            <p class="text-[11px] text-slate-400">配置工作区存储、外部 IDE/终端联动、偏好默认值与系统待办</p>
          </div>
        </div>

        <button
          @click="close"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="关闭设置 (Esc)"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 主体内容 (左右双栏架构) -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- 左侧分类侧边栏 -->
        <aside class="w-52 border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-1 select-none flex-shrink-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left"
            :class="activeTab === tab.id
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'"
          >
            <component :is="tab.icon" class="w-4 h-4 flex-shrink-0" />
            <span>{{ tab.label }}</span>
          </button>

          <div class="mt-auto p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div class="flex items-center gap-1.5 text-slate-300 font-medium">
              <HardDrive class="w-3.5 h-3.5 text-emerald-400" />
              <span>本地优先存储</span>
            </div>
            <p class="text-[10px] text-slate-500 leading-relaxed">配置与任务数据 100% 保存在本机，安全无泄露风险。</p>
          </div>
        </aside>

        <!-- 右侧设置详情面板 -->
        <main class="flex-1 overflow-y-auto p-6 bg-slate-900/90 custom-scrollbar">
          
          <!-- 1. 工作区管理 -->
          <div v-if="activeTab === 'workspace'" class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <FolderGit2 class="w-4 h-4 text-emerald-400" />
                工作区物理存储目录
              </h3>
              <p class="text-xs text-slate-400">所有任务文件夹、需求文档、联调笔记和 SQL 脚本均归集存储在此目录下。</p>
            </div>

            <!-- 当前路径大卡片 -->
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  当前工作区路径:
                </span>
                <span class="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  物理连通正常
                </span>
              </div>
              <div class="font-mono text-xs text-slate-200 bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-800 break-all select-all">
                {{ form.workspacePath || '未配置' }}
              </div>
              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  @click="handleSelectWorkspace"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-900/30"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                  <span>浏览更换工作区...</span>
                </button>
                <button
                  type="button"
                  @click="openInExplorer(form.workspacePath)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
                  <span>在资源管理器中打开</span>
                </button>
                <button
                  type="button"
                  @click="openConfigFolder"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium border border-slate-700 transition ml-auto"
                  title="打开 devtaskhub_config.json 所在目录"
                >
                  <Sliders class="w-3.5 h-3.5" />
                  <span>打开配置目录</span>
                </button>
              </div>
            </div>

            <!-- 工作区统计概览 -->
            <div>
              <h4 class="text-xs font-medium text-slate-300 mb-2.5">工作区现状概览</h4>
              <div class="grid grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div class="text-[11px] text-slate-400">已收录任务总数</div>
                  <div class="text-2xl font-bold font-mono text-emerald-400 mt-1">{{ taskStats.totalCount }}</div>
                  <div class="text-[10px] text-slate-500 mt-1">个独立需求文件夹</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div class="text-[11px] text-slate-400">覆盖年份目录</div>
                  <div class="text-2xl font-bold font-mono text-cyan-400 mt-1">{{ taskStats.yearCount }}</div>
                  <div class="text-[10px] text-slate-500 mt-1">{{ taskStats.yearList.join(', ') || '暂无' }}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div class="text-[11px] text-slate-400">归属项目分类</div>
                  <div class="text-2xl font-bold font-mono text-amber-400 mt-1">{{ taskStats.projectCount }}</div>
                  <div class="text-[10px] text-slate-500 mt-1 truncate" :title="taskStats.projectList.join(', ')">
                    {{ taskStats.projectList.join(', ') || '暂无' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 开发工具联动 -->
          <div v-else-if="activeTab === 'devtools'" class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Laptop class="w-4 h-4 text-emerald-400" />
                常用外部开发工具联动
              </h3>
              <p class="text-xs text-slate-400">在任务卡片、文件列表和右键菜单中一键打开代码工程与命令行。</p>
            </div>

            <!-- 代码编辑器 IDE -->
            <div class="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Code2 class="w-4 h-4 text-emerald-400" />
                  首选代码编辑器 (IDE)
                </label>
                <button
                  type="button"
                  @click="testLaunchIDE"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] transition font-medium"
                >
                  <Play class="w-3 h-3" />
                  <span>测试唤起编辑器</span>
                </button>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <label
                  @click="form.ideType = 'code'"
                  class="p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between"
                  :class="form.ideType === 'code'
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-200">VS Code</span>
                    <span v-if="form.ideType === 'code'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <p class="text-[10px] text-slate-500">通过系统 PATH 中的 code 命令唤起</p>
                </label>

                <label
                  @click="form.ideType = 'idea'"
                  class="p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between"
                  :class="form.ideType === 'idea'
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-200">IntelliJ IDEA</span>
                    <span v-if="form.ideType === 'idea'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <p class="text-[10px] text-slate-500">通过 idea64/idea 命令唤起</p>
                </label>

                <label
                  @click="form.ideType = 'custom'"
                  class="p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between"
                  :class="form.ideType === 'custom'
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-200">自定义编辑器</span>
                    <span v-if="form.ideType === 'custom'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <p class="text-[10px] text-slate-500">手动指定任意可执行程序 (.exe)</p>
                </label>
              </div>

              <!-- 自定义可执行程序路径输入 -->
              <div v-if="form.ideType === 'custom'" class="pt-2">
                <div class="flex items-center gap-2">
                  <input
                    v-model="form.customIdePath"
                    type="text"
                    placeholder="例如: C:\Users\xxx\AppData\Local\Programs\cursor\Cursor.exe"
                    class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    @click="chooseCustomIde"
                    class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
                  >
                    浏览 .exe
                  </button>
                </div>
              </div>
            </div>

            <!-- 命令行终端 -->
            <div class="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal class="w-4 h-4 text-emerald-400" />
                  首选命令行终端 (Terminal)
                </label>
                <button
                  type="button"
                  @click="testLaunchTerminal"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] transition font-medium"
                >
                  <Play class="w-3 h-3" />
                  <span>测试唤起终端</span>
                </button>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <label
                  @click="form.terminalType = 'powershell'"
                  class="p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between"
                  :class="form.terminalType === 'powershell'
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-200">PowerShell</span>
                    <span v-if="form.terminalType === 'powershell'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <p class="text-[10px] text-slate-500">Windows 现代化终端 (默认推荐)</p>
                </label>

                <label
                  @click="form.terminalType = 'cmd'"
                  class="p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between"
                  :class="form.terminalType === 'cmd'
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-200">命令提示符 (CMD)</span>
                    <span v-if="form.terminalType === 'cmd'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <p class="text-[10px] text-slate-500">Windows 原生轻量命令行</p>
                </label>

                <label
                  @click="form.terminalType = 'wt'"
                  class="p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between"
                  :class="form.terminalType === 'wt'
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-slate-200">Windows Terminal</span>
                    <span v-if="form.terminalType === 'wt'" class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <p class="text-[10px] text-slate-500">通过 wt 标签页多终端唤起</p>
                </label>
              </div>
            </div>

            <!-- 常用数据库工具配置 -->
            <div class="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Database class="w-4 h-4 text-emerald-400" />
                常用数据库客户端名称 / 路径
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.dbToolName"
                  type="text"
                  placeholder="如: Navicat Premium / DM管理工具 / DBeaver"
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p class="text-[11px] text-slate-500">记录常用客户端，以便在 SQL 管理模块中提供针对性的脚本格式与执行指引。</p>
            </div>
          </div>

          <!-- 3. 偏好与默认值 -->
          <div v-else-if="activeTab === 'preferences'" class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Sliders class="w-4 h-4 text-emerald-400" />
                工作流偏好与新建默认值
              </h3>
              <p class="text-xs text-slate-400">定制日常开发建档与操作的高频默认选项，降低重复输入。</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <!-- 默认所属项目 -->
                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">
                    新建任务默认所属项目
                  </label>
                  <input
                    v-model="form.defaultProject"
                    type="text"
                    placeholder="如: MZ"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <div class="text-[10px] text-slate-500 mt-1">例如: MZ、电商中台、常规项目</div>
                </div>

                <!-- 默认年份 -->
                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">
                    新建任务默认归属年份
                  </label>
                  <input
                    v-model="form.defaultYear"
                    type="text"
                    placeholder="如: 2026"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <div class="text-[10px] text-slate-500 mt-1">新建任务时优先自动预选此年份</div>
                </div>

                <!-- 开发者代号 / 签名 -->
                <div>
                  <label class="block text-xs font-medium text-slate-300 mb-1">
                    开发者姓名 / 代号
                  </label>
                  <input
                    v-model="form.developerName"
                    type="text"
                    placeholder="如: LiSB"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div class="text-[10px] text-slate-500 mt-1">用于周报导出、SQL发布人标注与提交记录</div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-800/80">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <Shield class="w-4 h-4 text-emerald-400" />
                      安全保护: 删除任务时移入系统回收站
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">
                      开启后，删除任务或文件会安全移入 Windows 回收站，防止手误造成不可挽回的物理丢失。
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="form.useTrashCan"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <!-- 配色主题快速设置 -->
              <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Palette class="w-4 h-4 text-emerald-400" />
                    配色主题 (Color Theme)
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    支持洁白、雾灰、钛灰、钴蓝、青绿、VS Code、IDEA、Xcode、Cursor、Claude 等 14 种配色。
                  </p>
                </div>
                <ColorThemeDropdown
                  v-model="form.themeSettings.colorTheme"
                  v-model:custom-color="form.themeSettings.customPrimaryColor"
                  align="right"
                />
              </div>

              <!-- 外观与背景入口 -->
              <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Palette class="w-4 h-4 text-emerald-400" />
                    个性化外观与自定义壁纸
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    支持自定义电脑本地壁纸图片、暗度遮罩调节与磨砂毛玻璃透光质感。
                  </p>
                </div>
                <button
                  type="button"
                  @click="emit('open-theme')"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
                >
                  <Palette class="w-3.5 h-3.5" />
                  <span>自定义壁纸</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 4. 待办路线图 -->
          <div v-else-if="activeTab === 'roadmap'" class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-white mb-0.5 flex items-center gap-2">
                  <BookmarkCheck class="w-4 h-4 text-emerald-400" />
                  DevOrbit 功能迭代待办清单 (Roadmap)
                </h3>
                <p class="text-xs text-slate-400">已梳理记录的提效新特性规划，伴随日常开发持续精进演化。</p>
              </div>
              <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                已沉淀到工作区文档
              </span>
            </div>

            <div class="space-y-3">
              <!-- 批次 1 -->
              <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    第一批：核心研发交付提效 (优先开发)
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    READY
                  </span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span class="text-emerald-400 font-mono">01</span>
                    <div>
                      <span class="font-medium text-slate-200">SQL 脚本一键合并导出</span>
                      <p class="text-[11px] text-slate-400 mt-0.5">将当前任务中多张 SQL 脚本按序号自动串联，输出带回退与事务包裹的标准上线总单 00_merged_all.sql。</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span class="text-emerald-400 font-mono">02</span>
                    <div>
                      <span class="font-medium text-slate-200">一键生成周报 / 交付清单 (周报一键汇总)</span>
                      <p class="text-[11px] text-slate-400 mt-0.5">自动抓取本周变更或完成的任务、关联SQL清单及联调笔记，一键复制格式化周报，省去手动编写烦恼。</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 批次 2 -->
              <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                    第二批：接口小抽屉与配置 Diff
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    PLANNED
                  </span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span class="text-cyan-400 font-mono">03</span>
                    <div>
                      <span class="font-medium text-slate-200">接口小抽屉 (API CheatSheet)</span>
                      <p class="text-[11px] text-slate-400 mt-0.5">在任务中快速沉淀核心接口地址、cURL 与入参示例，支持一键发送轻量 HTTP 测试请求。</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span class="text-cyan-400 font-mono">04</span>
                    <div>
                      <span class="font-medium text-slate-200">SQL 与配置文件差异对比 (Diff 对比视图)</span>
                      <p class="text-[11px] text-slate-400 mt-0.5">直接在工作台双栏对比生产环境与测试环境 SQL 差异，快速发现字段与索引疏漏。</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 批次 3 -->
              <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    第三批：敏捷看板拖拽流转与多环境配置
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    BACKLOG
                  </span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-300">
                  <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span class="text-amber-400 font-mono">05</span>
                    <div>
                      <span class="font-medium text-slate-200">敏捷看板视图 (Kanban 泳道)</span>
                      <p class="text-[11px] text-slate-400 mt-0.5">支持按「开发中」、「提测中」、「待发布」、「已归档」四列泳道直接拖拽卡片变更状态。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. 关于软件与在线更新 -->
          <div v-else-if="activeTab === 'about'" class="space-y-5">
            <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div class="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/60 flex-shrink-0">
                <Terminal class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  DevOrbit
                  <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    v1.3.0 (SQL合并 & SVN凭据版)
                  </span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">星轨 · 专为后端与全栈研发打造的高效离线开发任务工作台与资产管理套件</p>
              </div>

              <button
                type="button"
                @click="emit('open-update-center'); close()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
              >
                <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
                <span>打开更新中心</span>
              </button>
              <button
                type="button"
                @click="checkForUpdates"
                :disabled="isCheckingUpdate"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition shadow-md shadow-emerald-950/40"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isCheckingUpdate }" />
                <span>{{ isCheckingUpdate ? '正在检查...' : '检查新版本' }}</span>
              </button>
            </div>

            <!-- GitHub 检查更新结果反馈区 -->
            <div v-if="updateResult" class="p-4 rounded-xl border transition-all animate-in fade-in"
              :class="updateResult.hasUpdate
                ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200'
                : updateResult.success
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-200'"
            >
              <div v-if="updateResult.hasUpdate" class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles class="w-4 h-4" />
                    <span>🎉 发现 DevOrbit 新版本 {{ updateResult.latestVersion }}！</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">当前: v{{ updateResult.currentVersion || '1.2.0' }}</span>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 whitespace-pre-line max-h-32 overflow-y-auto custom-scrollbar">
                  {{ updateResult.releaseNotes }}
                </div>
                <div class="flex items-center justify-between pt-1">
                  <span class="text-[10px] text-slate-400">
                    发布包: {{ updateResult.assets?.[0]?.name || 'DevOrbit-Windows-x64.zip' }}
                    <span v-if="updateResult.assets?.[0]?.size" class="text-slate-500">
                      ({{ (updateResult.assets[0].size / (1024 * 1024)).toFixed(1) }} MB)
                    </span>
                  </span>
                  <button
                    type="button"
                    @click="openDownloadUrl(updateResult.releaseUrl)"
                    class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition"
                  >
                    <Download class="w-3.5 h-3.5" />
                    <span>前往下载更新</span>
                  </button>
                </div>
              </div>

              <div v-else-if="updateResult.success" class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 class="w-4 h-4" />
                    <span>当前已是最新版本 (v{{ updateResult.currentVersion || '1.2.0' }})，暂无更高版本。</span>
                  </div>
                  <span v-if="updateResult.isPrivateAuthorized" class="text-[10px] text-emerald-400/90 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
                    <Lock class="w-2.5 h-2.5 text-emerald-400" /> 私密鉴权连接成功
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60">
                  <span>云端最新: {{ updateResult.latestVersion }} ({{ updateResult.releaseName }})</span>
                  <span v-if="updateResult.publishedAt">发布时间: {{ formatDate(updateResult.publishedAt) }}</span>
                </div>
              </div>

              <div v-else class="space-y-1.5 text-xs text-rose-300">
                <div class="flex items-center gap-2 font-medium">
                  <AlertCircle class="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>检查更新失败: {{ updateResult.message || '网络连接异常' }}</span>
                </div>
                <p class="text-[10px] text-slate-400 pl-6 leading-relaxed">
                  若仓库已设为私密 (Private)，请在下方填入具有 repo 权限的 GitHub Token，或在系统终端登录 GitHub CLI (`gh auth login`)。
                </p>
              </div>
            </div>

            <!-- GitHub 源码仓库与私密鉴权配置 -->
            <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <ExternalLink class="w-3.5 h-3.5 text-emerald-400" />
                  GitHub 源码仓库与更新源 (Owner/Repo)
                </span>
                <button
                  type="button"
                  @click="openDownloadUrl('https://github.com/' + (form.githubRepo || '1852676265/dev-orbit'))"
                  class="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>访问 GitHub 仓库</span>
                  <ExternalLink class="w-3 h-3" />
                </button>
              </div>
              <input
                v-model="form.githubRepo"
                type="text"
                placeholder="例如: 1852676265/dev-orbit"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />

              <!-- 私密仓库 Token 配置 -->
              <div class="pt-2 border-t border-slate-800/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Key class="w-3.5 h-3.5 text-amber-400" />
                    GitHub 访问令牌 (Personal Access Token)
                  </span>
                  <span class="text-[10px] text-slate-400">私密仓库鉴权用 (可选)</span>
                </div>
                <div class="relative flex items-center">
                  <input
                    v-model="form.githubToken"
                    :type="showToken ? 'text' : 'password'"
                    placeholder="ghp_xxxx 或留空以自动复用本地 GitHub CLI"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    @click="showToken = !showToken"
                    class="absolute right-2.5 text-slate-400 hover:text-slate-200 transition"
                  >
                    <EyeOff v-if="showToken" class="w-3.5 h-3.5" />
                    <Eye v-else class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- 本地 GitHub CLI 智能检测状态提示 -->
                <div v-if="localCliAuth.available" class="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300">
                  <ShieldCheck class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span class="flex-1">
                    已自动识别本地 GitHub CLI 登录凭证（账号：<b class="text-emerald-200 font-mono">{{ localCliAuth.user }}</b>）。即使仓库私密，也支持免密自动检查更新！
                  </span>
                </div>
                <div v-else class="text-[10px] text-slate-500 leading-relaxed">
                  提示：如果仓库是私密 (Private) 仓库，建议填入一个具有 <code class="text-slate-400 font-mono">repo</code> 权限的 GitHub Token，或者本机在终端运行过 <code class="text-slate-400 font-mono">gh auth login</code>。
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="text-xs font-semibold text-slate-300">核心架构与理念</h4>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div class="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <HardDrive class="w-3.5 h-3.5" />
                    纯本地优先 (Local-First)
                  </div>
                  <p class="text-[11px] text-slate-400 leading-relaxed">
                    完全脱离云端数据库与外部网络依赖，无数据泄露风险。代码、文档、SQL 全部物理归整在你的专属硬盘中。
                  </p>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div class="text-xs font-medium text-cyan-400 flex items-center gap-1.5">
                    <FileCode class="w-3.5 h-3.5" />
                    文件夹即工程资产
                  </div>
                  <p class="text-[11px] text-slate-400 leading-relaxed">
                    不绑定任何私有专有数据格式。每个任务都是标准 Markdown、SQL、截图附件与 task.json 元数据，随时可迁移归档。
                  </p>
                </div>
              </div>
            </div>

            <!-- 快捷键指南 -->
            <div class="space-y-2">
              <h4 class="text-xs font-semibold text-slate-300">常用快捷键速查</h4>
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/80 text-xs">
                <div class="py-2 flex items-center justify-between">
                  <span class="text-slate-300">全局极速全文搜索 (需求文档、SQL与命令)</span>
                  <kbd class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">Ctrl + K</kbd>
                </div>
                <div class="py-2 flex items-center justify-between">
                  <span class="text-slate-300">关闭当前弹窗 / 退出全屏预览</span>
                  <kbd class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">Esc</kbd>
                </div>
                <div class="py-2 flex items-center justify-between">
                  <span class="text-slate-300">任务卡片右键菜单</span>
                  <span class="text-slate-400 text-[11px]">鼠标右键卡片唤出快捷 IDE / 终端 / 导出菜单</span>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      <!-- 弹窗底栏操作区 -->
      <div class="h-14 px-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>配置文件: <code class="font-mono text-[11px] text-slate-300">devorbit_config.json</code></span>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="close"
            class="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSave"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-900/30"
          >
            <Check class="w-3.5 h-3.5" />
            <span>保存并应用设置</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import {
  Settings, FolderGit2, Laptop, Sliders, BookmarkCheck,
  FolderOpen, ExternalLink, HardDrive, Code2, Terminal,
  Database, Shield, FileCode, Check, X, Play, Palette,
  RefreshCw, Sparkles, Download, CheckCircle2,
  Key, Eye, EyeOff, Lock, ShieldCheck, AlertCircle
} from 'lucide-vue-next'
import ColorThemeDropdown from './ColorThemeDropdown.vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  years: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['saved', 'workspace-changed', 'toast', 'open-theme', 'open-update-center'])

const isOpen = ref(false)
const activeTab = ref('workspace')
const isCheckingUpdate = ref(false)
const updateResult = ref(null)
const showToken = ref(false)
const localCliAuth = ref({ available: false, hasToken: false, user: '' })

const tabs = [
  { id: 'workspace', label: '工作区管理', icon: FolderGit2 },
  { id: 'devtools', label: '开发工具联动', icon: Laptop },
  { id: 'preferences', label: '偏好与默认值', icon: Sliders },
  { id: 'roadmap', label: '功能待办路线图', icon: BookmarkCheck },
  { id: 'about', label: '关于软件', icon: Settings }
]

const form = reactive({
  workspacePath: '',
  ideType: 'code',
  customIdePath: '',
  terminalType: 'powershell',
  dbToolName: 'Navicat / DM管理工具',
  customDbToolPath: '',
  developerName: 'LiSB',
  defaultProject: 'MZ',
  defaultYear: '2026',
  useTrashCan: true,
  githubRepo: '1852676265/dev-orbit',
  githubToken: '',
  themeSettings: {
    colorTheme: 'emerald',
    customPrimaryColor: '#10b981'
  }
})

// 统计信息
const taskStats = computed(() => {
  const totalCount = props.tasks.length
  const ySet = new Set(props.years)
  const pSet = new Set()
  for (const t of props.tasks) {
    if (t.year) ySet.add(t.year)
    if (t.project) pSet.add(t.project)
  }
  return {
    totalCount,
    yearCount: ySet.size,
    yearList: Array.from(ySet).sort().reverse(),
    projectCount: pSet.size,
    projectList: Array.from(pSet)
  }
})

async function open(defaultTab = 'workspace') {
  activeTab.value = defaultTab
  try {
    const config = await window.electronAPI.getAppConfig()
    if (config) {
      Object.assign(form, config)
      if (config.themeSettings) {
        form.themeSettings = {
          colorTheme: 'emerald',
          customPrimaryColor: '#10b981',
          ...config.themeSettings
        }
      }
    }
  } catch (err) {
    console.error('获取设置失败', err)
  }

  // 异步检测本地 GitHub CLI 凭证状态
  try {
    localCliAuth.value = await window.electronAPI.detectGitHubCliAuth()
  } catch (e) {
    localCliAuth.value = { available: false, hasToken: false }
  }

  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function handleSelectWorkspace() {
  const newPath = await window.electronAPI.selectWorkspaceDir()
  if (newPath) {
    form.workspacePath = newPath
    emit('workspace-changed', newPath)
    emit('toast', `工作区已切换为: ${newPath}`)
  }
}

function openInExplorer(path) {
  if (path) {
    window.electronAPI.openInExplorer(path)
  }
}

async function openConfigFolder() {
  await window.electronAPI.openConfigFolder()
}

async function chooseCustomIde() {
  const filePath = await window.electronAPI.selectFileDialog({
    title: '选择代码编辑器可执行程序 (.exe)',
    filters: [
      { name: '可执行程序 (*.exe)', extensions: ['exe'] },
      { name: '所有文件 (*.*)', extensions: ['*'] }
    ]
  })
  if (filePath) {
    form.customIdePath = filePath
    form.ideType = 'custom'
  }
}

async function testLaunchIDE() {
  try {
    // 先暂存当前表单选型
    await window.electronAPI.saveAppConfig({
      ideType: form.ideType,
      customIdePath: form.customIdePath
    })
    const res = await window.electronAPI.testLaunchIDE()
    emit('toast', res.message || 'IDE 唤起命令已发送', 'info')
  } catch (err) {
    emit('toast', '调起 IDE 失败: ' + err.message, 'error')
  }
}

async function testLaunchTerminal() {
  try {
    await window.electronAPI.saveAppConfig({
      terminalType: form.terminalType
    })
    const res = await window.electronAPI.testLaunchTerminal()
    emit('toast', res.message || '终端已启动', 'info')
  } catch (err) {
    emit('toast', '启动终端失败: ' + err.message, 'error')
  }
}

function formatDate(str) {
  if (!str) return ''
  try {
    const d = new Date(str)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch (e) {
    return str
  }
}

async function checkForUpdates() {
  isCheckingUpdate.value = true
  updateResult.value = null
  try {
    const res = await window.electronAPI.checkGitHubUpdate(form.githubRepo, form.githubToken)
    updateResult.value = res
    if (res.hasUpdate) {
      emit('toast', `🎉 发现 DevOrbit 新版本 ${res.latestVersion}！`, 'info')
    } else if (res.success) {
      emit('toast', '当前已是最新版本 (云端最新: ' + (res.latestVersion || 'v1.3.0') + ')', 'success')
    } else {
      emit('toast', res.message || '检查更新失败', 'error')
    }
  } catch (err) {
    updateResult.value = { success: false, message: err.message }
    emit('toast', '检查更新出错: ' + err.message, 'error')
  } finally {
    isCheckingUpdate.value = false
  }
}

function openDownloadUrl(url) {
  if (url) {
    window.electronAPI.openExternalUrl(url)
  }
}

async function handleSave() {
  try {
    const rawConfig = JSON.parse(JSON.stringify(form))
    const saved = await window.electronAPI.saveAppConfig(rawConfig)
    emit('saved', saved)
    emit('toast', '设置已成功保存并立即生效！', 'success')
    close()
  } catch (err) {
    emit('toast', '保存设置失败: ' + err.message, 'error')
  }
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 1);
}
</style>