<template>
  <div class="h-full w-full flex flex-col p-3 md:p-4 overflow-hidden select-none relative font-sans text-slate-100">
    
    <!-- ===================================================================== -->
    <!-- 极客全息矩阵中枢 (Matrix Command OS 主容器 - 纯正深邃黑曜微晶玻璃)        -->
    <!-- ===================================================================== -->
    <div
      class="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300"
      style="background: rgba(14, 19, 31, 0.72); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 10px 40px rgba(0,0,0,0.5);"
    >

      <!-- 1. 顶层速战一体指挥栏 (Command Bar) -->
      <div
        class="h-13 px-5 border-b border-white/5 flex items-center justify-between gap-4 flex-shrink-0 z-20 bg-[#121826]/70"
      >
        <!-- 极速搜索过滤框 -->
        <div class="flex items-center gap-3 flex-1 max-w-md relative">
          <Sparkles class="w-4 h-4 text-teal-400 flex-shrink-0 animate-pulse" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="穿透检索 2026/2025 任务、SQL 文件或备忘... (按 / 聚焦，↑↓ 切换)"
            class="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
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
            class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border border-white/10 bg-white/5 text-slate-400 opacity-60"
          >
            /
          </kbd>
        </div>

        <!-- 胶囊筛选区 (年份下拉框、项目、待发产线) -->
        <div class="flex items-center gap-2 overflow-visible py-1">
          <!-- 年份下拉选择器 (解决年份过多不好显示问题) -->
          <div class="relative flex-shrink-0" ref="yearDropdownRef">
            <button
              type="button"
              @click.stop="toggleYearDropdown"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 text-xs font-mono font-medium transition cursor-pointer"
              :class="selectedYear !== 'all' ? 'text-teal-300 border-teal-500/40 bg-teal-950/30 font-bold' : 'text-slate-300'"
              :title="`当前年份筛选: ${selectedYear === 'all' ? '全部年份' : selectedYear + ' 年度'}`"
            >
              <Calendar class="w-3.5 h-3.5 text-teal-400" />
              <span>{{ selectedYear === 'all' ? '全部年份' : selectedYear + ' 年' }}</span>
              <ChevronDown
                class="w-3.5 h-3.5 opacity-60 transition-transform duration-200"
                :class="{ 'rotate-180 opacity-100 text-teal-400': isYearDropdownOpen }"
              />
            </button>
          </div>

          <!-- 项目下拉选择器 (解决多项目展示拥挤问题) -->
          <div class="relative flex-shrink-0" ref="projectDropdownRef">
            <button
              type="button"
              @click.stop="toggleProjectDropdown"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 text-xs font-medium transition cursor-pointer"
              :class="selectedProject !== 'all' ? 'text-teal-300 border-teal-500/40 bg-teal-950/30 font-bold' : 'text-slate-300'"
              :title="`当前项目筛选: ${selectedProject === 'all' ? '全部项目' : selectedProject}`"
            >
              <FolderKanban class="w-3.5 h-3.5 text-teal-400" />
              <span>{{ selectedProject === 'all' ? '全部项目' : selectedProject }}</span>
              <span
                v-if="selectedProject !== 'all' && currentSelectedProjectCount"
                class="text-[10px] font-mono opacity-70"
              >
                ({{ currentSelectedProjectCount }})
              </span>
              <ChevronDown
                class="w-3.5 h-3.5 opacity-60 transition-transform duration-200"
                :class="{ 'rotate-180 opacity-100 text-teal-400': isProjectDropdownOpen }"
              />
            </button>
          </div>

          <!-- 待发 SQL 快速过滤器 -->
          <button
            @click="togglePendingSqlFilter"
            class="px-2.5 py-1 rounded-xl text-xs font-medium border transition flex items-center gap-1.5"
            :class="onlyPendingSql
              ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 font-bold shadow-sm'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'"
          >
            <Database class="w-3.5 h-3.5" :class="onlyPendingSql ? 'text-amber-400' : 'opacity-60'" />
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
            class="p-2 rounded-xl text-xs transition border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            title="刷新工作区任务列表"
          >
            <RefreshCw class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 2. 双屏极客中枢架构 (左翼：超高密流线条目 36% + 右翼：全息行动舱 64%) -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- ==================== 左翼：超高密度流线条目流 ==================== -->
        <div
          class="w-5/12 max-w-md min-w-[320px] border-r border-white/5 flex flex-col overflow-hidden transition-all duration-300 bg-black/30"
        >
          <!-- 统计条 -->
          <div
            class="h-8 px-4 border-b border-white/5 flex items-center justify-between text-[11px] font-mono flex-shrink-0 bg-white/[0.02] text-slate-400"
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
            <!-- 空状态提示 (支持一键重置筛选) -->
            <div
              v-if="filteredTasks.length === 0"
              class="h-64 flex flex-col items-center justify-center text-center p-6"
            >
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-white/5 text-slate-500">
                <Layers class="w-5 h-5" />
              </div>
              <p class="text-xs font-medium text-slate-300">
                {{ props.tasks.length > 0 ? `当前筛选条件下暂无任务 (已加载 ${props.tasks.length} 个任务资产)` : "工作区内暂无任务" }}
              </p>
              <p class="text-[11px] text-slate-500 mt-1 max-w-xs">
                {{ props.tasks.length > 0 ? "年份、项目或待发产线过滤排除了任务" : "可点击右上角「新建任务」创建开发工作区" }}
              </p>
              <button
                v-if="props.tasks.length > 0"
                type="button"
                @click="resetAllFilters"
                class="mt-3.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/35 text-teal-300 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>重置全部筛选条件 (显示 {{ props.tasks.length }} 个任务)</span>
              </button>
            </div>
            <!-- 条目卡片 (统一黑曜底色，左侧发光微晶光纤) -->
            <div
              v-for="(task, idx) in filteredTasks"
              :key="task.fullPath"
              :id="`task-item-${idx}`"
              @click="setFocusedTask(idx)"
              @dblclick="openInExplorer(task.fullPath)"
              @contextmenu.prevent.stop="openTaskContextMenu($event, task)"
              :title="`单击查看详情 · 双击在资源管理器打开 · 右键管理`"
              class="p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative select-none"
              :class="focusedTaskIndex === idx
                ? 'bg-teal-950/40 border-teal-500/70 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/30 text-white'
                : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-300'"
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
                      class="px-1.5 py-0.2 rounded text-[10px] font-mono flex-shrink-0 bg-white/10 text-slate-400"
                    >
                      {{ task.year }}
                    </span>
                    <span
                      v-if="task.project"
                      class="px-1.5 py-0.2 rounded text-[10px] font-mono flex-shrink-0 bg-teal-950/60 text-teal-300 border border-teal-800/50 font-bold"
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
                      ? 'text-teal-200 font-bold'
                      : 'text-slate-200 group-hover:text-teal-300'"
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
                  class="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 shadow-sm bg-amber-950/70 text-amber-300 border border-amber-600/50"
                >
                  <Database class="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span>{{ task.prodPendingCount }} 待发</span>
                </span>
                <span
                  v-else-if="task.sqlCount > 0"
                  class="text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 bg-teal-950/40 text-teal-300/90 border border-teal-800/40"
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

        <!-- ==================== 右翼：全息行动舱 (标签式工作区，彻底告别纵向无限下滚) ==================== -->
        <div
          v-if="currentTask"
          class="flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-300 bg-black/20"
        >
          <!-- 1. 任务头部看板与一键唤醒工具条 (固定紧凑顶栏) -->
          <div
            class="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition shadow-sm bg-[#121826]/90 flex-shrink-0"
          >
            <div class="space-y-1.5 flex-1 min-w-0">
              <!-- 属性标签行 -->
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-amber-950/70 text-amber-300 border-amber-700/60"
                >
                  {{ currentTask.year }} 年度
                </span>
                <span
                  v-if="currentTask.project"
                  class="px-2 py-0.5 rounded text-[10px] font-mono border bg-white/10 text-slate-200 border-white/10 font-bold"
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
                      ? 'bg-white/10 text-slate-400 border-white/10'
                      : (currentTask.status === 'suspended'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                          : 'bg-teal-950/80 text-teal-300 border-teal-700')"
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

              <!-- 完整长标题 (彻底告别截断) -->
              <h2
                class="text-base font-bold leading-relaxed text-white"
              >
                {{ currentTask.title }}
              </h2>

              <!-- 完整物理路径 -->
              <div class="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 truncate" :title="currentTask.fullPath">
                <FolderOpen class="w-3.5 h-3.5 flex-shrink-0 text-teal-400" />
                <span class="truncate">{{ currentTask.fullPath }}</span>
              </div>
            </div>

            <!-- 工具操作栏 (仅保留资源管理器与快捷复制路径) -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                @click="openInExplorer(currentTask.fullPath)"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm border bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/40 ring-1 ring-teal-500/20 cursor-pointer"
                title="在 Windows 资源管理器中打开此文件夹 (Ctrl+E)"
              >
                <FolderOpen class="w-3.5 h-3.5 text-teal-400" />
                <span>打开资源管理器</span>
              </button>

              <button
                @click="copyTaskPath(currentTask.fullPath)"
                class="p-2 rounded-xl text-xs transition border bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 cursor-pointer"
                title="一键复制当前任务绝对路径"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 2. 工作区独立子标签栏 (解决无限下滚的核心设计) -->
          <div class="h-11 px-4 border-b border-white/10 bg-black/30 flex items-center justify-between flex-shrink-0 select-none">
            <div class="flex items-center gap-1">
              <!-- 标签 1：开发备忘与联调参数 -->
              <button
                type="button"
                @click="activeWorkspaceTab = 'notes'"
                class="px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition -mb-px cursor-pointer"
                :class="activeWorkspaceTab === 'notes' ? 'border-teal-400 text-teal-300 bg-teal-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <StickyNote class="w-3.5 h-3.5 text-teal-400" />
                <span>开发备忘与参数</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300">
                  {{ taskNotes.length }}
                </span>
              </button>

              <!-- 标签 2：SQL 资产发布 -->
              <button
                type="button"
                @click="activeWorkspaceTab = 'sqls'"
                class="px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition -mb-px cursor-pointer"
                :class="activeWorkspaceTab === 'sqls' ? 'border-teal-400 text-teal-300 bg-teal-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <Database class="w-3.5 h-3.5 text-amber-400" />
                <span>SQL 资产发布</span>
                <span
                  class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold"
                  :class="currentTask.prodPendingCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-white/10 text-slate-300'"
                >
                  {{ currentSqls.length }}
                </span>
              </button>

              <!-- 标签 3：交付与需求文档 -->
              <button
                type="button"
                @click="activeWorkspaceTab = 'docs'"
                class="px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition -mb-px cursor-pointer"
                :class="activeWorkspaceTab === 'docs' ? 'border-teal-400 text-teal-300 bg-teal-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'"
              >
                <FolderKanban class="w-3.5 h-3.5 text-teal-400" />
                <span>交付与需求文档</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300">
                  {{ currentDocs.length }}
                </span>
              </button>

              <!-- 标签 4：综合看板 (全览) -->
              <button
                type="button"
                @click="activeWorkspaceTab = 'overview'"
                class="px-3 py-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition -mb-px cursor-pointer"
                :class="activeWorkspaceTab === 'overview' ? 'border-teal-400 text-teal-300 bg-teal-500/10' : 'border-transparent text-slate-500 hover:text-slate-300'"
                title="三模块紧凑看板一览"
              >
                <LayoutGrid class="w-3.5 h-3.5" />
                <span>全景看板</span>
              </button>
            </div>
          </div>

          <!-- 3. 工作区独立主内容视口 (每个标签页拥有完全独立的视口滚动，绝不相互挤压) -->
          <div class="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 custom-scrollbar">

            <!-- ============================== TAB 1: 开发备忘与联调参数 ============================== -->
            <div v-if="activeWorkspaceTab === 'notes'" class="space-y-3.5">
              <!-- 智能提取参数：支持平铺看全 (默认) & 紧凑单行切换，彻底杜绝看不全 -->
              <div
                v-if="enableSmartParams && parsedParameters.length > 0"
                class="p-2.5 rounded-xl border border-white/10 bg-[#121826]/90 transition-all duration-200"
              >
                <!-- 参数栏控制条 -->
                <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5 select-none">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="isMoreParamsOpen = true"
                      class="px-2.5 py-1 rounded-lg border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-mono font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-sm transition"
                      :title="`打开参数全景清单 (${parsedParameters.length} 项)`"
                    >
                      <Sparkles class="w-3.5 h-3.5 text-teal-400" />
                      <span>速拷核心参数 ({{ parsedParameters.length }})</span>
                      <ExternalLink class="w-3 h-3 opacity-60" />
                    </button>
                    <span class="text-[11px] text-slate-400 hidden sm:inline font-mono">
                      {{ paramViewMode === "wrap" ? "当前为平铺完整模式 (无截断)" : "当前为单行紧凑模式 (支持滚轮横划)" }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs">
                    <!-- 平铺模式 / 紧凑单行切换 -->
                    <button
                      type="button"
                      @click="toggleParamViewMode"
                      class="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono transition flex items-center gap-1 cursor-pointer"
                      :title="paramViewMode === 'wrap' ? '切换为单行紧凑横向滚动模式' : '切换为平铺展开完整展示模式'"
                    >
                      <LayoutGrid v-if="paramViewMode === 'compact'" class="w-3 h-3 text-teal-400" />
                      <Minimize2 v-else class="w-3 h-3 text-amber-400" />
                      <span>{{ paramViewMode === "wrap" ? "收起单行" : "平铺看全" }}</span>
                    </button>

                    <!-- 弹窗全览 -->
                    <button
                      type="button"
                      @click="isMoreParamsOpen = true"
                      class="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono transition flex items-center gap-1 cursor-pointer"
                      title="打开弹窗全屏查看无截断公私钥与全量复制"
                    >
                      <Eye class="w-3 h-3 text-sky-400" />
                      <span>完整查看</span>
                    </button>

                    <!-- 关闭/移除智能读取按钮 (满足用户“不行就把智能读取删除”的需求) -->
                    <button
                      type="button"
                      @click="toggleSmartParams(false)"
                      class="px-2 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-mono transition flex items-center gap-1 cursor-pointer"
                      title="关闭并移除智能提取参数栏（可在下方备忘工具栏随时重新开启）"
                    >
                      <X class="w-3 h-3 text-rose-400" />
                      <span>关闭提取</span>
                    </button>
                  </div>
                </div>

                <!-- 模式 A：平铺完整模式 (默认，所有参数完整换行，超宽展示) -->
                <div
                  v-if="paramViewMode === 'wrap'"
                  class="flex flex-wrap items-center gap-2 pt-0.5"
                >
                  <div
                    v-for="(param, pIdx) in parsedParameters"
                    :key="pIdx"
                    class="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-2 transition group bg-black/50 hover:bg-black/75 shadow-sm relative"
                    :class="getParamPillColor(param.type)"
                  >
                    <span class="font-bold whitespace-nowrap text-teal-300 flex-shrink-0">{{ param.label }}:</span>
                    <span
                      class="text-slate-200 group-hover:text-white font-mono break-all max-w-[280px] sm:max-w-[420px] select-all cursor-text"
                      :title="`完整值: ${param.value} (单击复制)`"
                    >
                      {{ param.value }}
                    </span>
                    <button
                      type="button"
                      @click="copyParamText(param.value, param.label)"
                      class="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-teal-300 transition cursor-pointer flex-shrink-0"
                      title="复制完整值到剪贴板"
                    >
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- 模式 B：单行紧凑横向滚动模式 -->
                <div
                  v-else
                  ref="paramBarRef"
                  @wheel.prevent="handleParamWheel"
                  class="h-7 max-h-[28px] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 select-none"
                >
                  <button
                    v-for="(param, pIdx) in parsedParameters"
                    :key="pIdx"
                    type="button"
                    @click="copyParamText(param.value, param.label)"
                    class="px-2.5 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer group bg-black/45 hover:bg-white/10 flex-shrink-0"
                    :class="getParamPillColor(param.type)"
                    :title="`【${param.label}】\n完整值: ${param.value}\n(单击直接复制)`"
                  >
                    <span class="font-bold max-w-[100px] truncate">{{ param.label }}:</span>
                    <span class="text-slate-200 group-hover:text-white font-mono max-w-[220px] truncate">{{ param.value }}</span>
                    <Copy class="w-3 h-3 text-slate-500 group-hover:text-teal-300 flex-shrink-0" />
                  </button>
                </div>
              </div>

              <!-- 备忘卡片主卡槽 -->
              <div class="p-4 rounded-xl border border-white/10 space-y-3 bg-[#121826]/90 relative">
                <!-- 顶栏：标题 + 内嵌搜索框 + 模式切换 + 新建按钮 -->
                <div class="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <StickyNote class="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <h3 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>备忘条目流</span>
                      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {{ taskNotes.length }}
                      </span>
                    </h3>
                  </div>

                  <!-- 嵌入式微型搜索框 -->
                  <div
                    v-if="noteViewMode === 'cards'"
                    class="relative flex-1 max-w-xs flex items-center bg-black/45 border border-white/10 rounded-lg px-2.5 py-1 focus-within:border-teal-500/60 focus-within:shadow-[0_0_12px_rgba(20,184,166,0.15)] transition"
                  >
                    <Search class="w-3.5 h-3.5 text-slate-500 mr-1.5 flex-shrink-0" />
                    <input
                      v-model="noteSearchQuery"
                      type="text"
                      placeholder="检索标题、参数、代码..."
                      class="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                    />
                    <button
                      v-if="noteSearchQuery"
                      type="button"
                      @click="noteSearchQuery = ''"
                      class="p-0.5 rounded text-slate-500 hover:text-white transition cursor-pointer"
                      title="清空搜索"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </div>

                  <!-- 右侧控制按钮组 -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span v-if="isSavingNote" class="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                      <RefreshCw class="w-3 h-3 animate-spin" /> 保存中...
                    </span>
                    <span v-else-if="noteSavedNotice" class="text-[10px] text-teal-300 font-mono flex items-center gap-1">
                      <Check class="w-3 h-3 text-teal-400" /> 已同步
                    </span>

                    <!-- 智能提取开关按钮 (随时一键开启或彻底关闭) -->
                    <button
                      type="button"
                      @click="toggleSmartParams()"
                      class="px-2.5 py-1 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                      :class="enableSmartParams ? 'border-teal-500/30 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25' : 'border-white/10 bg-black/40 text-slate-400 hover:text-slate-200 hover:border-white/20'"
                      :title="enableSmartParams ? '智能提取参数栏已启用，点击可隐藏/关闭' : '点击开启智能提取参数栏'"
                    >
                      <Sparkles class="w-3.5 h-3.5" :class="enableSmartParams ? 'text-teal-400' : 'text-slate-500'" />
                      <span>{{ enableSmartParams ? '智能提取: 开' : '智能提取: 关' }}</span>
                    </button>

                    <!-- 模式切换：卡片 vs 源码 -->
                    <div class="flex items-center p-0.5 rounded-lg border border-white/10 bg-black/40 text-[11px] font-medium">
                      <button
                        type="button"
                        @click="setNoteViewMode('cards')"
                        class="px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                        :class="noteViewMode === 'cards' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-white'"
                        title="卡片流模式"
                      >
                        <Layers class="w-3 h-3" />
                        <span>卡片</span>
                      </button>
                      <button
                        type="button"
                        @click="setNoteViewMode('raw')"
                        class="px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                        :class="noteViewMode === 'raw' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-white'"
                        title="Markdown源码视图"
                      >
                        <FileCode class="w-3 h-3" />
                        <span>源码</span>
                      </button>
                    </div>

                    <!-- 新建备忘按钮 -->
                    <button
                      type="button"
                      v-if="noteViewMode === 'cards'"
                      @click="toggleAddNotePanel"
                      class="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Plus class="w-3.5 h-3.5 text-slate-950" />
                      <span>新建</span>
                    </button>
                  </div>
                </div>

                <!-- 卡片模式内容区域 -->
                <div v-if="noteViewMode === 'cards'" class="space-y-2.5">
                  <!-- 标签分类过滤筛选行 -->
                  <div v-if="availableNoteCategories.length > 0" class="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                    <span class="text-[10px] text-slate-500 font-mono mr-1">分类:</span>
                    <button
                      type="button"
                      @click="selectedNoteCategory = 'all'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer"
                      :class="selectedNoteCategory === 'all'
                        ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'"
                    >
                      全部 ({{ taskNotes.length }})
                    </button>
                    <button
                      v-for="cat in availableNoteCategories"
                      :key="cat.name"
                      type="button"
                      @click="selectedNoteCategory = cat.name"
                      class="px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                      :class="selectedNoteCategory === cat.name
                        ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'"
                    >
                      <span>{{ cat.name }}</span>
                      <span class="text-[9px] opacity-60">({{ cat.count }})</span>
                    </button>
                  </div>

                  <!-- 新增备忘抽屉/折叠卡片 -->
                  <div
                    v-if="isAddingNote"
                    class="p-3.5 rounded-xl border border-teal-500/40 bg-slate-950/90 shadow-xl space-y-3 animate-in fade-in duration-150"
                  >
                    <div class="flex items-center justify-between border-b border-white/10 pb-2">
                      <span class="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                        <Plus class="w-3.5 h-3.5 text-teal-400" /> 新建备忘卡片
                      </span>
                      <button
                        type="button"
                        @click="isAddingNote = false"
                        class="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div class="space-y-2.5">
                      <div class="flex items-center gap-2">
                        <input
                          v-model="newNoteForm.title"
                          type="text"
                          placeholder="备忘标题 (选填，如：网关公钥 / 联调 Token / 接口回调)"
                          class="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-medium"
                          @keydown.enter.ctrl.stop="submitNewNote"
                        />
                        <button
                          type="button"
                          @click="newNoteForm.pinned = !newNoteForm.pinned"
                          class="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition cursor-pointer"
                          :class="newNoteForm.pinned ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-black/30 text-slate-500 border-white/10 hover:text-slate-300'"
                          title="置顶此条目"
                        >
                          <Pin class="w-3.5 h-3.5" />
                          <span>置顶</span>
                        </button>
                      </div>

                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[10px] text-slate-400">选择分类:</span>
                        <button
                          v-for="cat in PRESET_CATEGORIES"
                          :key="cat.key"
                          type="button"
                          @click="newNoteForm.category = cat.key"
                          class="px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer"
                          :class="newNoteForm.category === cat.key ? cat.borderClass + ' font-bold' : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'"
                        >
                          {{ cat.label }}
                        </button>
                      </div>

                      <textarea
                        v-model="newNoteForm.content"
                        rows="4"
                        placeholder="在此粘贴参数、私钥、联调地址、SQL或踩坑备忘 (支持 Markdown)..."
                        class="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/60 resize-y leading-relaxed"
                        @keydown.ctrl.enter.prevent="submitNewNote"
                      ></textarea>

                      <div class="flex items-center justify-between pt-1">
                        <span class="text-[10px] text-slate-500 font-mono">提示: 按 Ctrl+Enter 快速提交卡片</span>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            @click="isAddingNote = false"
                            class="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            @click="submitNewNote"
                            class="px-3.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            保存卡片
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 卡片列表流 -->
                  <div v-if="filteredTaskNotes.length > 0" class="space-y-2.5">
                    <div
                      v-for="note in filteredTaskNotes"
                      :key="note.id"
                      class="p-3.5 rounded-xl border bg-black/35 hover:bg-black/55 transition-all duration-150 group relative"
                      :class="note.pinned
                        ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                        : 'border-white/5 hover:border-teal-500/30 hover:shadow-lg'"
                    >
                      <!-- 普通展示状态 -->
                      <div v-if="editingNoteId !== note.id">
                        <div class="flex items-start justify-between gap-2 mb-2">
                          <div class="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              class="text-[10px] px-2 py-0.5 rounded font-mono font-medium border flex-shrink-0"
                              :class="getCategoryStyle(note.category)"
                            >
                              {{ note.category || '配置参数' }}
                            </span>
                            <h4
                              class="text-xs font-bold text-white truncate flex-1"
                              :title="note.title"
                            >
                              {{ note.title || '无标题备忘' }}
                            </h4>
                            <span
                              v-if="note.pinned"
                              class="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold flex items-center gap-0.5 flex-shrink-0"
                            >
                              <Pin class="w-2.5 h-2.5" /> 置顶
                            </span>
                          </div>

                          <!-- 卡片操作按钮组 -->
                          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition flex-shrink-0">
                            <button
                              type="button"
                              @click="copyNoteContent(note)"
                              class="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-white/5 transition cursor-pointer"
                              :title="copiedNoteId === note.id ? '已复制！' : '复制此卡片正文'"
                            >
                              <Check v-if="copiedNoteId === note.id" class="w-3.5 h-3.5 text-teal-400" />
                              <Copy v-else class="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              @click="togglePinNote(note)"
                              class="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/5 transition cursor-pointer"
                              :class="{ 'text-amber-400': note.pinned }"
                              :title="note.pinned ? '取消置顶' : '置顶此条目'"
                            >
                              <Pin class="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              @click="startEditNote(note)"
                              class="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-white/5 transition cursor-pointer"
                              title="就地编辑此条目"
                            >
                              <Pencil class="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              @click="deleteNote(note.id)"
                              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                              title="删除此条目"
                            >
                              <Trash2 class="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <!-- 卡片正文 -->
                        <div class="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5 max-h-56 overflow-y-auto custom-scrollbar select-text">
                          {{ note.content }}
                        </div>

                        <div class="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>最后更新: {{ formatNoteTime(note.updatedAt) }}</span>
                          <span class="opacity-60">{{ (note.content || '').length }} 字符</span>
                        </div>
                      </div>

                      <!-- 就地编辑状态 -->
                      <div v-else class="space-y-3 animate-in fade-in duration-100">
                        <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span class="text-xs font-bold text-teal-300">编辑条目</span>
                          <button
                            type="button"
                            @click="cancelEditNote"
                            class="p-1 rounded text-slate-400 hover:text-white"
                          >
                            <X class="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div class="flex items-center gap-2">
                          <input
                            v-model="editingNoteForm.title"
                            type="text"
                            placeholder="标题"
                            class="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500/60 font-medium"
                          />
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <button
                            v-for="cat in PRESET_CATEGORIES"
                            :key="cat.key"
                            type="button"
                            @click="editingNoteForm.category = cat.key"
                            class="px-2 py-0.5 rounded text-[10px] font-medium border transition"
                            :class="editingNoteForm.category === cat.key ? cat.borderClass + ' font-bold' : 'bg-black/30 border-white/10 text-slate-400'"
                          >
                            {{ cat.label }}
                          </button>
                        </div>
                        <textarea
                          v-model="editingNoteForm.content"
                          rows="4"
                          class="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500/60 resize-y"
                        ></textarea>
                        <div class="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            @click="cancelEditNote"
                            class="px-3 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            @click="saveEditNote"
                            class="px-3.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 空卡片状态 -->
                  <div
                    v-else
                    class="py-10 text-center rounded-xl border border-dashed border-white/10 text-slate-500 space-y-2 bg-black/20"
                  >
                    <StickyNote class="w-8 h-8 text-slate-600 mx-auto" />
                    <p class="text-xs text-slate-300 font-medium">当前暂无备忘条目</p>
                    <p class="text-[11px] text-slate-500">点击上方「新建」即可快速记录联调参数、密钥或接口备忘</p>
                  </div>
                </div>

                <!-- 源码长文本模式 -->
                <div v-else class="space-y-2">
                  <div class="flex items-center justify-between text-xs text-slate-400">
                    <span class="flex items-center gap-1 font-mono text-[11px]">
                      <FileCode class="w-3.5 h-3.5 text-teal-400" />
                      <span>正在直接编辑 docs/笔记.md 源码 (按 Ctrl+S 立即保存)</span>
                    </span>
                    <button
                      type="button"
                      @click="saveRawNote"
                      class="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Save class="w-3.5 h-3.5" />
                      <span>保存源码</span>
                    </button>
                  </div>
                  <textarea
                    v-model="rawNoteContent"
                    @keydown.ctrl.s.prevent="saveRawNote"
                    rows="16"
                    class="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/60 resize-y leading-relaxed custom-scrollbar select-text"
                    placeholder="在此直接编辑全量 Markdown 笔记..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- ============================== TAB 2: 上线 SQL 资产发布 ============================== -->
            <div v-else-if="activeWorkspaceTab === 'sqls'" class="space-y-3.5">
              <div class="p-4 rounded-xl border border-white/5 space-y-3 transition shadow-sm bg-[#121826]/90">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <Database class="w-4 h-4 text-amber-400" />
                    <h3 class="text-xs font-bold text-slate-100">
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
                      class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-teal-950/40 cursor-pointer"
                      title="一键按序拼接、包裹事务并生成上线汇总单 (00_merged_all.sql)"
                    >
                      <Sparkles class="w-3.5 h-3.5" />
                      <span>一键合并上线 SQL</span>
                    </button>
                    <button
                      @click="createNewSqlFile"
                      class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 flex items-center gap-1 transition bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5 text-teal-400" />
                      <span>新建 SQL</span>
                    </button>
                  </div>
                </div>

                <!-- SQL 脚本条目列表 -->
                <div v-if="loadingSqls" class="py-10 text-center text-xs text-slate-400">
                  <RefreshCw class="w-4 h-4 animate-spin mx-auto mb-1 text-teal-400" />
                  <span>正在扫描当前任务 SQL 脚本...</span>
                </div>

                <div
                  v-else-if="currentSqls.length === 0"
                  class="py-10 text-center rounded-lg border border-white/10 text-xs text-slate-500 bg-black/20"
                >
                  <span>当前任务暂无 SQL 脚本，可点击上方「新建 SQL」或放入 sql 目录</span>
                </div>

                <div v-else class="space-y-1.5">
                  <div
                    v-for="sql in currentSqls"
                    :key="sql.fileName"
                    @click="openFilePreview(sql.filePath, sql.fileName, true)"
                    @contextmenu.prevent.stop="openSqlContextMenu($event, sql)"
                    class="p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-3 text-xs transition group bg-black/40 hover:bg-black/60 hover:border-teal-500/40 cursor-pointer"
                    :title="`点击在软件弹窗中查看与编辑 · 右键查看更多操作: ${sql.fileName}`"
                  >
                    <!-- 文件名与大小 -->
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                      <Database class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span
                        class="font-mono font-bold truncate text-slate-200 group-hover:text-teal-300 transition"
                        :title="sql.fileName"
                      >
                        {{ sql.fileName }}
                      </span>
                      <span class="text-[10px] text-slate-500 font-mono flex-shrink-0">
                        ({{ (sql.size / 1024).toFixed(1) }} KB)
                      </span>
                    </div>

                    <!-- 发布状态与操作区 -->
                    <div class="flex items-center gap-2 flex-shrink-0" @click.stop>
                      <!-- 产线环境状态徽章 (点击打开二次确认弹窗) -->
                      <button
                        type="button"
                        @click.stop="promptToggleProdStatus(sql)"
                        class="px-2.5 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 cursor-pointer"
                        :class="sql.prodReleased
                          ? 'bg-teal-950/70 text-teal-300 border border-teal-700/60 font-bold hover:bg-teal-900/60'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-600/60 font-bold animate-pulse hover:bg-amber-900/60'"
                        :title="`当前产线状态: ${sql.prodReleased ? '已发' : '待发'} (点击确认变更)`"
                      >
                        <span>产线: {{ sql.prodReleased ? '已发' : '待发' }}</span>
                      </button>

                      <!-- 弹窗查看源码 (预览模式) -->
                      <button
                        type="button"
                        @click.stop="openFilePreview(sql.filePath, sql.fileName, false)"
                        class="p-1 rounded opacity-60 hover:opacity-100 transition text-slate-400 hover:text-teal-300 cursor-pointer"
                        title="在软件弹框中查看 SQL 源码"
                      >
                        <Eye class="w-3.5 h-3.5" />
                      </button>

                      <!-- 弹窗编辑源码 (直接进入编辑模式) -->
                      <button
                        type="button"
                        @click.stop="openFilePreview(sql.filePath, sql.fileName, true)"
                        class="p-1 rounded opacity-60 hover:opacity-100 transition text-slate-400 hover:text-amber-300 cursor-pointer"
                        title="在软件弹框中直接编辑 SQL 源码"
                      >
                        <Pencil class="w-3.5 h-3.5" />
                      </button>

                      <!-- 在资源管理器中定位 -->
                      <button
                        type="button"
                        @click.stop="showInFolder(sql.filePath)"
                        class="p-1 rounded opacity-60 hover:opacity-100 transition text-slate-400 hover:text-teal-300 cursor-pointer"
                        title="在 Windows 资源管理器中定位此 SQL 脚本"
                      >
                        <FolderOpen class="w-3 h-3" />
                      </button>

                      <!-- 复制 SQL 路径 -->
                      <button
                        type="button"
                        @click.stop="copyTaskPath(sql.filePath)"
                        class="p-1 rounded opacity-60 hover:opacity-100 transition text-slate-400 hover:text-white cursor-pointer"
                        title="复制 SQL 脚本绝对路径"
                      >
                        <Copy class="w-3 h-3" />
                      </button>

                      <!-- 删除 SQL 脚本 (移入回收站) -->
                      <button
                        type="button"
                        @click.stop="deleteSqlItem(sql)"
                        class="p-1 rounded opacity-60 hover:opacity-100 transition text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="删除此 SQL 脚本 (移入回收站)"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ============================== TAB 3: 交付与需求文档 ============================== -->
            <div v-else-if="activeWorkspaceTab === 'docs'" class="space-y-3.5">
              <div class="p-4 rounded-xl border border-white/5 space-y-3 transition shadow-sm bg-[#121826]/90">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold flex items-center gap-1.5 text-slate-100">
                    <FolderKanban class="w-4 h-4 text-teal-400" />
                    <span>需求与交付文档资产 ({{ currentDocs.length }})</span>
                  </h3>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-slate-500 font-mono">单击条目在软件弹窗预览 · 后方按钮专用打开</span>
                    <button
                      type="button"
                      @click="openInExplorer(currentTask.fullPath + '/docs')"
                      class="px-2.5 py-1 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition flex items-center gap-1 cursor-pointer"
                      title="打开任务 docs 文件夹"
                    >
                      <FolderOpen class="w-3.5 h-3.5 text-teal-400" />
                      <span>打开 docs 目录</span>
                    </button>
                  </div>
                </div>

                <div v-if="currentDocs.length === 0" class="py-10 text-center rounded-lg border border-white/10 text-xs text-slate-500 bg-black/20">
                  <span>当前 docs 目录下暂无文档，可将 Word、需求.md 或 PDF 文件放入任务 docs 目录</span>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    v-for="doc in currentDocs"
                    :key="doc.fileName"
                    @click="openFilePreview(doc.filePath, doc.fileName)"
                    @contextmenu.prevent.stop="openDocContextMenu($event, doc)"
                    class="p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2.5 cursor-pointer transition hover:border-teal-500/50 group bg-black/40 hover:bg-black/60 shadow-sm"
                    :title="`点击在软件弹窗中查看 · 右键查看更多操作: ${doc.fileName}`"
                  >
                    <!-- 文件名与大小 -->
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                      <FileText v-if="isWordFile(doc.fileName)" class="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <Sheet v-else-if="isExcelFile(doc.fileName)" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <FileCode v-else-if="isCodeDoc(doc.fileName)" class="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <FileText v-else class="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div class="min-w-0 flex-1">
                        <span
                          class="text-xs font-medium font-mono truncate block group-hover:text-teal-300 transition text-slate-200"
                        >
                          {{ doc.fileName }}
                        </span>
                        <span v-if="doc.size" class="text-[10px] text-slate-500 font-mono block">
                          {{ (doc.size / 1024).toFixed(1) }} KB
                        </span>
                      </div>
                    </div>

                    <!-- 后面单独的操作按钮区 (Word用Word打开，Excel用Excel打开) -->
                    <div class="flex items-center gap-1.5 flex-shrink-0" @click.stop>
                      <!-- Word 专用直启按钮 -->
                      <button
                        v-if="isWordFile(doc.fileName)"
                        type="button"
                        @click.stop="openNativeDoc(doc.filePath)"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 transition flex items-center gap-1 cursor-pointer shadow-sm"
                        title="使用本机 Microsoft Word 直接打开此文件"
                      >
                        <FileText class="w-3 h-3 text-blue-400" />
                        <span>Word打开</span>
                      </button>

                      <!-- Excel 专用直启按钮 -->
                      <button
                        v-else-if="isExcelFile(doc.fileName)"
                        type="button"
                        @click.stop="openNativeDoc(doc.filePath)"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1 cursor-pointer shadow-sm"
                        title="使用本机 Microsoft Excel 直接打开此文件"
                      >
                        <Sheet class="w-3 h-3 text-emerald-400" />
                        <span>Excel打开</span>
                      </button>

                      <!-- 其他文件外部打开 -->
                      <button
                        v-else
                        type="button"
                        @click.stop="openNativeDoc(doc.filePath)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-white/5 transition cursor-pointer"
                        title="使用系统默认程序打开"
                      >
                        <ExternalLink class="w-3.5 h-3.5" />
                      </button>

                      <!-- 资源管理器定位 -->
                      <button
                        type="button"
                        @click.stop="showInFolder(doc.filePath)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                        title="在资源管理器中定位"
                      >
                        <FolderOpen class="w-3.5 h-3.5" />
                      </button>

                      <!-- 删除此文档 (移入回收站) -->
                      <button
                        type="button"
                        @click.stop="deleteDocItem(doc)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="删除该文档 (移入回收站)"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ============================== TAB 4: 全景看板 (3合1紧凑概览) ============================== -->
            <div v-else-if="activeWorkspaceTab === 'overview'" class="space-y-4">
              <!-- 快捷状态卡片 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  @click="activeWorkspaceTab = 'notes'"
                  class="p-4 rounded-xl border border-white/5 bg-[#121826]/90 hover:border-teal-500/40 cursor-pointer transition shadow-sm space-y-1"
                >
                  <div class="flex items-center justify-between text-slate-400">
                    <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <StickyNote class="w-3.5 h-3.5 text-teal-400" /> 开发备忘
                    </span>
                    <span class="font-mono text-xs font-bold text-teal-300">{{ taskNotes.length }} 条</span>
                  </div>
                  <p class="text-[11px] text-slate-500">
                    {{ enableSmartParams ? `已提取 ${parsedParameters.length} 个联调参数，点击查看详情` : '智能提取已关闭' }}
                  </p>
                </div>

                <div
                  @click="activeWorkspaceTab = 'sqls'"
                  class="p-4 rounded-xl border border-white/5 bg-[#121826]/90 hover:border-amber-500/40 cursor-pointer transition shadow-sm space-y-1"
                >
                  <div class="flex items-center justify-between text-slate-400">
                    <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Database class="w-3.5 h-3.5 text-amber-400" /> SQL 发布
                    </span>
                    <span
                      class="font-mono text-xs font-bold"
                      :class="currentTask.prodPendingCount > 0 ? 'text-amber-400' : 'text-teal-400'"
                    >
                      {{ currentTask.prodPendingCount > 0 ? currentTask.prodPendingCount + ' 份待发' : '全部已上线' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500">共 {{ currentSqls.length }} 份脚本，支持一键合并与事务保护</p>
                </div>

                <div
                  @click="activeWorkspaceTab = 'docs'"
                  class="p-4 rounded-xl border border-white/5 bg-[#121826]/90 hover:border-blue-500/40 cursor-pointer transition shadow-sm space-y-1"
                >
                  <div class="flex items-center justify-between text-slate-400">
                    <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FolderKanban class="w-3.5 h-3.5 text-teal-400" /> 文档资产
                    </span>
                    <span class="font-mono text-xs font-bold text-blue-400">{{ currentDocs.length }} 份</span>
                  </div>
                  <p class="text-[11px] text-slate-500">支持 Word、PDF、Markdown 软件内弹窗或本机打开</p>
                </div>
              </div>

              <!-- 全景看板参数速查区 (支持完整查看) -->
              <div
                v-if="enableSmartParams && parsedParameters.length > 0"
                class="p-3.5 rounded-xl border border-white/10 bg-[#121826]/90 space-y-2.5"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs text-teal-400 font-bold flex items-center gap-1.5">
                    <Sparkles class="w-3.5 h-3.5" /> 核心联调参数 ({{ parsedParameters.length }} 项):
                  </span>
                  <button
                    type="button"
                    @click="isMoreParamsOpen = true"
                    class="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span>完整查看清单</span>
                  </button>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <div
                    v-for="(param, pIdx) in parsedParameters"
                    :key="pIdx"
                    class="px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-2 transition group bg-black/50 hover:bg-black/75 shadow-sm"
                    :class="getParamPillColor(param.type)"
                  >
                    <span class="font-bold whitespace-nowrap text-teal-300 flex-shrink-0">{{ param.label }}:</span>
                    <span
                      class="text-slate-200 group-hover:text-white font-mono break-all max-w-[280px] sm:max-w-[360px] truncate select-all cursor-text"
                      :title="`完整值: ${param.value} (单击复制)`"
                    >
                      {{ param.value }}
                    </span>
                    <button
                      type="button"
                      @click="copyParamText(param.value, param.label)"
                      class="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-teal-300 transition cursor-pointer flex-shrink-0"
                      title="复制完整值"
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </div>
                </div>
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
        class="h-8 px-5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono flex-shrink-0 select-none bg-black/40 text-slate-400"
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
          <span class="hidden sm:inline">↑↓ 切换任务</span>
          <span class="hidden sm:inline">Ctrl+E 资源管理器</span>
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
        class="fixed z-50 rounded-xl border border-slate-700 shadow-2xl py-1.5 text-xs backdrop-blur-xl animate-in fade-in duration-100 min-w-[200px] bg-slate-900/95 text-slate-200"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <template v-if="contextMenu.type === 'task' && contextMenu.task">
          <div class="px-3 py-1 font-mono text-[10px] text-slate-500 border-b border-white/10 truncate font-bold">
            {{ contextMenu.task.title }}
          </div>

          <!-- 仅保留资源管理器打开选项 -->
          <button
            @click="handleMenuAction('open-folder')"
            class="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <FolderOpen class="w-4 h-4 text-teal-400" />
            <span class="font-medium">在 Windows 资源管理器中打开</span>
          </button>

          <div class="my-1 border-t border-white/10"></div>

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

          <div class="my-1 border-t border-white/10"></div>

          <button
            @click="handleMenuAction('delete-task')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除该任务 (移入回收站)</span>
          </button>
        </template>

        <template v-else-if="contextMenu.type === 'project' && contextMenu.project">
          <div class="px-3 py-1 font-mono text-[10px] text-slate-500 border-b border-white/10 truncate font-bold">
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
          <div class="my-1 border-t border-white/10"></div>
          <button
            @click="handleProjectMenuAction('delete-project')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除该项目 (移入回收站)</span>
          </button>
        </template>

        <!-- SQL 脚本右键上下文菜单 -->
        <template v-else-if="contextMenu.type === 'sql' && contextMenu.sql">
          <div class="px-3 py-1 font-mono text-[10px] text-slate-500 border-b border-white/10 truncate font-bold flex items-center gap-1.5">
            <Database class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span class="truncate">{{ contextMenu.sql.fileName }}</span>
          </div>

          <button
            @click="handleSqlMenuAction('edit')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <Pencil class="w-3.5 h-3.5 text-amber-400" />
            <span>在软件内查看与编辑源码</span>
          </button>

          <button
            @click="handleSqlMenuAction('toggle-prod')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5 text-teal-400" />
            <span>产线状态变更 (当前: {{ contextMenu.sql.prodReleased ? '已发' : '待发' }})</span>
          </button>

          <button
            @click="handleSqlMenuAction('open-folder')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <FolderOpen class="w-3.5 h-3.5 text-blue-400" />
            <span>在 Windows 资源管理器中定位</span>
          </button>

          <button
            @click="handleSqlMenuAction('copy-path')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <Copy class="w-3.5 h-3.5 text-slate-400" />
            <span>复制文件绝对路径</span>
          </button>

          <div class="my-1 border-t border-white/10"></div>

          <button
            @click="handleSqlMenuAction('delete')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除此 SQL 脚本 (移入回收站)</span>
          </button>
        </template>

        <!-- 交付与需求文档右键上下文菜单 -->
        <template v-else-if="contextMenu.type === 'doc' && contextMenu.doc">
          <div class="px-3 py-1 font-mono text-[10px] text-slate-500 border-b border-white/10 truncate font-bold flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span class="truncate">{{ contextMenu.doc.fileName }}</span>
          </div>

          <button
            v-if="isWordFile(contextMenu.doc.fileName)"
            @click="handleDocMenuAction('open-native')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-500/20 hover:text-blue-300 text-left transition cursor-pointer text-blue-300 font-bold"
          >
            <FileText class="w-3.5 h-3.5 text-blue-400" />
            <span>使用 Microsoft Word 打开</span>
          </button>

          <button
            v-else-if="isExcelFile(contextMenu.doc.fileName)"
            @click="handleDocMenuAction('open-native')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-500/20 hover:text-emerald-300 text-left transition cursor-pointer text-emerald-300 font-bold"
          >
            <Sheet class="w-3.5 h-3.5 text-emerald-400" />
            <span>使用 Microsoft Excel 打开</span>
          </button>

          <button
            @click="handleDocMenuAction('preview')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <Eye class="w-3.5 h-3.5 text-teal-400" />
            <span>在软件内弹窗查看/编辑</span>
          </button>

          <button
            @click="handleDocMenuAction('open-folder')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <FolderOpen class="w-3.5 h-3.5 text-blue-400" />
            <span>在 Windows 资源管理器中定位</span>
          </button>

          <button
            @click="handleDocMenuAction('copy-path')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-teal-500/20 hover:text-teal-300 text-left transition cursor-pointer"
          >
            <Copy class="w-3.5 h-3.5 text-slate-400" />
            <span>复制文件绝对路径</span>
          </button>

          <div class="my-1 border-t border-white/10"></div>

          <button
            @click="handleDocMenuAction('delete')"
            class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition font-medium cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>删除此文档 (移入回收站)</span>
          </button>
        </template>
      </div>
    </Teleport>

    <!-- 全类型通用文件软件内弹窗预览与编辑器 -->
    <FilePreviewModal
      v-model:visible="filePreviewModal.visible"
      :file-path="filePreviewModal.filePath"
      :file-name="filePreviewModal.fileName"
      :initial-edit="filePreviewModal.initialEdit"
      @toast="(msg, type) => emit('toast', msg, type)"
      @file-saved="handleFileSaved"
    />

    <!-- 智能提取联调参数全景清单弹窗 (100% 完整无截断展示公私钥、代码、Token) -->
    <Teleport to="body">
      <div
        v-if="isMoreParamsOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        @click="isMoreParamsOpen = false"
      >
        <div
          class="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-700/80 bg-slate-900/98 shadow-2xl flex flex-col overflow-hidden text-xs animate-in zoom-in-95 duration-150 select-none"
          @click.stop
        >
          <!-- 顶栏 -->
          <div class="h-14 px-5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Sparkles class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>智能提取联调参数全景清单</span>
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-mono bg-teal-500/20 text-teal-300 font-bold">
                    共 {{ parsedParameters.length }} 项
                  </span>
                </h3>
                <p class="text-[11px] text-slate-400">100% 完整展示所有公私钥、Token、信用代码与长串参数，无任何截断</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="copyAllParamsAsYaml"
                class="px-3 py-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="将所有提取参数打包为 YAML 格式一键复制"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>复制全部 (YAML)</span>
              </button>
              <button
                type="button"
                @click="isMoreParamsOpen = false"
                class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 参数列表区 (完整无截断展示) -->
          <div class="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            <div
              v-for="(param, idx) in parsedParameters"
              :key="idx"
              class="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition group space-y-2 select-text"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span
                    class="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border"
                    :class="getParamPillColor(param.type)"
                  >
                    {{ param.label }}
                  </span>
                  <span class="text-[11px] text-slate-500 font-mono">
                    {{ param.value.length }} 字符 · {{ getParamTypeName(param.type) }}
                  </span>
                </div>

                <button
                  type="button"
                  @click="copyParamText(param.value, param.label)"
                  class="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-teal-500/20 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Copy class="w-3 h-3 text-slate-400 group-hover:text-teal-300" />
                  <span>复制此项</span>
                </button>
              </div>

              <!-- 100% 完整未截断值 (支持选择、复制、自动换行) -->
              <div class="p-3 rounded-lg bg-black/60 border border-white/5 text-xs font-mono text-teal-300/90 break-all leading-relaxed select-text font-normal">
                {{ param.value }}
              </div>
            </div>
          </div>

          <!-- 底部操作提示 -->
          <div class="h-10 px-5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-950/50">
            <span>鼠标悬停在上方胶囊也可直接查看完整值 · 按 Esc 快速关闭</span>
            <button
              type="button"
              @click="isMoreParamsOpen = false"
              class="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              关闭 (Esc)
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 产线 SQL 状态变更二次确认弹窗 (防误触) -->
    <Teleport to="body">
      <div
        v-if="sqlConfirmModal.visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      >
        <div
          class="bg-slate-900/95 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col backdrop-blur-xl"
          @click.stop
        >
          <!-- 弹窗顶栏 -->
          <div class="h-12 px-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70 select-none">
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center"
                :class="sqlConfirmModal.targetStatus ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'"
              >
                <Database class="w-4 h-4" />
              </div>
              <h3 class="text-xs font-bold text-white tracking-wide">
                产线上线状态变更确认
              </h3>
            </div>
            <button
              @click="closeSqlConfirmModal"
              class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- 弹窗主体内容 -->
          <div class="p-5 space-y-4 text-xs">
            <div class="p-3.5 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
              <div class="flex items-center justify-between text-slate-400">
                <span>SQL 脚本:</span>
                <span class="font-mono text-slate-200 font-bold truncate max-w-[240px]">{{ sqlConfirmModal.sql?.fileName }}</span>
              </div>
              <div class="flex items-center justify-between text-slate-400">
                <span>当前状态:</span>
                <span
                  class="font-mono font-bold px-2 py-0.5 rounded text-[11px]"
                  :class="sqlConfirmModal.sql?.prodReleased ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-amber-950 text-amber-300 border border-amber-800'"
                >
                  产线: {{ sqlConfirmModal.sql?.prodReleased ? '已发' : '待发' }}
                </span>
              </div>
              <div class="flex items-center justify-between text-slate-400">
                <span>目标变更为:</span>
                <span
                  class="font-mono font-bold px-2 py-0.5 rounded text-[11px]"
                  :class="sqlConfirmModal.targetStatus ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-amber-950 text-amber-300 border border-amber-800'"
                >
                  产线: {{ sqlConfirmModal.targetStatus ? '已发' : '待发' }}
                </span>
              </div>
            </div>

            <p class="text-slate-400 leading-relaxed text-[11px]">
              ⚠️ 生产环境上线涉及核心业务数据，请确认该 SQL 脚本已真实在生产数据库执行完毕（或确需回退为待发状态）。
            </p>
          </div>

          <!-- 弹窗底栏 -->
          <div class="h-12 px-5 border-t border-white/10 flex items-center justify-end gap-2.5 bg-slate-950/50">
            <button
              type="button"
              @click="closeSqlConfirmModal"
              class="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              @click="confirmSqlStatusChange"
              :disabled="sqlConfirmModal.loading"
              class="px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              :class="sqlConfirmModal.targetStatus
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/50'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'"
            >
              <Check class="w-3.5 h-3.5" />
              <span>确认变更状态</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 年份下拉菜单 (Teleport 挂载到 body，绝不受任何祖先 overflow/z-index 裁剪覆盖) -->
    <Teleport to="body">
      <div
        v-if="isYearDropdownOpen"
        @click.stop
        class="fixed z-50 w-36 max-h-64 overflow-y-auto rounded-xl border border-slate-700/80 shadow-2xl py-1 bg-slate-900/98 backdrop-blur-2xl text-xs custom-scrollbar animate-in fade-in duration-100"
        :style="{ top: `${yearDropdownPos.top}px`, left: `${yearDropdownPos.left}px` }"
      >
        <button
          type="button"
          @click="selectYear('all')"
          class="w-full px-3 py-2 flex items-center justify-between text-left transition cursor-pointer"
          :class="selectedYear === 'all'
            ? 'bg-teal-500/20 text-teal-300 font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'"
        >
          <span>全部年份</span>
          <Check v-if="selectedYear === 'all'" class="w-3.5 h-3.5 text-teal-400" />
        </button>

        <div class="my-1 border-t border-white/10"></div>

        <button
          v-for="yr in availableYears"
          :key="yr"
          type="button"
          @click="selectYear(yr)"
          class="w-full px-3 py-2 flex items-center justify-between text-left font-mono transition cursor-pointer"
          :class="selectedYear === yr
            ? 'bg-teal-500/20 text-teal-300 font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'"
        >
          <span>{{ yr }} 年</span>
          <Check v-if="selectedYear === yr" class="w-3.5 h-3.5 text-teal-400" />
        </button>
      </div>
    </Teleport>

    <!-- 项目下拉菜单 (Teleport 挂载到 body，不遮挡、支持右键管理) -->
    <Teleport to="body">
      <div
        v-if="isProjectDropdownOpen"
        @click.stop
        class="fixed z-50 min-w-[170px] max-w-[260px] max-h-72 overflow-y-auto rounded-xl border border-slate-700/80 shadow-2xl py-1 bg-slate-900/98 backdrop-blur-2xl text-xs custom-scrollbar animate-in fade-in duration-100"
        :style="{ top: `${projectDropdownPos.top}px`, left: `${projectDropdownPos.left}px` }"
      >
        <button
          type="button"
          @click="selectProject('all')"
          class="w-full px-3 py-2 flex items-center justify-between text-left transition cursor-pointer"
          :class="selectedProject === 'all'
            ? 'bg-teal-500/20 text-teal-300 font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'"
        >
          <span class="truncate">全部项目</span>
          <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span class="text-[10px] font-mono opacity-60">({{ props.tasks.length }})</span>
            <Check v-if="selectedProject === 'all'" class="w-3.5 h-3.5 text-teal-400" />
          </div>
        </button>

        <div class="my-1 border-t border-white/10"></div>

        <button
          v-for="proj in projectList"
          :key="proj.name"
          type="button"
          @click="selectProject(proj.name)"
          @contextmenu.prevent.stop="openProjectContextMenu($event, proj)"
          class="w-full px-3 py-2 flex items-center justify-between text-left transition cursor-pointer"
          :class="selectedProject === proj.name
            ? 'bg-teal-500/20 text-teal-300 font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'"
          :title="`单击选择 · 右键管理 [${proj.name}]`"
        >
          <span class="truncate font-medium">{{ proj.name }}</span>
          <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span class="text-[10px] font-mono opacity-60">({{ proj.totalCount }})</span>
            <Check v-if="selectedProject === proj.name" class="w-3.5 h-3.5 text-teal-400" />
          </div>
        </button>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import {
  ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Sparkles, X, Plus, RefreshCw, Layers, Database, ChevronRight, FolderOpen, Copy, FileText, Save, FolderKanban, Tag, Trash2, Pencil, Calendar, ChevronDown, Check, Search, Pin, StickyNote, FileCode, Sheet, Eye, ExternalLink, LayoutGrid, BookOpen, RotateCcw, Minimize2, Maximize2
} from 'lucide-vue-next'
import SqlMergeModal from './SqlMergeModal.vue'
import FilePreviewModal from './FilePreviewModal.vue'

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

// 年份下拉框状态 (解决年份过多不好显示问题)
const isYearDropdownOpen = ref(false)
const yearDropdownRef = ref(null)
const yearDropdownPos = ref({ top: 0, left: 0 })

function toggleYearDropdown() {
  if (!isYearDropdownOpen.value && yearDropdownRef.value) {
    const rect = yearDropdownRef.value.getBoundingClientRect()
    yearDropdownPos.value = {
      top: rect.bottom + 6,
      left: rect.left
    }
    isYearDropdownOpen.value = true
    isProjectDropdownOpen.value = false
    isMoreParamsOpen.value = false
  } else {
    isYearDropdownOpen.value = false
  }
}

const availableYears = computed(() => {
  const set = new Set(props.years || [])
  for (const t of props.tasks) {
    if (t.year) set.add(t.year)
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a))
})

function selectYear(yr) {
  selectedYear.value = yr
  isYearDropdownOpen.value = false
}

// 项目下拉框状态 (解决多项目展示拥挤问题)
const isProjectDropdownOpen = ref(false)
const projectDropdownRef = ref(null)
const projectDropdownPos = ref({ top: 0, left: 0 })

function toggleProjectDropdown() {
  if (!isProjectDropdownOpen.value && projectDropdownRef.value) {
    const rect = projectDropdownRef.value.getBoundingClientRect()
    projectDropdownPos.value = {
      top: rect.bottom + 6,
      left: rect.left
    }
    isProjectDropdownOpen.value = true
    isYearDropdownOpen.value = false
  } else {
    isProjectDropdownOpen.value = false
  }
}

function selectProject(projName) {
  selectedProject.value = projName
  isProjectDropdownOpen.value = false
}

const currentSelectedProjectCount = computed(() => {
  if (selectedProject.value === 'all') return props.tasks.length
  const found = projectList.value.find(p => p.name === selectedProject.value)
  return found ? found.totalCount : 0
})

// 产线 SQL 状态二次确认弹窗状态 (防误触，不会直接改状态)
const sqlConfirmModal = ref({
  visible: false,
  sql: null,
  targetStatus: true,
  loading: false
})

function promptToggleProdStatus(sql) {
  const isReleased = Boolean(sql.prodReleased)
  const targetStatus = !isReleased
  sqlConfirmModal.value = {
    visible: true,
    sql,
    targetStatus,
    loading: false
  }
}

function closeSqlConfirmModal() {
  sqlConfirmModal.value.visible = false
  sqlConfirmModal.value.sql = null
}

async function confirmSqlStatusChange() {
  const { sql, targetStatus } = sqlConfirmModal.value
  if (!sql || !window.electronAPI || !currentTask.value) {
    closeSqlConfirmModal()
    return
  }

  sqlConfirmModal.value.loading = true
  const timeStr = new Date().toLocaleString()

  try {
    await window.electronAPI.updateSqlStatus(
      currentTask.value.fullPath,
      sql.fileName,
      'prod',
      targetStatus,
      timeStr
    )
    // 立即就地更新当前 sql 对象的响应式状态，界面零延迟即时变色！
    sql.prodReleased = targetStatus
    sql.prodReleasedAt = targetStatus ? timeStr : null

    await loadSqlsForTask(currentTask.value.fullPath)
    emit('updated')
    emit('toast', `已将 [${sql.fileName}] 产线状态变更为: ${targetStatus ? '已发' : '待发'}`, 'success')
  } catch (err) {
    emit('toast', '更新产线状态失败: ' + err.message, 'error')
  } finally {
    closeSqlConfirmModal()
  }
}


// 工作区独立子标签：'notes' | 'sqls' | 'docs' | 'overview'
const activeWorkspaceTab = ref(localStorage.getItem('devorbit_active_workspace_tab') || 'notes')
watch(activeWorkspaceTab, (tab) => {
  try { localStorage.setItem('devorbit_active_workspace_tab', tab) } catch (e) {}
})

// 聚焦任务的持久化保存 (切换与刷新绝不丢失当前选中的任务)
const focusedTaskPath = ref(localStorage.getItem('devorbit_focused_task_path') || '')

// 全类型文件弹窗预览状态
const filePreviewModal = ref({
  visible: false,
  filePath: '',
  fileName: '',
  initialEdit: false
})

const paramBarRef = ref(null)

function handleParamWheel(e) {
  if (paramBarRef.value) {
    paramBarRef.value.scrollLeft += (e.deltaY || e.deltaX) * 1.5
  }
}

function openFilePreview(filePath, fileName, editMode = false) {
  filePreviewModal.value = {
    visible: true,
    filePath,
    fileName: fileName || (filePath ? filePath.split(/[\\/]/).pop() : ''),
    initialEdit: !!editMode
  }
}

async function handleFileSaved(savedPath) {
  if (currentTask.value) {
    if (savedPath.endsWith('.sql')) {
      await loadSqlsForTask(currentTask.value.fullPath)
    } else if (savedPath.endsWith('笔记.md')) {
      await loadNoteForTask(currentTask.value.fullPath)
    } else {
      await loadDocsForTask(currentTask.value.fullPath)
    }
  }
}

function isWordFile(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return lower.endsWith('.docx') || lower.endsWith('.doc')
}

function isExcelFile(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return lower.endsWith('.xlsx') || lower.endsWith('.xls')
}

function isCodeDoc(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.sql') || lower.endsWith('.json') || lower.endsWith('.yaml') || lower.endsWith('.yml') || lower.endsWith('.txt')
}

// 自动在切换任务前冲刷未提交的备忘修改
async function autoFlushCurrentTaskEdits() {
  if (!currentTask.value) return
  if (editingNoteId.value) {
    await saveEditNote()
  }
}

// 聚焦选中的任务索引 (左侧列表高亮)
const focusedTaskIndex = ref(0)
const taskListContainerRef = ref(null)

// 当前聚焦任务的扩展数据
const currentSqls = ref([])
const currentDocs = ref([])
const currentNoteContent = ref('')
const taskNotes = ref([])
const noteSearchQuery = ref('')
const selectedNoteCategory = ref('all')
const noteViewMode = ref('cards') // 'cards' | 'raw'
const rawNoteContent = ref('')
const isAddingNote = ref(false)
const newNoteForm = ref({ title: '', category: '配置参数', content: '', pinned: false })
const editingNoteId = ref(null)
const editingNoteForm = ref({ title: '', category: '配置参数', content: '', pinned: false })
const copiedNoteId = ref(null)
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
  project: null,
  sql: null,
  doc: null
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
function resetAllFilters() {
  selectedYear.value = "all"
  selectedProject.value = "all"
  onlyPendingSql.value = false
  searchQuery.value = ""
}

// 最终任务过滤列表
const filteredTasks = computed(() => {
  return props.tasks.filter(t => {
    if (selectedYear.value !== "all") {
      const taskYr = String(t.year || "").trim()
      const selYr = String(selectedYear.value || "").trim()
      if (taskYr && selYr && taskYr !== selYr) {
        return false
      }
    }
    if (selectedProject.value !== "all") {
      const p = (t.project || "常规项目").trim()
      if (p !== selectedProject.value) return false
    }
    if (onlyPendingSql.value && (!t.prodPendingCount || t.prodPendingCount <= 0)) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const inTitle = (t.title || "").toLowerCase().includes(q)
      const inProject = (t.project || "").toLowerCase().includes(q)
      const inYear = (t.year || "").toLowerCase().includes(q)
      if (!inTitle && !inProject && !inYear) return false
    }
    return true
  })
})

const currentTask = computed(() => {
  if (filteredTasks.value.length === 0) return null
  if (focusedTaskPath.value) {
    const found = filteredTasks.value.find(t => t.fullPath === focusedTaskPath.value)
    if (found) return found
  }
  const idx = Math.min(focusedTaskIndex.value, filteredTasks.value.length - 1)
  return filteredTasks.value[idx] || null
})

const PRESET_CATEGORIES = [
  { key: '配置参数', label: '配置参数', borderClass: 'border-teal-500/50 text-teal-300 bg-teal-500/15' },
  { key: '接口联调', label: '接口联调', borderClass: 'border-sky-500/50 text-sky-300 bg-sky-500/15' },
  { key: '账号密钥', label: '账号密钥', borderClass: 'border-amber-500/50 text-amber-300 bg-amber-500/15' },
  { key: '踩坑记录', label: '踩坑记录', borderClass: 'border-purple-500/50 text-purple-300 bg-purple-500/15' },
  { key: '常规便签', label: '常规便签', borderClass: 'border-slate-500/50 text-slate-300 bg-slate-500/15' }
]

function getCategoryStyle(cat) {
  const found = PRESET_CATEGORIES.find(c => c.key === cat)
  return found ? found.borderClass : 'border-white/10 bg-black/30 text-slate-300'
}

const availableNoteCategories = computed(() => {
  const counts = {}
  for (const n of taskNotes.value) {
    const k = n.category || '配置参数'
    counts[k] = (counts[k] || 0) + 1
  }
  return PRESET_CATEGORIES.map(cat => ({
    ...cat,
    count: counts[cat.key] || 0
  })).filter(cat => cat.count > 0)
})

const filteredTaskNotes = computed(() => {
  let list = [...taskNotes.value]
  if (selectedNoteCategory.value !== 'all') {
    list = list.filter(n => (n.category || '配置参数') === selectedNoteCategory.value)
  }
  const q = noteSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(n =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.category && n.category.toLowerCase().includes(q))
    )
  }
  // Sort: pinned first, then updatedAt desc
  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (b.updatedAt || '').localeCompare(a.updatedAt || '')
  })
  return list
})
const filteredNotes = filteredTaskNotes

// 智能自适应提取联调参数 (支持 YAML/JSON 键名精准识别、IP、Token、接口路径)
function extractParametersFromText(text) {
  if (!text || typeof text !== 'string') return []
  const list = []
  const seenValues = new Set()

  function addParam(label, value, type = 'general') {
    const trimmedVal = (value || '').trim().replace(/^["']|["']$/g, '').replace(/[,;]$/, '')
    if (!trimmedVal || seenValues.has(trimmedVal)) return
    if (/^(true|false|null|undefined|\{|\}|\[\])$/i.test(trimmedVal)) return
    if (trimmedVal.length < 3) return
    seenValues.add(trimmedVal)
    list.push({ label, value: trimmedVal, type })
  }

  // 1. YAML / 键值对逐行智能解析
  const lines = text.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const cleanLine = line.split('#')[0].trim()
    const kvMatch = cleanLine.match(/^([a-zA-Z0-9_\u4e00-\u9fa5-]+)\s*[:=]\s*(.+)$/)
    if (kvMatch) {
      const rawKey = kvMatch[1].trim()
      let rawVal = kvMatch[2].trim()
      let label = rawKey
      let type = 'general'

      const lowerKey = rawKey.toLowerCase()
      if (lowerKey.includes('public-key') || lowerKey.includes('publickey') || lowerKey.includes('公钥')) {
        label = 'SM2公钥'
        type = 'key'
      } else if (lowerKey.includes('private-key') || lowerKey.includes('privatekey') || lowerKey.includes('私钥')) {
        label = 'SM2私钥'
        type = 'key'
      } else if (lowerKey.includes('sm4') || lowerKey.includes('aes') || lowerKey.includes('secret')) {
        label = 'SM4密钥'
        type = 'secret'
      } else if (lowerKey.includes('credit-code') || lowerKey.includes('creditcode') || lowerKey.includes('信用代码')) {
        label = '信用代码'
        type = 'id'
      } else if (lowerKey.includes('token') || lowerKey.includes('auth')) {
        label = '认证Token'
        type = 'token'
      } else if (lowerKey.includes('url') || lowerKey.includes('ip') || lowerKey.includes('host')) {
        label = '服务地址'
        type = 'network'
      } else if (lowerKey.includes('user') || lowerKey.includes('account') || lowerKey.includes('账号')) {
        label = '测试账号'
        type = 'account'
      } else if (lowerKey.includes('pwd') || lowerKey.includes('password') || lowerKey.includes('密码')) {
        label = '密码'
        type = 'secret'
      }

      addParam(label, rawVal, type)
    }
  }

  // 2. IP 地址匹配 (如 192.168.1.100:8080)
  const ipMatches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g)
  if (ipMatches) {
    for (const ip of ipMatches) {
      addParam('服务IP', ip, 'network')
    }
  }

  // 3. Bearer Token 匹配
  const tokenMatches = text.match(/Bearer\s+[A-Za-z0-9._-]+/ig)
  if (tokenMatches) {
    for (const tk of tokenMatches) {
      addParam('Bearer Token', tk, 'token')
    }
  }

  // 4. API Endpoint 路径匹配
  const apiMatches = text.match(/\/(?:api|v1|v2|mz|sys)\/[a-zA-Z0-9_\-/]+/g)
  if (apiMatches) {
    for (const api of apiMatches) {
      addParam('接口Endpoint', api, 'network')
    }
  }

  return list
}

const enableSmartParams = ref(localStorage.getItem('devorbit_enable_smart_params') !== 'false')

function toggleSmartParams(val) {
  enableSmartParams.value = val !== undefined ? val : !enableSmartParams.value
  try {
    localStorage.setItem('devorbit_enable_smart_params', enableSmartParams.value ? 'true' : 'false')
  } catch (e) {}
  if (!enableSmartParams.value) {
    emit('toast', '已关闭智能提取参数栏，可在备忘工具栏随时重新开启', 'info')
  } else {
    emit('toast', '已开启智能提取参数栏', 'success')
  }
}

const parsedParameters = computed(() => {
  if (!enableSmartParams.value) return []

  let textToParse = ''
  if (noteViewMode.value === 'cards') {
    // 仅从卡片流中提取，绝不与历史 rawNoteContent 串联混淆！
    // 如果某卡片正在就地编辑，实时提取当前正在编辑的内容，所见即所得
    const texts = taskNotes.value.map(n => {
      if (editingNoteId.value && n.id === editingNoteId.value) {
        return (editingNoteForm.value.title || '') + '\n' + (editingNoteForm.value.content || '')
      }
      return (n.title || '') + '\n' + (n.content || '')
    })
    textToParse = texts.join('\n')
  } else {
    // 源码模式下直接从当前编辑器内容提取
    textToParse = rawNoteContent.value || ''
  }

  return extractParametersFromText(textToParse)
})

// 方案一：默认展示前 4 个，超出时支持展开浮层 (4 + N 防撑爆体系)
const displayedParameters = computed(() => {
  return parsedParameters.value.slice(0, 4)
})

const isMoreParamsOpen = ref(false)
const moreParamsBtnRef = ref(null)
const moreParamsPos = ref({ top: 0, left: 0 })

const paramViewMode = ref(localStorage.getItem("devorbit_param_view_mode") || "wrap")

function toggleParamViewMode() {
  paramViewMode.value = paramViewMode.value === "wrap" ? "compact" : "wrap"
  try {
    localStorage.setItem("devorbit_param_view_mode", paramViewMode.value)
  } catch (e) {}
}

function toggleMoreParamsDropdown() {
  isMoreParamsOpen.value = !isMoreParamsOpen.value
}

function getParamTypeName(type) {
  switch (type) {
    case "key": return "公私钥 / 密钥对"
    case "secret": return "对称密钥 / 密文字符串"
    case "token": return "认证令牌 / Token"
    case "network": return "网络节点 / Endpoint"
    case "id": return "业务编号 / 唯一编码"
    case "account": return "系统账号 / 凭证"
    default: return "常规配置项"
  }
}

async function copyAllParamsAsYaml() {
  if (!parsedParameters.value || parsedParameters.value.length === 0) return
  let text = ""
  for (const p of parsedParameters.value) {
    text += `${p.label}: "${p.value}"\n`
  }
  try {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      await window.electronAPI.copyToClipboard(text.trim())
    } else {
      await navigator.clipboard.writeText(text.trim())
    }
    emit("toast", `已复制全部 ${parsedParameters.value.length} 个参数为 YAML 格式！`, "success")
  } catch (e) {
    emit("toast", "复制失败: " + e.message, "error")
  }
}
function getParamPillColor(type) {
  switch (type) {
    case 'key': return 'border-teal-500/40 text-teal-300 bg-teal-500/10 hover:border-teal-400'
    case 'secret': return 'border-amber-500/40 text-amber-300 bg-amber-500/10 hover:border-amber-400'
    case 'token': return 'border-sky-500/40 text-sky-300 bg-sky-500/10 hover:border-sky-400'
    case 'network': return 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:border-cyan-400'
    case 'id': return 'border-purple-500/40 text-purple-300 bg-purple-500/10 hover:border-purple-400'
    default: return 'border-white/10 text-slate-300 bg-black/40 hover:border-white/20'
  }
}

function togglePendingSqlFilter() {
  onlyPendingSql.value = !onlyPendingSql.value
}

async function setFocusedTask(idx) {
  await autoFlushCurrentTaskEdits()
  focusedTaskIndex.value = idx
  const task = filteredTasks.value[idx]
  if (task && task.fullPath) {
    focusedTaskPath.value = task.fullPath
    try { localStorage.setItem('devorbit_focused_task_path', task.fullPath) } catch (e) {}
  }
}

watch(currentTask, async (newTask) => {
  if (!newTask) {
    currentSqls.value = []
    currentDocs.value = []
    currentNoteContent.value = ''
    taskNotes.value = []
    rawNoteContent.value = ''
    return
  }
  await Promise.all([
    loadSqlsForTask(newTask.fullPath),
    loadNoteForTask(newTask.fullPath),
    loadDocsForTask(newTask.fullPath)
  ])
}, { immediate: true })

watch(filteredTasks, (newTasks) => {
  if (newTasks.length === 0) {
    focusedTaskIndex.value = 0
  } else if (focusedTaskIndex.value >= newTasks.length) {
    focusedTaskIndex.value = newTasks.length - 1
  }
})

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

async function loadNoteForTask(taskPath) {
  if (!window.electronAPI || !taskPath) return
  try {
    let notes = []
    if (typeof window.electronAPI.getTaskNotes === 'function') {
      notes = await window.electronAPI.getTaskNotes(taskPath)
    }

    if (!Array.isArray(notes) || notes.length === 0) {
      const content = await window.electronAPI.getTaskFile(taskPath, 'note')
      if (content && content.trim()) {
        notes = [{
          id: 'note_' + Date.now(),
          title: '配置参数与公私钥',
          category: '配置参数',
          content: content.trim(),
          updatedAt: new Date().toLocaleString(),
          pinned: true
        }]
      } else {
        notes = []
      }
    }

    taskNotes.value = notes

    let mdText = ''
    for (const n of notes) {
      mdText += `### [${n.category || '配置参数'}] ${n.title || '无标题备忘'}\n`
      if (n.updatedAt) mdText += `> 更新时间: ${n.updatedAt}\n\n`
      mdText += `${n.content || ''}\n\n---\n\n`
    }
    rawNoteContent.value = mdText.trim()
    currentNoteContent.value = rawNoteContent.value
  } catch (err) {
    console.error('加载备忘异常:', err)
    taskNotes.value = []
    rawNoteContent.value = ''
    currentNoteContent.value = ''
  }
}

async function loadDocsForTask(taskPath) {
  if (!window.electronAPI || !taskPath) return
  try {
    const docsDir = `${taskPath}/docs`
    currentDocs.value = await window.electronAPI.getDirFiles(docsDir) || []
  } catch (err) {
    currentDocs.value = []
  }
}

function toggleAddNotePanel() {
  isAddingNote.value = !isAddingNote.value
  if (isAddingNote.value) {
    newNoteForm.value = {
      title: '',
      category: '配置参数',
      content: '',
      pinned: false
    }
  }
}

async function submitNewNote() {
  if (!newNoteForm.value.content?.trim() && !newNoteForm.value.title?.trim()) {
    emit('toast', '请先填写备忘标题或正文内容', 'warning')
    return
  }

  const content = (newNoteForm.value.content || '').trim()
  let title = (newNoteForm.value.title || '').trim()
  if (!title) {
    title = content.split('\n')[0].slice(0, 24) || '新建备忘'
  }

  const newCard = {
    id: 'note_' + Date.now(),
    title,
    category: newNoteForm.value.category || '配置参数',
    content,
    pinned: !!newNoteForm.value.pinned,
    updatedAt: new Date().toLocaleString()
  }

  if (newCard.pinned) {
    taskNotes.value.unshift(newCard)
  } else {
    taskNotes.value.push(newCard)
  }

  isAddingNote.value = false
  await persistNotes()
  emit('toast', '备忘卡片已新增！', 'success')
}

function startEditNote(note) {
  editingNoteId.value = note.id
  editingNoteForm.value = { ...note }
}

function cancelEditNote() {
  editingNoteId.value = null
}

async function saveEditNote() {
  if (!editingNoteId.value) return
  const idx = taskNotes.value.findIndex(n => n.id === editingNoteId.value)
  if (idx !== -1) {
    taskNotes.value[idx] = {
      ...taskNotes.value[idx],
      title: editingNoteForm.value.title || taskNotes.value[idx].title,
      category: editingNoteForm.value.category || '配置参数',
      content: editingNoteForm.value.content || '',
      pinned: !!editingNoteForm.value.pinned,
      updatedAt: new Date().toLocaleString()
    }
  }
  editingNoteId.value = null
  await persistNotes()
  emit('toast', '备忘条目已更新！', 'success')
}

async function togglePinNote(note) {
  note.pinned = !note.pinned
  await persistNotes()
  emit('toast', note.pinned ? '已置顶该条备忘' : '已取消置顶', 'info')
}

async function deleteNote(noteId) {
  taskNotes.value = taskNotes.value.filter(n => n.id !== noteId)
  await persistNotes()
  emit('toast', '已删除备忘条目', 'info')
}

function copyNoteContent(note) {
  const text = note.content || note.title
  if (!text) return
  if (window.electronAPI && window.electronAPI.copyToClipboard) {
    window.electronAPI.copyToClipboard(text)
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
  copiedNoteId.value = note.id
  setTimeout(() => {
    if (copiedNoteId.value === note.id) copiedNoteId.value = null
  }, 1800)
  emit('toast', `已复制「${note.title || '备忘内容'}」`, 'success')
}

function clearNoteFilter() {
  noteSearchQuery.value = ''
  selectedNoteCategory.value = 'all'
}

async function setNoteViewMode(mode) {
  if (mode === noteViewMode.value) return
  if (mode === 'cards') {
    if (rawNoteContent.value) {
      await saveRawNote()
      if (currentTask.value) {
        await loadNoteForTask(currentTask.value.fullPath)
      }
    }
  } else if (mode === 'raw') {
    let mdText = '# 开发备忘与接口联调参数\n\n'
    for (const n of taskNotes.value) {
      mdText += `### [${n.category || '配置参数'}] ${n.title || '无标题备忘'}\n`
      if (n.updatedAt) mdText += `> 更新时间: ${n.updatedAt}\n\n`
      mdText += `${n.content || ''}\n\n---\n\n`
    }
    rawNoteContent.value = mdText.trim()
  }
  noteViewMode.value = mode
}

function formatNoteTime(timeStr) {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${m}-${day} ${h}:${min}`
  } catch (e) {
    return timeStr
  }
}

async function persistNotes() {
  if (!currentTask.value || !window.electronAPI) return
  isSavingNote.value = true
  try {
    // 1. 同步更新内存中的 Markdown 与当前笔记，保证视图完全一致
    let mdText = ''
    for (const n of taskNotes.value) {
      mdText += `### [${n.category || '配置参数'}] ${n.title || '无标题备忘'}\n`
      if (n.updatedAt) mdText += `> 更新时间: ${n.updatedAt}\n\n`
      mdText += `${n.content || ''}\n\n---\n\n`
    }
    rawNoteContent.value = mdText.trim()
    currentNoteContent.value = rawNoteContent.value

    // 2. 纯净序列化后再跨进程传输，彻底杜绝 Vue 3 Proxy 跨 ContextBridge 结构化克隆失败
    const plainNotes = JSON.parse(JSON.stringify(taskNotes.value))
    if (typeof window.electronAPI.saveTaskNotes === 'function') {
      await window.electronAPI.saveTaskNotes(currentTask.value.fullPath, plainNotes)
    } else {
      let mdFile = `# 开发备忘与接口联调参数\n\n`
      for (const n of plainNotes) {
        mdFile += `### [${n.category || '配置参数'}] ${n.title}\n${n.content}\n\n---\n\n`
      }
      await window.electronAPI.saveTaskFile(currentTask.value.fullPath, 'note', mdFile)
    }

    noteSavedNotice.value = true
    setTimeout(() => { noteSavedNotice.value = false }, 2000)
  } catch (err) {
    console.error('保存备忘失败:', err)
    emit('toast', '保存备忘失败: ' + err.message, 'error')
  } finally {
    isSavingNote.value = false
  }
}

async function saveRawNote() {
  if (!currentTask.value || !window.electronAPI) return
  isSavingNote.value = true
  try {
    await window.electronAPI.saveTaskFile(currentTask.value.fullPath, 'note', rawNoteContent.value)
    await loadNoteForTask(currentTask.value.fullPath)
    noteSavedNotice.value = true
    emit('updated')
    setTimeout(() => { noteSavedNotice.value = false }, 2000)
    emit('toast', '源码笔记已保存并同步至卡片！', 'success')
  } catch (err) {
    emit('toast', '保存失败: ' + err.message, 'error')
  } finally {
    isSavingNote.value = false
  }
}

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

function openSqlMergeDialog() {
  sqlMergeModalOpen.value = true
}

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

function openNativeDoc(filePath) {
  if (window.electronAPI) {
    window.electronAPI.openInExplorer(filePath)
    emit('toast', '正在调用关联程序打开文档...')
  }
}

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

function showInFolder(path) {
  if (window.electronAPI && window.electronAPI.showItemInFolder) {
    window.electronAPI.showItemInFolder(path)
    emit('toast', '已在 Windows 资源管理器中定位！')
  } else {
    openInExplorer(path)
  }
}

function openInExplorer(path) {
  if (window.electronAPI) {
    window.electronAPI.openInExplorer(path)
    emit('toast', '已在文件资源管理器中打开！')
  }
}

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
  } else if (e.ctrlKey && e.key === 'e') {
    if (currentTask.value) {
      e.preventDefault()
      openInExplorer(currentTask.value.fullPath)
    }
  } else if (e.key === 'Escape') {
    closeContextMenu()
    closeSqlConfirmModal()
    isYearDropdownOpen.value = false
    isProjectDropdownOpen.value = false
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
    case 'open-folder':
      openInExplorer(task.fullPath)
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

function openSqlContextMenu(e, sql) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 240),
    y: Math.min(e.clientY, window.innerHeight - 280),
    type: 'sql',
    task: null,
    project: null,
    sql,
    doc: null
  }
}

function openDocContextMenu(e, doc) {
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 240),
    y: Math.min(e.clientY, window.innerHeight - 280),
    type: 'doc',
    task: null,
    project: null,
    sql: null,
    doc
  }
}

async function deleteSqlItem(sql) {
  if (!sql || !sql.filePath || !window.electronAPI) return
  if (!confirm(`确认将 SQL 脚本 [${sql.fileName}] 删除并移至 Windows 回收站吗？`)) return
  try {
    const ok = await window.electronAPI.deleteFile(sql.filePath)
    if (ok) {
      emit('toast', `已将 SQL [${sql.fileName}] 移入回收站`, 'info')
      if (currentTask.value) {
        await loadSqlsForTask(currentTask.value.fullPath)
      }
      emit('updated')
    } else {
      emit('toast', '删除失败: 文件不存在或已被删除', 'error')
    }
  } catch (err) {
    emit('toast', '删除失败: ' + err.message, 'error')
  }
}

async function deleteDocItem(doc) {
  if (!doc || !doc.filePath || !window.electronAPI) return
  if (!confirm(`确认将文档 [${doc.fileName}] 删除并移至 Windows 回收站吗？`)) return
  try {
    const ok = await window.electronAPI.deleteFile(doc.filePath)
    if (ok) {
      emit('toast', `已将文档 [${doc.fileName}] 移入回收站`, 'info')
      if (currentTask.value) {
        await loadDocsForTask(currentTask.value.fullPath)
      }
      emit('updated')
    } else {
      emit('toast', '删除失败: 文件不存在或已被删除', 'error')
    }
  } catch (err) {
    emit('toast', '删除失败: ' + err.message, 'error')
  }
}

async function handleSqlMenuAction(action) {
  const sql = contextMenu.value.sql
  if (!sql) return
  closeContextMenu()

  switch (action) {
    case 'edit':
      openFilePreview(sql.filePath, sql.fileName, true)
      break
    case 'preview':
      openFilePreview(sql.filePath, sql.fileName, false)
      break
    case 'toggle-prod':
      promptToggleProdStatus(sql)
      break
    case 'open-folder':
      showInFolder(sql.filePath)
      break
    case 'copy-path':
      copyTaskPath(sql.filePath)
      break
    case 'delete':
      await deleteSqlItem(sql)
      break
  }
}

async function handleDocMenuAction(action) {
  const doc = contextMenu.value.doc
  if (!doc) return
  closeContextMenu()

  switch (action) {
    case 'open-native':
      openNativeDoc(doc.filePath)
      break
    case 'preview':
      openFilePreview(doc.filePath, doc.fileName, false)
      break
    case 'open-folder':
      showInFolder(doc.filePath)
      break
    case 'copy-path':
      copyTaskPath(doc.filePath)
      break
    case 'delete':
      await deleteDocItem(doc)
      break
  }
}

function handleGlobalClick(e) {
  closeContextMenu()
  if (isYearDropdownOpen.value && yearDropdownRef.value && !yearDropdownRef.value.contains(e.target)) {
    isYearDropdownOpen.value = false
  }
  if (isProjectDropdownOpen.value && projectDropdownRef.value && !projectDropdownRef.value.contains(e.target)) {
    isProjectDropdownOpen.value = false
  }
  if (isMoreParamsOpen.value && moreParamsBtnRef.value && !moreParamsBtnRef.value.contains(e.target)) {
    isMoreParamsOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('click', handleGlobalClick)
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
