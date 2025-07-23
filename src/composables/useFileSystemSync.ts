import { dbManager } from '@/db/indexedDb'
import { ref, reactive } from 'vue'

export interface FileSystemSyncOptions {
  autoSync: boolean
  syncInterval: number // 分钟
  targetDirectory?: FileSystemDirectoryHandle
}

class FileSystemDataSync {
  private syncInterval: number | null = null
  private targetDirectory: FileSystemDirectoryHandle | null = null
  private autoSync = false

  // 选择目标文件夹
  async selectTargetDirectory(): Promise<boolean> {
    try {
      // 使用 File System Access API 选择文件夹
      if ('showDirectoryPicker' in window) {
        this.targetDirectory = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        })
        console.log('Target directory selected:', this.targetDirectory?.name)
        return true
      } else {
        console.warn('File System Access API not supported')
        return false
      }
    } catch (err) {
      console.error('Failed to select directory:', err)
      return false
    }
  }

  // 保存数据到文件
  async saveDataToFile(filename: string, data: any): Promise<boolean> {
    try {
      if (!this.targetDirectory) {
        console.error('No target directory selected')
        return false
      }

      // 创建文件
      const fileHandle = await this.targetDirectory.getFileHandle(filename, {
        create: true
      })

      // 写入数据
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()

      console.log(`Data saved to ${filename}`)
      return true
    } catch (err) {
      console.error('Failed to save data to file:', err)
      return false
    }
  }

  // 从文件加载数据
  async loadDataFromFile(filename: string): Promise<any | null> {
    try {
      if (!this.targetDirectory) {
        console.error('No target directory selected')
        return null
      }

      const fileHandle = await this.targetDirectory.getFileHandle(filename)
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text)
    } catch (err) {
      console.error('Failed to load data from file:', err)
      return null
    }
  }

  // 导出所有数据到 OneDrive 文件夹
  async exportAllData(): Promise<boolean> {
    try {
      // 获取 IndexedDB 中的所有数据
      const dbData = await dbManager.exportAllData()

      // 获取 localStorage 中的项目数据
      const projectsData = localStorage.getItem('projectManager_projects')
      const projects = projectsData ? JSON.parse(projectsData) : []

      // 获取用户信息
      const username = localStorage.getItem('sync_username') || 'Unknown User'

      // 合并所有数据
      const allData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        userInfo: {
          username,
          hostname: window.location.hostname,
          userAgent: navigator.userAgent.substring(0, 100) // 限制长度
        },
        projects: projects,
        studies: dbData.studies,
        settings: dbData.settings,
        localStorage: {
          projectManager_projects: projects,
          currentProject: localStorage.getItem('currentProject'),
          installPromptDismissed: localStorage.getItem('installPromptDismissed'),
          iosPromptDismissed: localStorage.getItem('iosPromptDismissed')
        }
      }

      // 保存到文件，文件名包含用户名
      const safeUsername = username.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      const filename = `dbl_flow_backup_${safeUsername}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
      return await this.saveDataToFile(filename, allData)
    } catch (err) {
      console.error('Failed to export all data:', err)
      return false
    }
  }

  // 从 OneDrive 文件夹导入数据（支持合并模式）
  async importAllData(filename: string, mode: 'merge' | 'replace' = 'replace'): Promise<boolean> {
    try {
      const data = await this.loadDataFromFile(filename)
      if (!data) return false

      if (mode === 'merge') {
        // 合并模式：智能合并数据
        await this.mergeData(data)
      } else {
        // 替换模式：完全替换现有数据
        await this.replaceData(data)
      }

      console.log(`Data imported successfully in ${mode} mode`)
      return true
    } catch (err) {
      console.error('Failed to import data:', err)
      return false
    }
  }

  // 智能合并数据
  private async mergeData(importData: any): Promise<void> {
    // 获取当前数据
    const currentProjects = JSON.parse(localStorage.getItem('projectManager_projects') || '[]')
    const currentDbData = await dbManager.exportAllData()

    // 合并项目数据
    const mergedProjects = [...currentProjects]
    if (importData.projects) {
      for (const importProject of importData.projects) {
        // 检查是否已存在相同的 studyId
        const existingIndex = mergedProjects.findIndex(p => p.studyId === importProject.studyId)
        if (existingIndex >= 0) {
          // 如果导入的项目更新时间更晚，则替换
          const existingProject = mergedProjects[existingIndex]
          const importTime = new Date(importProject.createdAt || 0)
          const existingTime = new Date(existingProject.createdAt || 0)

          if (importTime > existingTime) {
            mergedProjects[existingIndex] = {
              ...importProject,
              id: existingProject.id, // 保持原有的内部ID
              mergedFrom: importData.userInfo?.username || 'Unknown User'
            }
          }
        } else {
          // 新项目，直接添加
          mergedProjects.push({
            ...importProject,
            mergedFrom: importData.userInfo?.username || 'Unknown User'
          })
        }
      }
    }

    // 合并 Studies 数据
    const mergedStudies = [...currentDbData.studies]
    if (importData.studies) {
      for (const importStudy of importData.studies) {
        const existingIndex = mergedStudies.findIndex(s => s.id === importStudy.id)
        if (existingIndex >= 0) {
          // 比较更新时间
          const importTime = new Date(importStudy.updatedAt || 0)
          const existingTime = new Date(mergedStudies[existingIndex].updatedAt || 0)

          if (importTime > existingTime) {
            mergedStudies[existingIndex] = importStudy
          }
        } else {
          mergedStudies.push(importStudy)
        }
      }
    }

    // 保存合并后的数据
    localStorage.setItem('projectManager_projects', JSON.stringify(mergedProjects))

    if (importData.studies || importData.settings) {
      await dbManager.importData({
        studies: mergedStudies,
        settings: [...currentDbData.settings, ...(importData.settings || [])]
      })
    }
  }

  // 完全替换数据
  private async replaceData(importData: any): Promise<void> {
    // 恢复到 IndexedDB
    if (importData.studies && importData.settings) {
      await dbManager.importData({
        studies: importData.studies,
        settings: importData.settings
      })
    }

    // 恢复到 localStorage
    if (importData.localStorage) {
      Object.entries(importData.localStorage).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
        }
      })
    }
  }

  // 列出备份文件夹中的所有备份文件
  async listBackupFiles(): Promise<File[]> {
    try {
      if (!this.targetDirectory) {
        console.error('No target directory selected')
        return []
      }

      const files: File[] = []
      // 使用 values() 方法遍历目录
      for await (const handle of (this.targetDirectory as any).values()) {
        if (handle.kind === 'file' && handle.name.includes('dbl_flow_backup_') && handle.name.endsWith('.json')) {
          const file = await handle.getFile()
          files.push(file)
        }
      }

      // 按修改时间排序（最新的在前）
      return files.sort((a, b) => b.lastModified - a.lastModified)
    } catch (err) {
      console.error('Failed to list backup files:', err)
      return []
    }
  }

  // 预览备份文件内容
  async previewBackupFile(filename: string): Promise<any> {
    try {
      return await this.loadDataFromFile(filename)
    } catch (err) {
      console.error('Failed to preview backup file:', err)
      return null
    }
  }

  // 启动自动同步
  async startAutoSync(intervalMinutes: number = 30): Promise<void> {
    this.autoSync = true
    this.syncInterval = window.setInterval(async () => {
      if (this.autoSync && this.targetDirectory) {
        console.log('Auto-syncing data...')
        await this.exportAllData()
      }
    }, intervalMinutes * 60 * 1000)
  }

  // 停止自动同步
  stopAutoSync(): void {
    this.autoSync = false
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // 检查是否已选择目标文件夹
  hasTargetDirectory(): boolean {
    return this.targetDirectory !== null
  }

  // 获取目标文件夹名称
  getTargetDirectoryName(): string | null {
    return this.targetDirectory?.name || null
  }
}

// 单例模式
export const fileSystemSync = new FileSystemDataSync()

export function useFileSystemSync() {
  const isSupported = ref('showDirectoryPicker' in window)
  const hasTargetDirectory = ref(fileSystemSync.hasTargetDirectory())
  const targetDirectoryName = ref(fileSystemSync.getTargetDirectoryName())
  const autoSyncEnabled = ref(false)
  const syncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const lastSyncTime = ref<Date | null>(null)
  const error = ref<string | null>(null)

  // 选择同步文件夹
  const selectSyncFolder = async () => {
    try {
      const success = await fileSystemSync.selectTargetDirectory()
      if (success) {
        hasTargetDirectory.value = true
        targetDirectoryName.value = fileSystemSync.getTargetDirectoryName()
        error.value = null
      } else {
        error.value = '选择文件夹失败或用户取消'
      }
      return success
    } catch (err) {
      error.value = '选择文件夹时出错: ' + (err as Error).message
      return false
    }
  }

  // 手动导出数据
  const exportData = async () => {
    try {
      syncStatus.value = 'syncing'
      error.value = null

      const success = await fileSystemSync.exportAllData()
      if (success) {
        syncStatus.value = 'success'
        lastSyncTime.value = new Date()
      } else {
        syncStatus.value = 'error'
        error.value = '导出数据失败'
      }
      return success
    } catch (err) {
      syncStatus.value = 'error'
      error.value = '导出数据时出错: ' + (err as Error).message
      return false
    }
  }

  // 导入数据
  const importData = async (filename: string) => {
    try {
      syncStatus.value = 'syncing'
      error.value = null

      const success = await fileSystemSync.importAllData(filename)
      if (success) {
        syncStatus.value = 'success'
        // 刷新页面以加载新数据
        window.location.reload()
      } else {
        syncStatus.value = 'error'
        error.value = '导入数据失败'
      }
      return success
    } catch (err) {
      syncStatus.value = 'error'
      error.value = '导入数据时出错: ' + (err as Error).message
      return false
    }
  }

  // 启动自动同步
  const startAutoSync = async (intervalMinutes: number = 30) => {
    try {
      await fileSystemSync.startAutoSync(intervalMinutes)
      autoSyncEnabled.value = true
      error.value = null
    } catch (err) {
      error.value = '启动自动同步失败: ' + (err as Error).message
    }
  }

  // 停止自动同步
  const stopAutoSync = () => {
    fileSystemSync.stopAutoSync()
    autoSyncEnabled.value = false
  }

  // 清除错误
  const clearError = () => {
    error.value = null
    syncStatus.value = 'idle'
  }

  return {
    // 状态
    isSupported,
    hasTargetDirectory,
    targetDirectoryName,
    autoSyncEnabled,
    syncStatus,
    lastSyncTime,
    error,

    // 方法
    selectSyncFolder,
    exportData,
    importData,
    startAutoSync,
    stopAutoSync,
    clearError
  }
}
