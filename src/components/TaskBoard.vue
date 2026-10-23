<template>
  <div class="h-full w-full flex overflow-hidden">
    
    <!-- ==================== 左侧：可收缩项目侧边栏 (动态主题联动) ==================== -->
    <aside
      class="h-full app-sidebar backdrop-blur-xl flex flex-col flex-shrink-0 transition-all duration-200 select-none relative"
      :class="isSidebarCollapsed ? 'w-14' : 'w-60'"
    >
      <!-- 侧边栏顶栏：标题与收起/展开切换 -->
      <div class="h-13 app-sidebar-header px-3 flex items-center justify-between gap-2 flex-shrink-0">
        <div v-if="!isSidebarCollapsed" class="flex items-center gap-2 min-w-0">
          <Briefcase class="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span class="text-xs font-bold app-sidebar-title tracking-wide truncate">项目分类</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full app-sidebar-badge font-mono">
            {{ projectList.length }}
          </span>
        </div>

        <button
          @click="toggleSidebar"
          class="p-1.5 rounded-lg app-sidebar-item transition mx-auto"
          :class="{ '!mx-0': !isSidebarCollapsed }"
          :title="isSidebarCollapsed ? '展开项目侧边栏' : '收起项目侧边栏'"
        >
          <PanelLeftOpen v-if="isSidebarCollapsed" class="w-4 h-4 text-emerald-400" />
          <PanelLeftClose v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- 侧边栏项目列表 (支持右键重命名、删除、新建任务) -->
      <div class="flex-1 overflow-y-auto py-2.5 px-2 space-y-1 custom-scrollbar">
        <!-- 1. 全部项目项 -->
        <button
          @click="selectProject('all')"
          class="w-full flex items-center rounded-xl px-2.5 py-2.5 text-xs font-medium transition group"
          :class="selectedProject === 'all'
            ? 'app-sidebar-item-active'
            : 'app-sidebar-item'"
          :title="isSidebarCollapsed ? `全部项目 (${tasks.length} 个任务)` : ''"
        >
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition"
            :class="selectedProject === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'opacity-70 group-hover:opacity-100'"
          >
            <Boxes class="w-4 h-4" />
          </div>
          <span v-if="!isSidebarCollapsed" class="ml-2.5 truncate flex-1 text-left">
            全部项目
          </span>
          <span
            v-if="!isSidebarCollapsed"
            class="text-[10px] font-mono px-1.5 py-0.2 rounded-full"
            :class="selectedProject === 'all' ? 'app-sidebar-badge-active font-bold' : 'app-sidebar-badge'"
          >
            {{ tasks.length }}
          </span>
        </button>

        <!-- 分割提示 -->
        <div v-if="!isSidebarCollapsed" class="px-2 pt-3 pb-1 text-[10px] font-semibold opacity-60 tracking-wider">
          已识别项目 (右键可管理)
        </div>
        <div v-else class="my-1.5 border-t border-current opacity-20"></div>

        <!-- 2. 具体项目列表 (如 MZ, 常规项目等，支持右键重命名/删除) -->
        <button
          v-for="proj in projectList"
          :key="proj.name"
          @click="selectProject(proj.name)"
          @contextmenu.prevent.stop="openProjectContextMenu($event, proj)"
          class="w-full flex items-center rounded-xl px-2.5 py-2.5 text-xs font-medium transition group relative"
          :class="selectedProject === proj.name
            ? 'app-sidebar-item-active'
            : 'app-sidebar-item'"
          :title="isSidebarCollapsed ? `${proj.name} (${proj.totalCount} 个任务，右键可操作)` : '右键可重命名或删除此项目'"
        >
          <!-- 项目徽章方块头像 -->
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 transition shadow-sm"
            :class="selectedProject === proj.name
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-950/50'
              : 'opacity-70 group-hover:opacity-100 border border-current'"
          >
            {{ getProjectInitials(proj.name) }}
          </div>

          <span v-if="!isSidebarCollapsed" class="ml-2.5 truncate flex-1 text-left font-medium">
            {{ proj.name }}
          </span>

          <span
            v-if="!isSidebarCollapsed"
            class="text-[10px] font-mono px-1.5 py-0.2 rounded-full"
            :class="selectedProject === proj.name ? 'app-sidebar-badge-active font-bold' : 'app-sidebar-badge'"
          >
            {{ proj.totalCount }}
          </span>
        </button>
      </div>

      <!-- 侧边栏底部：新建任务快捷入口 -->
      <div v-if="!isSidebarCollapsed" class="p-3 app-sidebar-footer flex-shrink-0">
        <button
          @click="$emit('open-new-task', selectedYear, selectedProject !== 'all' ? selectedProject : '')"
          class="w-full py-2 px-3 rounded-xl app-sidebar-footer-btn text-xs flex items-center justify-center gap-1.5 transition shadow-sm backdrop-blur-sm"
        >
          <Plus class="w-3.5 h-3.5 text-emerald-400" />
          <span>{{ selectedProject !== 'all' ? `新建 ${selectedProject} 任务` : '新建任务工作区' }}</span>
        </button>
      </div>
    </aside>

    <!-- ==================== 右侧：任务卡片主列表 ==================== -->
    <div class="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
      <!-- 过滤与状态栏 -->
      <div class="flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <h2 class="text-base font-bold app-page-heading flex items-center gap-2 tracking-wide">
            <Layers class="w-4 h-4 text-emerald-400" />
            开发任务工作台
          </h2>

          <!-- 当前选中项目标签展示 -->
          <div v-if="selectedProject !== 'all'" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-xs backdrop-blur-sm">
            <Briefcase class="w-3 h-3 text-emerald-400" />
            <span class="font-bold">{{ selectedProject }}</span>
            <button
              @click="selectedProject = 'all'"
              class="ml-1 p-0.5 hover:bg-emerald-900 rounded text-emerald-400 hover:text-emerald-200 transition"
              title="清除项目过滤，查看全部项目"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <span class="text-xs app-page-muted font-mono">
            已加载 {{ filteredTasks.length }} 个任务
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- 1. 透光度档位 (解决挡住背景的核心控制器) -->
          <div class="flex items-center app-filter-box backdrop-blur-md p-0.5 rounded-xl shadow-sm text-xs" title="卡片透光度档位">
            <button
              type="button"
              @click="setTransparencyMode('crystal')"
              class="px-2 py-1 rounded-lg transition flex items-center gap-1"
              :class="transparencyMode === 'crystal' ? (isLight ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm') : 'app-filter-btn'"
              title="💎 超透直透 (0模糊，文字悬浮，背景100%清晰)"
            >
              <Sparkles class="w-3 h-3 text-emerald-400" />
              <span>超透</span>
            </button>
            <button
              type="button"
              @click="setTransparencyMode('soft')"
              class="px-2 py-1 rounded-lg transition"
              :class="transparencyMode === 'soft' ? (isLight ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm') : 'app-filter-btn'"
              title="🌫️ 轻磨砂 (微透浮层)"
            >
              <span>轻磨砂</span>
            </button>
            <button
              type="button"
              @click="setTransparencyMode('solid')"
              class="px-2 py-1 rounded-lg transition"
              :class="transparencyMode === 'solid' ? (isLight ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm') : 'app-filter-btn'"
              title="🛡️ 深色/实色 (高对比度)"
            >
              <span>{{ isLight ? '实色' : '深色' }}</span>
            </button>
          </div>

          <!-- 2. 排版避让选择 (把画面主体雕像/风景彻底让出来) -->
          <div class="flex items-center app-filter-box backdrop-blur-md p-0.5 rounded-xl shadow-sm text-xs" title="避让画面视觉焦点">
            <button
              type="button"
              @click="setLayoutAlign('full')"
              class="p-1.5 rounded-lg transition"
              :class="layoutAlign === 'full' ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold shadow-sm') : 'app-filter-btn'"
              title="全屏宽景排布"
            >
              <Maximize2 class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="setLayoutAlign('left')"
              class="p-1.5 rounded-lg transition"
              :class="layoutAlign === 'left' ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold shadow-sm') : 'app-filter-btn'"
              title="靠左避让 (右侧全景留白给雕像/风景)"
            >
              <AlignLeft class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="setLayoutAlign('right')"
              class="p-1.5 rounded-lg transition"
              :class="layoutAlign === 'right' ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold shadow-sm') : 'app-filter-btn'"
              title="靠右避让 (左侧全景留白)"
            >
              <AlignRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 3. 网格 VS 紧凑行模式 -->
          <div class="flex items-center app-filter-box backdrop-blur-md p-0.5 rounded-xl shadow-sm text-xs">
            <button
              type="button"
              @click="setViewMode('grid')"
              class="p-1.5 rounded-lg transition"
              :class="viewMode === 'grid' ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold shadow-sm') : 'app-filter-btn'"
              title="大卡片网格模式"
            >
              <LayoutGrid class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="setViewMode('compact')"
              class="p-1.5 rounded-lg transition"
              :class="viewMode === 'compact' ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-bold shadow-sm') : 'app-filter-btn'"
              title="极简单行紧凑模式 (遮挡减少 80%)"
            >
              <List class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 筛选下拉 -->
          <select
            v-model="filterStatus"
            class="app-filter-box backdrop-blur-md rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="all">全部状态</option>
            <option value="developing">🛠️ 开发中</option>
            <option value="testing">🧪 联调测试中</option>
            <option value="release_ready">🚀 待发布</option>
            <option value="archived">📦 已归档</option>
          </select>

          <!-- 新建任务按钮 (渐变高亮质感) -->
          <button
            @click="$emit('open-new-task', selectedYear, selectedProject !== 'all' ? selectedProject : '')"
            class="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 border border-emerald-400/20 transition active:scale-95"
          >
            <Plus class="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </div>

      <!-- 年份分层切换栏 -->
      <div class="flex items-center gap-2 border-b pb-3 flex-shrink-0 overflow-x-auto" style="border-color: var(--filter-bar-border)">
        <span class="text-xs app-page-muted font-medium flex items-center gap-1 mr-1">
          <Calendar class="w-3.5 h-3.5 text-amber-500" />
          归属年份:
        </span>

        <button
          @click="selectedYear = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition backdrop-blur-sm border flex items-center gap-1.5 select-none"
          :style="selectedYear === 'all' ? activePillStyle : inactivePillStyle"
        >
          <span>全部年份</span>
          <span
            class="text-[10px] px-1.5 py-0.2 rounded-full font-mono transition"
            :style="selectedYear === 'all' ? activeBadgeStyle : inactiveBadgeStyle"
          >
            {{ projectScopedTasksCount }}
          </span>
        </button>

        <button
          v-for="yr in years"
          :key="yr"
          @click="selectedYear = yr"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 backdrop-blur-sm border select-none"
          :style="selectedYear === yr ? activePillStyle : inactivePillStyle"
        >
          <span>📁 {{ yr }} 年</span>
          <span
            class="text-[10px] px-1.5 py-0.2 rounded-full font-mono transition"
            :style="selectedYear === yr ? activeBadgeStyle : inactiveBadgeStyle"
          >
            {{ getYearCount(yr) }}
          </span>
        </button>
      </div>

      <!-- 任务展示区域 (支持网格大卡片与极简紧凑行) -->
      <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div v-if="filteredTasks.length === 0" class="text-center py-24 text-sm app-page-muted">
          <FolderKanban class="w-12 h-12 mx-auto mb-2 opacity-50 text-current" />
          <p class="font-medium app-page-heading">
            {{ getEmptyNotice() }}
          </p>
          <p class="text-xs app-page-muted mt-1">
            点击右上角“新建任务工作区”，将自动在本地 <span class="font-mono text-emerald-400">{{ selectedYear === 'all' ? '2026' : selectedYear }}\</span> 目录下生成任务脚手架
          </p>
        </div>

        <!-- 1. 网格大卡片视图 (高透玻璃质感 + 智能避让排版) -->
        <div
          v-else-if="viewMode === 'grid'"
          class="grid gap-4 transition-all duration-300"
          :class="{
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': layoutAlign === 'full',
            'grid-cols-1 md:grid-cols-2 max-w-2xl': layoutAlign === 'left',
            'grid-cols-1 md:grid-cols-2 max-w-2xl ml-auto': layoutAlign === 'right'
          }"
        >
          <div
            v-for="task in filteredTasks"
            :key="task.fullPath"
            class="group relative border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[165px] app-task-card"
            :style="cardCustomStyle"
            @click="$emit('select-task', task)"
            @contextmenu.prevent.stop="openTaskContextMenu($event, task)"
          >
            <div>
              <!-- 顶部标签与状态 -->
              <div class="flex items-center justify-between gap-2 mb-2.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    @click.stop="selectedYear = task.year"
                    class="px-2 py-0.5 text-[11px] font-mono rounded-md border flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95"
                    :class="isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/25'"
                    :title="`点击筛选 ${task.year} 年任务`"
                  >
                    📁 {{ task.year }}年
                  </span>
                  <!-- 点击项目徽章快速过滤该项目 -->
                  <span
                    @click.stop="selectProject(task.project || '常规项目')"
                    class="px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer"
                    :class="(task.project || '常规项目') === selectedProject
                      ? (isLight ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'bg-emerald-950 text-emerald-300 border border-emerald-700')
                      : (isLight ? 'bg-slate-200/90 hover:bg-slate-300/90 text-slate-700 border border-slate-300' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/25')"
                    title="点击在左侧筛选该项目"
                  >
                    {{ task.project || '常规项目' }}
                  </span>
                </div>

                <div class="flex items-center gap-1">
                  <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 flex-shrink-0" :class="getStatusBadgeClass(task.status)">
                    <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(task.status)"></span>
                    {{ getStatusText(task.status) }}
                  </span>

                  <!-- 快捷更多操作按钮 (点击同样唤出右键菜单) -->
                  <button
                    @click.stop="openTaskContextMenu($event, task)"
                    class="p-1 app-task-subtext hover:text-emerald-400 rounded-lg transition"
                    title="右键或点击此处打开操作菜单"
                  >
                    <MoreVertical class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- 需求标题 -->
              <h3 class="text-sm font-bold app-task-title group-hover:text-emerald-400 transition duration-200 line-clamp-2 my-2 leading-snug">
                {{ task.title }}
              </h3>

              <div class="text-[11px] app-task-subtext font-mono flex items-center gap-1.5 mb-3">
                <Clock class="w-3 h-3 text-current opacity-70 flex-shrink-0" />
                <span>创建于: {{ new Date(task.createdAt || Date.now()).toLocaleDateString() }}</span>
              </div>
            </div>

            <!-- 底部 SQL 状态胶囊与操作快捷键 -->
            <div class="pt-3 border-t flex items-center justify-between text-xs mt-auto" style="border-color: var(--card-border)">
              <!-- SQL 脚本发布提醒 (图标完全包裹在胶囊格子内部) -->
              <div class="flex items-center min-w-0">
                <div
                  v-if="task.sqlCount === 0"
                  class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md app-task-tag"
                >
                  <Database class="w-3 h-3 opacity-60 flex-shrink-0" />
                  <span>无 SQL 脚本</span>
                </div>
                <div
                  v-else
                  class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md font-medium border"
                  :class="isLight
                    ? (task.prodPendingCount > 0 ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-emerald-800 bg-emerald-100 border-emerald-300')
                    : (task.prodPendingCount > 0 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30')"
                >
                  <Database
                    class="w-3 h-3 flex-shrink-0"
                    :class="task.prodPendingCount > 0 ? 'text-amber-500' : 'text-emerald-500'"
                  />
                  <span>{{ task.sqlCount }} 份 SQL ({{ task.prodPendingCount > 0 ? `产线待发 ${task.prodPendingCount}` : '已全发布' }})</span>
                </div>
              </div>

              <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                <!-- 快捷在 IDE 打开 -->
                <button
                  @click.stop="openIDE(task.fullPath)"
                  title="在代码编辑器中打开"
                  class="p-1 app-task-subtext hover:text-emerald-400 rounded transition"
                >
                  <Code2 class="w-3.5 h-3.5" />
                </button>
                <!-- 快捷在文件夹打开 -->
                <button
                  @click.stop="openExplorer(task.fullPath)"
                  title="在 Windows 资源管理器中打开"
                  class="p-1 app-task-subtext hover:text-emerald-400 rounded transition"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 极简紧凑列表视图 (条状微浮层，大面积透出壁纸风景) -->
        <div
          v-else-if="viewMode === 'compact'"
          class="space-y-2 transition-all duration-300"
          :class="{
            'w-full': layoutAlign === 'full',
            'max-w-2xl': layoutAlign === 'left',
            'max-w-2xl ml-auto': layoutAlign === 'right'
          }"
        >
          <div
            v-for="task in filteredTasks"
            :key="task.fullPath"
            class="group relative border rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 app-task-card"
            :style="cardCustomStyle"
            @click="$emit('select-task', task)"
            @contextmenu.prevent.stop="openTaskContextMenu($event, task)"
          >
            <!-- 左侧：年份、项目与需求名称 -->
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <span
                @click.stop="selectedYear = task.year"
                class="px-2 py-0.5 text-[11px] font-mono rounded border flex-shrink-0 cursor-pointer transition hover:scale-105 active:scale-95"
                :class="isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/25'"
                :title="`点击筛选 ${task.year} 年任务`"
              >
                📁 {{ task.year }}
              </span>
              <span
                @click.stop="selectProject(task.project || '常规项目')"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer flex-shrink-0"
                :class="(task.project || '常规项目') === selectedProject
                  ? (isLight ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'bg-emerald-950 text-emerald-300 border border-emerald-700')
                  : (isLight ? 'bg-slate-200/90 hover:bg-slate-300/90 text-slate-700 border border-slate-300' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/25')"
              >
                {{ task.project || '常规项目' }}
              </span>
              <h3 class="text-xs font-bold app-task-title group-hover:text-emerald-400 transition truncate">
                {{ task.title }}
              </h3>
            </div>

            <!-- 右侧：SQL胶囊、状态、日期与快捷按钮 -->
            <div class="flex items-center gap-3 flex-shrink-0">
              <div
                v-if="task.sqlCount === 0"
                class="text-[11px] app-task-tag px-2 py-0.5 rounded flex items-center gap-1"
              >
                <Database class="w-3 h-3 opacity-60" />
                <span>无 SQL</span>
              </div>
              <div
                v-else
                class="text-[11px] px-2 py-0.5 rounded font-medium border flex items-center gap-1"
                :class="isLight
                  ? (task.prodPendingCount > 0 ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-emerald-800 bg-emerald-100 border-emerald-300')
                  : (task.prodPendingCount > 0 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30')"
              >
                <Database class="w-3 h-3" :class="task.prodPendingCount > 0 ? 'text-amber-500' : 'text-emerald-500'" />
                <span>{{ task.sqlCount }} 份 SQL</span>
              </div>

              <span class="text-[11px] app-task-subtext font-mono hidden md:inline">
                {{ new Date(task.createdAt || Date.now()).toLocaleDateString() }}
              </span>

              <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1" :class="getStatusBadgeClass(task.status)">
                <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(task.status)"></span>
                {{ getStatusText(task.status) }}
              </span>

              <div class="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                <button
                  @click.stop="openIDE(task.fullPath)"
                  title="在代码编辑器中打开"
                  class="p-1 app-task-subtext hover:text-emerald-400 rounded transition"
                >
                  <Code2 class="w-3.5 h-3.5" />
                </button>
                <button
                  @click.stop="openExplorer(task.fullPath)"
                  title="在 Windows 资源管理器中打开"
                  class="p-1 app-task-subtext hover:text-emerald-400 rounded transition"
                >
                  <FolderOpen class="w-3.5 h-3.5" />
                </button>
                <button
                  @click.stop="openTaskContextMenu($event, task)"
                  class="p-1 app-task-subtext hover:text-emerald-400 rounded transition"
                  title="更多操作"
                >
                  <MoreVertical class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 全局自定义右键菜单 (任务与项目管理) ==================== -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="app-context-menu fixed z-50 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md py-1.5 min-w-[210px] text-xs text-slate-200 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <!-- 1. 任务卡片右键菜单 -->
        <template v-if="contextMenu.type === 'task' && contextMenu.task">
          <!-- 任务标题提示 -->
          <div class="px-3 py-1.5 text-[11px] font-bold text-slate-300 truncate max-w-[230px] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span class="truncate">{{ contextMenu.task.title }}</span>
          </div>

          <!-- 核心入口 -->
          <div class="py-1">
            <button
              @click="handleMenuAction('open-detail')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200 hover:text-emerald-300"
            >
              <FileEdit class="w-3.5 h-3.5 text-emerald-400" />
              <span>打开任务详情与代码</span>
            </button>
            <button
              @click="handleMenuAction('open-folder')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
              <span>在文件资源管理器中打开</span>
            </button>
            <button
              @click="handleMenuAction('open-ide')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <Code2 class="w-3.5 h-3.5 text-blue-400" />
              <span>在 VS Code 中打开</span>
            </button>
            <button
              @click="handleMenuAction('open-terminal')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <Terminal class="w-3.5 h-3.5 text-purple-400" />
              <span>在终端命令行打开</span>
            </button>
          </div>

          <!-- 所属项目与状态调整 -->
          <div class="py-1">
            <button
              @click="handleMenuAction('change-project')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <Tag class="w-3.5 h-3.5 text-cyan-400" />
              <span>修改所属项目 (当前: {{ contextMenu.task.project || '常规项目' }})</span>
            </button>

            <!-- 状态快速切换 -->
            <div class="px-3 pt-1.5 pb-0.5 text-[10px] text-slate-500 font-medium">快捷切换状态:</div>
            <div class="grid grid-cols-2 gap-1 px-2 pb-1">
              <button
                @click="handleMenuAction('set-status', 'developing')"
                class="px-2 py-1 rounded text-[11px] text-left transition"
                :class="contextMenu.task.status === 'developing' ? 'bg-blue-900/60 text-blue-300 font-bold' : 'hover:bg-slate-800 text-slate-300'"
              >
                🛠️ 开发中
              </button>
              <button
                @click="handleMenuAction('set-status', 'testing')"
                class="px-2 py-1 rounded text-[11px] text-left transition"
                :class="contextMenu.task.status === 'testing' ? 'bg-purple-900/60 text-purple-300 font-bold' : 'hover:bg-slate-800 text-slate-300'"
              >
                🧪 测试中
              </button>
              <button
                @click="handleMenuAction('set-status', 'release_ready')"
                class="px-2 py-1 rounded text-[11px] text-left transition"
                :class="contextMenu.task.status === 'release_ready' ? 'bg-amber-900/60 text-amber-300 font-bold' : 'hover:bg-slate-800 text-slate-300'"
              >
                🚀 待上线
              </button>
              <button
                @click="handleMenuAction('set-status', 'archived')"
                class="px-2 py-1 rounded text-[11px] text-left transition"
                :class="contextMenu.task.status === 'archived' ? 'bg-slate-800 text-slate-400 font-bold' : 'hover:bg-slate-800 text-slate-300'"
              >
                📦 已归档
              </button>
            </div>
          </div>

          <!-- 删除任务 -->
          <div class="py-1">
            <button
              @click="handleMenuAction('delete-task')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-left transition text-rose-400 hover:text-rose-300 font-medium"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>删除此任务 (安全移入回收站)</span>
            </button>
          </div>
        </template>

        <!-- 2. 左侧栏项目右键菜单 -->
        <template v-else-if="contextMenu.type === 'project' && contextMenu.project">
          <div class="px-3 py-1.5 text-[11px] font-bold text-slate-300 truncate max-w-[210px] flex items-center gap-1.5">
            <Briefcase class="w-3.5 h-3.5 text-emerald-400" />
            <span>项目: {{ contextMenu.project.name }}</span>
            <span class="text-[10px] text-slate-500 font-normal">({{ contextMenu.project.totalCount }}个任务)</span>
          </div>

          <div class="py-1">
            <button
              @click="handleProjectMenuAction('create-task')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200 hover:text-emerald-300"
            >
              <Plus class="w-3.5 h-3.5 text-emerald-400" />
              <span>在该项目下新建任务</span>
            </button>
            <button
              @click="handleProjectMenuAction('rename-project')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <Pencil class="w-3.5 h-3.5 text-amber-400" />
              <span>重命名此项目名称</span>
            </button>
          </div>

          <div class="py-1">
            <button
              @click="handleProjectMenuAction('delete-project')"
              class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-left transition text-rose-400 hover:text-rose-300 font-medium"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>删除该项目 (移入回收站)</span>
            </button>
          </div>
        </template>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Layers, Plus, FolderKanban, Database, FolderOpen, Calendar,
  Briefcase, Boxes, PanelLeftClose, PanelLeftOpen, X,
  MoreVertical, Trash2, Pencil, Code2, Terminal, Tag, FileEdit, Clock,
  LayoutGrid, List, AlignLeft, AlignRight, Maximize2, Sparkles
} from 'lucide-vue-next'

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

// 视图模式：'grid' (网格卡片) vs 'compact' (紧凑列表)
const viewMode = ref(localStorage.getItem('devtaskhub_view_mode') || 'grid')
function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem('devtaskhub_view_mode', mode)
}

// 透光度档位: 'crystal' (超透0模糊) | 'soft' (轻磨砂4px) | 'solid' (深色/实色)
const transparencyMode = ref(localStorage.getItem('devtaskhub_transparency_mode') || 'crystal')
function setTransparencyMode(mode) {
  transparencyMode.value = mode
  localStorage.setItem('devtaskhub_transparency_mode', mode)
}

// 画面排版避让: 'full' (全宽) | 'left' (靠左让出右侧风景) | 'right' (靠右让出左侧风景)
const layoutAlign = ref(localStorage.getItem('devtaskhub_layout_align') || 'full')
function setLayoutAlign(align) {
  layoutAlign.value = align
  localStorage.setItem('devtaskhub_layout_align', align)
}

const cardCustomStyle = computed(() => {
  if (props.isLight) {
    if (transparencyMode.value === 'crystal') {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        borderColor: 'rgba(203, 213, 225, 0.85)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        textShadow: 'none'
      }
    } else if (transparencyMode.value === 'soft') {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        borderColor: 'rgba(226, 232, 240, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        textShadow: 'none'
      }
    } else {
      return {
        backgroundColor: 'var(--card-bg, #ffffff)',
        borderColor: 'var(--card-border, rgba(226, 232, 240, 0.95))',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.07)'
      }
    }
  }

  // 深色主题模式
  if (transparencyMode.value === 'crystal') {
    return {
      backgroundColor: 'rgba(15, 23, 42, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.16)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.85)'
    }
  } else if (transparencyMode.value === 'soft') {
    return {
      backgroundColor: 'rgba(15, 23, 42, 0.22)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
    }
  } else {
    return {
      backgroundColor: 'var(--card-bg, rgba(15, 23, 42, 0.75))',
      borderColor: 'var(--card-border, rgba(255, 255, 255, 0.1))',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }
  }
})

// 年份胶囊高亮与未高亮动态样式
const activePillStyle = computed(() => {
  if (props.isLight) {
    return {
      backgroundColor: 'var(--theme-primary, #0f172a)',
      color: '#ffffff',
      borderColor: 'var(--theme-primary, #0f172a)',
      fontWeight: '700',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)'
    }
  } else {
    return {
      backgroundColor: 'rgba(var(--theme-primary-rgb, 16, 185, 129), 0.25)',
      color: 'var(--theme-primary, #34d399)',
      borderColor: 'var(--theme-primary, #10b981)',
      fontWeight: '700',
      boxShadow: '0 2px 10px rgba(var(--theme-primary-rgb, 16, 185, 129), 0.25)'
    }
  }
})

const activeBadgeStyle = computed(() => {
  if (props.isLight) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.28)',
      color: '#ffffff',
      fontWeight: '700'
    }
  } else {
    return {
      backgroundColor: 'rgba(var(--theme-primary-rgb, 16, 185, 129), 0.35)',
      color: '#ffffff',
      fontWeight: '700'
    }
  }
})

const inactivePillStyle = computed(() => {
  if (props.isLight) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.55)',
      color: '#475569',
      borderColor: 'rgba(203, 213, 225, 0.85)',
      fontWeight: '500'
    }
  } else {
    return {
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      color: '#94a3b8',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      fontWeight: '500'
    }
  }
})

const inactiveBadgeStyle = computed(() => {
  if (props.isLight) {
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      color: '#475569'
    }
  } else {
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      color: '#94a3b8'
    }
  }
})

// 侧边栏折叠状态持久化
const isSidebarCollapsed = ref(localStorage.getItem('devtaskhub_sidebar_collapsed') === 'true')

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('devtaskhub_sidebar_collapsed', isSidebarCollapsed.value.toString())
}

// 项目与年份筛选状态
const selectedProject = ref('all')
const currentYearStr = new Date().getFullYear().toString()
const selectedYear = ref(currentYearStr)
const filterStatus = ref('all')

// 右键上下文菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  type: 'task', // 'task' | 'project'
  task: null,
  project: null
})

function openTaskContextMenu(e, task) {
  closeContextMenu()
  const menuWidth = 220
  const menuHeight = 320
  const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12)
  const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12)

  contextMenu.value = {
    visible: true,
    x: Math.max(10, x),
    y: Math.max(10, y),
    type: 'task',
    task,
    project: null
  }
}

function openProjectContextMenu(e, proj) {
  closeContextMenu()
  const menuWidth = 220
  const menuHeight = 180
  const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12)
  const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12)

  contextMenu.value = {
    visible: true,
    x: Math.max(10, x),
    y: Math.max(10, y),
    type: 'project',
    task: null,
    project: proj
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

// 全局监听关闭右键菜单
onMounted(() => {
  window.addEventListener('click', closeContextMenu)
  window.addEventListener('scroll', closeContextMenu, true)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
  window.removeEventListener('scroll', closeContextMenu, true)
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(e) {
  if (e.key === 'Escape') {
    closeContextMenu()
  }
}

// 任务菜单动作执行
async function handleMenuAction(action, param = null) {
  const task = contextMenu.value.task
  if (!task) return
  closeContextMenu()

  switch (action) {
    case 'open-detail':
      emit('select-task', task)
      break
    case 'open-folder':
      window.electronAPI.openInExplorer(task.fullPath)
      break
    case 'open-ide':
      window.electronAPI.openInIDE(task.fullPath)
      break
    case 'open-terminal':
      window.electronAPI.openInTerminal(task.fullPath)
      break
    case 'change-project': {
      const current = task.project || '常规项目'
      const target = prompt(`修改任务 [${task.title}] 所属项目名称：`, current)
      if (target && target.trim() && target.trim() !== current) {
        await window.electronAPI.updateTask(task.fullPath, { project: target.trim() })
        emit('updated')
        emit('toast', `已将任务 [${task.title}] 归属项目更新为: ${target.trim()}`)
      }
      break
    }
    case 'set-status': {
      await window.electronAPI.updateTask(task.fullPath, { status: param })
      emit('updated')
      emit('toast', `任务状态已更新为: ${getStatusText(param)}`)
      break
    }
    case 'delete-task': {
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
}

// 项目菜单动作执行 (重命名或删除整个项目)
async function handleProjectMenuAction(action) {
  const proj = contextMenu.value.project
  if (!proj) return
  closeContextMenu()

  switch (action) {
    case 'create-task':
      emit('open-new-task', selectedYear.value, proj.name)
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
    case 'delete-project': {
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
}

// 提取所有项目清单与任务数统计
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

function selectProject(projName) {
  selectedProject.value = projName
}

function getProjectInitials(name) {
  if (!name) return '常'
  const clean = name.trim()
  if (/^[A-Za-z0-9]/.test(clean)) {
    return clean.slice(0, 2).toUpperCase()
  }
  return clean.slice(0, 2)
}

// 当前所选项目在对应年份的任务数量
function getYearCount(yr) {
  return props.tasks.filter(t => {
    if (selectedProject.value !== 'all') {
      const p = (t.project || '常规项目').trim()
      if (p !== selectedProject.value) return false
    }
    return t.year === yr
  }).length
}

// 当前项目过滤范围内的任务总数
const projectScopedTasksCount = computed(() => {
  if (selectedProject.value === 'all') return props.tasks.length
  return props.tasks.filter(t => (t.project || '常规项目').trim() === selectedProject.value).length
})

// 最终任务卡片展示列表
const filteredTasks = computed(() => {
  return props.tasks.filter(t => {
    // 1. 项目过滤
    if (selectedProject.value !== 'all') {
      const p = (t.project || '常规项目').trim()
      if (p !== selectedProject.value) return false
    }

    // 2. 年份过滤
    if (selectedYear.value !== 'all' && t.year !== selectedYear.value) {
      return false
    }

    // 3. 状态过滤
    if (filterStatus.value !== 'all' && t.status !== filterStatus.value) {
      return false
    }

    return true
  })
})

function getEmptyNotice() {
  if (selectedProject.value !== 'all' && selectedYear.value !== 'all') {
    return `[${selectedProject.value}] 项目在 ${selectedYear.value} 年暂无任务`
  }
  if (selectedProject.value !== 'all') {
    return `[${selectedProject.value}] 项目下暂无任务`
  }
  if (selectedYear.value !== 'all') {
    return `${selectedYear.value} 年暂无任务`
  }
  return '暂无开发任务'
}

function getStatusBadgeClass(status) {
  if (props.isLight) {
    switch (status) {
      case 'developing':
        return 'bg-blue-100 text-blue-700 border border-blue-300'
      case 'testing':
        return 'bg-purple-100 text-purple-700 border border-purple-300'
      case 'release_ready':
        return 'bg-amber-100 text-amber-800 border border-amber-300'
      case 'archived':
        return 'bg-slate-200 text-slate-700 border border-slate-300'
      default:
        return 'bg-slate-200 text-slate-700'
    }
  }

  switch (status) {
    case 'developing':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
    case 'testing':
      return 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
    case 'release_ready':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'archived':
      return 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
    default:
      return 'bg-slate-700 text-slate-300'
  }
}

function getStatusDotClass(status) {
  switch (status) {
    case 'developing':
      return 'bg-blue-400 animate-pulse'
    case 'testing':
      return 'bg-purple-400 animate-pulse'
    case 'release_ready':
      return 'bg-amber-400'
    case 'archived':
      return 'bg-slate-400'
    default:
      return 'bg-slate-400'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'developing': return '开发中'
    case 'testing': return '测试中'
    case 'release_ready': return '待上线'
    case 'archived': return '已归档'
    default: return status
  }
}

function openExplorer(path) {
  window.electronAPI.openInExplorer(path)
}

function openIDE(path) {
  window.electronAPI.openInIDE(path)
}
</script>
