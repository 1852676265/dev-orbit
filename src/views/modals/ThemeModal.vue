<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
    <div class="app-modal-dialog bg-slate-900/95 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col backdrop-blur-xl">
      
      <!-- 弹窗顶栏 -->
      <div class="h-14 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70 flex-shrink-0 select-none">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Palette class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              个性化外观与背景设置
              <span class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">Custom UI</span>
            </h2>
            <p class="text-[11px] text-slate-400">自定义桌面背景图片、精美渐变氛围与磨砂玻璃质感</p>
          </div>
        </div>

        <button
          @click="close"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="关闭 (Esc)"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 弹窗主体内容 -->
      <div class="p-6 space-y-6 overflow-y-auto max-h-[580px] custom-scrollbar">
        
        <!-- 0. 配色主题 (严格还原截图中 14 种经典与 IDE 主题) -->
        <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Palette class="w-4 h-4 text-emerald-400" />
              <span>配色主题</span>
            </label>
            <span class="text-[10px] text-slate-500">经典色系 · 开发工具主题 · 自定义拾色</span>
          </div>
          
          <div class="flex items-center justify-between gap-4">
            <div class="text-xs text-slate-400 leading-relaxed">
              切换后全软件按钮、图标、激活高亮、聚焦光晕将即时联动变色
            </div>
            <ColorThemeDropdown
              v-model="theme.colorTheme"
              v-model:custom-color="theme.customPrimaryColor"
              @change="onColorThemeChange"
            />
          </div>
        </div>

        <!-- 1. 背景模式切换 (预设氛围 VS 自定义图片) -->
        <div>
          <label class="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-emerald-400" />
            选择背景风格类型
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="setMode('preset')"
              class="p-3.5 rounded-xl border flex items-center gap-3 transition text-left"
              :class="theme.type === 'preset'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/50'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'"
            >
              <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                <Layers class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200">精美系统预设氛围</div>
                <div class="text-[10px] text-slate-500 mt-0.5">极光、赛博、黑曜、星云等现代渐变</div>
              </div>
            </button>

            <button
              type="button"
              @click="setMode('custom')"
              class="p-3.5 rounded-xl border flex items-center gap-3 transition text-left"
              :class="theme.type === 'custom'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/50'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'"
            >
              <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                <ImageIcon class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200">上传自定义本地壁纸</div>
                <div class="text-[10px] text-slate-500 mt-0.5">支持电脑任意 JPG / PNG / WebP 图片</div>
              </div>
            </button>
          </div>
        </div>

        <!-- 2. 预设背景网格 (当 type === 'preset') -->
        <div v-if="theme.type === 'preset'" class="space-y-2">
          <label class="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>预设渐变氛围</span>
            <span class="text-[10px] text-slate-500 font-normal">点击即时切换预览</span>
          </label>
          <div class="grid grid-cols-5 gap-2.5">
            <button
              v-for="p in presets"
              :key="p.id"
              type="button"
              @click="selectPreset(p.id)"
              class="group relative rounded-xl p-2 border flex flex-col items-center gap-2 transition overflow-hidden text-center"
              :class="theme.presetId === p.id
                ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-2 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'"
            >
              <!-- 颜色色块微缩图 -->
              <div
                class="w-full h-14 rounded-lg shadow-inner border border-white/10 relative overflow-hidden flex items-center justify-center"
                :style="p.thumbStyle"
              >
                <div v-if="theme.presetId === p.id" class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                  <Check class="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <span class="text-[11px] font-medium text-slate-300 group-hover:text-white truncate w-full">
                {{ p.name }}
              </span>
            </button>
          </div>
        </div>

        <!-- 3. 自定义本地图片上传 (当 type === 'custom') -->
        <div v-else class="space-y-3">
          <label class="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>本地壁纸图片</span>
            <span class="text-[10px] text-slate-500 font-normal">图片保存在本地配置中，离线可用</span>
          </label>

          <!-- 图片展示或选择框 -->
          <div
            v-if="theme.customBg"
            class="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950 group h-40 flex items-center justify-center"
          >
            <img
              :src="theme.customBg"
              alt="Custom Wallpaper"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                @click="chooseLocalImage"
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition"
              >
                <Upload class="w-3.5 h-3.5" />
                <span>更换图片</span>
              </button>
              <button
                type="button"
                @click="clearCustomImage"
                class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>清除并还原</span>
              </button>
            </div>
            <div class="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-300 font-mono truncate max-w-[80%]">
              {{ theme.customBgName || '自定义本地壁纸' }}
            </div>
          </div>

          <!-- 未上传时的上传引导框 -->
          <div
            v-else
            @click="chooseLocalImage"
            class="h-36 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/40 hover:bg-slate-950/80 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 group"
          >
            <div class="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center transition">
              <Upload class="w-5 h-5" />
            </div>
            <div class="text-xs font-medium">点击选择电脑中的壁纸图片</div>
            <div class="text-[10px] text-slate-500">支持 *.jpg, *.png, *.jpeg, *.webp 等高质量大图</div>
          </div>
        </div>

        <!-- 4. 视觉调节参数 (暗度遮罩 + 毛玻璃 + 玻璃卡片) -->
        <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4">
          <div class="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Sliders class="w-4 h-4 text-emerald-400" />
            视觉与可读性精细微调
          </div>

          <!-- 背景暗度遮罩浓度 (确保不论图片多亮，文字都清晰锐利) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300">背景暗度遮罩 (Overlay Tint)</span>
              <span class="font-mono text-emerald-400 font-bold">{{ theme.overlayOpacity }}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              v-model.number="theme.overlayOpacity"
              class="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div class="flex justify-between text-[10px] text-slate-500">
              <span>透亮 (20%)</span>
              <span>平衡推荐 (65%~75%)</span>
              <span>深邃专注 (90%)</span>
            </div>
          </div>

          <!-- 毛玻璃模糊度 -->
          <div class="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300">背景毛玻璃模糊 (Backdrop Blur)</span>
              <span class="text-slate-400 text-[11px] font-mono">{{ getBlurName(theme.blurLevel) }}</span>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="b in blurOptions"
                :key="b.id"
                type="button"
                @click="theme.blurLevel = b.id"
                class="py-1.5 rounded-lg text-xs font-medium border transition text-center"
                :class="theme.blurLevel === b.id
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-semibold shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                {{ b.label }}
              </button>
            </div>
          </div>

          <!-- 卡片底色不透明度调节 (解决挡住背景的核心控制器) -->
          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300">卡片透光度 / 不透明度 (Card Opacity)</span>
              <span class="font-mono text-emerald-400 font-bold">{{ theme.cardOpacity ?? 20 }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              v-model.number="theme.cardOpacity"
              class="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div class="flex items-center gap-2 pt-1 flex-wrap">
              <span class="text-[10px] text-slate-500">一键快速质感:</span>
              <button
                type="button"
                @click="theme.cardOpacity = 10"
                class="px-2 py-0.5 rounded text-[10px] font-medium transition border"
                :class="theme.cardOpacity <= 15 ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                💎 通透水晶 (10% 尽览壁纸)
              </button>
              <button
                type="button"
                @click="theme.cardOpacity = 25"
                class="px-2 py-0.5 rounded text-[10px] font-medium transition border"
                :class="theme.cardOpacity > 15 && theme.cardOpacity <= 45 ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                🌫️ 优雅磨砂 (25% 推荐)
              </button>
              <button
                type="button"
                @click="theme.cardOpacity = 65"
                class="px-2 py-0.5 rounded text-[10px] font-medium transition border"
                :class="theme.cardOpacity > 45 ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                🛡️ 深色稳重 (65% 高对比)
              </button>
            </div>
          </div>

          <!-- 磨砂玻璃卡片浮层开关 -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div class="text-xs font-medium text-slate-200">磨砂玻璃卡片透光质感 (Glassmorphism)</div>
              <div class="text-[10px] text-slate-500">开启后任务卡片和面板呈现微透明浮层与背景光晕辉映</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="theme.cardGlass"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

      </div>

      <!-- 弹窗底栏 -->
      <div class="h-14 px-6 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          @click="resetToDefault"
          class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>恢复默认外观</span>
        </button>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="close"
            class="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            关闭
          </button>
          <button
            type="button"
            @click="handleSave"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-900/30"
          >
            <Check class="w-3.5 h-3.5" />
            <span>保存并应用</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import {
  Palette, Sparkles, Layers, Image as ImageIcon,
  Upload, Trash2, Sliders, RotateCcw, Check, X
} from 'lucide-vue-next'
import ColorThemeDropdown from '@/views/common/ColorThemeDropdown.vue'

const emit = defineEmits(['update-theme', 'toast'])

const isOpen = ref(false)

const theme = reactive({
  colorTheme: 'emerald',
  customPrimaryColor: '#10b981',
  type: 'preset', // 'preset' | 'custom'
  presetId: 'aurora',
  customBg: '',
  customBgName: '',
  overlayOpacity: 45,
  blurLevel: 'sm',
  cardGlass: true,
  cardOpacity: 25
})

const presets = [
  {
    id: 'aurora',
    name: '深空极光',
    thumbStyle: 'background: radial-gradient(at 0% 0%, #059669 0px, transparent 60%), radial-gradient(at 100% 100%, #4338ca 0px, transparent 60%), #020617;'
  },
  {
    id: 'cyber',
    name: '赛博霓虹',
    thumbStyle: 'background: radial-gradient(at 20% 20%, #7c3aed 0px, transparent 60%), radial-gradient(at 80% 80%, #db2777 0px, transparent 60%), #030712;'
  },
  {
    id: 'obsidian',
    name: '极夜黑曜',
    thumbStyle: 'background: radial-gradient(circle at 50% 0%, #1e293b 0px, transparent 70%), #020617;'
  },
  {
    id: 'nebula',
    name: '蔚蓝星云',
    thumbStyle: 'background: radial-gradient(at 0% 100%, #0284c7 0px, transparent 60%), radial-gradient(at 100% 0%, #2563eb 0px, transparent 60%), #020617;'
  },
  {
    id: 'sunset',
    name: '暮光紫霞',
    thumbStyle: 'background: radial-gradient(at 20% 0%, #b45309 0px, transparent 60%), radial-gradient(at 80% 100%, #9f1239 0px, transparent 60%), #030712;'
  }
]

const blurOptions = [
  { id: 'none', label: '清晰无模糊' },
  { id: 'sm', label: '轻微 (4px)' },
  { id: 'md', label: '中度 (12px)' },
  { id: 'lg', label: '深度 (20px)' }
]

function getBlurName(id) {
  const found = blurOptions.find(b => b.id === id)
  return found ? found.label : '中度'
}

// 实时响应更改，给 App.vue 动态预览
watch(
  () => ({ ...theme }),
  (newVal) => {
    emit('update-theme', newVal)
  },
  { deep: true }
)

function setMode(mode) {
  theme.type = mode
}

function selectPreset(id) {
  theme.type = 'preset'
  theme.presetId = id
}

async function chooseLocalImage() {
  try {
    const res = await window.electronAPI.selectBackgroundImage()
    if (res && res.dataUrl) {
      theme.customBg = res.dataUrl
      theme.customBgName = res.fileName
      theme.type = 'custom'
      emit('toast', '已加载自定义壁纸，可微调暗度遮罩！', 'success')
    }
  } catch (err) {
    emit('toast', '选择图片失败: ' + err.message, 'error')
  }
}

function clearCustomImage() {
  theme.customBg = ''
  theme.customBgName = ''
  theme.type = 'preset'
  theme.presetId = 'aurora'
  emit('toast', '已清除自定义壁纸，还原为极光预设', 'info')
}

function onColorThemeChange(cfg) {
  emit('toast', `已切换配色主题: ${cfg.name}`, 'info')
}

function resetToDefault() {
  theme.colorTheme = 'emerald'
  theme.customPrimaryColor = '#10b981'
  theme.type = 'preset'
  theme.presetId = 'aurora'
  theme.customBg = ''
  theme.customBgName = ''
  theme.overlayOpacity = 45
  theme.blurLevel = 'sm'
  theme.cardGlass = true
  theme.cardOpacity = 25
  emit('toast', '已恢复默认外观风格', 'info')
}

async function open(currentTheme) {
  if (currentTheme) {
    Object.assign(theme, currentTheme)
  } else {
    try {
      const cfg = await window.electronAPI.getAppConfig()
      if (cfg && cfg.themeSettings) {
        Object.assign(theme, cfg.themeSettings)
      }
    } catch (e) {}
  }
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function handleSave() {
  try {
    await window.electronAPI.saveAppConfig({
      themeSettings: { ...theme }
    })
    emit('toast', '外观与背景设置已保存！', 'success')
    close()
  } catch (err) {
    emit('toast', '保存设置失败: ' + err.message, 'error')
  }
}

defineExpose({
  open,
  close,
  getTheme: () => ({ ...theme }),
  setTheme: (t) => Object.assign(theme, t)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 9999px;
}
</style>