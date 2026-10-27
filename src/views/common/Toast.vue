<template>
  <transition name="toast-fade">
    <div
      v-if="visible"
      class="toast-container"
      :class="`toast--${type}`"
    >
      <component :is="iconComponent" class="toast-icon" />
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

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  font-size: 13px;
  font-weight: 500;
  border-width: 1px;
  border-style: solid;
  user-select: none;
}

.toast--success {
  background-color: rgba(6, 78, 59, 0.95);
  color: #a7f3d0;
  border-color: rgba(16, 185, 129, 0.4);
}

.toast--error {
  background-color: rgba(136, 19, 55, 0.95);
  color: #fecdd3;
  border-color: rgba(244, 63, 94, 0.4);
}

.toast--info {
  background-color: rgba(15, 23, 42, 0.95);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.4);
}

.toast-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
