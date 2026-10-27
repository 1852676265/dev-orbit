<template>
  <transition
    enter-active-class="transform ease-out duration-200 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium border"
      :class="typeClasses"
    >
      <component :is="iconComponent" class="w-4 h-4 flex-shrink-0" />
      <span>{{ message }}</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'

const visible = ref(false)
const message = ref('')
const type = ref('success')
let timer = null

const iconComponent = computed(() => {
  if (type.value === 'success') return CheckCircle2
  if (type.value === 'error') return AlertCircle
  return Info
})

const typeClasses = computed(() => {
  if (type.value === 'success') return 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
  if (type.value === 'error') return 'bg-rose-950/90 text-rose-200 border-rose-700/50'
  return 'bg-slate-800 text-slate-200 border-slate-700'
})

function show(msg, t = 'success', duration = 2500) {
  message.value = msg
  type.value = t
  visible.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
  }, duration)
}

defineExpose({ show })
</script>
