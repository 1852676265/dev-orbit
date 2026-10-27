import { ref } from 'vue'
import { electronApi } from '../api/electronApi'

export function useTaskDocs(currentTask, emitToast, emitUpdated) {
  const currentDocs = ref([])

  function isWordFile(fileName) {
    if (!fileName) return false
    const lower = fileName.toLowerCase()
    return lower.endsWith('.doc') || lower.endsWith('.docx')
  }

  function isExcelFile(fileName) {
    if (!fileName) return false
    const lower = fileName.toLowerCase()
    return lower.endsWith('.xls') || lower.endsWith('.xlsx')
  }

  function isCodeDoc(fileName) {
    if (!fileName) return false
    const lower = fileName.toLowerCase()
    return (
      lower.endsWith('.md') ||
      lower.endsWith('.sql') ||
      lower.endsWith('.json') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.yml') ||
      lower.endsWith('.yaml') ||
      lower.endsWith('.xml')
    )
  }

  async function loadDocsForTask(taskPath) {
    if (!taskPath) {
      currentDocs.value = []
      return
    }
    try {
      const docsDir = `${taskPath}/docs`
      currentDocs.value = await electronApi.getDirFiles(docsDir) || []
    } catch (err) {
      console.error('加载任务文档资产失败', err)
      currentDocs.value = []
    }
  }

  function openNativeDoc(filePath) {
    if (filePath) {
      electronApi.openInExplorer(filePath)
    }
  }

  async function deleteDocItem(doc) {
    if (!doc || !doc.filePath) return
    if (!confirm(`确认将文档 [${doc.fileName}] 删除并移至 Windows 系统回收站吗？`)) return
    try {
      const ok = await electronApi.deleteFile(doc.filePath)
      if (ok) {
        if (emitToast) emitToast(`已将文档 [${doc.fileName}] 移入回收站`, 'info')
        if (currentTask.value) {
          await loadDocsForTask(currentTask.value.fullPath)
        }
        if (emitUpdated) emitUpdated()
      } else {
        if (emitToast) emitToast('删除失败: 文件不存在或已被删除', 'error')
      }
    } catch (err) {
      if (emitToast) emitToast('删除失败: ' + err.message, 'error')
    }
  }

  return {
    currentDocs,
    isWordFile,
    isExcelFile,
    isCodeDoc,
    loadDocsForTask,
    openNativeDoc,
    deleteDocItem
  }
}
