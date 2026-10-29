<template>
  <div class="memo-composer-card" :class="{ 'is-focused': isFocused }">
    <!-- 标题输入栏 -->
    <div class="composer-title-wrap">
      <input
        ref="titleInputRef"
        v-model="title"
        type="text"
        placeholder="随手记标题 (如: 会议纪要、部署备忘...)"
        class="composer-title-input"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter="focusContent"
        @keydown.ctrl.enter="submit"
        @keydown.meta.enter="submit"
      />
    </div>

    <textarea
      ref="textareaRef"
      v-model="content"
      rows="3"
      placeholder="写点具体内容... (支持 #标签 归类；支持 - [ ] 创建待办，Ctrl+Enter 保存)"
      class="composer-textarea custom-scrollbar"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown.enter.exact="handleEnter"
      @keydown.ctrl.enter="submit"
      @keydown.meta.enter="submit"
    />

    <div class="composer-toolbar">
      <!-- 左下：+ 待办复选框 & 历史 #标签 快捷插入 -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="todo-insert-btn"
          title="插入待办复选框 - [ ]"
          @click="insertChecklist"
        >
          <CheckSquare class="w-3.5 h-3.5 text-teal-400" />
          <span>+ 待办复选框</span>
        </button>

        <button
          v-for="tag in commonTags"
          :key="tag"
          type="button"
          class="tag-quick-chip"
          @click="insertTag(tag)"
        >
          {{ tag }}
        </button>
      </div>

      <!-- 右下：📌 置顶 + 🎨 底色选择器 + 记录 ↵ -->
      <div class="flex items-center gap-3 ml-auto">
        <label class="pin-check-label">
          <input v-model="isPinned" type="checkbox" class="rounded text-amber-400 focus:ring-0" />
          <span>📌 置顶</span>
        </label>

        <div class="color-picker-pill">
          <Palette class="w-3.5 h-3.5 text-slate-400" />
          <span class="text-[11px] text-slate-400 font-mono">底色:</span>
          <div class="flex items-center gap-1.5">
            <button
              v-for="c in colors"
              :key="c.name"
              type="button"
              class="color-dot-btn"
              :class="{ 'is-selected': selectedColor === c.name }"
              :style="{ backgroundColor: c.accent }"
              :title="c.title"
              @click="selectedColor = c.name"
            />
          </div>
        </div>

        <button
          type="button"
          class="memo-submit-btn"
          :disabled="!title.trim() && !content.trim()"
          @click="submit"
        >
          <span>记录</span>
          <kbd class="text-[10px] font-mono opacity-75">↵</kbd>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { CheckSquare, Palette } from 'lucide-vue-next'

const props = defineProps({
  commonTags: { type: Array, default: () => [] },
  colors: { type: Array, default: () => [] }
})

const emit = defineEmits(['submit'])

const title = ref('')
const content = ref('')
const isPinned = ref(false)
const selectedColor = ref('obsidian')
const isFocused = ref(false)
const titleInputRef = ref(null)
const textareaRef = ref(null)

function focusContent(e) {
  if (e.isComposing) return
  e.preventDefault()
  textareaRef.value?.focus()
}

function insertChecklist() {
  const prefix = (content.value && !content.value.endsWith('\n')) ? '\n- [ ] ' : '- [ ] '
  content.value += prefix
  nextTick(() => textareaRef.value?.focus())
}

function insertTag(tag) {
  if (!content.value.includes(tag)) {
    content.value = tag + ' ' + content.value
  }
  textareaRef.value?.focus()
}

function handleEnter(e) {
  if (e.isComposing) return
  const textarea = textareaRef.value
  if (!textarea) return

  const val = content.value
  const selStart = textarea.selectionStart
  const selEnd = textarea.selectionEnd
  const lastNewLine = val.lastIndexOf('\n', selStart - 1)
  const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1
  const currentLine = val.substring(lineStart, selStart)

  const checklistMatch = currentLine.match(/^(\s*-\s*\[([ x])\]\s*)(.*)$/)
  if (checklistMatch) {
    e.preventDefault()
    const textPart = checklistMatch[3]
    if (!textPart.trim()) {
      content.value = val.substring(0, lineStart) + val.substring(selEnd)
      nextTick(() => { textarea.selectionStart = textarea.selectionEnd = lineStart })
      return
    }
    const nextPrefix = '\n- [ ] '
    content.value = val.substring(0, selStart) + nextPrefix + val.substring(selEnd)
    nextTick(() => {
      const pos = selStart + nextPrefix.length
      textarea.selectionStart = textarea.selectionEnd = pos
    })
  }
}

function submit() {
  const t = title.value.trim()
  const text = content.value.trim()
  if (!t && !text) return
  emit('submit', { title: t, text, isPinned: isPinned.value, color: selectedColor.value })
  title.value = ''
  content.value = ''
  isPinned.value = false
}
</script>

<style scoped>
.memo-composer-card {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
}

.memo-composer-card.is-focused {
  border-color: rgba(245, 158, 11, 0.55);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.18), 0 8px 24px rgba(0, 0, 0, 0.3);
}

.composer-title-wrap {
  display: flex;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.composer-title-input {
  width: 100%;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: #f8fafc;
  outline: none;
  border: none;
}

.composer-title-input::placeholder {
  color: #64748b;
  font-weight: 400;
  font-size: 12.5px;
}

.composer-textarea {
  width: 100%;
  background: transparent;
  font-size: 12.5px;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.composer-textarea::placeholder {
  color: #64748b;
}

.composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.todo-insert-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 7px;
  background: rgba(20, 184, 166, 0.12);
  border: 1px solid rgba(20, 184, 166, 0.35);
  color: #5eead4;
  font-size: 11.5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;
  transition: all 0.15s ease;
}

.todo-insert-btn:hover { background: rgba(20, 184, 166, 0.22); }

.tag-quick-chip {
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;
}

.tag-quick-chip:hover {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.pin-check-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #cbd5e1;
  cursor: pointer;
}

.color-picker-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.color-dot-btn {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  opacity: 0.65;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-dot-btn:hover { opacity: 1; }

.color-dot-btn.is-selected {
  opacity: 1;
  transform: scale(1.22);
  border-color: #fbbf24;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
}

.memo-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 9px;
  background: #f59e0b;
  border: none;
  color: #090d16;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
  cursor: pointer;
  transition: all 0.15s ease;
}

.memo-submit-btn:hover { background: #fbbf24; }
.memo-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

</style>
