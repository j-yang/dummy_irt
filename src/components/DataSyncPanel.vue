<template>
  <div class="data-sync-panel">
    <h3>Data Sync to OneDrive</h3>

    <!-- Browser support check -->
    <div v-if="!isSupported" class="warning-message">
      <p>⚠️ Your browser does not support the File System API. Please use Chrome 86+ or Edge 86+</p>
    </div>

    <div v-else class="sync-content">
      <!-- Select folder -->
      <div class="sync-section">
        <h4>📁 Select Sync Folder</h4>
        <div v-if="!hasTargetDirectory" class="folder-selection">
          <p>Please select your OneDrive folder as the data backup location:</p>
          <button @click="selectFolder" class="select-folder-btn">
            Select Folder
          </button>
        </div>
        <div v-else class="folder-selected">
          <p>✅ Selected folder: <strong>{{ targetDirectoryName }}</strong></p>
          <div class="folder-actions">
            <button @click="selectFolder" class="change-folder-btn">
              Change Folder
            </button>
            <button @click="verifyAccess" class="verify-access-btn">
              Verify Access
            </button>
          </div>
          <p v-if="savedDirectoryInfo" class="folder-note">
            📝 Folder selection is remembered across sessions
          </p>
        </div>
      </div>

      <!-- Manual sync -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>💾 Manual Data Backup</h4>
        <div class="manual-sync">
          <button
            @click="exportData"
            :disabled="syncStatus === 'syncing'"
            class="export-btn"
          >
            <span v-if="syncStatus === 'syncing'">Backing up...</span>
            <span v-else>Backup to OneDrive Now</span>
          </button>

          <div v-if="lastSyncTime" class="last-sync">
            Last backup: {{ formatTime(lastSyncTime) }}
          </div>
        </div>
      </div>

      <!-- Import collaboration data -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>📥 Import Collaboration Data</h4>
        <div class="import-section">
          <p>Import backup data from other users from your OneDrive folder:</p>
          <button @click="showBackupFiles" class="list-backups-btn">
            View Backup Files
          </button>

          <div v-if="backupFiles.length > 0" class="backup-files-list">
            <h5>Available backup files:</h5>
            <div v-for="file in backupFiles" :key="file.name" class="backup-file-item">
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-date">{{ formatFileDate(file.lastModified) }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <div class="file-actions">
                <button @click="previewBackup(file.name)" class="preview-btn">Preview</button>
                <button @click="importBackup(file.name, 'merge')" class="merge-btn">Merge Import</button>
              </div>
            </div>
          </div>

          <div v-if="previewData" class="preview-panel">
            <h5>Backup Preview:</h5>
            <div class="preview-content">
              <p><strong>Backup time:</strong> {{ new Date(previewData.timestamp).toLocaleString() }}</p>
              <p><strong>Number of projects:</strong> {{ previewData.projects?.length || 0 }}</p>
              <p><strong>Number of studies:</strong> {{ previewData.studies?.length || 0 }}</p>
              <p><strong>User identifier:</strong> {{ previewData.userInfo?.username || 'Unknown user' }}</p>

              <details class="project-details">
                <summary>Project list ({{ previewData.projects?.length || 0 }})</summary>
                <ul>
                  <li v-for="project in previewData.projects" :key="project.id">
                    {{ project.studyName }} ({{ project.studyId }})
                  </li>
                </ul>
              </details>
            </div>
            <button @click="previewData = null" class="close-preview-btn">Close Preview</button>
          </div>
        </div>
      </div>

      <!-- User settings -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>👤 User Settings</h4>
        <div class="user-settings">
          <label>
            Username (to identify your backups):
            <input
              v-model="username"
              @change="saveUsername"
              type="text"
              placeholder="Enter your name"
              class="username-input"
            >
          </label>
          <p class="username-note">After setting a username, backup files will include your identity information for team collaboration identification.</p>
        </div>
      </div>

      <!-- Auto sync settings -->
      <div v-if="hasTargetDirectory" class="sync-section">
        <h4>🔄 Auto Sync Settings</h4>
        <div class="auto-sync-controls">
          <label class="auto-sync-toggle">
            <input
              type="checkbox"
              v-model="autoSyncEnabled"
              @change="toggleAutoSync"
            >
            Enable auto sync
          </label>

          <div v-if="autoSyncEnabled" class="sync-interval">
            <label>Sync interval:</label>
            <select v-model="syncInterval" @change="updateSyncInterval">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="180">3 hours</option>
            </select>
          </div>

          <label v-if="autoSyncEnabled" class="auto-import-toggle">
            <input
              type="checkbox"
              v-model="autoImportEnabled"
              @change="toggleAutoImport"
            >
            Automatically check and merge new backups from other users
          </label>
        </div>
      </div>

      <!-- Status display -->
      <div v-if="syncStatus !== 'idle'" class="sync-status">
        <div v-if="syncStatus === 'syncing'" class="status-syncing">
          🔄 Syncing data...
        </div>
        <div v-else-if="syncStatus === 'success'" class="status-success">
          ✅ Data sync successful!
        </div>
        <div v-else-if="syncStatus === 'error'" class="status-error">
          ❌ Sync failed: {{ error }}
          <button @click="clearError" class="clear-error-btn">OK</button>
        </div>
      </div>

      <!-- Information -->
      <div class="sync-info">
        <h4>📋 Feature Description</h4>
        <ul>
          <li>All project data and flow chart data will be backed up to the selected OneDrive folder</li>
          <li>Backup files are in JSON format and include timestamps</li>
          <li>Auto sync will periodically save the latest data to files</li>
          <li>You can access these backup files on any device</li>
          <li>Backup files can be used for data recovery and migration</li>
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

const syncInterval = ref(30) // Default 30 minutes
const autoImportEnabled = ref(false)
const backupFiles = ref<File[]>([])
const previewData = ref<any>(null)
const username = ref('')

// Check if directory info is saved
const savedDirectoryInfo = localStorage.getItem('sync_directory_info')

// Load saved username
onMounted(() => {
  const savedUsername = localStorage.getItem('sync_username')
  if (savedUsername) {
    username.value = savedUsername
  }
})

const selectFolder = async () => {
  await selectSyncFolder()
}

// Verify directory access
const verifyAccess = async () => {
  try {
    const hasAccess = await fileSystemSync.verifyDirectoryAccess()
    if (hasAccess) {
      // Update UI to show access is verified
      console.log('Directory access verified')
    } else {
      // Prompt user to reselect folder
      await selectFolder()
    }
  } catch (err) {
    console.error('Failed to verify access:', err)
    await selectFolder()
  }
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
  // TODO: Implement auto import functionality
  console.log('Auto import toggled:', autoImportEnabled.value)
}

// View backup files
const showBackupFiles = async () => {
  try {
    const files = await fileSystemSync.listBackupFiles()
    backupFiles.value = files
    console.log('Found backup files:', files.length)
  } catch (err) {
    console.error('Failed to list backup files:', err)
  }
}

// Preview backup file
const previewBackup = async (filename: string) => {
  try {
    const data = await fileSystemSync.previewBackupFile(filename)
    previewData.value = data
  } catch (err) {
    console.error('Failed to preview backup:', err)
  }
}

// Import backup file
const importBackup = async (filename: string, mode: 'merge') => {
  try {
    syncStatus.value = 'syncing'
    error.value = null

    const success = await fileSystemSync.importAllData(filename, mode)
    if (success) {
      syncStatus.value = 'success'
      console.log(`Successfully imported ${filename} in ${mode} mode`)
      // Show success message before reload
      setTimeout(() => {
        // Refresh page to display new data
        window.location.reload()
      }, 1500)
    } else {
      syncStatus.value = 'error'
      error.value = `Failed to import ${filename}`
    }
  } catch (err) {
    syncStatus.value = 'error'
    error.value = `Error importing backup: ${(err as Error).message}`
    console.error('Failed to import backup:', err)
  }
}

// Save username
const saveUsername = () => {
  localStorage.setItem('sync_username', username.value)
  console.log('Username saved:', username.value)
}

// Format time
const formatTime = (date: Date) => {
  return date.toLocaleString()
}

// Format file date
const formatFileDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return Math.round(bytes / (1024 * 1024)) + ' MB'
}
</script>

<style scoped>
.data-sync-panel {
  height: 100%;
  overflow-y: auto;
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

.folder-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.verify-access-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.verify-access-btn:hover {
  background: #059669;
}

.folder-note {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  font-style: italic;
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
.merge-btn {
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

.list-backups-btn {
  background: #6b7280;
}

.list-backups-btn:hover {
  background: #4b5563;
}
</style>
