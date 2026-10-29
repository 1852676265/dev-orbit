# DevOrbit 前端智能体开发规范与质量准则 (AGENTS.md)

本文件是本项目（DevOrbit：基于 Vue 3 + Vite + Tailwind CSS + Naive UI + Electron 的个人开发者工作台）专用的 AI Agent 行为准则与代码审查规范。所有参与代码生成的智能体必须严格遵守以下法则，严禁写出过程式流水账与难以维护的“代码垃圾”。

---

## 核心红线准则 (Zero-Tolerance Rules)

1. **严禁 Tailwind 样式灾难（反原子类堆砌）**：禁止在单个标签上堆积 4 个以上的非布局原子类，禁止写出数十个工具类组成的“样式泥潭”。
2. **严禁千行巨石组件（反流水账编程）**：单个 `.vue` 文件行数超过 **250 行**必须拆分子组件，超过 **400 行**视为严重违规。
3. **严禁在组件中手写裸 IPC/网络请求**：所有 Electron IPC 交互必须收拢在 `src/utils/api.js` 或专用 Service/Composable 中。
4. **统一 UI 库协同策略（Naive UI 优先）**：项目中已有 `naive-ui`，严禁用手写原生 `button`/`input`/`dialog` 配合 Tailwind 重新“造轮子”。
6. **严禁执行破坏性 Git 回滚**：严禁在未获用户显式授权的情况下执行任何销毁、重置或回滚工作区代码的命令（如 `git checkout -- .`、`git checkout -- <path>`、`git reset --hard` 等）。
7. **三振出局熔断机制**：任何工具（特别是 `edit`）连续失败 2 次，绝对禁止发起第 3 次重试！必须立即降级为 `read` 核查真实物理行、改用 `write` 整文件写入或向用户求助，严禁连续盲目重试。

---

## 一、样式与组件解耦规范 (告别 class 字符串堆砌)

### 1.1 样式分层与提取原则
- **Tailwind 仅用于宏观布局与间距**：允许使用 `flex`, `grid`, `items-center`, `gap-2`, `p-3`, `w-full` 等基础骨架工具类。
- **外观、色彩、交互态必须抽取**：
  - **方案 A（首选）**：封装可复用的微组件（如 `<SidebarItem>`、`<CommandCard>`、`<SettingCard>`）。
  - **方案 B**：利用 `<style scoped>` 编写语义化 Class，或通过 Tailwind `@apply` 收敛类名：
    ```vue
    <!-- ❌ 错误示范：恶劣的类名堆砌 -->
    <button class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
      <Folder class="w-4 h-4" />
      <span>工作区目录</span>
    </button>

    <!-- ✅ 正确示范：语义化 class 抽离 -->
    <button class="nav-tab-btn" :class="{ 'is-active': activeTab === 'workspace' }">
      <Folder class="tab-icon" />
      <span>工作区目录</span>
    </button>

    <style scoped>
    .nav-tab-btn {
      @apply flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left text-slate-400 border border-transparent;
    }
    .nav-tab-btn:hover {
      @apply text-slate-200 bg-slate-800/60;
    }
    .nav-tab-btn.is-active {
      @apply bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm font-semibold;
    }
    </style>
    ```
- **主题与状态颜色**：统一采用项目 CSS 变量或 Naive UI 主题覆盖，严禁在各处随意散落硬编码 HEX 颜色。

### 1.2 优先复用 Naive UI 组件
- 项目依赖包含 `naive-ui`，基础交互组件严禁手写 HTML 拟态：
  - 按钮 ➔ `<n-button>`
  - 输入框 ➔ `<n-input>`
  - 选择器 ➔ `<n-select>`
  - 弹窗/模态 ➔ `<n-modal>` / `useDialog()`
  - 气泡提示 ➔ `<n-tooltip>` / `<n-popover>`
  - 标签与微标 ➔ `<n-tag>` / `<n-badge>`
  - 消息与通知 ➔ `useMessage()` / `useNotification()`

---

## 二、Vue 3 现代化架构与特性规范 (告别过程式流水账)

### 2.1 强制目录与组件分层
- **视图组件（Views）**：只负责整体布局、骨架组装，代码必须控制在 150~200 行以内。
- **业务子组件（Feature Components）**：针对具体功能块独立拆分（例如：`SettingsModal.vue` 必须按 Tab 拆分为 `SettingsWorkspaceTab.vue`、`SettingsThemeTab.vue` 等）。
- **通用展示组件（Common Components）**：放入 `src/views/common/` 或 `src/components/`，具备通用性、自包含样式、无直接外部业务耦合。

### 2.2 逻辑抽离与 Composables (组合式函数)
- 任何超过 30 行的状态计算、事件联动、外部持久化，一律提取至 `src/composables/useXxx.js`。
- 遵循单一职责原则：
  - 任务状态流转 ➔ `useTaskState.js`
  - 快捷键监听 ➔ `useKeyboardShortcuts.js`
  - 命令与备忘数据 ➔ `useQuickNotes.js`
  - 服务器凭据解析 ➔ `useServerCredentials.js`
- 组件 `<script setup>` 仅保留：
  1. Composables 调用；
  2. UI 交互相关的局部轻量状态（如弹窗展开/关闭）；
  3. Props 和 Emits 定义。

### 2.3 必须善用 Vue 特性
1. **计算属性（Computed）**：
   - 过滤、统计、派生数据严禁在模板中写行内复杂 JS 表达式，严禁通过 watcher 去冗余赋值另一份独立状态，必须使用 `computed`。
2. **插槽（Slots）**：
   - 卡片、面板、对话框组件必须通过默认插槽 `<slot />` 与具名插槽（`#header`, `#action`, `#footer`）分发内容，杜绝使用巨大 props 传递渲染结构。
3. **内置动效与挂载控制**：
   - 动态视图切换使用 `<component :is="...">`；
   - 弹窗浮层必须使用 `<Teleport to="body">` 或 Naive UI 的 Modal；
   - 列表动态增删使用 `<TransitionGroup>`，状态淡入淡出使用 `<Transition>`。
4. **双向绑定契约**：
   - 父子组件值同步优先使用 `v-model:xxx`，子组件声明 `defineModel`（Vue 3.4+）或规范的 `update:xxx` 事件。

---

## 三、代码质量与严谨性红线 (想得更深的其他缺陷防范)

### 3.1 消除魔法值与硬编码 (Magic Values & Strings)
- **枚举常量化**：所有系统内置的 View 类型（`'tasks'`, `'notes'`, `'servers'`）、任务状态（`'active'`, `'suspended'`, `'archived'`）、Tab 名称、存储 Key 必须提取为常量文件（如 `src/constants/index.js`），严禁在代码多处直接比对裸字符串。

### 3.2 内存泄漏与副作用安全 (Electron & Lifecycle)
- **事件监听成对管理**：
  - 凡是使用了 `window.addEventListener('keydown', ...)`、`ipcRenderer.on(...)` 或定时器 `setInterval`，**必须**在 `onBeforeUnmount` / `onUnmounted` 中精准移除。
  - 推荐封装 `useEventListener` 通用 Hook 自动管理生命周期。

### 3.3 数据流管理与 Props 严格契约
- **声明明确**：`defineProps` 必须声明类型、默认值或必填项；`defineEmits` 必须显式声明触发的事件名及参数签名：
  ```javascript
  const props = defineProps({
    task: {
      type: Object,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  });

  const emit = defineEmits(['update:task', 'close']);
  ```
- **禁止深层 Props 钻取（Prop Drilling）**：超过 3 层的透传必须通过 `provide / inject` 或抽离轻量 Pinia / 模块化 Reactive Store 处理。

### 3.4 防御性编程与错误反馈
- 凡是涉及 IPC 调用、本地文件读写、JSON 解析、剪贴板读写等异步操作：
  1. 必须使用 `try...catch` 包裹；
  2. 出现错误必须调用统一的 Toast / Message 组件给出人类可读提示，并在控制台记录带有前缀的 `console.error('[Module] xxx failed:', err)`；
  3. 必须包含 Loading 状态反馈与防重复点击机制（防止用户狂点按钮导致进程竞争崩溃）。

---

## 四、Agent 代码生成与重构自检清单 (Pre-flight Checklist)

Agent 在每次写完代码或重构代码后，必须逐条对照自查，**如有违反必须立即自行修正**：

- [ ] **样式是否干净？** 是否消除了冗长丑陋的 Tailwind 内联串？是否利用 scoped CSS 抽出了语义化 Class？
- [ ] **组件是否单一职责？** 文件行数是否保持在 250 行以内？复杂视图是否已将 Tab/Card 拆解为子文件？
- [ ] **业务逻辑是否下沉？** `<script setup>` 中是否只剩 UI 胶水逻辑？数据拉取/过滤是否已进入 Composable？
- [ ] **UI 库是否协同？** 是不是又自己手写了 `input`/`button`/`modal`？有无充分利用 Naive UI 组件与主题？
- [ ] **资源是否清理？** 键盘监听、IPC 监听、轮询定时器是否均已在销毁钩子中清理完毕？
- [ ] **有无硬编码？** 状态判断、Tab 标志位是否引用了枚举常量？
不要几十行几十行地碎片化阅读代码了，请直接精准修改代码或一口气读完，单点闭环推进，改完一个打勾一个