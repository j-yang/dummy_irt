<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ step.title }}</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="step-info">
          <div class="info-row">
            <label>状态:</label>
            <div class="status-controls">
              <label class="radio-label">
                <input
                  type="radio"
                  :value="false"
                  v-model="localStep.completed"
                  @change="updateProgress"
                />
                未完成
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  :value="true"
                  v-model="localStep.completed"
                  @change="updateProgress"
                />
                已完成
              </label>
            </div>
          </div>

          <div class="info-row">
            <label>描述:</label>
            <textarea
              v-model="localStep.description"
              @input="updateStep"
              rows="3"
              class="description-input"
            ></textarea>
          </div>

          <div class="info-row">
            <label>备注:</label>
            <div class="notes-container">
              <div
                v-for="(note, index) in localStep.notes"
                :key="index"
                class="note-item"
              >
                <input
                  v-model="localStep.notes![index]"
                  @input="updateStep"
                  class="note-input"
                />
                <button @click="removeNote(index)" class="remove-note-btn">×</button>
              </div>
              <button @click="addNote" class="add-note-btn">+ 添加备注</button>
            </div>
          </div>
        </div>

        <div class="attachments-section">
          <h3>附件管理</h3>

          <div class="file-upload-area">
            <div
              class="drop-zone"
              @dragover.prevent
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                @change="handleFileSelect"
                style="display: none"
              />
              <div class="drop-zone-content">
                <i class="upload-icon">📁</i>
                <p>点击或拖拽文件到这里</p>
                <p class="file-types">支持: PDF, DOC, DOCX, TXT, 图片</p>
              </div>
            </div>
          </div>

          <div v-if="localStep.attachments?.length" class="attachments-list">
            <h4>已添加的附件:</h4>
            <div
              v-for="(file, index) in localStep.attachments"
              :key="index"
              class="attachment-item"
            >
              <div class="file-info">
                <i class="file-icon">{{ getFileIcon(file.name) }}</i>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <button @click="previewFile(file)" class="action-btn preview-btn">
                  预览
                </button>
                <button @click="downloadFile(file)" class="action-btn download-btn">
                  下载
                </button>
                <button @click="removeAttachment(index)" class="action-btn remove-btn">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="step.hasUpload" class="upload-section">
          <h3>SFTP 上传</h3>
          <div class="upload-config">
            <div class="config-row">
              <label>服务器地址:</label>
              <input v-model="sftpConfig.host" placeholder="192.168.1.100" />
            </div>
            <div class="config-row">
              <label>端口:</label>
              <input v-model="sftpConfig.port" type="number" placeholder="22" />
            </div>
            <div class="config-row">
              <label>用户名:</label>
              <input v-model="sftpConfig.username" placeholder="username" />
            </div>
            <div class="config-row">
              <label>密码:</label>
              <input v-model="sftpConfig.password" type="password" placeholder="password" />
            </div>
            <div class="config-row">
              <label>远程路径:</label>
              <input v-model="sftpConfig.remotePath" placeholder="/upload/" />
            </div>
          </div>

          <div class="upload-actions">
            <button @click="testConnection" class="btn btn-secondary">
              测试连接
            </button>
            <button
              @click="uploadToSftp"
              :disabled="!localStep.attachments?.length"
              class="btn btn-primary"
            >
              上传所有文件
            </button>
          </div>

          <div v-if="uploadProgress.length" class="upload-progress">
            <h4>上传进度:</h4>
            <div
              v-for="progress in uploadProgress"
              :key="progress.fileName"
              class="progress-item"
            >
              <span class="progress-name">{{ progress.fileName }}</span>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${progress.progress}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ progress.progress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">关闭</button>
        <button @click="saveChanges" class="btn btn-primary">保存更改</button>
      </div>
    </div>
  </div>

  <!-- File Preview Modal -->
  <div v-if="previewFileRef" class="modal-overlay" @click="closePreview">
    <div class="preview-modal" @click.stop>
      <div class="preview-header">
        <h3>{{ previewFileRef.name }}</h3>
        <button @click="closePreview" class="close-btn">&times;</button>
      </div>
      <div class="preview-content">
        <div v-if="previewFileRef.type.startsWith('image/')" class="image-preview">
          <img :src="previewUrl" alt="预览图片" />
        </div>
        <div v-else-if="previewFileRef.type === 'text/plain'" class="text-preview">
          <pre>{{ previewContent }}</pre>
        </div>
        <div v-else class="unsupported-preview">
          <i class="file-icon-large">📄</i>
          <p>此文件类型暂不支持预览</p>
          <button @click="downloadFile(previewFileRef)" class="btn btn-primary">
            下载文件
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { saveAs } from 'file-saver'

interface StepData {
  id: string
  stepNumber: string
  title: string
  description: string
  completed: boolean
  inProgress: boolean
  hasAttachments: boolean
  hasUpload: boolean
  attachments?: File[]
  notes?: string[]
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
}

const props = defineProps<{
  step: StepData
}>()

const emit = defineEmits<{
  close: []
  'update-step': [step: StepData]
  'upload-file': [stepId: string, file: File, uploadToSftp: boolean]
}>()

const localStep = reactive<StepData>({ ...props.step })
const fileInput = ref<HTMLInputElement>()
const previewFileRef = ref<File | null>(null)
const previewUrl = ref<string>('')
const previewContent = ref<string>('')
const uploadProgress = ref<UploadProgress[]>([])

const sftpConfig = reactive({
  host: '',
  port: 22,
  username: '',
  password: '',
  remotePath: '/upload/'
})

const updateStep = () => {
  emit('update-step', localStep)
}

const updateProgress = () => {
  if (localStep.completed) {
    localStep.inProgress = false
  }
  updateStep()
}

const addNote = () => {
  if (!localStep.notes) {
    localStep.notes = []
  }
  localStep.notes.push('')
  updateStep()
}

const removeNote = (index: number) => {
  localStep.notes?.splice(index, 1)
  updateStep()
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (files: File[]) => {
  if (!localStep.attachments) {
    localStep.attachments = []
  }

  const validFiles = files.filter(file => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    return validTypes.includes(file.type) || file.name.endsWith('.docx')
  })

  localStep.attachments.push(...validFiles)
  updateStep()
}

const removeAttachment = (index: number) => {
  localStep.attachments?.splice(index, 1)
  updateStep()
}

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return '📄'
    case 'doc':
    case 'docx': return '📝'
    case 'txt': return '📃'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return '🖼️'
    default: return '📁'
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const previewFile = async (file: File) => {
  previewFileRef.value = file

  if (file.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(file)
  } else if (file.type === 'text/plain') {
    previewContent.value = await file.text()
  }
}

const closePreview = () => {
  previewFileRef.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  previewContent.value = ''
}

const downloadFile = (file: File) => {
  saveAs(file, file.name)
}

const testConnection = async () => {
  try {
    // 在实际应用中，这里应该调用后端API来测试SFTP连接
    const response = await fetch('/api/sftp/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sftpConfig)
    })

    if (response.ok) {
      alert('连接测试成功！')
    } else {
      alert('连接测试失败，请检查配置')
    }
  } catch (error) {
    console.error('Connection test failed:', error)
    alert('连接测试失败')
  }
}

const uploadToSftp = async () => {
  if (!localStep.attachments?.length) return

  uploadProgress.value = localStep.attachments.map(file => ({
    fileName: file.name,
    progress: 0,
    status: 'pending' as const
  }))

  for (let i = 0; i < localStep.attachments.length; i++) {
    const file = localStep.attachments[i]
    const progressItem = uploadProgress.value[i]

    try {
      progressItem.status = 'uploading'

      // 模拟上传进度
      const uploadInterval = setInterval(() => {
        if (progressItem.progress < 90) {
          progressItem.progress += Math.random() * 20
        }
      }, 200)

      // 在实际应用中，这里应该调用后端API来上传文件
      const formData = new FormData()
      formData.append('file', file)
      formData.append('config', JSON.stringify(sftpConfig))

      const response = await fetch('/api/sftp/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(uploadInterval)

      if (response.ok) {
        progressItem.progress = 100
        progressItem.status = 'completed'
      } else {
        progressItem.status = 'error'
      }
    } catch (error) {
      console.error('Upload failed:', error)
      progressItem.status = 'error'
    }
  }
}

const saveChanges = () => {
  emit('update-step', localStep)
  emit('close')
}

onMounted(() => {
  // 初始化本地步骤数据
  if (!localStep.notes) {
    localStep.notes = []
  }
  if (!localStep.attachments) {
    localStep.attachments = []
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.step-info {
  margin-bottom: 2rem;
}

.info-row {
  margin-bottom: 1rem;
}

.info-row label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.status-controls {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

.description-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  resize: vertical;
}

.notes-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.note-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.remove-note-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.add-note-btn {
  align-self: flex-start;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}

.attachments-section {
  margin-bottom: 2rem;
}

.attachments-section h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 2rem;
}

.file-types {
  font-size: 0.875rem;
  color: #6b7280;
}

.attachments-list {
  margin-top: 1rem;
}

.attachments-list h4 {
  margin-bottom: 0.5rem;
  color: #374151;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-icon {
  font-size: 1.5rem;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.preview-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.download-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.remove-btn {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.upload-section h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.upload-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.config-row {
  display: flex;
  flex-direction: column;
}

.config-row label {
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #374151;
}

.config-row input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.upload-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.upload-progress h4 {
  margin-bottom: 0.5rem;
  color: #374151;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.progress-name {
  width: 150px;
  font-size: 0.875rem;
  color: #374151;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text {
  width: 50px;
  font-size: 0.875rem;
  color: #374151;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-modal {
  background: white;
  border-radius: 0.5rem;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.preview-content {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.image-preview img {
  max-width: 100%;
  height: auto;
}

.text-preview {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.375rem;
  white-space: pre-wrap;
  font-family: monospace;
}

.unsupported-preview {
  text-align: center;
  padding: 2rem;
}

.file-icon-large {
  font-size: 4rem;
  margin-bottom: 1rem;
}
</style>
