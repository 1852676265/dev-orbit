<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="批量导入凭据资产 (支持 TXT / Markdown / 剪贴板)"
    :bordered="false"
    size="medium"
    style="width: 720px; max-width: 95vw; background: #131927; border: 1px solid rgba(255, 255, 255, 0.1);"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between text-xs text-slate-400">
        <span>支持自动穿透提取 IP/URL、端口、账号、密码及类型，右侧可直接选本地文件：</span>
        <label class="cursor-pointer px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold border border-teal-500/30 transition text-xs">
          <span>选择本地文本文件</span>
          <input type="file" accept=".txt,.md,.sh,.conf,.properties" class="hidden" @change="handleFileSelect" />
        </label>
      </div>

      <n-input
        v-model:value="inputText"
        type="textarea"
        size="small"
        placeholder="在此粘贴文本或脚本内容，支持如：
192.168.10.154 生产结算服务 端口:22 root
http://192.168.10.154:8848/nacos Nacos控制台 nacos nacos#2026
iNode认证客户端 账号:lisb_dev 密码:InodePass#88 网关:10.10.0.1
192.168.10.160:5236 DM8主数据库 SYSDBA"
        :rows="6"
        class="font-mono text-xs"
        @input="parseInputText"
      />

      <!-- 智能预览表格 -->
      <div v-if="parsedPreview.length > 0" class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-teal-400">已智能识别 {{ parsedPreview.length }} 项资产：</span>
          <span class="text-slate-500">点击删除按钮可排除不需要的项</span>
        </div>

        <div class="max-h-48 overflow-y-auto border border-white/10 rounded-lg bg-black/40">
          <table class="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr class="bg-white/5 border-b border-white/10 text-slate-400">
                <th class="p-2">类型</th>
                <th class="p-2">名称</th>
                <th class="p-2">目标地址 / URL</th>
                <th class="p-2">端口</th>
                <th class="p-2">账号</th>
                <th class="p-2">密码</th>
                <th class="p-2 text-right">排除</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <tr v-for="(item, idx) in parsedPreview" :key="idx" class="hover:bg-white/[0.02]">
                <td class="p-2">
                  <span class="px-1.5 py-0.5 rounded text-[10px] bg-white/10">{{ getTypeName(item.type) }}</span>
                </td>
                <td class="p-2 font-bold text-white font-sans truncate max-w-[120px]">{{ item.name }}</td>
                <td class="p-2 text-teal-300 truncate max-w-[180px]">{{ item.target }}</td>
                <td class="p-2 text-slate-400">{{ item.port || '-' }}</td>
                <td class="p-2">{{ item.username || '-' }}</td>
                <td class="p-2 text-slate-400">{{ item.useDefaultPassword ? '👑 默认Root' : (item.password || '-') }}</td>
                <td class="p-2 text-right">
                  <button @click="removeItem(idx)" class="text-rose-400 hover:text-rose-300">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">
          识别规则：自动区分 http(s) URL、iNode/VPN 与 Linux 服务器
        </span>
        <div class="flex items-center gap-2">
          <n-button size="small" quaternary @click="visible = false">取消</n-button>
          <n-button
            size="small"
            type="primary"
            secondary
            :disabled="parsedPreview.length === 0"
            @click="handleImport(false)"
          >
            追加导入 ({{ parsedPreview.length }})
          </n-button>
          <n-button
            size="small"
            type="warning"
            :disabled="parsedPreview.length === 0"
            @click="handleImport(true)"
          >
            清空并覆盖
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NModal, NInput, NButton } from 'naive-ui'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['update:show', 'import'])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const inputText = ref('')
const parsedPreview = ref([])

function getTypeName(type) {
  if (type === 'web') return '🌐 Web'
  if (type === 'network') return '📶 网络'
  if (type === 'database') return '🗄️ 数据库'
  return '🖥️ 服务器'
}

function parseInputText() {
  const lines = inputText.value.split(/\r?\n/)
  const results = []
  let globalId = 1

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const urlMatch = line.match(/(https?:\/\/[^\s]+)/i)
    const ipMatch = line.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?\b/)

    if (urlMatch || ipMatch) {
      const target = urlMatch ? urlMatch[1] : ipMatch[1]
      const port = urlMatch ? (target.match(/:(\d+)/)?.[1] || '') : (ipMatch[2] || '22')
      const isWeb = Boolean(urlMatch)

      let type = isWeb ? 'web' : 'server'
      if (/inode|vpn|网络|802\.1/i.test(line)) type = 'network'
      if (/达梦|dm8|oracle|mysql|redis/i.test(line)) type = 'database'

      const userMatch = line.match(/(?:账号|用户|user|username)[：:\s]+(\S+)/i)
      const pwdMatch = line.match(/(?:密码|口令|password|pwd)[：:\s]+(\S+)/i)

      let username = userMatch ? userMatch[1] : (type === 'server' ? 'root' : (type === 'web' ? 'admin' : ''))
      let password = pwdMatch ? pwdMatch[1] : ''
      let useDefaultPassword = !password

      const tokens = line.split(/[\s,，;；|]+/)
      const name = tokens[0] && !tokens[0].includes('http') && !/^\d{1,3}\./.test(tokens[0])
        ? tokens[0]
        : (isWeb ? 'Web业务系统' : `服务器-${globalId}`)

      results.push({
        id: 'imported_' + Date.now() + '_' + (globalId++),
        type,
        name,
        target,
        port,
        env: /生产|prod/i.test(line) ? '生产环境' : /测试|test/i.test(line) ? '测试环境' : '常规环境',
        username,
        password,
        useDefaultPassword,
        remark: line
      })
    }
  }

  parsedPreview.value = results
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    inputText.value = ev.target?.result || ''
    parseInputText()
  }
  reader.readAsText(file, 'utf-8')
}

function removeItem(idx) {
  parsedPreview.value.splice(idx, 1)
}

function handleImport(isOverwrite) {
  if (parsedPreview.value.length === 0) return
  emit('import', {
    items: JSON.parse(JSON.stringify(parsedPreview.value)),
    isOverwrite
  })
  visible.value = false
  inputText.value = ''
  parsedPreview.value = []
}
</script>
