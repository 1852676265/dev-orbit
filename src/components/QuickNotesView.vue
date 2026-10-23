<template>
  <div class="h-full w-full flex overflow-hidden select-none" :class="isLight ? 'text-slate-900' : 'text-slate-100'">
    
    <!-- ==================== 1. 左侧分类与命令库导航栏 ==================== -->
    <aside
      class="w-56 flex-shrink-0 flex flex-col border-r transition-colors duration-300 backdrop-blur-xl"
      :style="{
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.75)',
        borderColor: isLight ? 'rgba(226, 232, 240, 0.95)' : 'rgba(255, 255, 255, 0.08)'
      }"
    >
      <!-- 侧边栏标题 -->
      <div class="p-4 border-b flex items-center justify-between flex-shrink-0" :style="{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }">
        <div class="flex items-center gap-2">
          <BookMarked class="w-4 h-4 text-amber-500" />
          <h2 class="text-xs font-bold tracking-wide uppercase" :class="isLight ? 'text-slate-800' : 'text-slate-200'">
            命令分类库
          </h2>
        </div>
        <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full" :class="isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'">
          {{ notes.length }} 条
        </span>
      </div>

      <!-- 分类列表 (支持快捷过滤与统计) -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <!-- 全部命令项 -->
        <button
          type="button"
          @click="selectedCategory = 'all'"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left group"
          :class="selectedCategory === 'all'
            ? (isLight ? 'bg-slate-900 text-white font-semibold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm')
            : (isLight ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200')"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <Layers class="w-3.5 h-3.5 flex-shrink-0" :class="selectedCategory === 'all' ? (isLight ? 'text-white' : 'text-emerald-400') : 'text-slate-400'" />
            <span class="truncate">全部常用命令</span>
          </div>
          <span
            class="text-[10px] font-mono px-1.5 py-0.2 rounded-full"
            :class="selectedCategory === 'all'
              ? (isLight ? 'bg-slate-800 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
              : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400')"
          >
            {{ notes.length }}
          </span>
        </button>

        <!-- 业务与技术分类头部 (包含明确的 + 新建分类按钮) -->
        <div class="pt-3 pb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" :class="isLight ? 'text-slate-500' : 'text-slate-400'">
          <span>业务与技术分类</span>
          <button
            type="button"
            @click="openAddCategoryModal"
            class="flex items-center gap-1 text-[11px] font-medium transition px-1.5 py-0.5 rounded cursor-pointer"
            :class="isLight ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200' : 'text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60'"
            title="新建自定义命令分类 (如: Redis, K8s, 前端发布)"
          >
            <Plus class="w-3 h-3" />
            <span>新建分类</span>
          </button>
        </div>

        <!-- 分类列表 (包含系统预设 + 用户自定义分类) -->
        <div
          v-for="cat in categoryList"
          :key="cat.id"
          class="group/item flex items-center rounded-xl transition text-xs font-medium"
          :class="selectedCategory === cat.id
            ? (isLight ? 'bg-slate-900 text-white font-semibold shadow-sm' : 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm')
            : (isLight ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200')"
        >
          <button
            type="button"
            @click="selectedCategory = cat.id"
            class="flex-1 flex items-center justify-between px-3 py-2 text-left min-w-0"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <component
                :is="cat.icon"
                class="w-3.5 h-3.5 flex-shrink-0"
                :style="{ color: selectedCategory === cat.id ? (isLight ? '#ffffff' : '#34d399') : cat.color }"
              />
              <span class="truncate">{{ cat.name }}</span>
            </div>
            <span
              v-if="cat.count > 0"
              class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ml-1"
              :class="selectedCategory === cat.id
                ? (isLight ? 'bg-slate-800 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
                : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400')"
            >
              {{ cat.count }}
            </span>
          </button>

          <!-- 自定义分类的快捷删除按钮 -->
          <button
            v-if="cat.isCustom"
            type="button"
            @click.stop="deleteCustomCategory(cat)"
            class="opacity-0 group-hover/item:opacity-100 p-1.5 mr-1.5 rounded text-slate-400 hover:text-rose-500 transition"
            :title="`删除自定义分类 [${cat.name}]`"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- 侧边栏底部：本地存储提示与打开文件夹 -->
      <div class="p-3 border-t text-[11px] flex flex-col gap-1.5 flex-shrink-0" :style="{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[10px] font-mono flex items-center gap-1">
            <FolderOpen class="w-3 h-3 text-amber-500" />
            _quick_notes/
          </span>
          <button
            @click="openNotesFolder"
            class="text-[10px] text-emerald-500 hover:underline cursor-pointer"
            title="在 Windows 资源管理器中打开存储目录"
          >
            打开目录
          </button>
        </div>
      </div>
    </aside>

    <!-- ==================== 2. 右侧主工作区：高密度命令清单 ==================== -->
    <main class="flex-1 flex flex-col overflow-hidden relative">
      
      <!-- 顶栏：分类指示、极速搜索、视图切换与操作按钮 -->
      <div
        class="px-6 py-3.5 border-b flex items-center justify-between gap-4 flex-shrink-0 backdrop-blur-md"
        :style="{
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.45)',
          borderColor: isLight ? 'rgba(226, 232, 240, 0.95)' : 'rgba(255, 255, 255, 0.08)'
        }"
      >
        <!-- 左侧分类与数量统计 -->
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-bold flex items-center gap-2" :class="isLight ? 'text-slate-900' : 'text-slate-100'">
            {{ activeCategoryTitle }}
            <span class="text-xs font-normal text-slate-400 font-mono">
              ({{ filteredNotes.length }} 条命中)
            </span>
          </h2>
        </div>

        <!-- 右侧操作区：搜索框 + 视图切换 + 批量导入 + 新建命令 -->
        <div class="flex items-center gap-2.5">
          <!-- 实时过滤搜索框 -->
          <div class="relative w-64">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索说明、参数或命令关键字..."
              class="w-full rounded-xl pl-8 pr-7 py-1.5 text-xs transition focus:outline-none border"
              :class="isLight
                ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-slate-800 shadow-sm'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-emerald-500 shadow-inner'"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
              title="清除"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <!-- 视图模式切换胶囊 (清单高密 VS 卡片网格) -->
          <div
            class="flex items-center p-0.5 rounded-xl border text-xs"
            :class="isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-700/80'"
          >
            <button
              @click="viewMode = 'list'"
              class="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              :class="viewMode === 'list'
                ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-slate-800 text-emerald-400 font-semibold shadow-sm')
                : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')"
              title="高密度清单模式 (一屏浏览海量命令，强烈推荐)"
            >
              <LayoutList class="w-3.5 h-3.5" />
              <span>极速清单</span>
            </button>
            <button
              @click="viewMode = 'grid'"
              class="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              :class="viewMode === 'grid'
                ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-slate-800 text-emerald-400 font-semibold shadow-sm')
                : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')"
              title="大卡片视图模式"
            >
              <LayoutGrid class="w-3.5 h-3.5" />
              <span>卡片</span>
            </button>
          </div>

          <!-- 批量导入快捷入口 -->
          <button
            @click="openBatchModal"
            class="px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border transition active:scale-95 shadow-sm"
            :class="isLight
              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'"
            title="一键批量粘贴脚本并智能自动识别为多条命令"
          >
            <UploadCloud class="w-3.5 h-3.5 text-blue-500" />
            <span>批量导入</span>
          </button>

          <!-- 添加单条命令/笔记 -->
          <button
            @click="openAddModal"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            :class="isLight
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>添加命令</span>
          </button>
        </div>
      </div>

      <!-- 主命令内容滚动区 -->
      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar">
        
        <!-- 空状态展示 -->
        <div
          v-if="filteredNotes.length === 0"
          class="text-center py-24 rounded-2xl border border-dashed flex flex-col items-center justify-center space-y-3"
          :class="isLight ? 'bg-white/60 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-800 text-slate-400'"
        >
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'">
            <StickyNote class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm font-semibold" :class="isLight ? 'text-slate-700' : 'text-slate-300'">
              {{ searchQuery ? '未搜索到匹配的命令' : `[${activeCategoryTitle}] 下暂无命令记录` }}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              可点击右上角“添加命令”在该分类下添加，或使用“批量导入”一键粘贴脚本
            </p>
          </div>
          <div class="flex items-center gap-2 pt-2">
            <button
              @click="openAddModal"
              class="px-3 py-1.5 text-xs rounded-lg font-medium transition"
              :class="isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-emerald-600 text-white hover:bg-emerald-500'"
            >
              + 在此分类下添加第一条命令
            </button>
            <button
              @click="openBatchModal"
              class="px-3 py-1.5 text-xs rounded-lg border font-medium transition"
              :class="isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'"
            >
              📥 批量导入脚本
            </button>
          </div>
        </div>

        <!-- ==================== A. 极速清单高密模式 (一行一个，突出命令与说明的区别) ==================== -->
        <div v-else-if="viewMode === 'list'" class="space-y-3">
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 group relative overflow-hidden"
            :class="[
              isLight ? 'bg-white/95 border-slate-200 hover:border-slate-300' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700',
              getCategoryInfo(note.tag).borderAccent
            ]"
            style="border-left-width: 4px;"
          >
            <!-- 左侧：类型徽章 + 说明标题 -->
            <div class="flex-1 min-w-0 space-y-1.5 pr-2">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- 分类标签徽章 (根据命令类型呈现专属颜色) -->
                <span
                  class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 flex-shrink-0"
                  :class="isLight ? getCategoryInfo(note.tag).lightBadgeClass : getCategoryInfo(note.tag).badgeClass"
                >
                  <component :is="getCategoryInfo(note.tag).icon" class="w-3 h-3" />
                  <span>{{ note.tag || '通用' }}</span>
                </span>

                <!-- 标题 / 作用说明 -->
                <h3 class="text-xs font-bold truncate flex-1" :class="isLight ? 'text-slate-800' : 'text-slate-100'">
                  {{ note.title }}
                </h3>

                <span class="text-[10px] text-slate-400 font-mono hidden lg:inline flex-shrink-0">
                  {{ formatTime(note.createdAt || note.updatedAt) }}
                </span>
              </div>

              <!-- 终端命令行区 (逐行智能区分：注释行 VS 执行命令，支持单行悬浮独立复制) -->
              <div
                class="rounded-lg p-2 font-mono text-xs border space-y-1 overflow-x-auto"
                :class="isLight
                  ? 'bg-slate-50 border-slate-200/90 text-slate-800'
                  : 'bg-slate-950/80 border-slate-800 text-slate-200'"
              >
                <div
                  v-for="line in parseContentLines(note.content)"
                  :key="line.id"
                  class="flex items-center justify-between gap-3 group/line hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded transition"
                >
                  <!-- 行内容：注释行呈柔和斜体，命令呈加粗代码 -->
                  <div class="flex items-start gap-1.5 min-w-0 flex-1">
                    <span
                      v-if="line.isComment"
                      class="text-slate-400 italic text-[11px] truncate select-text"
                    >
                      {{ line.text }}
                    </span>
                    <template v-else-if="line.isCommand">
                      <span class="text-emerald-500 font-bold select-none text-[11px] flex-shrink-0">$</span>
                      <span class="font-semibold text-xs tracking-tight truncate select-text" :class="isLight ? 'text-slate-900' : 'text-emerald-300'">
                        {{ line.text }}
                      </span>
                    </template>
                    <span v-else class="text-slate-400 text-xs truncate">
                      {{ line.text }}
                    </span>
                  </div>

                  <!-- 单行即时复制按钮 (仅命令代码行显示) -->
                  <button
                    v-if="line.isCommand"
                    @click.stop="copySingleLine(line.text)"
                    class="opacity-0 group-hover/line:opacity-100 transition px-1.5 py-0.5 text-[10px] rounded border flex items-center gap-1 flex-shrink-0"
                    :class="isLight
                      ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'"
                    title="复制这单行命令"
                  >
                    <Copy class="w-2.5 h-2.5" />
                    <span>单行复制</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 右侧操作栏：一键复制命令 + 编辑 + 删除 -->
            <div class="flex items-center gap-2 flex-shrink-0 self-end md:self-center pt-2 md:pt-0">
              <!-- 一键复制主按钮 (支持全部有效命令复制) -->
              <button
                @click="copyAllCommands(note)"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm active:scale-95"
                :class="copiedId === note.id
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50'
                  : (isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-emerald-600/90 hover:bg-emerald-500 text-white')"
                title="一键复制全部可执行命令"
              >
                <component :is="copiedId === note.id ? Check : Copy" class="w-3.5 h-3.5" />
                <span>{{ copiedId === note.id ? '已复制 ✓' : '复制命令' }}</span>
              </button>

              <button
                @click="editNote(note)"
                class="p-1.5 rounded-lg border text-slate-400 transition"
                :class="isLight ? 'bg-white hover:text-slate-900 hover:bg-slate-100 border-slate-200' : 'bg-slate-800 hover:text-white hover:bg-slate-700 border-slate-700'"
                title="编辑命令"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                @click="deleteNote(note.id)"
                class="p-1.5 rounded-lg border text-slate-400 hover:text-rose-500 transition"
                :class="isLight ? 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-200' : 'bg-slate-800 hover:bg-rose-950/40 border-slate-700 hover:border-rose-800'"
                title="删除命令"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== B. 卡片模式 (同样拥有语法区分与单行独立复制) ==================== -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between group shadow-sm overflow-hidden"
            :class="[
              isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/80 border-slate-800',
              getCategoryInfo(note.tag).borderAccent
            ]"
            style="border-left-width: 4px;"
          >
            <div>
              <!-- 顶部：标题 + 标签 -->
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="text-xs font-bold line-clamp-2 flex-1" :class="isLight ? 'text-slate-900' : 'text-slate-100'">
                  {{ note.title }}
                </h3>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold flex-shrink-0 flex items-center gap-1"
                  :class="isLight ? getCategoryInfo(note.tag).lightBadgeClass : getCategoryInfo(note.tag).badgeClass"
                >
                  <component :is="getCategoryInfo(note.tag).icon" class="w-2.5 h-2.5" />
                  <span>{{ note.tag || '通用' }}</span>
                </span>
              </div>

              <!-- 命令内容与多行区分展示 -->
              <div
                class="rounded-xl p-2.5 font-mono text-xs border max-h-44 overflow-y-auto space-y-1 custom-scrollbar"
                :class="isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950/90 border-slate-800 text-slate-200'"
              >
                <div
                  v-for="line in parseContentLines(note.content)"
                  :key="line.id"
                  class="flex items-center justify-between gap-2 group/line hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded"
                >
                  <div class="flex items-start gap-1 min-w-0 flex-1">
                    <span v-if="line.isComment" class="text-slate-400 italic text-[11px] truncate">
                      {{ line.text }}
                    </span>
                    <template v-else-if="line.isCommand">
                      <span class="text-emerald-500 font-bold select-none text-[11px]">$</span>
                      <span class="font-semibold text-xs truncate" :class="isLight ? 'text-slate-900' : 'text-emerald-300'">
                        {{ line.text }}
                      </span>
                    </template>
                    <span v-else class="text-slate-400 text-xs truncate">
                      {{ line.text }}
                    </span>
                  </div>
                  <button
                    v-if="line.isCommand"
                    @click.stop="copySingleLine(line.text)"
                    class="opacity-0 group-hover/line:opacity-100 text-[10px] text-slate-400 hover:text-emerald-500 p-0.5"
                    title="复制单行"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 卡片底栏 -->
            <div class="mt-3 pt-2.5 border-t flex items-center justify-between text-xs" :style="{ borderColor: isLight ? '#f1f5f9' : '#1e293b' }">
              <span class="text-[10px] text-slate-400 font-mono">
                {{ formatTime(note.createdAt || note.updatedAt) }}
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  @click="editNote(note)"
                  class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="编辑"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="deleteNote(note.id)"
                  class="p-1 text-slate-400 hover:text-rose-500"
                  title="删除"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="copyAllCommands(note)"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-sm active:scale-95"
                  :class="copiedId === note.id
                    ? 'bg-emerald-600 text-white'
                    : (isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-500 text-white')"
                >
                  <component :is="copiedId === note.id ? Check : Copy" class="w-3 h-3" />
                  <span>{{ copiedId === note.id ? '已复制' : '复制' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ==================== 3. 弹窗：新建自定义命令分类 ==================== -->
    <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="app-modal-dialog bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-slate-100 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
          <h3 class="text-base font-bold flex items-center gap-2">
            <Plus class="w-4 h-4 text-emerald-400" />
            新建命令分类
          </h3>
          <button @click="showCategoryModal = false" class="text-slate-400 hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveNewCategory" class="space-y-4">
          <!-- 分类名称 -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-300">
              分类名称 <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="categoryForm.name"
              required
              placeholder="如: Redis, K8s, 前端发布, Jenkins..."
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- 图标选择器 -->
          <div>
            <label class="block text-xs font-semibold mb-1.5 text-slate-300">
              选择分类代表图标
            </label>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="item in availableIcons"
                :key="item.name"
                type="button"
                @click="categoryForm.iconName = item.name"
                class="p-2.5 rounded-xl border flex items-center justify-center transition"
                :class="categoryForm.iconName === item.name
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-sm'
                  : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
                :title="item.label"
              >
                <component :is="item.component" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 颜色选择器 -->
          <div>
            <label class="block text-xs font-semibold mb-1.5 text-slate-300">
              选择分类标识颜色
            </label>
            <div class="flex items-center gap-2.5 flex-wrap">
              <button
                v-for="color in availableColors"
                :key="color.hex"
                type="button"
                @click="categoryForm.color = color.hex"
                class="w-7 h-7 rounded-full flex items-center justify-center transition border-2"
                :style="{
                  backgroundColor: color.hex,
                  borderColor: categoryForm.color === color.hex ? '#ffffff' : 'transparent'
                }"
                :title="color.label"
              >
                <Check v-if="categoryForm.color === color.hex" class="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          <!-- 效果预览 -->
          <div class="p-3 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/50 space-y-1">
            <span class="text-[10px] text-slate-400">分类展示效果预览：</span>
            <div class="flex items-center gap-2">
              <span
                class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                :style="{
                  color: categoryForm.color,
                  borderColor: categoryForm.color + '50',
                  backgroundColor: categoryForm.color + '15'
                }"
              >
                <component :is="getIconComponentByName(categoryForm.iconName)" class="w-3 h-3" />
                <span>{{ categoryForm.name || '分类名称' }}</span>
              </span>
            </div>
          </div>

          <div class="flex justify-end gap-2.5 pt-2 border-t border-slate-700/60">
            <button
              type="button"
              @click="showCategoryModal = false"
              class="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded-lg border border-slate-700"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
            >
              创建并进入该分类
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== 4. 弹窗：单条命令添加 / 编辑 ==================== -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="app-modal-dialog bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 text-slate-100 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
          <h3 class="text-base font-bold flex items-center gap-2">
            <BookMarked class="w-4 h-4 text-amber-500" />
            {{ editingId ? '编辑随手记命令' : '添加新的随手记命令' }}
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveNote" class="space-y-4">
          <!-- 标签选择与快捷候选 (包含系统预设 + 所有自定义分类) -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-300">
              命令分类标签 <span class="text-rose-400">*</span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="form.tag"
                required
                placeholder="如: 发布脚本, Docker, Git, Linux, SQL, Redis..."
                class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <!-- 快捷标签胶囊一键选择 (全量联动) -->
            <div class="flex items-center gap-1.5 flex-wrap mt-2">
              <span class="text-[10px] text-slate-400">选择分类:</span>
              <button
                v-for="preset in allSelectableTags"
                :key="preset"
                type="button"
                @click="form.tag = preset"
                class="px-2 py-0.5 rounded text-[10px] border transition"
                :class="form.tag === preset
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold'
                  : 'bg-slate-700/60 text-slate-300 border-slate-600/50 hover:bg-slate-700'"
              >
                {{ preset }}
              </button>
            </div>
          </div>

          <!-- 说明标题 -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-300">
              作用描述 / 标题 <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="form.title"
              required
              placeholder="如: # 1.1 默认发布：发布指定日期的所有服务"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- 具体命令内容 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-300">
                可执行命令代码 (支持单行或多行) <span class="text-rose-400">*</span>
              </label>
              <span class="text-[10px] text-slate-400">
                提示：以 # 开头的行自动识别为说明注释
              </span>
            </div>
            <textarea
              v-model="form.content"
              required
              rows="6"
              placeholder="例如输入：&#10;bash deploy-jars.sh 2026-09-10&#10;# 或者包含多行指令与注释&#10;bash deploy-jars.sh 2026-09-10 tsm-gateway.jar"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2.5 pt-2 border-t border-slate-700/60">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded-lg border border-slate-700"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
            >
              保存命令
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== 5. 弹窗：智能批量导入命令 (支持直接粘贴截图片段) ==================== -->
    <div v-if="showBatchModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="app-modal-dialog bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 text-slate-100 shadow-2xl flex flex-col max-h-[88vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-3 flex-shrink-0">
          <div class="flex items-center gap-2">
            <UploadCloud class="w-5 h-5 text-blue-400" />
            <div>
              <h3 class="text-base font-bold">智能批量导入命令脚本</h3>
              <p class="text-[11px] text-slate-400">直接粘贴含有 # 说明与多行命令的脚本代码，自动切割识别入库</p>
            </div>
          </div>
          <button @click="showBatchModal = false" class="text-slate-400 hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-4 pr-1">
          <!-- 默认分类归属 -->
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-slate-300 flex-shrink-0">归属分类:</span>
            <input
              v-model="batchCategory"
              placeholder="如: 发布脚本"
              class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 w-44 focus:outline-none focus:border-emerald-500"
            />
            <div class="flex items-center gap-1 flex-wrap">
              <button
                v-for="p in allSelectableTags.slice(0, 5)"
                :key="p"
                type="button"
                @click="batchCategory = p"
                class="px-2 py-0.5 rounded text-[10px] border"
                :class="batchCategory === p ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold' : 'bg-slate-700/60 text-slate-300 border-slate-600/50'"
              >
                {{ p }}
              </button>
            </div>

            <!-- 一键填入截图示例按钮 -->
            <button
              type="button"
              @click="fillSampleDeploymentScript"
              class="ml-auto text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>载入截图发布脚本示例</span>
            </button>
          </div>

          <!-- 批量文本输入框 -->
          <div>
            <textarea
              v-model="batchRawText"
              rows="9"
              placeholder="请在此直接粘贴整段命令或脚本清单，如：&#10;# 1.1 默认发布：发布指定日期的所有服务&#10;bash deploy-jars.sh 2026-09-10&#10;&#10;# 1.2 单包发布：仅发布指定的一个或几个服务&#10;bash deploy-jars.sh 2026-09-10 tsm-gateway.jar&#10;bash deploy-jars.sh 2026-09-10 tsm-system.jar tsm-gateway.jar"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
            ></textarea>
          </div>

          <!-- 实时解析结果预览 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>实时解析预览</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  已识别出 {{ parsedBatchItems.length }} 条独立命令
                </span>
              </span>
            </div>

            <div
              v-if="parsedBatchItems.length > 0"
              class="max-h-48 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-900/60 divide-y divide-slate-800 p-1 custom-scrollbar text-xs"
            >
              <div
                v-for="(item, idx) in parsedBatchItems"
                :key="idx"
                class="p-2.5 space-y-1 hover:bg-slate-800/40 rounded transition"
              >
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                    #{{ idx + 1 }}
                  </span>
                  <span class="font-bold text-slate-200 truncate flex-1">
                    {{ item.title }}
                  </span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {{ batchCategory }}
                  </span>
                </div>
                <div class="font-mono text-[11px] text-emerald-300 bg-slate-950 px-2 py-1 rounded truncate">
                  {{ item.content }}
                </div>
              </div>
            </div>
            <div
              v-else
              class="text-center py-6 border border-dashed border-slate-700 rounded-xl text-xs text-slate-500"
            >
              在上方粘贴脚本后，此处将自动分拆展示识别出的命令列表
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-700/60 mt-2 flex-shrink-0">
          <button
            type="button"
            @click="showBatchModal = false"
            class="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded-lg border border-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            @click="confirmBatchImport"
            :disabled="parsedBatchItems.length === 0"
            class="px-5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition"
            :class="parsedBatchItems.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'"
          >
            确认导入这 {{ parsedBatchItems.length }} 条命令
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BookMarked, Search, Plus, StickyNote, Copy, Pencil, Trash2,
  Rocket, Boxes, GitBranch, Terminal, Database, Globe, Code,
  Layers, Check, LayoutList, LayoutGrid, UploadCloud, X, FolderOpen,
  Sparkles, Server, Cpu, Shield, Workflow, Zap, Flame
} from 'lucide-vue-next'

const props = defineProps({
  isLight: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toast'])

const notes = ref([])
const customCategories = ref([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const viewMode = ref('list') // 'list' (极速清单，高密度) | 'grid' (卡片)

// 新建单条命令状态
const showModal = ref(false)
const editingId = ref(null)
const form = ref({
  title: '',
  tag: '发布脚本',
  content: ''
})

const copiedId = ref(null)

// 批量导入状态
const showBatchModal = ref(false)
const batchCategory = ref('发布脚本')
const batchRawText = ref('')

// 新建分类状态
const showCategoryModal = ref(false)
const categoryForm = ref({
  name: '',
  iconName: 'Server',
  color: '#06b6d4'
})

// 可选图标库
const availableIcons = [
  { name: 'Server', component: Server, label: '服务器/服务' },
  { name: 'Cpu', component: Cpu, label: '系统/硬件' },
  { name: 'Rocket', component: Rocket, label: '发布部署' },
  { name: 'Terminal', component: Terminal, label: '命令行/Shell' },
  { name: 'Database', component: Database, label: '数据库' },
  { name: 'Globe', component: Globe, label: '网络/接口' },
  { name: 'Boxes', component: Boxes, label: '容器/组件' },
  { name: 'GitBranch', component: GitBranch, label: '版本分支' },
  { name: 'Shield', component: Shield, label: '安全防御' },
  { name: 'Workflow', component: Workflow, label: '工作流/CI' },
  { name: 'Zap', component: Zap, label: '高频快捷' },
  { name: 'Flame', component: Flame, label: '应急排错' }
]

// 可选颜色库
const availableColors = [
  { hex: '#10b981', label: '翠绿' },
  { hex: '#0ea5e9', label: '天蓝' },
  { hex: '#06b6d4', label: '青色' },
  { hex: '#f97316', label: '活力橙' },
  { hex: '#a855f7', label: '紫罗兰' },
  { hex: '#f59e0b', label: '琥珀金' },
  { hex: '#f43f5e', label: '玫瑰红' },
  { hex: '#64748b', label: '石板灰' }
]

function getIconComponentByName(iconName) {
  const found = availableIcons.find(i => i.name === iconName)
  return found ? found.component : Server
}

onMounted(() => {
  loadNotes()
  loadCustomCategories()
})

async function loadNotes() {
  try {
    const list = await window.electronAPI.getQuickNotes()
    notes.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('加载随手记失败', err)
  }
}

async function loadCustomCategories() {
  try {
    if (window.electronAPI.getQuickNoteCategories) {
      const cats = await window.electronAPI.getQuickNoteCategories()
      customCategories.value = Array.isArray(cats) ? cats : []
    }
  } catch (err) {
    console.error('加载自定义分类失败', err)
  }
}

// 分类与标签规范列表 (包含系统预设 + 用户自定义创建的分类)
const categoryList = computed(() => {
  // 1. 系统预设高频开发类别
  const presets = [
    { id: 'deploy', name: '发布脚本', icon: Rocket, color: '#10b981', isCustom: false },
    { id: 'docker', name: 'Docker 容器', icon: Boxes, color: '#0ea5e9', isCustom: false },
    { id: 'git', name: 'Git 版本', icon: GitBranch, color: '#f97316', isCustom: false },
    { id: 'linux', name: 'Linux 运维', icon: Terminal, color: '#a855f7', isCustom: false },
    { id: 'sql', name: 'SQL 数据库', icon: Database, color: '#f59e0b', isCustom: false },
    { id: 'nginx', name: 'Nginx 网络', icon: Globe, color: '#f43f5e', isCustom: false },
    { id: 'general', name: '通用其它', icon: Code, color: '#94a3b8', isCustom: false }
  ]

  // 2. 自定义分类列表
  const customList = customCategories.value.map(c => ({
    id: c.id,
    name: c.name,
    icon: getIconComponentByName(c.iconName),
    color: c.color || '#06b6d4',
    isCustom: true
  }))

  const allCats = [...presets, ...customList]

  // 计算每个分类对应的命中条目数
  return allCats.map(cat => {
    const count = notes.value.filter(n => matchCategory(n.tag, cat.id, cat.name)).length
    return {
      ...cat,
      count
    }
  })
})

// 所有可供一键选择的分类标签（包含预设与自定义）
const allSelectableTags = computed(() => {
  const set = new Set(['发布脚本', 'Docker', 'Git', 'Linux', 'SQL', 'Nginx', '通用'])
  customCategories.value.forEach(c => {
    if (c.name) set.add(c.name.trim())
  })
  notes.value.forEach(n => {
    if (n.tag) set.add(n.tag.trim())
  })
  return Array.from(set)
})

function matchCategory(tag, catId, catName) {
  const t = (tag || '').toLowerCase()
  if (catId === 'deploy') return t.includes('发布') || t.includes('deploy') || t.includes('jar') || t.includes('上线')
  if (catId === 'docker') return t.includes('docker') || t.includes('容器') || t.includes('k8s')
  if (catId === 'git') return t.includes('git') || t.includes('commit') || t.includes('分支')
  if (catId === 'linux') return t.includes('linux') || t.includes('shell') || t.includes('bash') || t.includes('运维') || t.includes('进程')
  if (catId === 'sql') return t.includes('sql') || t.includes('db') || t.includes('mysql') || t.includes('dm') || t.includes('oracle')
  if (catId === 'nginx') return t.includes('nginx') || t.includes('网络') || t.includes('curl') || t.includes('端口') || t.includes('http')
  if (catId === 'general') {
    return !matchCategory(tag, 'deploy') &&
      !matchCategory(tag, 'docker') &&
      !matchCategory(tag, 'git') &&
      !matchCategory(tag, 'linux') &&
      !matchCategory(tag, 'sql') &&
      !matchCategory(tag, 'nginx') &&
      !customCategories.value.some(c => c.name.toLowerCase() === t)
  }
  // 针对自定义分类按精确名称或 ID 匹配
  if (catName && t === catName.toLowerCase()) return true
  return false
}

// 当前激活的分类标题
const activeCategoryTitle = computed(() => {
  if (selectedCategory.value === 'all') return '全部常用命令'
  const found = categoryList.value.find(c => c.id === selectedCategory.value)
  return found ? found.name : '常用命令'
})

// 过滤后的命令清单
const filteredNotes = computed(() => {
  return notes.value.filter(n => {
    // 1. 分类过滤
    let matchCat = true
    if (selectedCategory.value !== 'all') {
      const activeCat = categoryList.value.find(c => c.id === selectedCategory.value)
      matchCat = matchCategory(n.tag, selectedCategory.value, activeCat?.name)
    }

    // 2. 搜索过滤
    const q = searchQuery.value.toLowerCase().trim()
    let matchSearch = true
    if (q) {
      matchSearch =
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tag && n.tag.toLowerCase().includes(q))
    }

    return matchCat && matchSearch
  })
})

// 命令分类色彩与图标体系 (根据标签名称智能渲染)
function getCategoryInfo(tag) {
  const t = (tag || '').toLowerCase()
  // 首先查找是否有对应的自定义分类
  const custom = customCategories.value.find(c => c.name.toLowerCase() === t)
  if (custom) {
    return {
      label: custom.name,
      icon: getIconComponentByName(custom.iconName),
      borderAccent: 'border-l-cyan-500',
      badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      lightBadgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-300',
      color: custom.color || '#06b6d4'
    }
  }

  if (t.includes('发布') || t.includes('deploy') || t.includes('jar') || t.includes('上线')) {
    return {
      label: tag || '发布脚本',
      icon: Rocket,
      borderAccent: 'border-l-emerald-500',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      lightBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      color: '#10b981'
    }
  }
  if (t.includes('docker') || t.includes('容器') || t.includes('k8s')) {
    return {
      label: tag || 'Docker',
      icon: Boxes,
      borderAccent: 'border-l-sky-500',
      badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      lightBadgeClass: 'bg-sky-50 text-sky-700 border-sky-300',
      color: '#0ea5e9'
    }
  }
  if (t.includes('git') || t.includes('commit') || t.includes('分支')) {
    return {
      label: tag || 'Git',
      icon: GitBranch,
      borderAccent: 'border-l-orange-500',
      badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      lightBadgeClass: 'bg-orange-50 text-orange-700 border-orange-300',
      color: '#f97316'
    }
  }
  if (t.includes('linux') || t.includes('shell') || t.includes('bash') || t.includes('运维') || t.includes('进程')) {
    return {
      label: tag || 'Linux',
      icon: Terminal,
      borderAccent: 'border-l-purple-500',
      badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      lightBadgeClass: 'bg-purple-50 text-purple-700 border-purple-300',
      color: '#a855f7'
    }
  }
  if (t.includes('sql') || t.includes('db') || t.includes('mysql') || t.includes('dm') || t.includes('oracle')) {
    return {
      label: tag || 'SQL',
      icon: Database,
      borderAccent: 'border-l-amber-500',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      lightBadgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
      color: '#f59e0b'
    }
  }
  if (t.includes('nginx') || t.includes('网络') || t.includes('curl') || t.includes('端口') || t.includes('http')) {
    return {
      label: tag || 'Nginx',
      icon: Globe,
      borderAccent: 'border-l-rose-500',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      lightBadgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
      color: '#f43f5e'
    }
  }
  return {
    label: tag || '通用',
    icon: Code,
    borderAccent: 'border-l-slate-500',
    badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    lightBadgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    color: '#94a3b8'
  }
}

// 逐行解析器：区分说明注释行 (# 开头) 与可执行命令行
function parseContentLines(content) {
  if (!content) return []
  return content.split('\n').map((line, idx) => {
    const trimmed = line.trim()
    const isComment = trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('--')
    return {
      id: idx,
      text: line,
      isComment,
      isCommand: !isComment && trimmed.length > 0
    }
  })
}

// 单行独立复制
async function copySingleLine(text) {
  if (!text) return
  await window.electronAPI.copyToClipboard(text.trim())
  emit('toast', `已复制命令: ${text.trim().substring(0, 30)}...`)
}

// 复制全部有效命令 (智能提取所有非纯注释命令行)
async function copyAllCommands(note) {
  if (!note || !note.content) return
  const lines = note.content.split('\n')
  const executable = lines
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('//') && !l.startsWith('--'))
  
  const textToCopy = executable.length > 0 ? executable.join('\n') : note.content
  await window.electronAPI.copyToClipboard(textToCopy)
  
  copiedId.value = note.id
  setTimeout(() => {
    if (copiedId.value === note.id) copiedId.value = null
  }, 1800)

  emit('toast', `已复制命令 [${note.title}] 到剪贴板`)
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  } catch (e) {
    return ''
  }
}

// ==================== 新建自定义分类 ====================
function openAddCategoryModal() {
  categoryForm.value = {
    name: '',
    iconName: 'Server',
    color: '#06b6d4'
  }
  showCategoryModal.value = true
}

async function saveNewCategory() {
  const name = categoryForm.value.name.trim()
  if (!name) return
  // 检查是否已有同名分类
  if (categoryList.value.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('已存在同名分类，请勿重复创建！')
    return
  }

  const newCat = {
    id: 'cat_' + Date.now(),
    name,
    iconName: categoryForm.value.iconName,
    color: categoryForm.value.color
  }

  customCategories.value.push(newCat)
  try {
    if (window.electronAPI.saveQuickNoteCategories) {
      await window.electronAPI.saveQuickNoteCategories(customCategories.value)
    }
  } catch (e) {
    console.error('保存分类失败', e)
  }

  showCategoryModal.value = false
  selectedCategory.value = newCat.id
  emit('toast', `已成功新建命令分类 [${name}]`)
}

async function deleteCustomCategory(cat) {
  if (!confirm(`确认删除自定义分类 [${cat.name}] 吗？`)) return
  customCategories.value = customCategories.value.filter(c => c.id !== cat.id)
  try {
    if (window.electronAPI.saveQuickNoteCategories) {
      await window.electronAPI.saveQuickNoteCategories(customCategories.value)
    }
  } catch (e) {}

  if (selectedCategory.value === cat.id) {
    selectedCategory.value = 'all'
  }
  emit('toast', `已删除分类 [${cat.name}]`)
}

// ==================== 单条命令添加与编辑 ====================
function openAddModal() {
  editingId.value = null
  form.value = {
    title: '',
    tag: selectedCategory.value !== 'all' ? activeCategoryTitle.value : '发布脚本',
    content: ''
  }
  showModal.value = true
}

function editNote(note) {
  editingId.value = note.id
  form.value = {
    title: note.title,
    tag: note.tag || '通用',
    content: note.content
  }
  showModal.value = true
}

async function saveNote() {
  try {
    const payload = {
      title: form.value.title.trim(),
      tag: form.value.tag.trim() || '通用',
      content: form.value.content.trim()
    }
    if (editingId.value) {
      payload.id = editingId.value
    }
    notes.value = await window.electronAPI.saveQuickNote(payload)
    showModal.value = false
    emit('toast', editingId.value ? '已成功更新命令' : '已添加新命令')
  } catch (err) {
    alert('保存失败: ' + err.message)
  }
}

async function deleteNote(id) {
  if (confirm('确认删除这条常用命令吗？')) {
    notes.value = await window.electronAPI.deleteQuickNote(id)
    emit('toast', '已删除命令')
  }
}

// 打开外部物理存储目录
async function openNotesFolder() {
  try {
    const ws = await window.electronAPI.getWorkspacePath()
    if (ws) {
      await window.electronAPI.openExplorer(ws + '\\_quick_notes')
    }
  } catch (e) {}
}

// ==================== 批量导入解析器 ====================
function openBatchModal() {
  batchCategory.value = selectedCategory.value !== 'all' ? activeCategoryTitle.value : '发布脚本'
  batchRawText.value = ''
  showBatchModal.value = true
}

// 智能把代码文本按 # 说明切割为独立条目
const parsedBatchItems = computed(() => {
  const raw = batchRawText.value
  if (!raw || !raw.trim()) return []
  const lines = raw.split('\n')
  const items = []
  let currentTitle = ''
  let currentCommands = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    // 注释行视为标题
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      if (currentTitle || currentCommands.length > 0) {
        if (currentCommands.length > 0) {
          items.push({
            title: currentTitle || currentCommands[0] || '常用命令',
            tag: batchCategory.value || '发布脚本',
            content: currentCommands.join('\n')
          })
        }
        currentCommands = []
      }
      currentTitle = trimmed.replace(/^[#\/]+\s*/, '')
    } else {
      currentCommands.push(rawLine)
    }
  }

  if (currentTitle || currentCommands.length > 0) {
    if (currentCommands.length > 0) {
      items.push({
        title: currentTitle || currentCommands[0] || '常用命令',
        tag: batchCategory.value || '发布脚本',
        content: currentCommands.join('\n')
      })
    }
  }

  return items
})

// 填入用户截图 Image 2 里的同款发布脚本示例
function fillSampleDeploymentScript() {
  batchCategory.value = '发布脚本'
  batchRawText.value = `# 1.1 默认发布：发布指定日期的所有服务（会提示输入 yes 确认）
bash deploy-jars.sh 2026-09-10

# 1.2 单包发布：仅发布指定的一个或几个服务
bash deploy-jars.sh 2026-09-10 tsm-gateway.jar
bash deploy-jars.sh 2026-09-10 tsm-system.jar tsm-gateway.jar

# 1.3 自定义发布目录：发布到测试/其他目录（如 /data/tsm_uat）
bash deploy-jars.sh -d /data/tsm_uat 2026-09-10

# 1.4 自定义取包目录：从指定了目录取包（取包路径变为 /home/wsupport/2026-09-10/set1）
bash deploy-jars.sh -s set1 2026-09-10

# 1.5 绝对路径取包：直接从任意指定目录取包
bash deploy-jars.sh -s /tmp/new_jars 2026-09-10

# 1.6 组合发布：自定义发布目录 + 自定义取包子目录 + 指定单个 jar
bash deploy-jars.sh -d /data/tsm_uat -s set1 2026-09-10 tsm-gateway.jar

# 1.7 自动化/免交互：跳过输入 yes 直接执行（适合脚本调用）
bash deploy-jars.sh -y 2026-09-10

# 1.8 演练预览：只看发布计划和将要执行的命令，不做实际更改
bash deploy-jars.sh -n 2026-09-10

# 2.1 默认重启：重启默认目录（/usr/local/tsm_serve）下的所有服务
bash deploy-jars.sh restart
# 或使用短参数
bash deploy-jars.sh -r

# 2.2 单包重启：只重启某一个服务（如只重启网关）
bash deploy-jars.sh restart tsm-gateway.jar
bash deploy-jars.sh -r tsm-gateway.jar`
}

// 确认批量导入
async function confirmBatchImport() {
  if (parsedBatchItems.value.length === 0) return
  try {
    if (window.electronAPI.saveQuickNotesBatch) {
      notes.value = await window.electronAPI.saveQuickNotesBatch(parsedBatchItems.value)
    } else {
      // 降级兜底：逐条保存
      for (const item of parsedBatchItems.value) {
        notes.value = await window.electronAPI.saveQuickNote(item)
      }
    }
    showBatchModal.value = false
    selectedCategory.value = 'deploy'
    emit('toast', `成功批量导入 ${parsedBatchItems.value.length} 条发布命令！`)
  } catch (err) {
    alert('批量导入失败: ' + err.message)
  }
}
</script>
