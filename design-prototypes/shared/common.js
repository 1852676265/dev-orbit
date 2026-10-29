/* DevOrbit 全界面轻量原型引擎：所有真实按钮/筛选/子页面/弹窗均可点击切换 */
const DATA = {
  workspace: 'D:/DevWorkspaces',
  rootPwd: 'DevOrbit#2026',
  svnDoc: '研发中心服务器与环境台账_v4.docx',
  years: ['2026', '2025'],
  tasks: [
    {
      id: 1, title: '工单流转模块重构', project: 'MZ', year: '2026', status: 'in-progress', updated: '2026-10-28 14:20',
      path: 'D:/DevWorkspaces/2026/工单流转模块重构',
      params: [
        { k: '接口Endpoint', v: '/api/v2/order/flow' },
        { k: '测试Token', v: 'eyJhbGciOiJIUzI1NiIs9f2a' },
        { k: 'AppSecret', v: 'mz_sec_8848a91c' },
        { k: '联调主机', v: '192.168.1.21:8080' }
      ],
      notes: [
        { id: 11, cat: '接口地址', title: '工单状态流转核心接口', pinned: true, body: 'POST /api/v2/order/flow\nHeader: Authorization: Bearer eyJhbGciOiJIUzI1NiIs9f2a\n入参: { "orderId": 10024, "targetState": "APPROVED" }' },
        { id: 12, cat: '配置参数', title: '达梦 DM8 分页与分布式锁配置', pinned: false, body: 'spring.datasource.dm.schema=MZ_PROD\nredis.lock.prefix=mz:order:lock:' }
      ],
      sqls: [
        { name: '01_alter_order_table.sql', size: '2.4 KB', prod: false },
        { name: '02_init_flow_dict.sql', size: '1.8 KB', prod: false },
        { name: '03_add_union_index.sql', size: '0.9 KB', prod: true }
      ],
      docs: [
        { name: '需求.md', size: '4.2 KB', type: 'md' },
        { name: '笔记.md', size: '3.1 KB', type: 'md' },
        { name: '工单流转总体方案评审.docx', size: '128.5 KB', type: 'word' },
        { name: '字段映射对照表.xlsx', size: '42.0 KB', type: 'excel' }
      ]
    },
    {
      id: 2, title: '财务对账单批量导出优化', project: '财务系统', year: '2026', status: 'in-progress', updated: '2026-10-25 17:05',
      path: 'D:/DevWorkspaces/2026/财务对账单批量导出优化',
      params: [
        { k: '导出Endpoint', v: 'http://10.0.3.8:9001/recon/export' },
        { k: '批次大小', v: 'batchSize=2000' }
      ],
      notes: [{ id: 21, cat: '联调日志', title: '大文件流式导出压测记录', pinned: true, body: '单次 10w 条耗时 4.2s，内存占用稳定在 350MB。' }],
      sqls: [
        { name: '01_create_recon_view.sql', size: '3.1 KB', prod: false },
        { name: '02_grant_select.sql', size: '0.5 KB', prod: false }
      ],
      docs: [{ name: '需求.md', size: '2.8 KB', type: 'md' }, { name: '对账口径说明.docx', size: '64.0 KB', type: 'word' }]
    },
    {
      id: 3, title: '移动端统一消息推送接入', project: '移动端', year: '2026', status: 'suspended', updated: '2026-10-12 09:40',
      path: 'D:/DevWorkspaces/2026/移动端统一消息推送接入',
      params: [{ k: 'PushAppId', v: 'hw_push_99201' }],
      notes: [{ id: 31, cat: '账号凭证', title: '各厂商推送通道申请进度', pinned: false, body: '华为/小米通道已下发，vivo 通道待商务盖章。' }],
      sqls: [{ name: '01_device_push_token.sql', size: '1.5 KB', prod: false }],
      docs: [{ name: '需求.md', size: '1.9 KB', type: 'md' }]
    },
    {
      id: 4, title: '2025 年终报表归档迁移', project: '财务系统', year: '2025', status: 'archived', updated: '2025-12-28 19:00',
      path: 'D:/DevWorkspaces/2025/2025年终报表归档迁移',
      params: [], notes: [],
      sqls: [{ name: '01_archive_2025.sql', size: '5.6 KB', prod: true }],
      docs: [{ name: '需求.md', size: '1.2 KB', type: 'md' }]
    }
  ],
  commands: [
    { cat: 'Docker', title: '查看容器实时日志', pinned: true, cmd: 'docker logs -f --tail 200 mz-order-service' },
    { cat: 'Docker', title: '清理虚悬镜像释放磁盘', pinned: false, cmd: 'docker image prune -f' },
    { cat: 'Git / SVN', title: '撤销最近一次 commit 保留改动', pinned: true, cmd: 'git reset --soft HEAD~1' },
    { cat: 'Linux', title: '排查端口被哪个进程占用', pinned: false, cmd: 'netstat -tunlp | grep 8080' },
    { cat: '达梦 DM8', title: '查看表空间使用率', pinned: false, cmd: 'SELECT tablespace_name, file_name, bytes/1024/1024 MB FROM dba_data_files;' }
  ],
  memos: [
    { color: 'amber', time: '10-28 11:20', text: '周五发版前务必提醒 DBA 先执行 MZ 项目的 01_alter_order_table.sql' },
    { color: 'teal', time: '10-26 16:05', text: '测试环境 Nginx 泛域名证书 11 月 15 日到期，需提前续签' },
    { color: 'default', time: '10-24 09:30', text: '财务导出接口已找前端确认：超 5w 行自动转后台异步任务中心下载' }
  ],
  servers: [
    { name: 'MZ 测试应用机-01', target: '192.168.1.21', port: '22', user: 'root', inherit: true, pwd: '', cat: '服务器账号', env: 'TEST' },
    { name: '财务预发布节点', target: '192.168.1.35', port: '22', user: 'deploy', inherit: false, pwd: 'Fin@Uat2026', cat: '服务器账号', env: 'UAT' },
    { name: '研发内网 Nacos 控制台', target: 'http://192.168.1.10:8848/nacos', port: '', user: 'nacos', inherit: false, pwd: 'nacos_dev', cat: 'Web网站', env: 'DEV' },
    { name: '总部 VPN 深信服网关', target: 'https://vpn.corp.com', port: '443', user: 'lisb', inherit: false, pwd: 'Vpn#8821', cat: 'iNode', env: 'PROD' }
  ]
};

/* 全局共享 UI 状态 */
const UI = {
  view: 'tasks',        // 'tasks' | 'notes' | 'servers'
  year: 'all',
  project: 'all',
  onlyPending: false,
  q: '',
  taskId: 1,
  wsTab: 'notes',       // 'notes' | 'sqls' | 'docs'
  paramWrap: true,
  noteCat: 'all',
  noteMode: 'cards',    // 'cards' | 'raw'
  notesSub: 'commands', // 'commands' | 'memos'
  cmdView: 'grid',      // 'grid' | 'list'
  cmdCat: 'all',
  srvMode: 'daily',     // 'daily' | 'excerpt'
  srvCat: 'all',
  showRootPwd: false,
  draft: { cat: '服务器账号', name: '', target: '', user: 'root', pwd: '' }
};

const STATUS_MAP = { 'in-progress': '进行中', suspended: '挂起延期', archived: '已上线归档' };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const taskPending = (t) => t.sqls.filter((s) => !s.prod).length;
const totalPending = () => DATA.tasks.reduce((n, t) => n + taskPending(t), 0);
const currentTask = () => DATA.tasks.find((t) => t.id === UI.taskId) || DATA.tasks[0];

function filteredTasks() {
  return DATA.tasks.filter((t) => {
    if (UI.year !== 'all' && t.year !== UI.year) return false;
    if (UI.project !== 'all' && t.project !== UI.project) return false;
    if (UI.onlyPending && taskPending(t) === 0) return false;
    if (UI.q && !(t.title + t.project + t.year).toLowerCase().includes(UI.q.toLowerCase())) return false;
    return true;
  });
}

function toast(msg) {
  let el = $('#_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '_toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1500);
}

function openModal(title, bodyHtml, footHtml = '<button class="btn primary" data-close-modal>关闭</button>') {
  let mask = $('#_modal');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = '_modal'; mask.className = 'modal-mask';
    document.body.appendChild(mask);
  }
  mask.innerHTML = `<div class="modal"><div class="modal-head"><span>${title}</span><button class="btn ghost xs" data-close-modal>✕</button></div><div class="modal-body">${bodyHtml}</div><div class="modal-foot">${footHtml}</div></div>`;
  mask.classList.add('open');
}

/* ================= 1. 任务侧栏渲染 ================= */
function renderTaskSidebar() {
  const projs = [...new Set(DATA.tasks.map((t) => t.project))];
  const list = filteredTasks();
  return `
    <div class="filter-box">
      <div class="row">
        <select class="select" style="flex:1" data-bind="year">
          <option value="all" ${UI.year === 'all' ? 'selected' : ''}>全部年份资产</option>
          ${DATA.years.map((y) => `<option value="${y}" ${UI.year === y ? 'selected' : ''}>${y} 年度任务</option>`).join('')}
        </select>
        <button class="btn ${UI.onlyPending ? 'warn' : ''}" data-act="toggle-pending">⚡ 待发 SQL</button>
      </div>
      <div class="row">
        <select class="select" style="flex:1" data-bind="project">
          <option value="all" ${UI.project === 'all' ? 'selected' : ''}>全部所属项目</option>
          ${projs.map((p) => `<option value="${p}" ${UI.project === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <button class="btn ghost" title="重置全部筛选" data-act="reset-filter">↺</button>
      </div>
      <div class="filter-stats">
        <span>已匹配: <b>${list.length}</b> / ${DATA.tasks.length} 个任务</span>
        <span>↑↓ 切换 · 右键菜单</span>
      </div>
    </div>
    <div class="t-list scroll" style="flex:1">
      ${list.map((t) => `
        <div class="t-item ${t.id === UI.taskId ? 'active' : ''}" data-select-task="${t.id}">
          <div style="min-width:0">
            <div class="meta">
              <span class="dot ${t.status}"></span>
              <span class="tag">${t.year}</span>
              <span class="tag accent">${esc(t.project)}</span>
              <span>${t.updated.slice(5, 10)}</span>
            </div>
            <div class="title">${esc(t.title)}</div>
          </div>
          ${taskPending(t) ? `<span class="tag warn">${taskPending(t)} 待发</span>` : `<span class="tag ok">${t.sqls.length} SQL</span>`}
        </div>`).join('') || '<div class="empty">当前筛选无任务</div>'}
    </div>`;
}

/* ================= 2. 任务详情主舱（含 3 个完整 Tab） ================= */
function renderTaskWorkspace(t = currentTask()) {
  if (!t) return '<div class="empty">请选择任务</div>';
  const pend = taskPending(t);
  return `
    <div class="t-head">
      <div>
        <div class="row">
          <span class="tag">${t.year} 年</span>
          <span class="tag accent">${esc(t.project)}</span>
          <span class="tag ${t.status === 'in-progress' ? 'ok' : 'warn'}">${STATUS_MAP[t.status]}</span>
          <span class="muted" style="font-size:11px">更新于: ${t.updated}</span>
        </div>
        <h1>${esc(t.title)}</h1>
        <div class="t-path mono">📁 ${esc(t.path)}</div>
      </div>
      <div class="row">
        <button class="btn" data-toast="已在 VS Code 中打开任务目录">在 IDE 打开</button>
        <button class="btn primary" data-toast="已打开系统资源管理器">打开资源管理器</button>
        <button class="btn ghost" data-copy="${esc(t.path)}">复制路径</button>
      </div>
    </div>
    <div class="ws-tabs">
      <div>
        <button class="ws-tab ${UI.wsTab === 'notes' ? 'active' : ''}" data-ws-tab="notes">📝 开发备忘与联调参数 <span class="tag">${t.notes.length}</span></button>
        <button class="ws-tab ${UI.wsTab === 'sqls' ? 'active' : ''}" data-ws-tab="sqls">🗄️ 上线 SQL 资产 <span class="tag ${pend ? 'warn' : 'ok'}">${pend ? pend + ' 待发' : t.sqls.length}</span></button>
        <button class="ws-tab ${UI.wsTab === 'docs' ? 'active' : ''}" data-ws-tab="docs">📂 交付与需求文档 <span class="tag">${t.docs.length}</span></button>
      </div>
      <span class="muted" style="font-size:11px">● 已自动保存并同步 task.json</span>
    </div>
    <div class="ws-body">${renderTaskTabBody(t)}</div>`;
}

function renderTaskTabBody(t) {
  if (UI.wsTab === 'notes') {
    const cats = ['all', '配置参数', '接口地址', '联调日志', '账号凭证'];
    const notes = t.notes.filter((n) => UI.noteCat === 'all' || n.cat === UI.noteCat);
    return `
      <div class="smart-bar">
        <div class="between">
          <div class="row"><span class="tag accent">✨ 速拷核心参数 (${t.params.length})</span><span class="muted" style="font-size:11px">自动从备忘文本正则嗅探 Endpoint / Token / IP</span></div>
          <div class="row">
            <button class="btn xs ghost" data-act="toggle-param-wrap">${UI.paramWrap ? '切换单行' : '切换平铺'}</button>
            <button class="btn xs" data-copy="${esc(t.params.map((p) => p.k + ': ' + p.v).join('\n'))}">一键复制全部 YAML</button>
          </div>
        </div>
        <div class="pills ${UI.paramWrap ? 'wrap' : ''}">
          ${t.params.map((p) => `<span class="pill mono" data-copy="${esc(p.v)}"><b>${esc(p.k)}:</b><code>${esc(p.v)}</code><span>📋</span></span>`).join('') || '<span class="muted">暂无提取参数</span>'}
        </div>
      </div>
      <div class="between" style="margin-bottom:10px">
        <div class="row">
          ${cats.map((c) => `<button class="btn xs ${UI.noteCat === c ? 'active' : 'ghost'}" data-note-cat="${c}">${c === 'all' ? '全部 (' + t.notes.length + ')' : c}</button>`).join('')}
        </div>
        <div class="row">
          <input class="input" placeholder="搜索备忘内容…" style="width:150px">
          <div class="seg">
            <button class="${UI.noteMode === 'cards' ? 'active' : ''}" data-note-mode="cards">卡片流</button>
            <button class="${UI.noteMode === 'raw' ? 'active' : ''}" data-note-mode="raw">Markdown 源码</button>
          </div>
          <button class="btn primary" data-act="modal-new-note">+ 新建备忘</button>
        </div>
      </div>
      ${UI.noteMode === 'raw'
        ? `<textarea class="input" rows="11"># ${esc(t.title)} - 开发备忘与接口联调参数\n\n${t.notes.map((n) => `### [${n.cat}] ${n.title}\n${n.body}`).join('\n\n---\n\n')}</textarea>`
        : notes.map((n) => `
          <div class="ncard">
            <div class="between">
              <div class="row">${n.pinned ? '<span class="tag warn">置顶</span>' : ''}<span class="tag accent">${esc(n.cat)}</span><b>${esc(n.title)}</b></div>
              <div class="row">
                <button class="btn xs ghost" data-toast="已切换置顶">📌</button>
                <button class="btn xs ghost" data-act="preview-file" data-title="${esc(n.title)}" data-body="${esc(n.body)}">✏️ 编辑</button>
                <button class="btn xs ghost" data-copy="${esc(n.body)}">📋 复制</button>
                <button class="btn xs ghost" data-toast="已删除备忘">🗑️</button>
              </div>
            </div>
            <pre class="mono">${esc(n.body)}</pre>
          </div>`).join('')}`;
  }
  if (UI.wsTab === 'sqls') {
    const pend = taskPending(t);
    return `
      <div class="between" style="margin-bottom:12px">
        <div class="row"><b>上线 SQL 脚本资产 (${t.sqls.length})</b><span class="tag ${pend ? 'warn' : 'ok'}">${pend ? pend + ' 份待发产线' : '全部已发产线'}</span></div>
        <div class="row">
          <button class="btn primary" data-act="modal-sql-merge">✨ 一键合并上线 SQL (00_merged_all.sql)</button>
          <button class="btn" data-act="modal-new-sql">+ 新建 SQL</button>
        </div>
      </div>
      ${t.sqls.map((s, i) => `
        <div class="sql-row">
          <div class="row"><span class="mono" style="font-weight:600">🗄️ ${esc(s.name)}</span><span class="muted">(${s.size})</span></div>
          <div class="row">
            <button class="btn xs ${s.prod ? 'ok' : 'warn'}" data-toggle-sql="${i}" data-task="${t.id}">产线: ${s.prod ? '已发 ✓' : '待发'}</button>
            <button class="btn xs ghost" data-act="preview-file" data-title="${esc(s.name)}" data-body="-- 脚本: ${esc(s.name)}\nALTER TABLE mz_order ADD COLUMN flow_state VARCHAR(32) DEFAULT 'INIT';\nCOMMIT;">👁 预览</button>
            <button class="btn xs ghost" data-act="preview-file" data-title="编辑 ${esc(s.name)}" data-body="-- 脚本: ${esc(s.name)}\nALTER TABLE mz_order ADD COLUMN flow_state VARCHAR(32);">✏️ 编辑</button>
            <button class="btn xs ghost" data-toast="已在资源管理器中定位">📂</button>
            <button class="btn xs ghost" data-copy="${esc(t.path + '/sql/' + s.name)}">📋</button>
            <button class="btn xs ghost" data-toast="已移入 Windows 回收站">🗑️</button>
          </div>
        </div>`).join('')}`;
  }
  return `
    <div class="between" style="margin-bottom:12px">
      <b>需求与交付文档资产 (${t.docs.length})</b>
      <span class="muted" style="font-size:11px">支持拖拽外部文件直接拷入 · 单击软件内预览 · 专用按钮唤醒本机 Word/Excel</span>
    </div>
    <div class="doc-grid">
      ${t.docs.map((d) => `
        <div class="doc-card">
          <div class="row">
            <span>${d.type === 'word' ? '📘' : d.type === 'excel' ? '📗' : '📄'}</span>
            <div><div style="font-weight:600">${esc(d.name)}</div><div class="muted" style="font-size:11px">${d.size}</div></div>
          </div>
          <div class="row">
            ${d.type === 'word' ? `<button class="btn xs primary" data-toast="正在调用 Microsoft Word 打开 ${esc(d.name)}">Word打开</button>` : ''}
            ${d.type === 'excel' ? `<button class="btn xs ok" data-toast="正在调用 Microsoft Excel 打开 ${esc(d.name)}">Excel打开</button>` : ''}
            ${d.type === 'md' ? `<button class="btn xs" data-act="preview-file" data-title="${esc(d.name)}" data-body="# ${esc(t.title)} - ${esc(d.name)}\n\n1. 核心业务目标\n2. 联调与验收标准">内建预览</button>` : ''}
            <button class="btn xs ghost" data-toast="已在资源管理器中定位">📂</button>
            <button class="btn xs ghost" data-toast="已移入回收站">🗑️</button>
          </div>
        </div>`).join('')}
    </div>`;
}

/* ================= 3. 随手记 & 常用命令军火库 ================= */
function renderNotesView() {
  const cats = [...new Set(DATA.commands.map((c) => c.cat))];
  const cmds = DATA.commands.filter((c) => UI.cmdCat === 'all' ? true : UI.cmdCat === 'pinned' ? c.pinned : c.cat === UI.cmdCat);
  return `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="between" style="padding:10px 18px;border-bottom:1px solid var(--line);background:var(--card)">
        <div class="seg">
          <button class="${UI.notesSub === 'commands' ? 'active' : ''}" data-notes-sub="commands">💻 常用命令军火库 (${DATA.commands.length})</button>
          <button class="${UI.notesSub === 'memos' ? 'active' : ''}" data-notes-sub="memos">📌 极速随手记 / 备忘录 (${DATA.memos.length})</button>
        </div>
        <div class="row">
          ${UI.notesSub === 'commands' ? `
            <div class="seg">
              <button class="${UI.cmdView === 'grid' ? 'active' : ''}" data-cmd-view="grid">卡片</button>
              <button class="${UI.cmdView === 'list' ? 'active' : ''}" data-cmd-view="list">清单</button>
            </div>
            <button class="btn" data-act="modal-txt-import">📄 TXT 批量导入</button>
            <button class="btn primary" data-act="modal-new-cmd">+ 新增命令</button>
          ` : `<button class="btn primary" data-toast="已聚焦便签输入框">+ 记一笔</button>`}
        </div>
      </div>
      ${UI.notesSub === 'commands' ? `
        <div class="cmd-wrap" style="flex:1">
          <aside class="cmd-side">
            <div class="between" style="padding:4px 6px;font-size:11px;color:var(--muted)"><span>命令分类</span><button class="btn xs ghost" data-toast="新建命令分类">+ 新建</button></div>
            <button class="cat-item ${UI.cmdCat === 'all' ? 'active' : ''}" data-cmd-cat="all"><span>全部命令</span><span class="mono">${DATA.commands.length}</span></button>
            <button class="cat-item ${UI.cmdCat === 'pinned' ? 'active' : ''}" data-cmd-cat="pinned"><span>📌 常用置顶</span><span class="mono">${DATA.commands.filter((c) => c.pinned).length}</span></button>
            <div class="muted" style="padding:8px 6px 2px;font-size:10px">业务分组</div>
            ${cats.map((c) => `<button class="cat-item ${UI.cmdCat === c ? 'active' : ''}" data-cmd-cat="${c}"><span>${esc(c)}</span><span class="mono">${DATA.commands.filter((x) => x.cat === c).length}</span></button>`).join('')}
          </aside>
          <div class="scroll" style="padding:14px 18px">
            <div class="between" style="margin-bottom:12px">
              <input class="input" placeholder="检索命令说明、参数、微服务名 (按 / 聚焦)…" style="width:320px">
              <span class="muted">当前分类: <b>${UI.cmdCat}</b> (${cmds.length} 条)</span>
            </div>
            <div class="${UI.cmdView === 'grid' ? 'cmd-grid' : ''}">
              ${cmds.map((c) => `
                <div class="cmd-card" style="${UI.cmdView === 'list' ? 'margin-bottom:8px' : ''}">
                  <div class="between">
                    <div class="row"><span class="tag accent">${esc(c.cat)}</span><b>${esc(c.title)}</b></div>
                    <div class="row"><button class="btn xs" data-copy="${esc(c.cmd)}">📋 复制</button><button class="btn xs ghost" data-toast="编辑命令">✏️</button></div>
                  </div>
                  <pre class="mono" data-copy="${esc(c.cmd)}">${esc(c.cmd)}</pre>
                </div>`).join('')}
            </div>
          </div>
        </div>
      ` : `
        <div class="scroll" style="padding:16px 20px;flex:1">
          <div class="row" style="margin-bottom:12px">
            <input class="input" id="_memo_inp" placeholder="随手记下一笔临时备忘、发版提醒、待办事项，回车即存…" style="flex:1">
            <button class="btn primary" data-act="add-memo">保存便签</button>
          </div>
          <div class="memo-grid">
            ${DATA.memos.map((m) => `
              <div class="memo-box ${m.color}">
                <div style="margin-bottom:8px;line-height:1.6">${esc(m.text)}</div>
                <div class="between muted" style="font-size:11px"><span>${m.time}</span><button class="btn xs ghost" data-copy="${esc(m.text)}">复制</button></div>
              </div>`).join('')}
          </div>
        </div>
      `}
    </div>`;
}

/* ================= 4. 服务器矩阵与 Word 原档摘录台 ================= */
function renderServersView() {
  const cats = ['all', '服务器账号', 'Web网站', 'iNode'];
  const list = DATA.servers.filter((s) => UI.srvCat === 'all' || s.cat === UI.srvCat);
  return `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="between" style="padding:10px 18px;border-bottom:1px solid var(--line);background:var(--card)">
        <div class="row" style="gap:10px">
          <b>${UI.srvMode === 'daily' ? '日常凭据精简账本' : 'Word 原档交互摘录工作台'}</b>
          <span class="tag">${DATA.servers.length} 项精选</span>
          <div class="row" style="padding:3px 9px;background:var(--soft);border:1px solid var(--line);border-radius:var(--radius)">
            <span class="muted">👑 通用Root口令:</span>
            <code class="mono" style="font-weight:600">${UI.showRootPwd ? DATA.rootPwd : '••••••••••••'}</code>
            <button class="btn xs ghost" data-act="toggle-root-pwd">${UI.showRootPwd ? '🙈' : '👁'}</button>
            <button class="btn xs" data-copy="${esc(DATA.rootPwd)}">秒拷</button>
          </div>
        </div>
        <div class="row">
          <div class="row" style="padding:3px 8px;background:var(--soft);border-radius:var(--radius)">
            <span class="mono muted" style="font-size:11px">📘 ${DATA.svnDoc}</span>
            <button class="btn xs accent" data-toast="已拉取最新 SVN Word 文档并自动同步标蓝密码">🔄 SVN同步新密码</button>
          </div>
          <button class="btn ${UI.srvMode === 'excerpt' ? 'active' : ''}" data-act="toggle-srv-mode">
            ${UI.srvMode === 'daily' ? '📖 去 Word 文档摘录' : '← 返回日常极简账本'}
          </button>
          <button class="btn primary" data-act="modal-new-srv">+ 手动新建</button>
        </div>
      </div>
      ${UI.srvMode === 'daily' ? `
        <div class="between" style="padding:10px 18px;border-bottom:1px solid var(--line)">
          <div class="row">
            ${cats.map((c) => `<button class="btn xs ${UI.srvCat === c ? 'active' : ''}" data-srv-cat="${c}">${c === 'all' ? '全部精选 (' + DATA.servers.length + ')' : c}</button>`).join('')}
            <button class="btn xs ghost" data-toast="新建自定义凭据分类">+ 新建分类</button>
          </div>
          <input class="input" placeholder="搜索精选名称、IP、URL… (按 / 聚焦)" style="width:240px">
        </div>
        <div class="scroll" style="padding:14px 18px;flex:1">
          <table class="tbl">
            <thead><tr><th>类别</th><th>名称 / 用途</th><th>目标地址 (IP / URL)</th><th>账号</th><th>口令 (支持继承Root)</th><th>环境</th><th>快捷操作</th></tr></thead>
            <tbody>
              ${list.map((s) => `
                <tr>
                  <td><span class="tag">${esc(s.cat)}</span></td>
                  <td style="font-weight:600">${esc(s.name)}</td>
                  <td class="mono" style="cursor:pointer" data-copy="${esc(s.target)}">${esc(s.target)}${s.port ? ':' + s.port : ''}</td>
                  <td class="mono">${esc(s.user)}</td>
                  <td>${s.inherit ? '<span class="tag accent">👑 继承全局Root</span>' : `<code class="mono">${esc(s.pwd)}</code>`}</td>
                  <td><span class="tag">${s.env}</span></td>
                  <td>
                    <div class="row">
                      <button class="btn xs" data-copy="${esc(s.target)}">复制地址</button>
                      <button class="btn xs" data-copy="${esc(s.inherit ? DATA.rootPwd : s.pwd)}">复制密码</button>
                      ${s.cat === '服务器账号' ? `<button class="btn xs" data-copy="ssh ${esc(s.user)}@${esc(s.target)} -p ${s.port || 22}">复制SSH</button>` : `<button class="btn xs" data-toast="已在浏览器打开 ${esc(s.target)}">打开网页 ↗</button>`}
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : renderWordBench('padding:14px 18px;flex:1')}
    </div>`;
}

/* Word 原档交互摘录台（左：原位解析文档 / 右：摘录草稿箱），供各原型自由摆放 */
function renderWordBench(style = '') {
  return `
        <div class="bench" style="${style}">
          <div class="bench-pane">
            <div class="between" style="margin-bottom:10px">
              <b>📘 原位解析文档流：${DATA.svnDoc}</b>
              <span class="muted" style="font-size:11px">点击任意表格单元格或蓝字，右侧即刻拾取入账</span>
            </div>
            <p class="muted" style="margin-bottom:8px">一、 MZ 核心业务集群（2026年10月 SVN 修订，蓝字为本月轮换新密码）</p>
            <table class="tbl" style="margin-bottom:14px">
              <thead><tr><th>系统模块</th><th>主机 IP</th><th>账号</th><th>最新口令 (点蓝字直接拾取)</th></tr></thead>
              <tbody>
                <tr>
                  <td class="w-cell" data-pick-name="MZ 生产主库节点">MZ 生产主库节点</td>
                  <td class="w-cell mono" data-pick-target="10.10.8.101">10.10.8.101</td>
                  <td class="w-cell mono" data-pick-user="root">root</td>
                  <td><span class="w-blue mono" data-pick-pwd="MzProd#2026!Blue">MzProd#2026!Blue (🔵标蓝新密码)</span></td>
                </tr>
                <tr>
                  <td class="w-cell" data-pick-name="财务电子发票前置机">财务电子发票前置机</td>
                  <td class="w-cell mono" data-pick-target="10.10.8.205">10.10.8.205</td>
                  <td class="w-cell mono" data-pick-user="taxadmin">taxadmin</td>
                  <td><span class="w-blue mono" data-pick-pwd="Tax@Inv9981">Tax@Inv9981 (🔵标蓝新密码)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="bench-pane">
            <b style="display:block;margin-bottom:10px">📥 交互式摘录草稿箱（点左侧表格即填入）</b>
            <div class="row" style="margin-bottom:8px"><span class="muted" style="width:70px">归属分类:</span><span class="tag accent">${UI.draft.cat}</span></div>
            <div class="row" style="margin-bottom:8px"><span class="muted" style="width:70px">资产名称:</span><input class="input" style="flex:1" id="_d_name" value="${esc(UI.draft.name)}" placeholder="点击左侧单元格填入…"></div>
            <div class="row" style="margin-bottom:8px"><span class="muted" style="width:70px">IP / URL:</span><input class="input mono" style="flex:1" id="_d_target" value="${esc(UI.draft.target)}" placeholder="10.x.x.x 或 https://"></div>
            <div class="row" style="margin-bottom:8px"><span class="muted" style="width:70px">登录账号:</span><input class="input mono" style="flex:1" id="_d_user" value="${esc(UI.draft.user)}"></div>
            <div class="row" style="margin-bottom:12px"><span class="muted" style="width:70px">登录密码:</span><input class="input mono" style="flex:1" id="_d_pwd" value="${esc(UI.draft.pwd)}" placeholder="留空则默认继承全局Root口令"></div>
            <button class="btn primary" style="width:100%;justify-content:center" data-act="save-draft">✓ 确认摘录并关联蓝色锚点（下次SVN自动同步密码）</button>
          </div>
        </div>`;
}

/* ================= 5. 全局点击与快捷键事件代理 ================= */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-view],[data-select-task],[data-ws-tab],[data-note-cat],[data-note-mode],[data-notes-sub],[data-cmd-view],[data-cmd-cat],[data-srv-cat],[data-toggle-sql],[data-copy],[data-toast],[data-act],[data-close-modal],[data-pick-name],[data-pick-target],[data-pick-user],[data-pick-pwd]');
  if (!el) return;

  if (el.hasAttribute('data-close-modal')) { $('#_modal')?.classList.remove('open'); return; }
  if (el.dataset.view) { UI.view = el.dataset.view; return window.renderApp?.(); }
  if (el.dataset.selectTask) { UI.taskId = +el.dataset.selectTask; return window.renderApp?.(); }
  if (el.dataset.wsTab) { UI.wsTab = el.dataset.wsTab; return window.renderApp?.(); }
  if (el.dataset.noteCat) { UI.noteCat = el.dataset.noteCat; return window.renderApp?.(); }
  if (el.dataset.noteMode) { UI.noteMode = el.dataset.noteMode; return window.renderApp?.(); }
  if (el.dataset.notesSub) { UI.notesSub = el.dataset.notesSub; return window.renderApp?.(); }
  if (el.dataset.cmdView) { UI.cmdView = el.dataset.cmdView; return window.renderApp?.(); }
  if (el.dataset.cmdCat) { UI.cmdCat = el.dataset.cmdCat; return window.renderApp?.(); }
  if (el.dataset.srvCat) { UI.srvCat = el.dataset.srvCat; return window.renderApp?.(); }

  if (el.dataset.toggleSql !== undefined) {
    const t = DATA.tasks.find((x) => x.id == el.dataset.task) || currentTask();
    const s = t.sqls[+el.dataset.toggleSql];
    s.prod = !s.prod;
    toast(`${s.name} 已标记为【${s.prod ? '产线已发' : '待发产线'}】`);
    return window.renderApp?.();
  }
  if (el.dataset.copy) {
    navigator.clipboard?.writeText(el.dataset.copy).catch(() => {});
    return toast('已复制到剪贴板: ' + el.dataset.copy.slice(0, 36));
  }
  if (el.dataset.toast) return toast(el.dataset.toast);

  if (el.dataset.pickName) { UI.draft.name = el.dataset.pickName; toast('已拾取名称'); return window.renderApp?.(); }
  if (el.dataset.pickTarget) { UI.draft.target = el.dataset.pickTarget; toast('已拾取地址'); return window.renderApp?.(); }
  if (el.dataset.pickUser) { UI.draft.user = el.dataset.pickUser; toast('已拾取账号'); return window.renderApp?.(); }
  if (el.dataset.pickPwd) { UI.draft.pwd = el.dataset.pickPwd; toast('已拾取标蓝新密码'); return window.renderApp?.(); }

  const act = el.dataset.act;
  if (act === 'toggle-pending') { UI.onlyPending = !UI.onlyPending; return window.renderApp?.(); }
  if (act === 'reset-filter') { UI.year = 'all'; UI.project = 'all'; UI.onlyPending = false; UI.q = ''; return window.renderApp?.(); }
  if (act === 'toggle-param-wrap') { UI.paramWrap = !UI.paramWrap; return window.renderApp?.(); }
  if (act === 'toggle-root-pwd') { UI.showRootPwd = !UI.showRootPwd; return window.renderApp?.(); }
  if (act === 'toggle-srv-mode') { UI.srvMode = UI.srvMode === 'daily' ? 'excerpt' : 'daily'; return window.renderApp?.(); }
  if (act === 'toggle-zen') { document.body.classList.toggle('zen'); return; }
  if (act === 'add-memo') {
    const v = $('#_memo_inp')?.value?.trim();
    if (v) { DATA.memos.unshift({ color: 'amber', time: '刚刚', text: v }); toast('便签已保存'); window.renderApp?.(); }
    return;
  }
  if (act === 'save-draft') {
    DATA.servers.unshift({ name: UI.draft.name || '新摘录节点', target: UI.draft.target || '10.10.8.101', port: '22', user: UI.draft.user, inherit: !UI.draft.pwd, pwd: UI.draft.pwd, cat: '服务器账号', env: 'PROD' });
    UI.srvMode = 'daily';
    toast('已加入日常凭据账本');
    return window.renderApp?.();
  }
  if (act === 'preview-file') {
    return openModal(`内置编辑器 · ${esc(el.dataset.title)}`, `<textarea class="input" rows="10">${esc(el.dataset.body)}</textarea>`, `<button class="btn" data-close-modal>取消</button><button class="btn primary" data-close-modal data-toast="文件已保存">保存修改 (Ctrl+S)</button>`);
  }
  if (act === 'modal-sql-merge') {
    const t = currentTask();
    const merged = t.sqls.map((s) => `-- ======== ${s.name} ========\nALTER TABLE ...;\n`).join('\n');
    return openModal(`✨ 一键按序合并 SQL · ${esc(t.title)}`, `<p class="muted" style="margin-bottom:8px">支持拖拽调整执行顺序，自动包裹事务并生成 00_merged_all.sql：</p><textarea class="input" rows="9">${esc(merged)}</textarea>`, `<button class="btn" data-copy="${esc(merged)}">复制合并内容</button><button class="btn primary" data-close-modal data-toast="已生成 sql/00_merged_all.sql">生成并保存 00_merged_all.sql</button>`);
  }
  if (act === 'modal-new-task') {
    return openModal('新建开发任务脚手架', `<div class="row" style="margin-bottom:8px"><span style="width:70px">归属年份:</span><input class="input" value="2026"></div><div class="row" style="margin-bottom:8px"><span style="width:70px">所属项目:</span><input class="input" value="MZ"></div><div class="row"><span style="width:70px">任务名称:</span><input class="input" style="flex:1" placeholder="输入需求名称，自动创建 docs / sql / attachments"></div>`, `<button class="btn" data-close-modal>取消</button><button class="btn primary" data-close-modal data-toast="已创建任务文件夹及标准脚手架">立即创建</button>`);
  }
  if (act === 'modal-search') {
    return openModal('全局穿透搜索 (Ctrl+K)', `<input class="input" style="width:100%;margin-bottom:10px" placeholder="输入关键字秒搜全工作区 .md / .sql / 命令 / IP…" value="order"><div class="sql-row"><span>📄 工单流转模块重构 / docs / 笔记.md : 第 2 行</span><span class="mono muted">POST /api/v2/order/flow</span></div><div class="sql-row"><span>🗄️ 工单流转模块重构 / sql / 01_alter_order_table.sql : 第 4 行</span><span class="mono muted">ALTER TABLE mz_order...</span></div>`);
  }
  if (act === 'modal-update') {
    return openModal('更新中心 (GitHub Releases 无感热更新)', `<p style="margin-bottom:8px">当前版本: <b>v1.3.0</b> · 仓库: <code class="mono">1852676265/dev-orbit</code> (已复用本地 GitHub CLI 鉴权)</p><div class="smart-bar">✅ 当前已是最新版本 v1.3.0，支持后台流式下载并一键无感替换重启。</div>`);
  }
  if (act === 'modal-theme') {
    return openModal('个性化外观与自定义壁纸', `<div class="row" style="margin-bottom:10px"><span class="tag accent">经典青绿</span><span class="tag">洁白高透</span><span class="tag">VS Code</span><span class="tag">IntelliJ IDEA</span><span class="tag">Cursor</span><span class="tag">Claude 暖陶</span></div><div class="smart-bar">💎 支持本地壁纸上传、<b>0 模糊超透直透模式</b>、磨砂玻璃与背景暗度无级调节。</div>`);
  }
  if (act === 'modal-settings') {
    return openModal('系统设置中心', `<div class="row" style="margin-bottom:8px"><span style="width:90px">工作区路径:</span><input class="input mono" style="flex:1" value="${DATA.workspace}"></div><div class="row" style="margin-bottom:8px"><span style="width:90px">默认 IDE:</span><span class="tag accent">VS Code (code)</span><span class="tag">IntelliJ IDEA (idea64)</span></div><div class="row"><span style="width:90px">默认终端:</span><span class="tag accent">PowerShell</span><span class="tag">Windows Terminal (wt)</span></div>`);
  }
  if (act === 'modal-new-sql' || act === 'modal-new-note' || act === 'modal-new-cmd' || act === 'modal-txt-import' || act === 'modal-new-srv') {
    return openModal('快捷录入 / 导入', `<input class="input" style="width:100%;margin-bottom:8px" placeholder="名称 / 标题"><textarea class="input" rows="5" placeholder="在此输入内容或粘贴批量文本…"></textarea>`, `<button class="btn" data-close-modal>取消</button><button class="btn primary" data-close-modal data-toast="已保存并同步落盘">确认保存</button>`);
  }
});

document.addEventListener('change', (e) => {
  if (e.target.dataset.bind === 'year') { UI.year = e.target.value; window.renderApp?.(); }
  if (e.target.dataset.bind === 'project') { UI.project = e.target.value; window.renderApp?.(); }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); $('[data-act="modal-search"]')?.click(); }
  if (e.key === 'Escape') { $('#_modal')?.classList.remove('open'); document.body.classList.remove('zen'); }
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === '_memo_inp') { e.preventDefault(); $('[data-act="add-memo"]')?.click(); }
});
