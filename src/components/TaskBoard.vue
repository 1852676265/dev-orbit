<template>
  <div class="h-full w-full flex flex-col p-3 md:p-4 overflow-hidden select-none relative font-sans">
    
    <!-- ===================================================================== -->
    <!-- 极客全息矩阵中枢 (Matrix Command OS 主容器 - 殿堂级微晶黑曜质感)         -->
    <!-- ===================================================================== -->
    <div
      class="flex-1 flex flex-col rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300"
      :class="isLight
        ? 'bg-white/85 border-slate-300/80 shadow-slate-200/50'
        : 'bg-slate-950/70 border-white/10 shadow-black/60'"
      style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"
    >

      <!-- 1. 顶层速战一体指挥栏 (Command Bar) -->
      <div
        class="h-13 px-5 border-b flex items-center justify-between gap-4 flex-shrink-0 z-20"
        :class="isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900/60 border-white/5'"
      >
        <!-- 极速搜索过滤框 -->
        <div class="flex items-center gap-3 flex-1 max-w-md relative">
          <Sparkles class="w-4 h-4 text-teal-400 flex-shrink-0 animate-pulse" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="穿透检索 2026/2025 任务、SQL 文件或备忘... (按 / 聚焦，↑↓ 切换)"
            class="w-full bg-transparent text-xs placeholder-slate-500 focus:outline-none font-mono"
            :class="isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="text-slate-400 hover:text-slate-200 p-1"
          >
            <X class="w-3.5 h-3.5" />
          </button>
          <kbd
            v-else
            class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border opacity-60"
            :class="isLight ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-slate-400'"
          >
            /
          </kbd>
        </div>

        <!-- 胶囊筛选区 (年份、项目、待发产线) -->
        <div class="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
          <!-- 年份胶囊 -->
          <div class="flex items-center p-0.5 rounded-xl border text-xs" :class="isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-black/40 border-white/10'">
            <button
              v-for="yr in ['all', ...years]"
              :key="yr"
              @click="selectedYear = yr"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition"
              :class="selectedYear === yr
                ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/35 shadow-sm')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')"
            >
              {{ yr === 'all' ? '全部年份' : yr }}
            </button>
          </div>

          <!-- 项目胶囊 (高频项目 + 全部) -->
          <div class="flex items-center p-0.5 rounded-xl border text-xs" :class="isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-black/40 border-white/10'">
            <button
              @click="selectedProject = 'all'"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition"
              :class="selectedProject === 'all'
                ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/35 shadow-sm')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')"
            >
              全部项目
            </button>
            <button
              v-for="proj in topProjects"
              :key="proj.name"
              @click="selectedProject = proj.name"
              @contextmenu.prevent.stop="openProjectContextMenu($event, proj)"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              :class="selectedProject === proj.name
                ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/35 shadow-sm')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')"
              :title="`右键可重命名或删除 [${proj.name}]`"
            >
              <span>{{ proj.name }}</span>
              <span class="text-[10px] font-mono opacity-60">({{ proj.totalCount }})</span>
            </button>
          </div>

          <!-- 待发 SQL 快速过滤器 -->
          <button
            @click="togglePendingSqlFilter"
            class="px-2.5 py-1 rounded-xl text-xs font-medium border transition flex items-center gap-1.5"
            :class="onlyPendingSql
              ? (isLight ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold shadow-sm' : 'bg-amber-950/70 border-amber-500/40 text-amber-300 font-bold')
              : (isLight ? 'bg-slate-200/60 border-slate-300 text-slate-600 hover:text-slate-900' : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200')"
          >
            <Database class="w-3.5 h-3.5" :class="onlyPendingSql ? 'text-amber-500' : 'opacity-60'" />
            <span>待发产线</span>
            <span
              v-if="totalPendingProdSqls > 0"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold"
              :class="onlyPendingSql ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/20 text-amber-400'"
            >
              {{ totalPendingProdSqls }}
            </span>
          </button>
        </div>

        <!-- 顶栏快捷操作按钮 -->
        <div class="flex items-center gap-2">
          <button
            @click="$emit('open-new-task', selectedYear === 'all' ? years[0] : selectedYear, selectedProject !== 'all' ? selectedProject : '')"
            class="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-teal-950/40"
            title="新建任务工作区 (快捷键 Ctrl+N)"
          >
            <Plus class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">新建任务</span>
          </button>
          
          <button
            @click="$emit('updated')"
            class="p-2 rounded-xl text-xs transition border"
            :class="isLight ? 'bg-slate-200/60 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'"
            title="刷新工作区任务列表"
          >
            <RefreshCw class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 2. 双屏极客中枢架构 (左翼：超高密流线条目 38% + 右翼：全息行动舱 62%) -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- ==================== 左翼：超高密度流线条目流 ==================== -->
        <div
          class="w-5/12 max-w-md min-w-[320px] border-r flex flex-col overflow-hidden transition-all duration-300"
          :class="isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/25 border-white/5'"
        >
          <!-- 统计与次要信息条 -->
          <div
            class="h-8 px-4 border-b flex items-center justify-between text-[11px] font-mono flex-shrink-0"
            :class="isLight ? 'bg-slate-100/60 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/5 text-slate-400'"
          >
            <span class="flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-teal-400" />
              <span>任务索引 ({{ filteredTasks.length }})</span>
            </span>
            <span v-if="totalPendingProdSqls > 0" class="text-amber-400 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              {{ totalPendingProdSqls }} 份产线 SQL 待发布
            </span>
            <span v-else class="text-teal-400 font-medium">
              SQL 均已上线
            </span>
          </div>

          <!-- 任务条目列表 (一屏容纳 15~20 个，按上下键秒级切换) -->
          <div
            ref="taskListContainerRef"
            class="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar"
          >
            <!-- 空状态提示 -->
            <div
              v-if="filteredTasks.length === 0"
              class="h-64 flex flex-col items-center justify-center text-center p-6"
            >
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" :class="isLight ? 'bg-slate-200 text-slate-400' : 'bg-white/5 text-slate-500'">
                <Layers class="w-5 h-5" />
              </div>
              <p class="text-xs font-medium" :class="isLight ? 'text-slate-600' : 'text-slate-400'">
                没有匹配的开发任务
              </p>
              <p class="text-[11px] text-slate-500 mt-1">
                请尝试更换搜索词或年份/项目过滤
              </p>
            </div>

            <!-- 条目卡片 (高质感打磨，左侧发光微晶光纤) -->
            <div
              v-for="(task, idx) in filteredTasks"
              :key="task.fullPath"
              :id="`task-item-${idx}`"
              @click="setFocusedTask(idx)"
              @dblclick="openFullTaskDetail(task)"
              @contextmenu.prevent.stop="openTaskContextMenu($event, task)"
              class="p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative select-none"
              :class="focusedTaskIndex === idx
                ? (isLight
                    ? 'bg-teal-50/90 border-teal-500/80 shadow-md ring-1 ring-teal-500/30'
                    : 'bg-teal-950/30 border-teal-500/70 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/30 text-white')
                : (isLight
                    ? 'bg-white/60 hover:bg-slate-100/90 border-slate-200/80 text-slate-700'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-300')"
            >
              <!-- 聚焦高亮左边缘晶体微光条 -->
              <div
                v-if="focusedTaskIndex === idx"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4/5 bg-teal-400 rounded-r shadow-md shadow-teal-400"
              ></div>

              <!-- 左侧：状态呼吸灯 + 标题 + 年份项目徽章 -->
              <div class="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 pl-1">
                <!-- 呼吸状态灯 -->
                <div
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="task.status === 'archived'
                    ? 'bg-slate-500'
                    : (task.status === 'suspended' ? 'bg-amber-400' : 'bg-teal-400 animate-pulse')"
                ></div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span
                      class="px-1.5 py-0.2 rounded text-[10px] font-mono flex-shrink-0"
                      :class="isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-400'"
                    >
                      {{ task.year }}
                    </span>
                    <span
                      v-if="task.project"
                      class="px-1.5 py-0.2 rounded text-[10px] font-mono flex-shrink-0"
                      :class="isLight ? 'bg-slate-200 text-slate-800 font-bold' : 'bg-teal-950/60 text-teal-300 border border-teal-800/50 font-bold'"
                    >
                      {{ task.project }}
                    </span>
                    <span class="text-[10px] text-slate-500 font-mono truncate">
                      {{ formatTaskDate(task.updatedAt || task.createdAt) }}
                    </span>
                  </div>

                  <!-- 任务标题 -->
                  <h3
                    class="text-xs font-semibold leading-snug truncate transition"
                    :class="focusedTaskIndex === idx
                      ? (isLight ? 'text-teal-950 font-bold' : 'text-teal-200 font-bold')
                      : (isLight ? 'text-slate-800 group-hover:text-teal-600' : 'text-slate-200 group-hover:text-teal-300')"
                    :title="task.title"
                  >
                    {{ task.title }}
                  </h3>
                </div>
              </div>

              <!-- 右侧：SQL 警示胶囊 -->
              <div class="flex-shrink-0 flex items-center gap-1.5">
                <!-- 待发产线醒目胶囊 -->
                <span
                  v-if="task.prodPendingCount > 0"
                  class="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 shadow-sm"
                  :class="isLight
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-950/70 text-amber-300 border border-amber-600/50'"
                >
                  <Database class="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span>{{ task.prodPendingCount }} 待发</span>
                </span>
                <span
                  v-else-if="task.sqlCount > 0"
                  class="text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1"
                  :class="isLight
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'bg-teal-950/40 text-teal-300/90 border border-teal-800/40'"
                >
                  <Database class="w-3 h-3 text-teal-400 flex-shrink-0" />
                  <span>{{ task.sqlCount }} SQL</span>
                </span>
                <span
                  v-else
                  class="text-[10px] text-slate-500 font-mono opacity-50 hidden sm:inline"
                >
                  无SQL
                </span>

                <!-- 箭头提示 -->
                <ChevronRight
                  class="w-3.5 h-3.5 transition"
                  :class="focusedTaskIndex === idx ? 'text-teal-400 translate-x-0.5' : 'text-slate-600 opacity-40'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== 右翼：全息行动舱 (免弹窗生产力) ==================== -->
        <div
          v-if="currentTask"
          class="flex-1 flex flex-col overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar transition-all duration-300"
          :class="isLight ? 'bg-white/60' : 'bg-black/20'"
        >
          
          <!-- 1. 任务头部看板与一键唤醒工具条 -->
          <div
            class="p-4 rounded-xl border flex flex-col md:flex-row md:items-start justify-between gap-4 transition shadow-sm"
            :class="isLight ? 'bg-white border-slate-200/90' : 'bg-black/40 border-white/5'"
          >
            <div class="space-y-1.5 flex-1 min-w-0">
              <!-- 属性标签行 -->
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  :class="isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-950/70 text-amber-300 border-amber-700/60'"
                >
                  {{ currentTask.year }} 年度
                </span>
                <span
                  v-if="currentTask.project"
                  class="px-2 py-0.5 rounded text-[10px] font-mono border"
                  :class="isLight ? 'bg-slate-100 text-slate-800 border-slate-300 font-bold' : 'bg-white/10 text-slate-200 border-white/10 font-bold'"
                >
                  {{ currentTask.project }}
                </span>

                <!-- 状态即时切换器 -->
                <div class="relative inline-block">
                  <select
                    :value="currentTask.status || 'in-progress'"
                    @change="onTaskStatusChange($event.target.value)"
                    class="appearance-none text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none pr-5 transition"
                    :class="currentTask.status === 'archived'
                      ? (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-slate-400 border-white/10')
                      : (currentTask.status === 'suspended'
                          ? (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/80 text-amber-300 border-amber-700')
                          : (isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-950/80 text-teal-300 border-teal-700'))"
                  >
                    <option value="in-progress">🟢 开发进行中</option>
                    <option value="archived">⚪ 已上线归档</option>
                    <option value="suspended">🟡 临时挂起</option>
                  </select>
                </div>

                <span class="text-[11px] text-slate-500 font-mono">
                  更新: {{ formatTaskDate(currentTask.updatedAt || currentTask.createdAt) }}
                </span>
              </div>

              <!-- 完整长标题 (彻底告别折叠截断) -->
              <h2
                class="text-base font-bold leading-relaxed transition"
                :class="isLight ? 'text-slate-900' : 'text-white'"
              >
                {{ currentTask.title }}
              </h2>

              <!-- 完整物理路径 -->
              <div class="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 truncate" :title="currentTask.fullPath">
                <FolderOpen class="w-3.5 h-3.5 flex-shrink-0 text-teal-400" />
                <span class="truncate">{{ currentTask.fullPath }}</span>
              </div>
            </div>

            <!-- 一键唤醒工具操作栏 -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <!-- 在 IDE 打开 -->
              <button
                @click="openInIDE(currentTask.fullPath)"
                class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm border"
                :class="isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-teal-300 border-white/10'"
                title="在 VS Code / 设定编辑器中打开任务工作区 (Ctrl+O)"
              >
                <Code2 class="w-3.5 h-3.5" />
                <span>IDE 打开</span>
              </button>

              <!-- 在资源管理器打开 -->
              <button
                @click="openInExplorer(currentTask.fullPath)"
                class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm border"
                :class="isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/10'"
                title="在 Windows 资源管理器中打开此文件夹 (Ctrl+E)"
              >
                <FolderOpen class="w-3.5 h-3.5" />
                <span>文件目录</span>
              </button>

              <!-- 打开终端 -->
              <button
                @click="openInTerminal(currentTask.fullPath)"
                class="p-2 rounded-xl text-xs transition border"
                :class="isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'"
                title="在当前任务目录打开命令行终端"
              >
                <Terminal class="w-3.5 h-3.5" />
              </button>

              <!-- 复制路径 -->
              <button
                @click="copyTaskPath(currentTask.fullPath)"
                class="p-2 rounded-xl text-xs transition border"
                :class="isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'"
                title="一键复制当前任务绝对路径"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>

              <!-- 更多详情模态框 -->
              <button
                @click="openFullTaskDetail(currentTask)"
                class="p-2 rounded-xl text-xs transition border"
                :class="isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'"
                title="打开任务完整管理弹窗 (Enter)"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 2. 上线 SQL 资产追踪与一键合并神器 (核心功能) -->
          <div
            class="p-4 rounded-xl border space-y-3 transition shadow-sm"
            :class="isLight ? 'bg-white border-slate-200/90' : 'bg-black/40 border-white/5'"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Database class="w-4 h-4 text-amber-400" />
                <h3 class="text-xs font-bold" :class="isLight ? 'text-slate-900' : 'text-slate-100'">
                  上线 SQL 脚本清单 ({{ currentSqls.length }} 份)
                </h3>
                <span
                  v-if="currentTask.prodPendingCount > 0"
                  class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  {{ currentTask.prodPendingCount }} 份待发产线
                </span>
                <span
                  v-else-if="currentSqls.length > 0"
                  class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30"
                >
                  全部已上线
                </span>
              </div>

              <!-- 一键合并上线 SQL 核心主按钮 -->
              <div class="flex items-center gap-2">
                <button
                  v-if="currentSqls.length > 0"
                  @click="openSqlMergeDialog"
                  class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-teal-950/40"
                  title="一键按序拼接、包裹事务并生成上线汇总单 (00_merged_all.sql)"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>一键合并上线 SQL</span>
                </button>
                <button
                  @click="createNewSqlFile"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition"
                  :class="isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'"
                >
                  <Plus class="w-3.5 h-3.5 text-teal-400" />
                  <span>新建 SQL</span>
                </button>
              </div>
            </div>

            <!-- SQL 脚本条目列表 -->
            <div v-if="loadingSqls" class="py-6 text-center text-xs text-slate-400">
              <RefreshCw class="w-4 h-4 animate-spin mx-auto mb-1 text-teal-400" />
              <span>正在扫描当前任务 SQL 脚本...</span>
            </div>

            <div
              v-else-if="currentSqls.length === 0"
              class="py-6 text-center rounded-lg border border-dashed text-xs"
              :class="isLight ? 'border-slate-300 text-slate-500 bg-slate-50' : 'border-white/10 text-slate-500 bg-black/20'"
            >
              <span>当前任务暂无 SQL 脚本，可点击上方「新建 SQL」或放入 sql 目录</span>
            </div>

            <div v-else class="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              <div
                v-for="sql in currentSqls"
                :key="sql.fileName"
                class="p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs transition group"
                :class="isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  : 'bg-black/30 hover:bg-black/50 border-white/5'"
              >
                <!-- 文件名与大小 -->
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <Database class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span
                    @click="openInIDE(sql.filePath)"
                    class="font-mono font-bold truncate cursor-pointer transition"
                    :class="isLight ? 'text-slate-800 hover:text-teal-600' : 'text-slate-200 hover:text-teal-300'"
                    :title="`在编辑器打开: ${sql.fileName}`"
                  >
                    {{ sql.fileName }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono flex-shrink-0">
                    ({{ (sql.size / 1024).toFixed(1) }} KB)
                  </span>
                </div>

                <!-- 发布状态切换胶囊 -->
                <div class="flex items-center gap-2 flex-shrink-0">
                  <!-- 测试环境 -->
                  <button
                    @click="toggleSqlStatus(sql, 'test')"
                    class="px-2 py-0.5 rounded text-[10px] font-mono transition"
                    :class="sql.testStatus === 'published'
                      ? (isLight ? 'bg-teal-100 text-teal-800 border border-teal-300 font-bold' : 'bg-teal-950/70 text-teal-300 border border-teal-700/60 font-bold')
                      : (isLight ? 'bg-slate-200 text-slate-600 border border-slate-300' : 'bg-black/40 text-slate-500 border border-white/5')"
                    title="点击切换测试环境发布状态"
                  >
                    测试: {{ sql.testStatus === 'published' ? '已发' : '未发' }}
                  </button>

                  <!-- 产线环境 -->
                  <button
                    @click="toggleSqlStatus(sql, 'prod')"
                    class="px-2 py-0.5 rounded text-[10px] font-mono transition"
                    :class="sql.prodStatus === 'published'
                      ? (isLight ? 'bg-teal-100 text-teal-800 border border-teal-300 font-bold' : 'bg-teal-950/70 text-teal-300 border border-teal-700/60 font-bold')
                      : (isLight ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold' : 'bg-amber-950/70 text-amber-300 border border-amber-600/60 font-bold animate-pulse')"
                    title="点击切换产线环境发布状态"
                  >
                    产线: {{ sql.prodStatus === 'published' ? '已发' : '待发' }}
                  </button>

                  <!-- 复制 SQL 路径 -->
                  <button
                    @click="copyTaskPath(sql.filePath)"
                    class="p-1 rounded opacity-60 hover:opacity-100 transition text-slate-400 hover:text-white"
                    title="复制 SQL 脚本绝对路径"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 开发便签 & 接口参数备忘抽屉 (免弹窗即时备忘与一键复制) -->
          <div
            class="p-4 rounded-xl border space-y-3 transition shadow-sm"
            :class="isLight ? 'bg-white border-slate-200/90' : 'bg-black/40 border-white/5'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-teal-400" />
                <h3 class="text-xs font-bold" :class="isLight ? 'text-slate-900' : 'text-slate-100'">
                  开发备忘与接口联调参数小抽屉
                </h3>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="isSavingNote" class="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                  <RefreshCw class="w-3 h-3 animate-spin" /> 保存中...
                </span>
                <span v-else-if="noteSavedNotice" class="text-[10px] text-teal-400 font-mono">
                  已自动同步
                </span>
                <button
                  @click="saveNoteContent"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition"
                  :class="isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-white/5 hover:bg-white/10 text-teal-300 border-white/10'"
                  title="手动保存便签内容 (Ctrl+S)"
                >
                  <Save class="w-3.5 h-3.5 text-teal-400" />
                  <span>保存便签</span>
                </button>
              </div>
            </div>

            <!-- 智能识别出的可快速复制参数卡片 (如 IP、Token、接口路径) -->
            <div v-if="parsedParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="(param, pIdx) in parsedParameters"
                :key="pIdx"
                @click="copyParamText(param.value, param.label)"
                class="p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition hover:border-teal-500/50 group"
                :class="isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'"
                :title="`点击一键复制: ${param.value}`"
              >
                <div class="min-w-0 flex-1">
                  <span class="text-[10px] text-slate-500 block truncate font-mono">{{ param.label }}</span>
                  <span
                    class="font-mono text-xs font-bold truncate block group-hover:text-teal-300 transition"
                    :class="isLight ? 'text-slate-800' : 'text-slate-200'"
                  >
                    {{ param.value }}
                  </span>
                </div>
                <Copy class="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 flex-shrink-0 transition" />
              </div>
            </div>

            <!-- 便签正文就地编辑框 -->
            <div class="relative">
              <textarea
                v-model="currentNoteContent"
                @keydown.ctrl.s.prevent.stop="saveNoteContent"
                placeholder="在此快速记录联调参数、测试 Token、接口返回格式、开发备忘等... (支持 Ctrl+S 保存)"
                rows="4"
                class="w-full text-xs font-mono p-3 rounded-lg border resize-y focus:outline-none focus:border-teal-500/60 transition"
                :class="isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  : 'bg-black/40 border-white/5 text-slate-200 placeholder-slate-600'"
              ></textarea>
            </div>
          </div>

          <!-- 4. 需求文档与关联资产 -->
          <div
            v-if="currentDocs.length > 0"
            class="p-4 rounded-xl border space-y-2.5 transition shadow-sm"
            :class="isLight ? 'bg-white border-slate-200/90' : 'bg-black/40 border-white/5'"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold flex items-center gap-1.5" :class="isLight ? 'text-slate-900' : 'text-slate-100'">
                <FolderKanban class="w-4 h-4 text-teal-400" />
                <span>需求文档与附件资产 ({{ currentDocs.length }})</span>
              </h3>
              <span class="text-[10px] text-slate-500 font-mono">点击直接在关联软件中打开</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="doc in currentDocs"
                :key="doc.fileName"
                @click="openNativeDoc(doc.filePath)"
                class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition hover:border-teal-500/50 group"
                :class="isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'"
                :title="`在本地关联程序打开: ${doc.fileName}`"
              >
                <FileText class="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span
                  class="text-xs font-medium font-mono truncate flex-1 group-hover:text-teal-300 transition"
                  :class="isLight ? 'text-slate-800' : 'text-slate-200'"
                >
                  {{ doc.fileName }}
                </span>
                <ExternalLink class="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 flex-shrink-0" />
              </div>
            </div>
          </div>

        </div>

        <!-- 空选中状态 -->
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500"
        >
          <Layers class="w-12 h-12 text-slate-600 mb-3" />
          <p class="text-sm font-medium">请从左侧选择一个开发任务</p>
          <p class="text-xs text-slate-600 mt-1">支持通过 ↑ ↓ 键盘方向键无缝切换查看</p>
        </div>

      </div>

      <!-- 3. 底部状态与快捷键提示行 -->
      <div
        class="h-8 px-5 border-t flex items-center justify-between text-[11px] font-mono flex-shrink-0 select-none"
        :class="isLight ? 'bg-slate-100/90 border-slate-200 text-slate-600' : 'bg-black/30 border-white/5 text-slate-400'"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5 text-teal-400 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            DevOrbit HUD 就绪
          </span>
          <span class="hidden md:inline text-slate-500 opacity-40">|</span>
          <span class="hidden md:inline truncate max-w-sm">
            {{ currentTask ? currentTask.title : '未选择任务' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <span class="hidden sm:inline">↑↓ 切换</span>
          <span class="hidden sm:inline">↵ 详情</span>
          <span class="hidden sm:inline">Ctrl+O IDE</span>
          <span class="hidden sm:inline">Ctrl+E 目录</span>
          <span class="text-teal-400/90 font-bold">⚡ v1.3.0</span>
        </div>
      </div>

    </div>

    <!-- SQL 合并导出模态框 (原生挂载) -->
    <SqlMergeModal
      v-if="sqlMergeModalOpen"
      :is-open="sqlMergeModalOpen"
      :task="currentTask"
      @close="sqlMergeModalOpen = false"
      @updated="$emit('updated')"
      @toast="(msg, type) => $emit('toast', msg, type)"
    />

    <!-- 右键上下文菜单 (Teleport 挂载到 body) -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="fixed z-50 rounded-xl border shadow-2xl py-1.5 text-xs backdrop-blur-xl animate-in fade-in duration-100 min-w-[200px]"
        :class="isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/95 border-slate-700 text-slate-200'"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <!-- 任务上下文菜单 -->
        <template v-if="contextMenu.type === 'task' && contextMenu.task">
          <div class="px-3 py-1 font-mono text-[10px] text-slate-500 border-b border-current/10 truncate font-bold">
            {{ contextMenu.task.title }}
          </div>

          <button
            @click="handleMenuAction('open-detail')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>打开完整详情弹窗</span>
          </button>
          <button
            @click="handleMenuAction('open-ide')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <Code2 class="w-3.5 h-3.5" />
            <span>在 IDE (代码编辑器) 中打开</span>
          </button>
          <button
            @click="handleMenuAction('open-folder')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <FolderOpen class="w-3.5 h-3.5" />
            <span>在 Windows 资源管理器中打开</span>
          </button>
          <button
            @click="handleMenuAction('open-terminal')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <Terminal class="w-3.5 h-3.5" />
            <span>在当前任务目录打开命令行</span>
          </button>

          <div class="my-1 border-t border-current/10"></div>

          <button
            @click="handleMenuAction('change-project')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <Tag class="w-3.5 h-3.5" />
            <span>修改所属项目名称...</span>
          </button>

          <button
            @click="handleMenuAction('set-status', 'in-progress')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <span class="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>标记为: 进行中</span>
          </button>
          <button
            @click="handleMenuAction('set-status', 'archived')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>标记为: 已上线归档</span>
          </button>

          <div class="my-1 border-t border-current/10"></div>

          <button
            @click="handleMenuAction('delete-task')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除该任务 (移入回收站)</span>
          </button>
        </template>

        <!-- 项目上下文菜单 -->
        <template v-else-if="contextMenu.type === 'project' && contextMenu.project">
          <div class="px-3 py-1 font-mono text-[10px] text-slate-500 border-b border-current/10 truncate font-bold">
            项目: {{ contextMenu.project.name }}
          </div>
          <button
            @click="handleProjectMenuAction('create-task')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>在此项目下新建任务</span>
          </button>
          <button
            @click="handleProjectMenuAction('rename-project')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition"
          >
            <Pencil class="w-3.5 h-3.5" />
            <span>重命名此项目...</span>
          </button>
          <div class="my-1 border-t border-current/10"></div>
          <button
            @click="handleProjectMenuAction('delete-project')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除该项目 (移入回收站)</span>
          </button>
        </template>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Sparkles, X, Plus, RefreshCw, Layers, Database, ChevronRight,
  FolderOpen, Code2, Terminal, Copy, ExternalLink, FileText,
  Save, FolderKanban, Tag, Trash2, Pencil
} from 'lucide-vue-next'
import SqlMergeModal from './SqlMergeModal.vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  years: {
    type: Array,
    default: () => ['2026', '2025']
  },
  isLight: {
    type: Boolean,
    default: false
  },
  cardOpacity: {
    type: Number,
    default: 20
  },
  cardGlass: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['open-new-task', 'select-task', 'updated', 'toast'])

// 搜索与过滤状态
const searchQuery = ref('')
const searchInputRef = ref(null)
const selectedYear = ref(props.years[0] || '2026')
const selectedProject = ref('all')
const onlyPendingSql = ref(false)

// 聚焦选中的任务索引 (左侧列表高亮)
const focusedTaskIndex = ref(0)
const taskListContainerRef = ref(null)

// 当前聚焦任务的扩展数据
const currentSqls = ref([])
const currentDocs = ref([])
const currentNoteContent = ref('')
const loadingSqls = ref(false)
const isSavingNote = ref(false)
const noteSavedNotice = ref(false)
const sqlMergeModalOpen = ref(false)

// 右键菜单
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  type: 'task',
  task: null,
  project: null
})

// 项目列表统计
const projectList = computed(() => {
  const map = new Map()
  for (const t of props.tasks) {
    const p = (t.project || '常规项目').trim()
    if (!map.has(p)) {
      map.set(p, { name: p, totalCount: 0 })
    }
    map.get(p).totalCount++
  }
  return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount)
})

// 顶栏高频项目前 4 个
const topProjects = computed(() => {
  return projectList.value.slice(0, 4)
})

// 总待发产线 SQL 统计
const totalPendingProdSqls = computed(() => {
  return props.tasks.reduce((sum, t) => sum + (t.prodPendingCount || 0), 0)
})

// 最终任务过滤列表
const filteredTasks = computed(() => {
  return props.tasks.filter(t => {
    // 1. 年份过滤
    if (selectedYear.value !== 'all' && t.year !== selectedYear.value) {
      return false
    }

    // 2. 项目过滤
    if (selectedProject.value !== 'all') {
      const p = (t.project || '常规项目').trim()
      if (p !== selectedProject.value) return false
    }

    // 3. 待发产线过滤
    if (onlyPendingSql.value && (!t.prodPendingCount || t.prodPendingCount <= 0)) {
      return false
    }

    // 4. 全局搜索关键词
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const inTitle = (t.title || '').toLowerCase().includes(q)
      const inProject = (t.project || '').toLowerCase().includes(q)
      const inYear = (t.year || '').toLowerCase().includes(q)
      if (!inTitle && !inProject && !inYear) return false
    }

    return true
  })
})

// 当前选中的任务对象
const currentTask = computed(() => {
  if (filteredTasks.value.length === 0) return null
  const idx = Math.min(focusedTaskIndex.value, filteredTasks.value.length - 1)
  return filteredTasks.value[idx] || null
})

// 智能从便签文本中提取参数 (IP/Token/接口路径)
const parsedParameters = computed(() => {
  if (!currentNoteContent.value) return []
  const text = currentNoteContent.value
  const list = []

  // 1. 匹配 IP + 端口
  const ipMatches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g)
  if (ipMatches) {
    for (const ip of ipMatches.slice(0, 2)) {
      list.push({ label: '服务节点 / IP 地址', value: ip })
    }
  }

  // 2. 匹配 Token
  const tokenMatch = text.match(/Bearer\s+[A-Za-z0-9._-]+/i) || text.match(/[a-zA-Z0-9_-]{32,}/)
  if (tokenMatch) {
    list.push({ label: '认证 Token / 鉴权密钥', value: tokenMatch[0] })
  }

  // 3. 匹配 API 路由
  const apiMatches = text.match(/\/(?:api|v1|v2|mz|sys)\/[a-zA-Z0-9_\-/]+/g)
  if (apiMatches) {
    for (const api of apiMatches.slice(0, 2)) {
      list.push({ label: '接口 Endpoint', value: api })
    }
  }

  return list
})

// 切换待发产线过滤器
function togglePendingSqlFilter() {
  onlyPendingSql.value = !onlyPendingSql.value
}

// 选中某个任务
function setFocusedTask(idx) {
  focusedTaskIndex.value = idx
}

// 监听当前选中的任务变化，实时拉取其 SQL 列表、便签与文档
watch(currentTask, async (newTask) => {
  if (!newTask) {
    currentSqls.value = []
    currentDocs.value = []
    currentNoteContent.value = ''
    return
  }
  await Promise.all([
    loadSqlsForTask(newTask.fullPath),
    loadNoteForTask(newTask.fullPath),
    loadDocsForTask(newTask.fullPath)
  ])
}, { immediate: true })

// 过滤列表变化时，防止索引越界
watch(filteredTasks, (newTasks) => {
  if (newTasks.length === 0) {
    focusedTaskIndex.value = 0
  } else if (focusedTaskIndex.value >= newTasks.length) {
    focusedTaskIndex.value = newTasks.length - 1
  }
})

// 加载 SQL 列表
async function loadSqlsForTask(taskPath) {
  if (!window.electronAPI || !taskPath) return
  loadingSqls.value = true
  try {
    currentSqls.value = await window.electronAPI.getTaskSqls(taskPath) || []
  } catch (err) {
    console.error('加载 SQL 列表异常:', err)
  } finally {
    loadingSqls.value = false
  }
}

// 加载便签
async function loadNoteForTask(taskPath) {
  if (!window.electronAPI || !taskPath) return
  try {
    const content = await window.electronAPI.getTaskFile(taskPath, 'note')
    currentNoteContent.value = content || ''
  } catch (err) {
    currentNoteContent.value = ''
  }
}

// 加载需求文档附件
async function loadDocsForTask(taskPath) {
  if (!window.electronAPI || !taskPath) return
  try {
    const docsDir = `${taskPath}/docs`
    currentDocs.value = await window.electronAPI.getDirFiles(docsDir) || []
  } catch (err) {
    currentDocs.value = []
  }
}

// 保存便签
async function saveNoteContent() {
  if (!currentTask.value || !window.electronAPI) return
  isSavingNote.value = true
  try {
    await window.electronAPI.saveTaskFile(currentTask.value.fullPath, 'note', currentNoteContent.value)
    noteSavedNotice.value = true
    setTimeout(() => { noteSavedNotice.value = false }, 2000)
    emit('toast', '开发备忘已成功保存！', 'success')
  } catch (err) {
    emit('toast', '保存备忘失败: ' + err.message, 'error')
  } finally {
    isSavingNote.value = false
  }
}

// 切换 SQL 状态 (测试/产线)
async function toggleSqlStatus(sql, env) {
  if (!window.electronAPI || !currentTask.value) return
  const currentStatus = env === 'test' ? sql.testStatus : sql.prodStatus
  const newStatus = currentStatus === 'published' ? 'pending' : 'published'
  const timeStr = new Date().toLocaleString()

  try {
    await window.electronAPI.updateSqlStatus(
      currentTask.value.fullPath,
      sql.fileName,
      env,
      newStatus,
      timeStr
    )
    await loadSqlsForTask(currentTask.value.fullPath)
    emit('updated')
    emit('toast', `已将 [${sql.fileName}] ${env === 'test' ? '测试' : '产线'}发布状态更新为: ${newStatus === 'published' ? '已发布' : '未发布'}`)
  } catch (err) {
    emit('toast', '更新状态失败: ' + err.message, 'error')
  }
}

// 新建 SQL
async function createNewSqlFile() {
  if (!currentTask.value || !window.electronAPI) return
  const fileName = prompt('请输入新 SQL 脚本名称 (如 02_add_index.sql):')
  if (!fileName || !fileName.trim()) return

  const cleanName = fileName.trim().endsWith('.sql') ? fileName.trim() : `${fileName.trim()}.sql`
  const dirPath = `${currentTask.value.fullPath}/sql`
  const defaultSql = `-- =====================================================================\n-- Task: ${currentTask.value.title}\n-- File: ${cleanName}\n-- Created: ${new Date().toLocaleString()}\n-- =====================================================================\n\n`

  try {
    await window.electronAPI.createTextFile(dirPath, cleanName, defaultSql)
    await loadSqlsForTask(currentTask.value.fullPath)
    emit('updated')
    emit('toast', `已成功创建 SQL 脚本: ${cleanName}`, 'success')
  } catch (err) {
    emit('toast', '创建 SQL 失败: ' + err.message, 'error')
  }
}

// 打开 SQL 合并弹窗
function openSqlMergeDialog() {
  sqlMergeModalOpen.value = true
}

// 任务状态修改
async function onTaskStatusChange(newStatus) {
  if (!currentTask.value || !window.electronAPI) return
  try {
    await window.electronAPI.updateTask(currentTask.value.fullPath, { status: newStatus })
    emit('updated')
    emit('toast', `任务状态已更新为: ${getStatusText(newStatus)}`)
  } catch (err) {
    emit('toast', '修改状态失败: ' + err.message, 'error')
  }
}

// 在本地关联程序打开文档
function openNativeDoc(filePath) {
  if (window.electronAPI) {
    window.electronAPI.openInExplorer(filePath)
    emit('toast', '正在调用关联程序打开文档...')
  }
}

// 一键复制参数
async function copyParamText(text, label) {
  if (!text) return
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(text)
    } else {
      await navigator.clipboard.writeText(text)
    }
    emit('toast', `已复制 ${label}: ${text}`, 'success')
  } catch (err) {
    emit('toast', '复制失败: ' + err.message, 'error')
  }
}

// 一键复制任务路径
async function copyTaskPath(path) {
  if (!path) return
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(path)
    } else {
      await navigator.clipboard.writeText(path)
    }
    emit('toast', `已成功复制路径: ${path}`, 'success')
  } catch (err) {
    emit('toast', '复制路径失败', 'error')
  }
}

// 打开 IDE
function openInIDE(path) {
  if (window.electronAPI) {
    window.electronAPI.openInIDE(path)
    emit('toast', '已调用编辑器打开！')
  }
}

// 打开资源管理器
function openInExplorer(path) {
  if (window.electronAPI) {
    window.electronAPI.openInExplorer(path)
    emit('toast', '已在文件资源管理器中打开！')
  }
}

// 打开命令行终端
function openInTerminal(path) {
  if (window.electronAPI) {
    window.electronAPI.openInTerminal(path)
    emit('toast', '已在当前目录拉起命令行终端！')
  }
}

// 打开任务完整模态框
function openFullTaskDetail(task) {
  emit('select-task', task)
}

// 格式化日期
function formatTaskDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  } catch (e) {
    return dateStr
  }
}

function getStatusText(status) {
  switch (status) {
    case 'archived': return '已上线归档'
    case 'suspended': return '已挂起'
    default: return '开发进行中'
  }
}

// 全局键盘导航处理 (↑ ↓ Enter / Ctrl+O / Ctrl+E)
function handleGlobalKeydown(e) {
  const tag = e.target.tagName.toLowerCase()
  if (tag === 'textarea' || (tag === 'input' && e.key !== 'Escape')) {
    if (e.key === 'Escape') {
      e.target.blur()
    }
    return
  }

  if (e.key === '/') {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (focusedTaskIndex.value < filteredTasks.value.length - 1) {
      focusedTaskIndex.value++
      scrollToActiveTask()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (focusedTaskIndex.value > 0) {
      focusedTaskIndex.value--
      scrollToActiveTask()
    }
  } else if (e.key === 'Enter') {
    if (currentTask.value) {
      e.preventDefault()
      openFullTaskDetail(currentTask.value)
    }
  } else if (e.ctrlKey && e.key === 'o') {
    if (currentTask.value) {
      e.preventDefault()
      openInIDE(currentTask.value.fullPath)
    }
  } else if (e.ctrlKey && e.key === 'e') {
    if (currentTask.value) {
      e.preventDefault()
      openInExplorer(currentTask.value.fullPath)
    }
  } else if (e.key === 'Escape') {
    closeContextMenu()
  }
}

function scrollToActiveTask() {
  nextTick(() => {
    const el = document.getElementById(`task-item-${focusedTaskIndex.value}`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// 右键菜单管理
function openTaskContextMenu(e, task) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 220),
    y: Math.min(e.clientY, window.innerHeight - 300),
    type: 'task',
    task,
    project: null
  }
}

function openProjectContextMenu(e, proj) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 220),
    y: Math.min(e.clientY, window.innerHeight - 200),
    type: 'project',
    task: null,
    project: proj
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

async function handleMenuAction(action, param = null) {
  const task = contextMenu.value.task
  if (!task) return
  closeContextMenu()

  switch (action) {
    case 'open-detail':
      openFullTaskDetail(task)
      break
    case 'open-ide':
      openInIDE(task.fullPath)
      break
    case 'open-folder':
      openInExplorer(task.fullPath)
      break
    case 'open-terminal':
      openInTerminal(task.fullPath)
      break
    case 'change-project': {
      const current = task.project || '常规项目'
      const target = prompt(`修改任务 [${task.title}] 所属项目名称：`, current)
      if (target && target.trim() && target.trim() !== current) {
        await window.electronAPI.updateTask(task.fullPath, { project: target.trim() })
        emit('updated')
        emit('toast', `项目归属已更新为: ${target.trim()}`)
      }
      break
    }
    case 'set-status':
      await window.electronAPI.updateTask(task.fullPath, { status: param })
      emit('updated')
      emit('toast', `状态已更新为: ${getStatusText(param)}`)
      break
    case 'delete-task':
      if (confirm(`确认删除任务 [${task.title}] 吗？\n\n该任务及其名下的所有需求文档、SQL脚本将被安全移入系统回收站。`)) {
        try {
          await window.electronAPI.deleteTask(task.fullPath)
          emit('updated')
          emit('toast', `已将任务 [${task.title}] 移至系统回收站`)
        } catch (err) {
          alert('删除任务失败: ' + err.message)
        }
      }
      break
  }
}

async function handleProjectMenuAction(action) {
  const proj = contextMenu.value.project
  if (!proj) return
  closeContextMenu()

  switch (action) {
    case 'create-task':
      emit('open-new-task', selectedYear.value === 'all' ? props.years[0] : selectedYear.value, proj.name)
      break
    case 'rename-project': {
      const oldName = proj.name
      const newName = prompt(`请输入项目 [${oldName}] 的新名称:`, oldName)
      if (newName && newName.trim() && newName.trim() !== oldName) {
        const cleanNew = newName.trim()
        const targetTasks = props.tasks.filter(t => (t.project || '常规项目').trim() === oldName)
        for (const t of targetTasks) {
          await window.electronAPI.updateTask(t.fullPath, { project: cleanNew })
        }
        if (selectedProject.value === oldName) {
          selectedProject.value = cleanNew
        }
        emit('updated')
        emit('toast', `已将项目 [${oldName}] 重命名为: ${cleanNew}`)
      }
      break
    }
    case 'delete-project':
      if (confirm(`⚠️ 危险操作：确认删除项目 [${proj.name}] 吗？\n\n该项目名下的全部 ${proj.totalCount} 个任务文件夹都将被安全移入 Windows 系统回收站。`)) {
        const targetTasks = props.tasks.filter(t => (t.project || '常规项目').trim() === proj.name)
        for (const t of targetTasks) {
          try {
            await window.electronAPI.deleteTask(t.fullPath)
          } catch (e) {
            console.error('删除任务失败', t.fullPath, e)
          }
        }
        if (selectedProject.value === proj.name) {
          selectedProject.value = 'all'
        }
        emit('updated')
        emit('toast', `已将项目 [${proj.name}] 及其名下任务移入回收站`)
      }
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.25);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 184, 166, 0.55);
}
</style>
