/**
 * 【逻辑层】任务过滤、年度/项目筛选与上下键盘切换逻辑
 */
import { ref, computed, watch } from 'vue'

export function useTaskFilter(props, onTaskSwitchCallback) {
  const selectedYear = ref(localStorage.getItem('devorbit_task_year') || 'all')
  const selectedProject = ref(localStorage.getItem('devorbit_task_project') || 'all')
  const onlyPendingSql = ref(false)
  const focusedTaskIndex = ref(0)
  const focusedTaskPath = ref(localStorage.getItem('devorbit_focused_task_path') || '')

  // 项目统计列表
  const projectList = computed(() => {
    const map = new Map()
    for (const t of props.tasks || []) {
      const p = (t.project && t.project.trim()) ? t.project.trim() : '常规项目'
      if (!map.has(p)) {
        map.set(p, { name: p, totalCount: 0, pendingCount: 0, inProgressCount: 0 })
      }
      const item = map.get(p)
      item.totalCount++
      if (t.prodPendingCount > 0) item.pendingCount += t.prodPendingCount
      if (t.status === 'in-progress') item.inProgressCount++
    }
    return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount)
  })

  // 任务过滤计算属性
  const filteredTasks = computed(() => {
    let list = props.tasks || []

    // 1. 年份筛选
    if (selectedYear.value !== 'all') {
      list = list.filter(t => t.year === selectedYear.value)
    }

    // 2. 项目筛选
    if (selectedProject.value !== 'all') {
      list = list.filter(t => (t.project || '常规项目').trim() === selectedProject.value)
    }

    // 3. 待发 SQL 筛选
    if (onlyPendingSql.value) {
      list = list.filter(t => (t.prodPendingCount || 0) > 0)
    }

    // 4. 搜索框文本匹配
    if (props.searchQuery && props.searchQuery.trim()) {
      const q = props.searchQuery.trim().toLowerCase()
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.project && t.project.toLowerCase().includes(q)) ||
        (t.year && t.year.toLowerCase().includes(q))
      )
    }

    return list
  })

  // 当前聚焦的任务
  const currentTask = computed(() => {
    if (filteredTasks.value.length === 0) return null

    // 优先依据历史持久化的 taskPath 匹配
    if (focusedTaskPath.value) {
      const matched = filteredTasks.value.find(t => t.fullPath === focusedTaskPath.value)
      if (matched) return matched
    }

    // 索引越界安全防跌
    const safeIdx = Math.min(focusedTaskIndex.value, filteredTasks.value.length - 1)
    return filteredTasks.value[Math.max(0, safeIdx)]
  })

  // 同步保持 focusedTaskIndex 与 focusedTaskPath / currentTask 一致
  watch(
    [filteredTasks, focusedTaskPath],
    () => {
      if (!filteredTasks.value || filteredTasks.value.length === 0) return
      if (focusedTaskPath.value) {
        const foundIdx = filteredTasks.value.findIndex(t => t.fullPath === focusedTaskPath.value)
        if (foundIdx !== -1) {
          focusedTaskIndex.value = foundIdx
          return
        }
      }
      if (focusedTaskIndex.value >= filteredTasks.value.length) {
        focusedTaskIndex.value = 0
      }
      const cur = filteredTasks.value[focusedTaskIndex.value]
      if (cur && cur.fullPath) {
        focusedTaskPath.value = cur.fullPath
      }
    },
    { immediate: true }
  )

  // 切换选中的任务 (支持传入任务对象或索引)
  async function setFocusedTask(target) {
    let task = null
    let idx = 0

    if (typeof target === 'number') {
      idx = target
      task = filteredTasks.value[idx]
    } else if (target && typeof target === 'object') {
      task = target
      idx = filteredTasks.value.findIndex(t => t.fullPath === task.fullPath)
    }

    if (!task || !task.fullPath) return

    // 优先立即更新聚焦索引与路径，确保 UI 与激活高亮即时切换
    focusedTaskIndex.value = Math.max(0, idx)
    focusedTaskPath.value = task.fullPath
    try {
      localStorage.setItem('devorbit_focused_task_path', task.fullPath)
    } catch (e) {}

    // 触发前置持久化回调（如换任务前自动刷盘备忘），异常时静默捕获不阻断任务切换
    if (typeof onTaskSwitchCallback === 'function') {
      try {
        await onTaskSwitchCallback()
      } catch (err) {
        console.error('[TaskFilter] autoFlush callback error ignored:', err)
      }
    }
  }

  // 重置全部筛选条件
  function resetAllFilters() {
    selectedYear.value = 'all'
    selectedProject.value = 'all'
    onlyPendingSql.value = false
    try {
      localStorage.setItem('devorbit_task_year', 'all')
      localStorage.setItem('devorbit_task_project', 'all')
    } catch (e) {}
  }

  // 键盘方向键上下快速切换任务
  function handleFilterKeydown(e) {
    if (filteredTasks.value.length === 0) return
    const activeEl = document.activeElement
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIdx = (focusedTaskIndex.value + 1) % filteredTasks.value.length
      setFocusedTask(nextIdx)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIdx = (focusedTaskIndex.value - 1 + filteredTasks.value.length) % filteredTasks.value.length
      setFocusedTask(prevIdx)
    }
  }

  // 监听年份和项目变化做持久化
  watch(selectedYear, (val) => {
    try { localStorage.setItem('devorbit_task_year', val) } catch (e) {}
    focusedTaskIndex.value = 0
  })

  watch(selectedProject, (val) => {
    try { localStorage.setItem('devorbit_task_project', val) } catch (e) {}
    focusedTaskIndex.value = 0
  })

  return {
    selectedYear,
    selectedProject,
    onlyPendingSql,
    focusedTaskIndex,
    focusedTaskPath,
    projectList,
    filteredTasks,
    currentTask,
    setFocusedTask,
    resetAllFilters,
    handleFilterKeydown
  }
}
