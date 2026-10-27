<template>
  <div class="relative inline-block select-none text-left" ref="dropdownRef">
    <!-- 标签 (可选) -->
    <label v-if="showLabel" class="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
      <Palette class="w-3.5 h-3.5 text-emerald-400" />
      <span>配色主题</span>
    </label>

    <!-- 下拉触发按钮 (随顶栏主题智能联动) -->
    <button
      type="button"
      @click="toggleOpen"
      class="flex items-center justify-between gap-3 px-3 py-2 rounded-xl app-header-item transition-all text-xs outline-none shadow-sm"
      :class="[
        isOpen ? 'ring-1 ring-emerald-500/50' : '',
        sizeClasses
      ]"
      :title="`当前配色主题: ${activeTheme.name}`"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- 色点指示器 -->
        <span
          class="w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-transform duration-200"
          :style="{
            backgroundColor: activeTheme.id === 'custom' ? (customColor || '#10b981') : activeTheme.dotColor,
            border: activeTheme.dotBorder ? `1px solid ${activeTheme.dotBorder}` : 'none'
          }"
        ></span>
        <!-- 主题名称 -->
        <span class="truncate font-medium text-xs">
          {{ activeTheme.name }}
          <span v-if="activeTheme.id === 'custom' && customColor" class="font-mono text-[10px] opacity-70 ml-1">
            ({{ customColor.toUpperCase() }})
          </span>
        </span>
      </div>

      <!-- 下拉箭头 -->
      <ChevronDown
        class="w-4 h-4 opacity-60 flex-shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180 opacity-100 text-emerald-400': isOpen }"
      />
    </button>

    <!-- 下拉弹出面板 (完全对齐截图列表选项、色点及选中打勾状态) -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1.5 min-w-[210px] w-full max-h-80 overflow-y-auto rounded-xl border shadow-2xl py-1 custom-scrollbar"
        :class="[
          align === 'right' ? 'right-0' : 'left-0',
          activeTheme.isLight
            ? 'bg-white/98 text-slate-800 border-slate-200 shadow-slate-900/10'
            : 'bg-slate-900/98 text-slate-100 border-slate-700/80 backdrop-blur-xl'
        ]"
      >
        <!-- 主题项列表 -->
        <div
          v-for="item in COLOR_THEMES"
          :key="item.id"
          @click="selectTheme(item)"
          class="flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition group"
          :class="modelValue === item.id
            ? (activeTheme.isLight ? 'bg-slate-100 text-slate-900 font-bold' : 'bg-slate-800/90 text-white font-semibold')
            : (activeTheme.isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-50' : 'text-slate-300 hover:text-white hover:bg-slate-800/60')"
        >
          <!-- 左侧：色点 + 名称 -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
              :style="{
                backgroundColor: item.id === 'custom' ? (customColor || '#10b981') : item.dotColor,
                border: item.dotBorder ? `1px solid ${item.dotBorder}` : 'none'
              }"
            ></span>
            <span class="truncate">{{ item.name }}</span>
          </div>

          <!-- 右侧：打勾图标 (仅当前选中项显示) -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <!-- 若是自定义模式且已选中，支持快捷调出色板 -->
            <label
              v-if="item.id === 'custom'"
              @click.stop
              class="cursor-pointer relative flex items-center justify-center p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
              title="自由选择自定义颜色"
            >
              <input
                type="color"
                :value="customColor || '#10b981'"
                @input="onCustomColorInput"
                class="sr-only"
              />
              <span
                class="w-3.5 h-3.5 rounded border border-white/30 shadow-inner"
                :style="{ backgroundColor: customColor || '#10b981' }"
              ></span>
            </label>

            <!-- 选中的对勾 -->
            <Check
              v-if="modelValue === item.id"
              class="w-4 h-4 text-emerald-500 stroke-[2.5]"
            />
          </div>
        </div>

        <!-- 自定义拾色快捷扩展条 (当选中自定义时展开) -->
        <div
          v-if="modelValue === 'custom'"
          class="p-2.5 mx-1.5 my-1 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2"
          @click.stop
        >
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>拾取自定义主色:</span>
            <span class="font-mono text-emerald-400 font-bold">{{ customColor || '#10b981' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="customColor || '#10b981'"
              @input="onCustomColorInput"
              class="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
            />
            <input
              type="text"
              :value="customColor || '#10b981'"
              @input="onCustomHexInput"
              placeholder="#10b981"
              maxlength="7"
              class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 uppercase focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Check, Palette } from 'lucide-vue-next'
import { COLOR_THEMES, getThemeConfig } from '@/utils/colorThemes'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'emerald'
  },
  customColor: {
    type: String,
    default: '#10b981'
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md' // 'sm' | 'md'
  },
  align: {
    type: String,
    default: 'left' // 'left' | 'right'
  }
})

const emit = defineEmits(['update:modelValue', 'update:customColor', 'change'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const activeTheme = computed(() => {
  return getThemeConfig(props.modelValue, props.customColor)
})

const sizeClasses = computed(() => {
  if (props.size === 'sm') {
    return 'h-8 min-w-[130px] px-2.5 py-1 text-xs'
  }
  return 'h-9 min-w-[170px] px-3 py-1.5 text-xs'
})

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function selectTheme(item) {
  emit('update:modelValue', item.id)
  const cfg = getThemeConfig(item.id, props.customColor)
  emit('change', cfg)
  if (item.id !== 'custom') {
    isOpen.value = false
  }
}

function onCustomColorInput(e) {
  const hex = e.target.value
  emit('update:customColor', hex)
  emit('update:modelValue', 'custom')
  const cfg = getThemeConfig('custom', hex)
  emit('change', cfg)
}

function onCustomHexInput(e) {
  const hex = e.target.value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    emit('update:customColor', hex)
    emit('update:modelValue', 'custom')
    const cfg = getThemeConfig('custom', hex)
    emit('change', cfg)
  }
}

function handleDocumentClick(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 1);
}
</style>
