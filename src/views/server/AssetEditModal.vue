<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    :title="isEdit ? '编辑日常凭据' : '手动新建凭据'"
    class="asset-edit-modal"
    :bordered="false"
    size="medium"
    style="width: 560px; max-width: 95vw; background: #131927; border: 1px solid rgba(255, 255, 255, 0.1);"
  >
    <div class="form-container">
      <!-- 1. 归属分类与环境 -->
      <div class="form-row-2">
        <div class="form-item">
          <div class="flex items-center justify-between">
            <label class="form-label">归属分类</label>
            <button
              type="button"
              class="text-[11px] text-teal-400 font-bold hover:underline"
              @click="showNewCat = !showNewCat"
            >
              {{ showNewCat ? '选择已有' : '+ 新建分类' }}
            </button>
          </div>
          <div v-if="showNewCat" class="flex gap-1.5">
            <n-input
              v-model:value="customCatInput"
              size="small"
              placeholder="输入新分类名称..."
              @keydown.enter="confirmNewCat"
            />
            <n-button size="small" type="primary" @click="confirmNewCat">确定</n-button>
          </div>
          <n-select
            v-else
            v-model:value="form.category"
            :options="categoryOptions"
            size="small"
            placeholder="请选择分类"
          />
        </div>
        <div class="form-item">
          <label class="form-label">所属环境</label>
          <n-select
            v-model:value="form.env"
            :options="envOptions"
            size="small"
            placeholder="请选择环境"
          />
        </div>
      </div>

      <!-- 2. 资产系统名称 -->
      <div class="form-item">
        <label class="form-label">资产 / 系统名称 <span class="required">*</span></label>
        <n-input
          v-model:value="form.name"
          size="small"
          placeholder="如: 政务外网应用01 / 智慧MZ后台 / iNode客户端"
          maxlength="60"
        />
      </div>

      <!-- 3. 目标地址与端口 -->
      <div class="form-row-2">
        <div class="form-item flex-2">
          <label class="form-label">
            {{ form.category === 'Web网站' ? 'Web 完整 URL 地址' : 'IP 地址 / 域名 / 网关' }}
          </label>
          <n-input
            v-model:value="form.target"
            size="small"
            :placeholder="form.category === 'Web网站' ? 'https://...' : '172.31.101.45'"
          />
        </div>
        <div class="form-item flex-1">
          <label class="form-label">端口</label>
          <n-input
            v-model:value="form.port"
            size="small"
            :placeholder="form.category === '服务器账号' ? '22' : ''"
          />
        </div>
      </div>

      <!-- 4. 用户名与密码策略 -->
      <div class="form-row-2">
        <div class="form-item">
          <label class="form-label">登录用户名</label>
          <n-input
            v-model:value="form.username"
            size="small"
            placeholder="如: root / admin / xc_mz_yf"
          />
        </div>

        <div class="form-item">
          <label class="form-label flex items-center justify-between">
            <span>密码凭据</span>
            <span v-if="globalRootPassword" class="text-xs text-teal-400 font-mono">
              通用Root已设
            </span>
          </label>

          <div class="pwd-strategy-box">
            <label v-if="form.category === '服务器账号'" class="checkbox-label mb-1.5">
              <input
                v-model="form.useDefaultPassword"
                type="checkbox"
                class="rounded text-teal-400 focus:ring-0"
              />
              <span class="text-xs text-slate-200">👑 继承全局通用 Root 口令</span>
            </label>

            <n-input
              v-if="form.category !== '服务器账号' || !form.useDefaultPassword"
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              size="small"
              placeholder="请输入独立密码 / 口令"
            />
          </div>
        </div>
      </div>

      <!-- 5. 业务说明/备注 -->
      <div class="form-item">
        <label class="form-label">业务用途说明 / 备注</label>
        <n-input
          v-model:value="form.remark"
          type="textarea"
          size="small"
          placeholder="如: 政务外网 | EIP: 10.86.139.182..."
          :rows="2"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <n-button size="small" quaternary @click="visible = false">取消</n-button>
        <n-button size="small" type="primary" :disabled="!form.name.trim()" @click="handleConfirm">
          保存至账本
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { NModal, NInput, NSelect, NButton } from 'naive-ui'
import { normalizeItemCategory, getCategoryIconLabel } from '@/composables/useServerCredentials'

const props = defineProps({
  show: { type: Boolean, default: false },
  editItem: { type: Object, default: null },
  categories: { type: Array, default: () => ['服务器账号', 'Web网站', 'iNode'] },
  globalRootPassword: { type: String, default: '' }
})

const emit = defineEmits(['update:show', 'save', 'add-category'])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const isEdit = computed(() => Boolean(props.editItem && props.editItem.id))
const showNewCat = ref(false)
const customCatInput = ref('')

const categoryOptions = computed(() =>
  props.categories.map(c => ({
    label: getCategoryIconLabel(c),
    value: c
  }))
)

const envOptions = [
  { label: '生产环境', value: '生产环境' },
  { label: '测试环境', value: '测试环境' },
  { label: '开发环境', value: '开发环境' },
  { label: '常规环境', value: '常规环境' }
]

const form = ref({
  category: '服务器账号',
  env: '生产环境',
  name: '',
  target: '',
  port: '22',
  username: 'root',
  useDefaultPassword: true,
  password: '',
  remark: ''
})

watch(() => props.show, (newVal) => {
  showNewCat.value = false
  customCatInput.value = ''
  if (newVal) {
    if (props.editItem) {
      const cat = normalizeItemCategory(props.editItem)
      form.value = {
        id: props.editItem.id,
        category: cat,
        env: props.editItem.env || '生产环境',
        name: props.editItem.name || '',
        target: props.editItem.target || props.editItem.ip || '',
        port: props.editItem.port || '',
        username: props.editItem.username || '',
        useDefaultPassword: Boolean(props.editItem.useDefaultPassword || (cat === '服务器账号' && !props.editItem.password)),
        password: props.editItem.password || '',
        remark: props.editItem.remark || ''
      }
    } else {
      form.value = {
        category: '服务器账号',
        env: '生产环境',
        name: '',
        target: '',
        port: '22',
        username: 'root',
        useDefaultPassword: true,
        password: '',
        remark: ''
      }
    }
  }
})

function confirmNewCat() {
  const name = customCatInput.value.trim()
  if (!name) return
  emit('add-category', name)
  form.value.category = name
  customCatInput.value = ''
  showNewCat.value = false
}

function handleConfirm() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
  visible.value = false
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row-2 {
  display: flex;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.flex-2 {
  flex: 2;
}

.flex-1 {
  flex: 1;
}

.form-label {
  font-size: 11px;
  color: var(--app-secondary-foreground);
  font-weight: 600;
}

.required {
  color: #f43f5e;
}

.pwd-strategy-box {
  padding: 8px 10px;
  border-radius: 8px;
  background-color: var(--app-subcard-background);
  border: 1px solid var(--app-border);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
