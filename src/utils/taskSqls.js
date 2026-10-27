/**
 * 【逻辑层】SQL 脚本扫描、产线状态管理、新建与删除逻辑
 */
import { ref } from 'vue'
import { electronApi } from './api'

export function useTaskSqls(currentTask, emitToast, emitUpdated) {
  const currentSqls = ref([])
  const loadingSqls = ref(false)
  const sqlMergeModalOpen = ref(false)

  async function loadSqlsForTask(taskPath) {
    if (!taskPath) {
      currentSqls.value = []
      return
    }
    loadingSqls.value = true
    try {
      currentSqls.value = await electronApi.getSqlFiles(taskPath) || []
    } catch (err) {
      console.error('加载任务 SQL 脚本失败', err)
      currentSqls.value = []
    } finally {
      loadingSqls.value = false
    }
  }

  async function promptToggleProdStatus(sql) {
    if (!sql || !currentTask.value) return
    const isReleased = Boolean(sql.prodReleased)
    const targetStatus = !isReleased
    const promptMsg = targetStatus
      ? `确认将 SQL 脚本 [${sql.fileName}] 标记为【产线已上线】吗？`
      : `确认撤回 SQL 脚本 [${sql.fileName}] 的产线状态，重新标记为【待发产线】吗？`

    if (!confirm(promptMsg)) return

    try {
      await electronApi.setSqlReleaseStatus(
        currentTask.value.fullPath,
        sql.fileName,
        'prod',
        targetStatus
      )
      sql.prodReleased = targetStatus
      sql.prodReleasedAt = targetStatus ? new Date().toLocaleString() : null

      if (emitToast) {
        emitToast(
          targetStatus
            ? `SQL [${sql.fileName}] 已标记为【产线已发】`
            : `SQL [${sql.fileName}] 已重置为【待发产线】`,
          targetStatus ? 'success' : 'info'
        )
      }
      if (emitUpdated) emitUpdated()
    } catch (err) {
      if (emitToast) emitToast('更新产线状态失败: ' + err.message, 'error')
    }
  }

  async function createNewSqlFile() {
    if (!currentTask.value) return
    const name = prompt('请输入新 SQL 脚本文件名 (如: 02_create_table.sql)：', '')
    if (!name || !name.trim()) return

    let fileName = name.trim()
    if (!fileName.toLowerCase().endsWith('.sql')) fileName += '.sql'

    try {
      const sqlDir = `${currentTask.value.fullPath}/sql`
      const defaultTemplate = `-- ========================================================\n-- 脚本名称: ${fileName}\n-- 所属任务: ${currentTask.value.title}\n-- 创建时间: ${new Date().toLocaleString()}\n-- 编写人员: DevOrbit\n-- ========================================================\n\n-- 在此编写 Dameng/Oracle 兼容 DDL/DML 语句\n`
      await electronApi.createTextFile(sqlDir, fileName, defaultTemplate)
      await loadSqlsForTask(currentTask.value.fullPath)
      if (emitToast) emitToast(`已创建 SQL 脚本: ${fileName}`, 'success')
      if (emitUpdated) emitUpdated()
    } catch (err) {
      if (emitToast) emitToast('创建失败: ' + err.message, 'error')
    }
  }

  async function deleteSqlItem(sql) {
    if (!sql || !sql.filePath) return
    if (!confirm(`确认将 SQL 脚本 [${sql.fileName}] 删除并移至 Windows 系统回收站吗？`)) return
    try {
      const ok = await electronApi.deleteFile(sql.filePath)
      if (ok) {
        if (emitToast) emitToast(`已将 SQL [${sql.fileName}] 移入回收站`, 'info')
        if (currentTask.value) {
          await loadSqlsForTask(currentTask.value.fullPath)
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
    currentSqls,
    loadingSqls,
    sqlMergeModalOpen,
    loadSqlsForTask,
    promptToggleProdStatus,
    createNewSqlFile,
    deleteSqlItem
  }
}
