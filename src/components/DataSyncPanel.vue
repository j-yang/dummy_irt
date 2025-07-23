<template>
  <div class="data-sync-panel">
    <h3>数据同步到 OneDrive</h3>

    <!-- 浏览器支持检查 -->
    <div v-if="!isSupported" class="warning-message">
      <p>⚠️ 你的浏览器不支持文件系统 API，请使用 Chrome 86+ 或 Edge 86+</p>
    </div>

    <div v-else class="sync-content">
      <!-- 选择文件夹 -->
      <div class="sync-section">
        <h4>📁 选择同步文件夹</h4>
        <div v-if="!hasTargetDirectory" class="folder-selection">
          <p>请选择你的 OneDrive 文件夹作为数据备份位置：</p>
          <button @click="selectFolder" class="select-folder-btn">
            选择文件夹
          </button>
        </div>
        <div v-else class="folder-selected">
          <p>✅ 已选择文件夹: <strong>{{ targetDirectoryName }}</strong></p>
          <button @click="selectFolder" class="change-folder-btn">
            更换文件夹
          </button>
        </div>
      </div>

      <!-- 手动同步 -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>💾 手动备份数据</h4>
        <div class="manual-sync">
          <button
            @click="exportData"
            :disabled="syncStatus === 'syncing'"
            class="export-btn"
          >
            <span v-if="syncStatus === 'syncing'">正在备份...</span>
            <span v-else>立即备份到 OneDrive</span>
          </button>

          <div v-if="lastSyncTime" class="last-sync">
            上次备份: {{ formatTime(lastSyncTime) }}
          </div>
        </div>
      </div>

      <!-- 导入其他用户数据 -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>📥 导入协作数据</h4>
        <div class="import-section">
          <p>从 OneDrive 文件夹导入其他用户的备份数据：</p>
          <button @click="showBackupFiles" class="list-backups-btn">
            查看备份文件
          </button>

          <div v-if="backupFiles.length > 0" class="backup-files-list">
            <h5>可用的备份文件：</h5>
            <div v-for="file in backupFiles" :key="file.name" class="backup-file-item">
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-date">{{ formatFileDate(file.lastModified) }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <div class="file-actions">
                <button @click="previewBackup(file.name)" class="preview-btn">预览</button>
                <button @click="importBackup(file.name, 'merge')" class="merge-btn">合并导入</button>
                <button @click="importBackup(file.name, 'replace')" class="replace-btn">替换导入</button>
              </div>
            </div>
          </div>

          <div v-if="previewData" class="preview-panel">
            <h5>备份预览：</h5>
            <div class="preview-content">
              <p><strong>备份时间：</strong> {{ new Date(previewData.timestamp).toLocaleString('zh-CN') }}</p>
              <p><strong>项目数量：</strong> {{ previewData.projects?.length || 0 }}</p>
              <p><strong>Study ���量：</strong> {{ previewData.studies?.length || 0 }}</p>
              <p><strong>用户标识：</strong> {{ previewData.userInfo?.username || '未知用户' }}</p>

              <details class="project-details">
                <summary>项目列表 ({{ previewData.projects?.length || 0 }})</summary>
                <ul>
                  <li v-for="project in previewData.projects" :key="project.id">
                    {{ project.studyName }} ({{ project.studyId }})
                  </li>
                </ul>
              </details>
            </div>
            <button @click="previewData = null" class="close-preview-btn">关闭预览</button>
          </div>
        </div>
      </div>

      <!-- 用户设置 -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>👤 用户设置</h4>
        <div class="user-settings">
          <label>
            用户名（用于标识你的备份）：
            <input
              v-model="username"
              @change="saveUsername"
              type="text"
              placeholder="输入你的名字"
              class="username-input"
            >
          </label>
          <p class="username-note">设置用户名后，备份文件将包含你的身份信息，便于团队协作识别。</p>
        </div>
      </div>

      <!-- 自动同步设置 -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>🔄 自动同步设置</h4>
        <div class="auto-sync-controls">
          <label class="auto-sync-toggle">
            <input
              type="checkbox"
              v-model="autoSyncEnabled"
              @change="toggleAutoSync"
            >
            启用自动同步
          </label>

          <div v-if="autoSyncEnabled" class="sync-interval">
            <label>同步间隔:</label>
            <select v-model="syncInterval" @change="updateSyncInterval">
              <option value="15">15 分钟</option>
              <option value="30">30 分钟</option>
              <option value="60">1 小时</option>
              <option value="180">3 小时</option>
            </select>
          </div>

          <label v-if="autoSyncEnabled" class="auto-import-toggle">
            <input
              type="checkbox"
              v-model="autoImportEnabled"
              @change="toggleAutoImport"
            >
            自动检查并合并其他用户的新备份
          </label>
        </div>
      </div>

      <!-- 状态显示 -->
      <div v-if="syncStatus !== 'idle'" class="sync-status">
        <div v-if="syncStatus === 'syncing'" class="status-syncing">
          🔄 正在同步数据...
        </div>
        <div v-else-if="syncStatus === 'success'" class="status-success">
          ✅ 数据同步成功！
        </div>
        <div v-else-if="syncStatus === 'error'" class="status-error">
          ❌ 同步失败: {{ error }}
          <button @click="clearError" class="clear-error-btn">确定</button>
        </div>
      </div>

      <!-- 说明信息 -->
      <div class="sync-info">
        <h4>📋 功能说明</h4>
        <ul>
          <li>所有项目数据和��程图数据��备份到选定的 OneDrive 文件夹</li>
          <li>备份文件为 JSON 格式，包含时间戳</li>
          <li>自动同步会定期将最新数据保存到文件</li>
          <li>你可以在任何设备上访问这些备份文件</li>
          <li>备份文件可以用于数据恢复和迁移</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFileSystemSync } from '@/composables/useFileSystemSync'
import { fileSystemSync } from '@/composables/useFileSystemSync'

const {
  isSupported,
  hasTargetDirectory,
  targetDirectoryName,
  autoSyncEnabled,
  syncStatus,
  lastSyncTime,
  error,
  selectSyncFolder,
  exportData,
  startAutoSync,
  stopAutoSync,
  clearError
} = useFileSystemSync()

const syncInterval = ref(30) // 默认 30 分钟
const autoImportEnabled = ref(false)
const backupFiles = ref<File[]>([])
const previewData = ref<any>(null)
const username = ref('')

// 加载保存的用户名
onMounted(() => {
  const savedUsername = localStorage.getItem('sync_username')
  if (savedUsername) {
    username.value = savedUsername
  }
})

const selectFolder = async () => {
  await selectSyncFolder()
}

const toggleAutoSync = async () => {
  if (autoSyncEnabled.value) {
    await startAutoSync(syncInterval.value)
  } else {
    stopAutoSync()
  }
}

const updateSyncInterval = async () => {
  if (autoSyncEnabled.value) {
    stopAutoSync()
    await startAutoSync(syncInterval.value)
  }
}

const toggleAutoImport = () => {
  // TODO: 实现自动导入功能
  console.log('Auto import toggled:', autoImportEnabled.value)
}

// 查看备份文件
const showBackupFiles = async () => {
  try {
    const files = await fileSystemSync.listBackupFiles()
    backupFiles.value = files
    console.log('Found backup files:', files.length)
  } catch (err) {
    console.error('Failed to list backup files:', err)
  }
}

// 预览备份文件
const previewBackup = async (filename: string) => {
  try {
    const data = await fileSystemSync.previewBackupFile(filename)
    previewData.value = data
  } catch (err) {
    console.error('Failed to preview backup:', err)
  }
}

// 导入备份文件
const importBackup = async (filename: string, mode: 'merge' | 'replace') => {
  try {
    const success = await fileSystemSync.importAllData(filename, mode)
    if (success) {
      console.log(`Successfully imported ${filename} in ${mode} mode`)
      // 刷新页面以显示新数据
      window.location.reload()
    }
  } catch (err) {
    console.error('Failed to import backup:', err)
  }
}

// 保存用户名
const saveUsername = () => {
  localStorage.setItem('sync_username', username.value)
  console.log('Username saved:', username.value)
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

// 格式化文件日期
const formatFileDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return Math.round(bytes / (1024 * 1024)) + ' MB'
}
</script>

<style scoped>
.data-sync-panel {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-sync-panel h3 {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.25rem;
}

.warning-message {
  background: #fef3cd;
  color: #856404;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
}

.sync-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.sync-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.sync-section h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.folder-selection p,
.folder-selected p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.select-folder-btn,
.change-folder-btn,
.export-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.select-folder-btn:hover,
.change-folder-btn:hover,
.export-btn:hover {
  background: #2563eb;
}

.export-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.change-folder-btn {
  background: #6b7280;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.change-folder-btn:hover {
  background: #4b5563;
}

.folder-selected strong {
  color: #059669;
}

.last-sync {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.auto-sync-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auto-sync-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.sync-interval {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sync-interval select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}

.sync-status {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
}

.status-syncing {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.status-error {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-error-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.sync-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.sync-info h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.sync-info ul {
  margin: 0;
  padding-left: 1.25rem;
}

.sync-info li {
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-size: 0.9rem;
}

.backup-files-list {
  margin-top: 1rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
}

.backup-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.backup-file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.file-date,
.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
}

.preview-content {
  margin-bottom: 1rem;
  color: #374151;
}

.project-details {
  margin-top: 0.5rem;
}

.close-preview-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.close-preview-btn:hover {
  background: #2563eb;
}

.username-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 100%;
  max-width: 300px;
}

.username-note {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.auto-import-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.list-backups-btn,
.preview-btn,
.merge-btn,
.replace-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.list-backups-btn:hover,
.preview-btn:hover {
  background: #2563eb;
}

.merge-btn {
  background: #059669;
}

.merge-btn:hover {
  background: #047857;
}

.replace-btn {
  background: #dc2626;
}

.replace-btn:hover {
  background: #b91c1c;
}

.list-backups-btn {
  background: #6b7280;
}

.list-backups-btn:hover {
  background: #4b5563;
}
</style>
