import { ref, reactive } from 'vue'
import { dbManager, createStudy, type StudyInfo } from '@/db/indexedDb'

export function useStudyManager() {
  const studies = ref<StudyInfo[]>([])
  const currentStudy = ref<StudyInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 初始化数据库
  const initializeDB = async () => {
    try {
      loading.value = true
      await dbManager.initDB()
      await loadStudies()
    } catch (err) {
      error.value = '初始化数据库失败: ' + (err as Error).message
    } finally {
      loading.value = false
    }
  }

  // 加载所有研究
  const loadStudies = async () => {
    try {
      loading.value = true
      studies.value = await dbManager.getAllStudies()
    } catch (err) {
      error.value = '加载研究列表失败: ' + (err as Error).message
    } finally {
      loading.value = false
    }
  }

  // 创建新研究
  const createNewStudy = async (name: string, description?: string) => {
    try {
      loading.value = true
      const newStudy = createStudy(name, description)
      await dbManager.saveStudy(newStudy)
      await loadStudies()
      return newStudy
    } catch (err) {
      error.value = '创建研究失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 保存研究
  const saveStudy = async (study: StudyInfo) => {
    try {
      loading.value = true
      await dbManager.saveStudy(study)
      await loadStudies()
      if (currentStudy.value?.id === study.id) {
        currentStudy.value = study
      }
    } catch (err) {
      error.value = '保存研究失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 加载特定研究
  const loadStudy = async (id: string) => {
    try {
      loading.value = true
      const study = await dbManager.getStudy(id)
      if (study) {
        currentStudy.value = study
      }
      return study
    } catch (err) {
      error.value = '加载研究失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除研究
  const deleteStudy = async (id: string) => {
    try {
      loading.value = true
      await dbManager.deleteStudy(id)
      await loadStudies()
      if (currentStudy.value?.id === id) {
        currentStudy.value = null
      }
    } catch (err) {
      error.value = '删除研究失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置当前研究
  const setCurrentStudy = (study: StudyInfo | null) => {
    currentStudy.value = study
  }

  // 更新当前研究的流程图数据
  const updateFlowData = async (flowData: any) => {
    if (currentStudy.value) {
      const updatedStudy = {
        ...currentStudy.value,
        flowData,
        updatedAt: new Date()
      }
      await saveStudy(updatedStudy)
    }
  }

  // 导出数据
  const exportData = async () => {
    try {
      const data = await dbManager.exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study_data_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      error.value = '导出数据失败: ' + (err as Error).message
      throw err
    }
  }

  // 导入数据
  const importData = async (file: File) => {
    try {
      loading.value = true
      const text = await file.text()
      const data = JSON.parse(text)
      await dbManager.importData(data)
      await loadStudies()
    } catch (err) {
      error.value = '导入数据失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    studies,
    currentStudy,
    loading,
    error,

    // 方法
    initializeDB,
    loadStudies,
    createNewStudy,
    saveStudy,
    loadStudy,
    deleteStudy,
    setCurrentStudy,
    updateFlowData,
    exportData,
    importData,
    clearError
  }
}
