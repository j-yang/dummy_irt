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

  // 导出数据到 JSON 文件
  const exportToJSON = async () => {
    try {
      loading.value = true
      const data = await dbManager.exportAllData()

      // 创建 JSON 文件并下载
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `dbl-studies-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      return data
    } catch (err) {
      error.value = '导出数据失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 从 JSON 文件导入数据
  const importFromJSON = async (file: File) => {
    try {
      loading.value = true

      const text = await file.text()
      const data = JSON.parse(text)

      // 验证数据格式
      if (!data.studies || !Array.isArray(data.studies)) {
        throw new Error('无效的数据格式: 缺少 studies 数组')
      }

      await dbManager.importAllData(data)
      await loadStudies()

      // 清除当前研究选择
      currentStudy.value = null

      return data
    } catch (err) {
      if (err instanceof SyntaxError) {
        error.value = '导入失败: JSON 文件格式错误'
      } else {
        error.value = '导入数据失败: ' + (err as Error).message
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // 清空所有数据
  const clearAllData = async () => {
    try {
      loading.value = true
      await dbManager.clearAllData()
      studies.value = []
      currentStudy.value = null
    } catch (err) {
      error.value = '清空数据失败: ' + (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建文件输入元素用于导入
  const createFileInput = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    return input
  }

  // 触发文件选择对话框
  const triggerImport = () => {
    return new Promise<File | null>((resolve) => {
      const input = createFileInput()
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        resolve(file || null)
      }
      input.onclick = () => {
        // 重置 input 值，允许选择同一个文件
        input.value = ''
      }
      input.click()
    })
  }

  return {
    studies,
    currentStudy,
    loading,
    error,
    initializeDB,
    loadStudies,
    createNewStudy,
    saveStudy,
    loadStudy,
    deleteStudy,
    setCurrentStudy,
    updateFlowData,
    exportToJSON,
    importFromJSON,
    clearAllData,
    triggerImport
  }
}
