<template>
  <div
    v-if="isOpen && task"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDropFiles"
  >
    <div class="app-modal-dialog bg-slate-800 border border-slate-700 w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
      
      <!-- 拖拽文件进入时的高亮发光提示蒙层 -->
      <div
        v-if="isDragging"
        class="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-100"
      >
        <div class="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2 max-w-md shadow-2xl">
          <UploadCloud class="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
          <h3 class="text-base font-bold text-slate-100">
            释放鼠标，直接保存至当前任务
          </h3>
          <p class="text-xs text-slate-400">
            文件将自动保存至：
            <span class="font-mono text-emerald-400 font-bold">
              {{ activeTab === 'sql' ? 'sql/' : 'docs/' }}
            </span>
            目录并立即识别展示
          </p>
        </div>
      </div>
      
      <!-- 弹窗顶栏 -->
      <div class="px-6 py-3.5 bg-slate-900/80 border-b border-slate-700/80 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-slate-700/80 text-amber-300 border border-slate-600/50">
            📁 {{ task.year }}年
          </span>
          <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
            {{ task.title }}
          </h2>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
            {{ task.project || '常规项目' }}
          </span>
        </div>

        <!-- 顶栏右侧：任务内容搜索 + 系统工具入口 -->
        <div class="flex items-center gap-2">
          <!-- 本任务内容搜索按钮 -->
          <button
            @click="taskSearch.visible = !taskSearch.visible"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition border"
            :class="taskSearch.visible ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600/50'"
            title="搜索本任务下所有文件中的内容（代码、接口、文字）"
          >
            <Search class="w-3.5 h-3.5 text-emerald-400" />
            <span>搜本任务内容</span>
          </button>

          <button
            @click="openExplorer"
            title="在 Windows 资源管理器中打开此文件夹"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-600/50"
          >
            <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            <span>打开文件夹</span>
          </button>
          <button
            @click="openIDE"
            title="在 VS Code / 编辑器中打开"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-600/50"
          >
            <Code2 class="w-3.5 h-3.5 text-blue-400" />
            <span>IDE 打开</span>
          </button>
          <button
            @click="openTerminal"
            title="在此目录打开终端"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-600/50"
          >
            <Terminal class="w-3.5 h-3.5 text-purple-400" />
            <span>命令行</span>
          </button>
          <button @click="close" class="p-1.5 text-slate-400 hover:text-slate-100 transition rounded-lg hover:bg-slate-700/50 ml-2">
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 本任务内容搜索抽屉栏 (文件内容精准检索与行定位) -->
      <div v-if="taskSearch.visible" class="px-6 py-3 bg-slate-950/90 border-b border-slate-700/80 flex flex-col gap-2 flex-shrink-0 animate-in slide-in-from-top-2 duration-150">
        <div class="flex items-center gap-2">
          <Search class="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <input
            v-model="taskSearch.query"
            @input="handleTaskContentSearch"
            type="text"
            placeholder="在当前任务的所有 SQL、需求、笔记中搜索内容（输入如: ALTER TABLE, 手机号, 接口字段）..."
            class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <span class="text-xs text-slate-400 font-mono">
            {{ taskSearch.results.length }} 条命中
          </span>
          <button @click="taskSearch.visible = false" class="text-slate-400 hover:text-slate-200 p-1">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- 搜索结果列表 -->
        <div v-if="taskSearch.results.length > 0" class="max-h-40 overflow-y-auto space-y-1 pr-1 mt-1">
          <div
            v-for="(res, idx) in taskSearch.results"
            :key="idx"
            @click="openFileFromSearch(res)"
            class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 text-xs cursor-pointer group transition"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                {{ res.category }}
              </span>
              <span class="font-mono font-medium text-slate-200 truncate group-hover:text-emerald-300">
                {{ res.fileName }}
              </span>
              <span class="text-[10px] text-amber-300 font-mono bg-slate-800 px-1.5 py-0.2 rounded">
                第 {{ res.lineNum }} 行
              </span>
              <span class="text-slate-400 font-mono text-[11px] truncate flex-1">
                {{ res.lineContent }}
              </span>
            </div>
            <span class="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition ml-2 flex-shrink-0 flex items-center gap-0.5">
              <Eye class="w-3 h-3" /> 点击打开
            </span>
          </div>
        </div>
      </div>

      <!-- Tab 切换：1.任务需求 2.任务笔记 3.SQL脚本 -->
      <div class="px-6 border-b border-slate-700/60 bg-slate-800/60 flex items-center justify-between flex-shrink-0">
        <div class="flex gap-2">
          <!-- 1. 任务需求 -->
          <button
            @click="switchTab('requirement')"
            class="py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition"
            :class="activeTab === 'requirement' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            <ScrollText class="w-4 h-4" />
            <span>1. 任务需求 ({{ reqFiles.length }})</span>
          </button>

          <!-- 2. 任务笔记 -->
          <button
            @click="switchTab('note')"
            class="py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition"
            :class="activeTab === 'note' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            <BookOpen class="w-4 h-4" />
            <span>2. 任务笔记 ({{ noteFiles.length }})</span>
          </button>

          <!-- 3. SQL 脚本 -->
          <button
            @click="switchTab('sql')"
            class="py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition"
            :class="activeTab === 'sql' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            <Database class="w-4 h-4" />
            <span>3. SQL 脚本 ({{ sqlList.length }})</span>
            <span
              v-if="task.prodPendingCount > 0"
              class="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-mono"
            >
              待发布 {{ task.prodPendingCount }}
            </span>
          </button>
        </div>

        <!-- 任务状态流转选择器 -->
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400">状态:</span>
          <select
            v-model="task.status"
            @change="handleStatusChange"
            class="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="developing">🛠️ 开发进行中</option>
            <option value="testing">🧪 联调测试中</option>
            <option value="release_ready">🚀 待发布上线</option>
            <option value="archived">📦 已归档/已上线</option>
          </select>
        </div>
      </div>

      <!-- Tab 内容区 -->
      <div class="flex-1 overflow-y-auto p-5 bg-slate-900/40">
        
        <!-- ==================== TAB 3: SQL 脚本列表 (单行排版，无复制按钮，支持删除与搜索) ==================== -->
        <div v-if="activeTab === 'sql'" class="space-y-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs text-slate-400 flex items-center gap-1.5">
              <Info class="w-3.5 h-3.5 text-slate-400" />
              本地路径: <span class="font-mono text-slate-300">{{ task.dirName }}/sql/</span>
              （点击 SQL 名称即可在软件内直接打开查看与编辑）
            </p>

            <div class="flex items-center gap-2">
              <!-- 文件名搜索过滤框 -->
              <div class="relative w-48">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  v-model="sqlSearchQuery"
                  type="text"
                  placeholder="搜索 SQL 文件..."
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  v-if="sqlSearchQuery"
                  @click="sqlSearchQuery = ''"
                  class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200"
                  title="清除"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                @click="loadSqls"
                class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1"
              >
                <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': loadingSqls }" />
                刷新
              </button>
              <button
                @click="openNewFileModal('sql')"
                class="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded flex items-center gap-1 shadow"
              >
                <Plus class="w-3.5 h-3.5" />
                新建 SQL
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredSqlList.length === 0" class="text-center py-16 border border-dashed border-slate-700/60 rounded-xl bg-slate-800/20">
            <Database class="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p class="text-xs text-slate-400 font-medium">
              {{ sqlSearchQuery ? '没有匹配的 SQL 脚本' : '该任务目录下暂无 SQL 脚本' }}
            </p>
            <p class="text-[11px] text-slate-500 mt-1">
              点击右上角“新建 SQL”，或把 .sql 文件放进 <span class="font-mono text-emerald-400">{{ task.dirName }}\sql</span>
            </p>
          </div>

          <!-- 单行列表排版 (一行一个 SQL，无外层复制，增加删除与打开) -->
          <div v-else class="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-800/60 divide-y divide-slate-700/60">
            <div
              v-for="sql in filteredSqlList"
              :key="sql.fileName"
              class="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-slate-700/40 transition group"
            >
              <!-- 左侧：文件名与大小，点击直接在软件里打开 -->
              <div
                @click="openFileInEditor(sql.filePath, sql.fileName, 'sql')"
                class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                title="点击在软件内打开此 SQL 文件"
              >
                <span class="p-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex-shrink-0">
                  <FileCode2 class="w-4 h-4" />
                </span>
                <span class="font-mono text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition truncate">
                  {{ sql.fileName }}
                </span>
                <span class="text-[11px] text-slate-500 font-mono flex-shrink-0">
                  ({{ (sql.size / 1024).toFixed(1) }} KB)
                </span>
                <span class="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 flex-shrink-0">
                  <Eye class="w-3 h-3" /> 打开
                </span>
              </div>

              <!-- 中间：发布状态打勾与时间戳 -->
              <div class="flex items-center gap-3 flex-shrink-0">
                <!-- 测试环境状态 -->
                <div class="flex items-center gap-1.5 text-xs bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/50">
                  <span class="w-2 h-2 rounded-full" :class="sql.testReleased ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                  <span class="text-[11px] text-slate-400">测试:</span>
                  <span v-if="sql.testReleased" class="text-[11px] text-slate-300 font-mono">
                    {{ sql.testReleasedAt?.split(' ')[1] || '已发' }}
                  </span>
                  <button
                    @click.stop="toggleSqlStatus(sql, 'test')"
                    class="px-1.5 py-0.2 rounded text-[10px] font-medium transition ml-1"
                    :class="sql.testReleased ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                  >
                    {{ sql.testReleased ? '已发' : '未发' }}
                  </button>
                </div>

                <!-- 生产环境状态 -->
                <div class="flex items-center gap-1.5 text-xs bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/50">
                  <span class="w-2 h-2 rounded-full" :class="sql.prodReleased ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                  <span class="text-[11px] text-slate-400">生产:</span>
                  <span v-if="sql.prodReleased" class="text-[11px] text-slate-300 font-mono">
                    {{ sql.prodReleasedAt?.split(' ')[1] || '已发' }}
                  </span>
                  <button
                    @click.stop="toggleSqlStatus(sql, 'prod')"
                    class="px-1.5 py-0.2 rounded text-[10px] font-medium transition ml-1"
                    :class="sql.prodReleased ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'"
                  >
                    {{ sql.prodReleased ? '已发' : '未发' }}
                  </button>
                </div>
              </div>

              <!-- 右侧操作按钮组：打开、定位与删除 -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <!-- 在软件内打开 -->
                <button
                  @click.stop="openFileInEditor(sql.filePath, sql.fileName, 'sql')"
                  class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition flex items-center gap-1"
                  title="在软件内置编辑器中查看与编辑"
                >
                  <FileEdit class="w-3.5 h-3.5 text-emerald-400" />
                  <span>打开</span>
                </button>
                <!-- 在文件夹中定位 -->
                <button
                  @click.stop="showItemInFolder(sql.filePath)"
                  class="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-700 transition"
                  title="在文件夹中高亮定位此 SQL 文件"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                </button>
                <!-- 删除文件 -->
                <button
                  @click.stop="handleDeleteFile(sql.filePath, sql.fileName, 'sql')"
                  class="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 transition"
                  title="删除此 SQL 文件"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 1: 任务需求列表 (单行排版，支持搜索与删除) ==================== -->
        <div v-if="activeTab === 'requirement'" class="space-y-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs text-slate-400 flex items-center gap-1.5">
              <ScrollText class="w-3.5 h-3.5 text-emerald-400" />
              本地目录: <span class="font-mono text-slate-300">{{ task.dirName }}/docs/</span>
              （点击需求文档即可在软件内置编辑器中打开查看与编辑）
            </p>

            <div class="flex items-center gap-2">
              <!-- 文件名搜索过滤框 -->
              <div class="relative w-48">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  v-model="reqSearchQuery"
                  type="text"
                  placeholder="搜索需求文档..."
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  v-if="reqSearchQuery"
                  @click="reqSearchQuery = ''"
                  class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200"
                  title="清除"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                @click="loadDocs"
                class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1"
              >
                <RefreshCw class="w-3 h-3" />
                刷新
              </button>
              <button
                @click="openNewFileModal('requirement')"
                class="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded flex items-center gap-1 shadow"
              >
                <Plus class="w-3.5 h-3.5" />
                新建需求文档
              </button>
            </div>
          </div>

          <div v-if="filteredReqFiles.length === 0" class="text-center py-16 border border-dashed border-slate-700/60 rounded-xl bg-slate-800/20">
            <ScrollText class="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p class="text-xs text-slate-400 font-medium">
              {{ reqSearchQuery ? '没有匹配的需求文档' : '暂无需求文档' }}
            </p>
            <button @click="openNewFileModal('requirement')" class="mt-2 text-xs text-emerald-400 underline">新建需求文档</button>
          </div>

          <!-- 单行列表排版 (一行一个需求文档，智能识别 Word / 纯文本) -->
          <div v-else class="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-800/60 divide-y divide-slate-700/60">
            <div
              v-for="file in filteredReqFiles"
              :key="file.fileName"
              class="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-slate-700/40 transition group cursor-pointer"
              @click="handleFileClick(file, 'doc')"
            >
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="p-1 rounded flex-shrink-0 border" :class="getFileTypeInfo(file.fileName).iconClass">
                  <component :is="getFileIconComponent(file.fileName)" class="w-4 h-4" />
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border flex-shrink-0" :class="getFileTypeInfo(file.fileName).badgeClass">
                  {{ getFileTypeInfo(file.fileName).label }}
                </span>
                <span class="font-mono text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition truncate">
                  {{ file.fileName }}
                </span>
                <span class="text-[11px] text-slate-500 font-mono flex-shrink-0">
                  ({{ (file.size / 1024).toFixed(1) }} KB)
                </span>
                <span class="text-[11px] text-slate-500 font-mono flex-shrink-0 ml-3">
                  更新: {{ file.updatedAt }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 flex-shrink-0">
                <!-- 二进制文档：Word打开 / Excel打开 / 本地打开 -->
                <button
                  v-if="getFileTypeInfo(file.fileName).isBinary"
                  @click.stop="openNativeApp(file.filePath, file.fileName)"
                  class="px-2.5 py-1 text-xs rounded transition flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white font-medium shadow-sm"
                  :title="`调用本地关联程序打开 ${file.fileName}`"
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                  <span>{{ getFileTypeInfo(file.fileName).type === 'word' ? 'Word打开' : (getFileTypeInfo(file.fileName).type === 'excel' ? 'Excel打开' : '本地打开') }}</span>
                </button>

                <!-- 纯文本：打开编辑 -->
                <button
                  v-else
                  @click.stop="openFileInEditor(file.filePath, file.fileName, 'doc')"
                  class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition flex items-center gap-1"
                  title="在内置编辑器中查看与编辑"
                >
                  <FileEdit class="w-3.5 h-3.5 text-emerald-400" />
                  <span>打开编辑</span>
                </button>

                <!-- 详情/卡片说明 -->
                <button
                  @click.stop="openFileInEditor(file.filePath, file.fileName, 'doc')"
                  class="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700 transition"
                  title="在软件内置窗口中查看属性"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <!-- 在文件夹中定位 -->
                <button
                  @click.stop="showItemInFolder(file.filePath)"
                  class="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-700 transition"
                  title="在资源管理器中定位此文件"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                </button>

                <!-- 删除按钮 -->
                <button
                  @click.stop="handleDeleteFile(file.filePath, file.fileName, 'doc')"
                  class="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 transition"
                  title="删除此文档"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: 任务笔记列表 (单行排版，支持搜索与删除) ==================== -->
        <div v-if="activeTab === 'note'" class="space-y-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs text-slate-400 flex items-center gap-1.5">
              <BookOpen class="w-3.5 h-3.5 text-amber-400" />
              本地目录: <span class="font-mono text-slate-300">{{ task.dirName }}/docs/</span>
              （点击笔记文档即可在软件内置编辑器中打开查看与编辑）
            </p>

            <div class="flex items-center gap-2">
              <!-- 文件名搜索过滤框 -->
              <div class="relative w-48">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  v-model="noteSearchQuery"
                  type="text"
                  placeholder="搜索笔记文档..."
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  v-if="noteSearchQuery"
                  @click="noteSearchQuery = ''"
                  class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200"
                  title="清除"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                @click="loadDocs"
                class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1"
              >
                <RefreshCw class="w-3 h-3" />
                刷新
              </button>
              <button
                @click="openNewFileModal('note')"
                class="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded flex items-center gap-1 shadow"
              >
                <Plus class="w-3.5 h-3.5" />
                新建笔记文件
              </button>
            </div>
          </div>

          <div v-if="filteredNoteFiles.length === 0" class="text-center py-16 border border-dashed border-slate-700/60 rounded-xl bg-slate-800/20">
            <BookOpen class="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p class="text-xs text-slate-400 font-medium">
              {{ noteSearchQuery ? '没有匹配的笔记文件' : '暂无笔记文件' }}
            </p>
            <button @click="openNewFileModal('note')" class="mt-2 text-xs text-emerald-400 underline">新建笔记文件</button>
          </div>

          <!-- 单行列表排版 (一行一个笔记，智能识别 Word / 纯文本) -->
          <div v-else class="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-800/60 divide-y divide-slate-700/60">
            <div
              v-for="file in filteredNoteFiles"
              :key="file.fileName"
              class="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-slate-700/40 transition group cursor-pointer"
              @click="handleFileClick(file, 'doc')"
            >
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="p-1 rounded flex-shrink-0 border" :class="getFileTypeInfo(file.fileName).iconClass">
                  <component :is="getFileIconComponent(file.fileName)" class="w-4 h-4" />
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border flex-shrink-0" :class="getFileTypeInfo(file.fileName).badgeClass">
                  {{ getFileTypeInfo(file.fileName).label }}
                </span>
                <span class="font-mono text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition truncate">
                  {{ file.fileName }}
                </span>
                <span class="text-[11px] text-slate-500 font-mono flex-shrink-0">
                  ({{ (file.size / 1024).toFixed(1) }} KB)
                </span>
                <span class="text-[11px] text-slate-500 font-mono flex-shrink-0 ml-3">
                  更新: {{ file.updatedAt }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 flex-shrink-0">
                <!-- 二进制文档：Word打开 / Excel打开 / 本地打开 -->
                <button
                  v-if="getFileTypeInfo(file.fileName).isBinary"
                  @click.stop="openNativeApp(file.filePath, file.fileName)"
                  class="px-2.5 py-1 text-xs rounded transition flex items-center gap-1 bg-amber-600/80 hover:bg-amber-600 text-white font-medium shadow-sm"
                  :title="`调用本地关联程序打开 ${file.fileName}`"
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                  <span>{{ getFileTypeInfo(file.fileName).type === 'word' ? 'Word打开' : (getFileTypeInfo(file.fileName).type === 'excel' ? 'Excel打开' : '本地打开') }}</span>
                </button>

                <!-- 纯文本：打开编辑 -->
                <button
                  v-else
                  @click.stop="openFileInEditor(file.filePath, file.fileName, 'doc')"
                  class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition flex items-center gap-1"
                  title="在内置编辑器中查看与编辑"
                >
                  <FileEdit class="w-3.5 h-3.5 text-amber-400" />
                  <span>打开编辑</span>
                </button>

                <!-- 详情/卡片说明 -->
                <button
                  @click.stop="openFileInEditor(file.filePath, file.fileName, 'doc')"
                  class="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700 transition"
                  title="在软件内置窗口中查看属性"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <!-- 在文件夹中定位 -->
                <button
                  @click.stop="showItemInFolder(file.filePath)"
                  class="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-700 transition"
                  title="在资源管理器中定位此文件"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                </button>

                <!-- 删除按钮 -->
                <button
                  @click.stop="handleDeleteFile(file.filePath, file.fileName, 'doc')"
                  class="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 transition"
                  title="删除此笔记"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ==================== 内置弹层：软件内直接查看与编辑文件 (支持文件内容搜索定位) ==================== -->
    <div v-if="editorModal.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div class="app-modal-dialog bg-slate-900 border border-slate-700 w-full max-w-4xl h-[86vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        <!-- 编辑器顶栏 -->
        <div class="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="p-1 rounded border flex-shrink-0" :class="editorModal.fileInfo?.iconClass || 'text-emerald-400 bg-slate-800 border-slate-700'">
              <component :is="getFileIconComponent(editorModal.fileName)" class="w-4 h-4" />
            </span>
            <span v-if="editorModal.fileInfo" class="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border flex-shrink-0" :class="editorModal.fileInfo.badgeClass">
              {{ editorModal.fileInfo.label }}
            </span>
            <h3 class="font-mono text-sm font-bold text-slate-100 truncate">
              {{ editorModal.fileName }}
            </h3>
          </div>

          <!-- 纯文本模式：文件内搜索栏工具条 -->
          <div v-if="!editorModal.isBinary" class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Search class="w-3.5 h-3.5 text-slate-400" />
            <input
              ref="editorSearchInputRef"
              v-model="editorSearch.query"
              @input="handleEditorSearch"
              @keydown.enter="jumpNextMatch"
              @keydown.esc="clearEditorSearch"
              type="text"
              placeholder="文件内查找关键字 (Enter 下一个, ESC 清除)..."
              class="bg-transparent text-xs text-slate-200 placeholder-slate-500 w-52 focus:outline-none"
            />
            <!-- 一键清除按钮 -->
            <button
              v-if="editorSearch.query"
              @click="clearEditorSearch"
              class="p-0.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition flex-shrink-0"
              title="清除搜索 (ESC)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
            <span v-if="editorSearch.query" class="text-[10px] text-slate-400 font-mono flex-shrink-0">
              {{ editorSearch.matches.length > 0 ? `${editorSearch.currentIndex + 1}/${editorSearch.matches.length} 处` : '无匹配' }}
            </span>
            <div v-if="editorSearch.matches.length > 0" class="flex items-center gap-0.5 flex-shrink-0">
              <button
                @click="jumpPrevMatch"
                title="上一个匹配"
                class="p-0.5 hover:bg-slate-800 text-slate-300 rounded text-xs"
              >
                ▲
              </button>
              <button
                @click="jumpNextMatch"
                title="下一个匹配"
                class="p-0.5 hover:bg-slate-800 text-slate-300 rounded text-xs"
              >
                ▼
              </button>
            </div>
          </div>

          <!-- 右侧动作按钮 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- 二进制文件动作：调用本地程序打开 + 定位 -->
            <template v-if="editorModal.isBinary">
              <button
                @click="openNativeApp(editorModal.filePath, editorModal.fileName)"
                class="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1.5 shadow"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>{{ editorModal.fileInfo?.type === 'word' ? 'Word打开' : '本地程序打开' }}</span>
              </button>
              <button
                @click="showItemInFolder(editorModal.filePath)"
                class="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 flex items-center gap-1"
                title="在 Windows 资源管理器中高亮定位"
              >
                <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
                <span>定位文件</span>
              </button>
            </template>

            <!-- 纯文本动作：复制全部 + 保存修改 -->
            <template v-else>
              <button
                @click="copyContent(editorModal.content)"
                class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 flex items-center gap-1 shadow-sm active:scale-95"
                title="复制全部文件内容"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>复制全部</span>
              </button>
              <button
                @click="saveEditorContent"
                :disabled="editorModal.saving"
                class="px-4 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition flex items-center gap-1.5 shadow"
              >
                <Save class="w-3.5 h-3.5" />
                <span>{{ editorModal.saving ? '保存中...' : '保存修改' }}</span>
              </button>
            </template>

            <button
              @click="editorModal.visible = false"
              class="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 ml-1"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- 二进制文档展示卡片 (告别乱码与文件损坏) -->
        <div v-if="editorModal.isBinary" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80">
          <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl max-w-lg w-full flex flex-col items-center gap-5">
            <div class="relative">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border" :class="editorModal.fileInfo?.iconClass">
                <component :is="getFileIconComponent(editorModal.fileName)" class="w-10 h-10" />
              </div>
              <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border shadow" :class="editorModal.fileInfo?.badgeClass">
                {{ editorModal.fileInfo?.label }}
              </span>
            </div>

            <div class="space-y-1.5 text-center">
              <h3 class="text-base font-bold text-slate-100 font-mono break-all px-2">
                {{ editorModal.fileName }}
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed px-4">
                {{ editorModal.fileInfo?.desc }}
              </p>
            </div>

            <div class="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-1.5 text-slate-300">
              <div class="flex items-center gap-1.5 text-amber-400 font-medium">
                <Info class="w-4 h-4 flex-shrink-0" />
                <span>为什么不在文本框中直接展示？</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">
                Word/Office 等文件为二进制复合包格式（包含 XML/样式/图片压缩流）。如果直接以纯文本打开会呈现乱码（如 PK... 符号），若强制保存更会永久损坏原始文件。
              </p>
              <p class="text-[11px] text-emerald-400/90 leading-normal">
                ✓ 推荐方式：点击下方按钮调用本地 Word/WPS 打开，不仅原汁原味展示表格与排版，且在 Word 中保存后会自动同步保留在当前任务中。
              </p>
            </div>

            <div class="flex items-center gap-3 w-full pt-1">
              <button
                @click="openNativeApp(editorModal.filePath, editorModal.fileName)"
                class="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                <ExternalLink class="w-4 h-4" />
                <span>{{ editorModal.fileInfo?.type === 'word' ? '使用 Word / WPS 打开' : '使用本地程序打开' }}</span>
              </button>
              <button
                @click="showItemInFolder(editorModal.filePath)"
                class="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95"
                title="在资源管理器中高亮定位该文件"
              >
                <FolderOpen class="w-4 h-4 text-amber-400" />
                <span>定位文件</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 纯文本文件编辑区 (包含搜索直达匹配行与编辑框) -->
        <template v-else>
          <!-- 搜索匹配行快速直达栏 (点击直接精准跳到该行) -->
          <div v-if="editorSearch.matches.length > 0" class="px-5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] flex-shrink-0">
            <span class="text-slate-500 flex-shrink-0 font-medium">匹配行:</span>
            <button
              v-for="(m, idx) in editorSearch.matches"
              :key="idx"
              @click="selectMatchItem(idx)"
              class="px-2 py-0.5 rounded transition font-mono flex items-center gap-1 flex-shrink-0"
              :class="editorSearch.currentIndex === idx ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            >
              <span class="text-amber-300 font-bold">第 {{ m.lineNum }} 行:</span>
              <span class="max-w-[140px] truncate">{{ m.lineContent }}</span>
            </button>
          </div>

          <!-- 编辑器文本区域 -->
          <div class="flex-1 p-3 bg-slate-950/90 flex flex-col relative overflow-hidden">
            <textarea
              ref="editorTextareaRef"
              v-model="editorModal.content"
              placeholder="文件内容为空，可在此直接编辑并保存..."
              class="w-full flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none selection:bg-emerald-800 selection:text-white"
            ></textarea>
          </div>
        </template>

      </div>
    </div>

    <!-- ==================== 内置：SQL 一键合并导出弹窗 ==================== -->
    <SqlMergeModal
      :is-open="isMergeModalOpen"
      :task="task"
      :sql-list="sqlList"
      @close="isMergeModalOpen = false"
      @updated="loadSqls"
      @toast="(msg, type) => emit('toast', msg, type)"
    />

    <!-- ==================== 内置：新建文件弹窗 ==================== -->
    <div v-if="newFileModal.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="app-modal-dialog bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-5 text-slate-100">
        <h4 class="font-bold text-sm mb-3 flex items-center gap-2">
          <PlusCircle class="w-4 h-4 text-emerald-400" />
          {{ newFileModal.title }}
        </h4>
        <input
          v-model="newFileModal.fileName"
          :placeholder="newFileModal.placeholder"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 mb-3 focus:outline-none focus:border-emerald-500 font-mono"
        />
        <div class="flex justify-end gap-2">
          <button @click="newFileModal.visible = false" class="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded">
            取消
          </button>
          <button @click="confirmCreateFile" class="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium">
            确认创建
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import SqlMergeModal from './SqlMergeModal.vue'
import {
  FolderOpen, Code2, Terminal, X, Database, Info,
  RefreshCw, Plus, FileCode2, Copy, Save, PlusCircle,
  ScrollText, BookOpen, FileText, StickyNote, Eye, FileEdit,
  Trash2, Search, UploadCloud, ExternalLink, FileSpreadsheet, FileArchive, FileImage, Layers
} from 'lucide-vue-next'

const emit = defineEmits(['updated', 'toast'])

const isOpen = ref(false)
const task = ref(null)
const activeTab = ref('sql') // 'requirement' | 'note' | 'sql'
const isDragging = ref(false)
const isMergeModalOpen = ref(false)

// 列表数据
const sqlList = ref([])
const loadingSqls = ref(false)
const reqFiles = ref([])
const noteFiles = ref([])

// 列表文件名搜索过滤关键字
const sqlSearchQuery = ref('')
const reqSearchQuery = ref('')
const noteSearchQuery = ref('')

// 本任务内容搜索状态
const taskSearch = ref({
  visible: false,
  query: '',
  results: []
})

// 软件内置编辑器
const editorModal = ref({
  visible: false,
  filePath: '',
  fileName: '',
  type: 'sql',
  isBinary: false,
  fileInfo: null,
  content: '',
  saving: false
})

// 文件类型智能识别（区分 Word/Excel/PDF 等二进制与纯文本）
function getFileTypeInfo(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase()

  if (['doc', 'docx', 'wps', 'rtf'].includes(ext)) {
    return {
      type: 'word',
      isBinary: true,
      label: 'Word',
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
      iconClass: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
      desc: 'Word 文档 (.docx / .doc) 为二进制格式。已无缝接入系统关联，点击直接使用本地 Word 或 WPS 打开，保留完整排版与表格，保存后实时同步当前任务。'
    }
  }
  if (['xls', 'xlsx', 'et'].includes(ext)) {
    return {
      type: 'excel',
      isBinary: true,
      label: 'Excel',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      iconClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      desc: 'Excel 表格 (.xlsx / .xls) 为二进制格式。请使用本地 Excel 或 WPS 打开查看与编辑，保留所有公式与工作表。'
    }
  }
  if (['ppt', 'pptx', 'dps'].includes(ext)) {
    return {
      type: 'ppt',
      isBinary: true,
      label: 'PPT',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      iconClass: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      desc: 'PPT 演示文稿 (.pptx / .ppt) 为二进制格式。请使用本地 PowerPoint 或 WPS 打开播放与编辑。'
    }
  }
  if (['pdf'].includes(ext)) {
    return {
      type: 'pdf',
      isBinary: true,
      label: 'PDF',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
      iconClass: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
      desc: 'PDF 文档已固化排版，请使用本地系统默认阅读器或浏览器打开查看。'
    }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      type: 'archive',
      isBinary: true,
      label: '压缩包',
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
      iconClass: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
      desc: '压缩包文件，请使用本地解压软件或在文件管理器中解压。'
    }
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
    return {
      type: 'image',
      isBinary: true,
      label: '图片',
      badgeClass: 'bg-pink-950/80 text-pink-300 border-pink-700/60',
      iconClass: 'text-pink-400 bg-pink-950/60 border-pink-800/60',
      desc: '图片文件，请使用本地系统看图程序打开查看。'
    }
  }
  if (['sql'].includes(ext)) {
    return {
      type: 'sql',
      isBinary: false,
      label: 'SQL',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      iconClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      desc: 'SQL 脚本，支持在软件内置编辑器快速查看、编辑与保存。'
    }
  }
  if (['md'].includes(ext)) {
    return {
      type: 'markdown',
      isBinary: false,
      label: 'Markdown',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
      iconClass: 'text-sky-400 bg-sky-950/60 border-sky-800/60',
      desc: 'Markdown 文档，支持在软件内置编辑器快速查看、编辑与保存。'
    }
  }
  return {
    type: 'text',
    isBinary: false,
    label: ext ? ext.toUpperCase() : '文本',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    iconClass: 'text-slate-400 bg-slate-800 border-slate-700',
    desc: '纯文本文件，支持在软件内置编辑器直接查看与编辑。'
  }
}

// 动态选择对应图标组件
function getFileIconComponent(fileName) {
  const info = getFileTypeInfo(fileName)
  switch (info.type) {
    case 'excel':
      return FileSpreadsheet
    case 'archive':
      return FileArchive
    case 'image':
      return FileImage
    case 'sql':
      return Database
    case 'word':
    case 'ppt':
    case 'pdf':
    case 'markdown':
    case 'text':
    default:
      return FileText
  }
}

// 调用本地系统默认关联软件直接打开文件
function openNativeApp(filePath, fileName) {
  window.electronAPI.openInExplorer(filePath)
  emit('toast', `正在调用本地关联程序打开: ${fileName}`)
}

// 在 Windows 资源管理器中高亮定位该文件
function showItemInFolder(filePath) {
  window.electronAPI.showItemInFolder(filePath)
  emit('toast', '已在文件夹中高亮定位！')
}

// 点击列表某文件项时的智能响应
function handleFileClick(file, category) {
  const info = getFileTypeInfo(file.fileName)
  if (info.isBinary) {
    openNativeApp(file.filePath, file.fileName)
  } else {
    openFileInEditor(file.filePath, file.fileName, category)
  }
}

// 编辑器内文本搜索定位
const editorSearch = ref({
  query: '',
  matches: [],
  currentIndex: -1
})
const editorTextareaRef = ref(null)
const editorSearchInputRef = ref(null)

// 新建文件弹窗
const newFileModal = ref({
  visible: false,
  category: 'sql',
  title: '新建 SQL 脚本',
  placeholder: '如: 01_update_table.sql',
  fileName: ''
})

// 拖拽保存处理
function handleDragOver() {
  isDragging.value = true
}

function handleDragLeave(e) {
  if (e && e.currentTarget && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false
  } else if (!e.relatedTarget) {
    isDragging.value = false
  }
}

async function handleDropFiles(e) {
  isDragging.value = false
  if (!task.value || !e.dataTransfer || !e.dataTransfer.files) return

  const files = e.dataTransfer.files
  const paths = []
  for (let i = 0; i < files.length; i++) {
    if (files[i] && files[i].path) {
      paths.push(files[i].path)
    }
  }

  if (paths.length === 0) return

  let targetDir = ''
  if (activeTab.value === 'sql') {
    targetDir = `${task.value.fullPath}/sql`
  } else {
    targetDir = `${task.value.fullPath}/docs`
  }

  try {
    const copied = await window.electronAPI.copyFilesToDir(paths, targetDir)
    if (copied && copied.length > 0) {
      emit('toast', `已成功拖拽保存 ${copied.length} 个文件到当前目录！`)
      if (activeTab.value === 'sql') {
        await loadSqls()
      } else {
        await loadDocs()
      }
      emit('updated')
    }
  } catch (err) {
    alert('保存拖拽文件失败: ' + err.message)
  }
}

async function open(taskItem) {
  task.value = { ...taskItem }
  isOpen.value = true
  activeTab.value = 'sql'
  sqlSearchQuery.value = ''
  reqSearchQuery.value = ''
  noteSearchQuery.value = ''
  taskSearch.value = { visible: false, query: '', results: [] }
  await Promise.all([loadSqls(), loadDocs()])
}

function close() {
  isOpen.value = false
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'sql') loadSqls()
  else loadDocs()
}

// 过滤后的列表
const filteredSqlList = computed(() => {
  if (!sqlSearchQuery.value.trim()) return sqlList.value
  const q = sqlSearchQuery.value.toLowerCase().trim()
  return sqlList.value.filter(s => s.fileName.toLowerCase().includes(q))
})

const filteredReqFiles = computed(() => {
  if (!reqSearchQuery.value.trim()) return reqFiles.value
  const q = reqSearchQuery.value.toLowerCase().trim()
  return reqFiles.value.filter(f => f.fileName.toLowerCase().includes(q))
})

const filteredNoteFiles = computed(() => {
  if (!noteSearchQuery.value.trim()) return noteFiles.value
  const q = noteSearchQuery.value.toLowerCase().trim()
  return noteFiles.value.filter(f => f.fileName.toLowerCase().includes(q))
})

// 加载 SQL 列表
async function loadSqls() {
  if (!task.value) return
  loadingSqls.value = true
  try {
    sqlList.value = await window.electronAPI.getTaskSqls(task.value.fullPath)
  } catch (err) {
    console.error(err)
  } finally {
    loadingSqls.value = false
  }
}

// 加载需求与笔记文档列表
async function loadDocs() {
  if (!task.value) return
  const docsDir = `${task.value.fullPath}/docs`
  try {
    const allFiles = await window.electronAPI.getDirFiles(docsDir)
    
    // 如果 docs 目录下完全空，自动初始化 需求.md 与 笔记.md
    if (allFiles.length === 0) {
      await window.electronAPI.createTextFile(docsDir, '需求.md', `# ${task.value.title} - 任务需求\n\n`)
      await window.electronAPI.createTextFile(docsDir, '笔记.md', `# ${task.value.title} - 开发笔记\n\n`)
      return loadDocs()
    }

    const reqs = []
    const notes = []
    for (const f of allFiles) {
      const lower = f.fileName.toLowerCase()
      if (lower.includes('笔记') || lower.includes('note') || lower.includes('memo')) {
        notes.push(f)
      } else {
        reqs.push(f)
      }
    }
    reqFiles.value = reqs
    noteFiles.value = notes
  } catch (err) {
    console.error(err)
  }
}

// 删除文件
async function handleDeleteFile(filePath, fileName, category) {
  if (confirm(`确认删除 [${fileName}] 吗？\n文件将被安全移入系统回收站。`)) {
    try {
      await window.electronAPI.deleteFile(filePath)
      emit('toast', `已删除文件: ${fileName}`)
      if (category === 'sql') {
        await loadSqls()
      } else {
        await loadDocs()
      }
      emit('updated')
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }
}

// 在软件内部直接打开文件查看与编辑 (智能区分二进制与纯文本，彻底归一化换行符避免偏移)
async function openFileInEditor(filePath, fileName, type = 'sql', targetLine = null) {
  const info = getFileTypeInfo(fileName)

  // 如果是二进制文件（如 Word、Excel、PDF 等），以安全卡片模式打开，不读入 UTF-8 乱码
  if (info.isBinary) {
    editorModal.value = {
      visible: true,
      filePath,
      fileName,
      type,
      isBinary: true,
      fileInfo: info,
      content: '',
      saving: false
    }
    return
  }

  try {
    const raw = await window.electronAPI.readTextFile(filePath)
    // 核心关键：统一将 Windows \r\n 换行规范化为 \n，彻底杜绝光标和搜索选区偏移！
    const content = (raw || '').replace(/\r\n/g, '\n')
    editorModal.value = {
      visible: true,
      filePath,
      fileName,
      type,
      isBinary: false,
      fileInfo: info,
      content,
      saving: false
    }
    editorSearch.value = { query: '', matches: [], currentIndex: -1 }

    // 如果指定了跳转行号，自动定位到那一行
    if (targetLine && targetLine > 0) {
      await nextTick()
      locateLineInTextarea(targetLine)
    }
  } catch (err) {
    alert('打开文件失败: ' + err.message)
  }
}

// 根据行号高亮/定位 textarea
function locateLineInTextarea(lineNum) {
  const textarea = editorTextareaRef.value
  if (!textarea) return
  const text = textarea.value
  const lines = text.split('\n')
  let pos = 0
  for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
    pos += lines[i].length + 1
  }
  const endPos = pos + (lines[lineNum - 1] ? lines[lineNum - 1].length : 0)
  textarea.focus()
  textarea.setSelectionRange(pos, endPos)

  const lineHeight = textarea.scrollHeight / Math.max(1, lines.length)
  textarea.scrollTop = Math.max(0, (lineNum - 1) * lineHeight - textarea.clientHeight / 2 + 20)
}

// 清除文件内搜索
function clearEditorSearch() {
  editorSearch.value.query = ''
  editorSearch.value.matches = []
  editorSearch.value.currentIndex = -1
  const textarea = editorTextareaRef.value
  if (textarea) {
    const cur = textarea.selectionStart || 0
    textarea.setSelectionRange(cur, cur)
  }
}

// 文件内关键字搜索 (基于 textarea.value 绝对字符位置匹配)
function handleEditorSearch() {
  const q = (editorSearch.value.query || '').trim()
  if (!q) {
    editorSearch.value.matches = []
    editorSearch.value.currentIndex = -1
    return
  }
  const textarea = editorTextareaRef.value
  const text = (textarea ? textarea.value : editorModal.value.content)
  const lowerText = text.toLowerCase()
  const lowerQ = q.toLowerCase()
  const matches = []
  
  let index = lowerText.indexOf(lowerQ)
  const lines = text.split('\n')
  while (index !== -1) {
    // 精准计算属于第几行
    const textBefore = text.substring(0, index)
    const lineNum = textBefore.split('\n').length
    const lineContent = lines[lineNum - 1] ? lines[lineNum - 1].trim() : ''
    matches.push({
      index,
      lineNum,
      lineContent
    })
    index = lowerText.indexOf(lowerQ, index + lowerQ.length)
  }
  editorSearch.value.matches = matches
  editorSearch.value.currentIndex = matches.length > 0 ? 0 : -1
  if (matches.length > 0) {
    highlightCurrentMatch()
  }
}

function jumpNextMatch() {
  if (editorSearch.value.matches.length === 0) return
  editorSearch.value.currentIndex = (editorSearch.value.currentIndex + 1) % editorSearch.value.matches.length
  highlightCurrentMatch()
}

function jumpPrevMatch() {
  if (editorSearch.value.matches.length === 0) return
  editorSearch.value.currentIndex = (editorSearch.value.currentIndex - 1 + editorSearch.value.matches.length) % editorSearch.value.matches.length
  highlightCurrentMatch()
}

function selectMatchItem(idx) {
  editorSearch.value.currentIndex = idx
  highlightCurrentMatch()
}

function highlightCurrentMatch() {
  const textarea = editorTextareaRef.value
  if (!textarea) return
  const idx = editorSearch.value.currentIndex
  if (idx < 0 || idx >= editorSearch.value.matches.length) return
  const match = editorSearch.value.matches[idx]
  const start = match.index
  const len = editorSearch.value.query.trim().length

  textarea.focus()
  textarea.setSelectionRange(start, start + len)

  // 精准根据行号滚动到视口中央
  const totalLines = textarea.value.split('\n').length
  const lineHeight = textarea.scrollHeight / Math.max(1, totalLines)
  textarea.scrollTop = Math.max(0, (match.lineNum - 1) * lineHeight - textarea.clientHeight / 2 + 20)
}

// 本任务内容穿透检索
let taskSearchTimer = null
function handleTaskContentSearch() {
  if (taskSearchTimer) clearTimeout(taskSearchTimer)
  taskSearchTimer = setTimeout(async () => {
    const q = taskSearch.value.query.trim()
    if (!q) {
      taskSearch.value.results = []
      return
    }
    try {
      taskSearch.value.results = await window.electronAPI.searchTaskFiles(task.value.fullPath, q)
    } catch (err) {
      console.error(err)
    }
  }, 250)
}

function openFileFromSearch(res) {
  openFileInEditor(res.filePath, res.fileName, res.category === 'SQL' ? 'sql' : 'doc', res.lineNum)
}

// 保存编辑器中的修改
async function saveEditorContent() {
  editorModal.value.saving = true
  try {
    await window.electronAPI.saveTextFile(editorModal.value.filePath, editorModal.value.content)
    editorModal.value.saving = false
    emit('toast', `[${editorModal.value.fileName}] 修改已保存！`)
    if (editorModal.value.type === 'sql') {
      loadSqls()
    } else {
      loadDocs()
    }
  } catch (err) {
    alert('保存失败: ' + err.message)
    editorModal.value.saving = false
  }
}

// 切换 SQL 发布状态
async function toggleSqlStatus(sql, env) {
  const currentStatus = env === 'test' ? sql.testReleased : sql.prodReleased
  const nextStatus = !currentStatus
  const now = new Date().toLocaleString()

  try {
    await window.electronAPI.updateSqlStatus(
      task.value.fullPath,
      sql.fileName,
      env,
      nextStatus,
      nextStatus ? now : null
    )
    if (env === 'test') {
      sql.testReleased = nextStatus
      sql.testReleasedAt = nextStatus ? now : null
    } else {
      sql.prodReleased = nextStatus
      sql.prodReleasedAt = nextStatus ? now : null
    }
    emit('updated')
    emit('toast', `${sql.fileName} ${env === 'test' ? '测试环境' : '生产环境'} 状态更新为: ${nextStatus ? '已发布' : '未发布'}`)
  } catch (err) {
    alert('更新状态失败: ' + err.message)
  }
}

// 快速复制内容
async function copyContent(text) {
  if (!text) return
  await window.electronAPI.copyToClipboard(text)
  emit('toast', '已复制到剪贴板！')
}

// 打开新建文件弹窗
function openNewFileModal(category) {
  newFileModal.value.category = category
  newFileModal.value.fileName = ''
  if (category === 'sql') {
    newFileModal.value.title = '新建 SQL 脚本'
    newFileModal.value.placeholder = '如: 01_add_column.sql'
  } else if (category === 'requirement') {
    newFileModal.value.title = '新建需求文档'
    newFileModal.value.placeholder = '如: 5G短信需求规范.md'
  } else {
    newFileModal.value.title = '新建笔记文件'
    newFileModal.value.placeholder = '如: 联调踩坑记录.md'
  }
  newFileModal.value.visible = true
}

// 确认创建文件
async function confirmCreateFile() {
  let name = newFileModal.value.fileName.trim()
  if (!name) return

  const cat = newFileModal.value.category
  let dirPath = ''
  let defaultContent = ''

  if (cat === 'sql') {
    if (!name.endsWith('.sql')) name += '.sql'
    dirPath = `${task.value.fullPath}/sql`
    defaultContent = `-- 任务: ${task.value.title}\n-- 创建时间: ${new Date().toLocaleString()}\n\n`
  } else {
    if (!name.includes('.')) name += '.md'
    dirPath = `${task.value.fullPath}/docs`
    defaultContent = `# ${name}\n\n创建时间: ${new Date().toLocaleString()}\n\n`
  }

  try {
    const fullCreated = await window.electronAPI.createTextFile(dirPath, name, defaultContent)
    newFileModal.value.visible = false
    emit('toast', `已创建文件: ${name}`)
    if (cat === 'sql') {
      await loadSqls()
    } else {
      await loadDocs()
    }
    emit('updated')
    openFileInEditor(fullCreated, name, cat === 'sql' ? 'sql' : 'doc')
  } catch (err) {
    alert('创建失败: ' + err.message)
  }
}

async function handleStatusChange() {
  try {
    await window.electronAPI.updateTask(task.value.fullPath, { status: task.value.status })
    emit('updated')
  } catch (err) {
    console.error(err)
  }
}

// 联动调用外部系统
function openExplorer() {
  window.electronAPI.openInExplorer(task.value.fullPath)
}

function openIDE() {
  window.electronAPI.openInIDE(task.value.fullPath)
}

function openTerminal() {
  window.electronAPI.openInTerminal(task.value.fullPath)
}

defineExpose({ open })
</script>
