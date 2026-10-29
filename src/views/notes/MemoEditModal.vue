<template>
  <n-modal
    :show="show"
    preset="card"
    title="编辑随手记便签"
    :style="{ width: '520px', maxWidth: '92vw' }"
    class="glass-island app-modal-dialog"
    @update:show="(val) => { if (!val) close() }"
  >
    <form class="space-y-3.5" @submit.prevent="save">
      <div>
        <label class="block text-xs font-semibold mb-1 text-slate-300">便签标题</label>
        <n-input
          v-model:value="form.title"
          placeholder="如: 会议纪要、部署备忘、产品调研..."
          maxlength="80"
          show-count
          clearable
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold mb-1 text-slate-300">分类标签</label>
          <n-input
            v-model:value="form.tag"
            placeholder="如: #会议, #待办, #临时..."
            clearable
          />
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1 text-slate-300">底色样式</label>
          <div class="flex items-center gap-2 pt-1.5">
            <button
              v-for="c in colors"
              :key="c.name"
              type="button"
              class="w-5 h-5 rounded-full border border-white/25 transition-transform hover:scale-110"
              :class="{ 'ring-2 ring-amber-400 scale-110': form.color === c.name }"
              :style="{ backgroundColor: c.accent }"
              :title="c.title"
              @click="form.color = c.name"
            />
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold mb-1 text-slate-300">详细内容 (支持 Markdown / 待办语法)</label>
        <n-input
          v-model:value="form.content"
          type="textarea"
          :rows="6"
          placeholder="详细便签内容... 支持 - [ ] 待办列表"
        />
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-white/10">
        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            v-model="form.isPinned"
            type="checkbox"
            class="rounded text-amber-400 focus:ring-0"
          />
          <span>📌 常驻置顶</span>
        </label>

        <div class="flex gap-2">
          <n-button quaternary size="small" @click="close">取消</n-button>
          <n-button type="primary" size="small" attr-type="submit">确认保存</n-button>
        </div>
      </div>
    </form>
  </n-modal>
</template>

<script setup>
import { NModal, NInput, NButton } from 'naive-ui'

defineProps({
  show: { type: Boolean, default: false },
  form: { type: Object, required: true },
  colors: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])

function close() {
  emit('close')
}

function save() {
  emit('save')
}
</script>
