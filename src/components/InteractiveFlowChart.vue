<template>
  <div class="interactive-flowchart">
    <div class="flowchart-header">
      <h1>DBL Process Flow - Interactive Version</h1>
      <div class="toolbar">
        <button @click="exportFlow" class="btn btn-primary">导出流程图</button>
        <button @click="shareFlow" class="btn btn-secondary">分享链接</button>
        <button @click="toggleFullscreen" class="btn btn-tertiary">全屏</button>
      </div>
    </div>

    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.8, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="2"
      :fit-view-on-init="true"
      class="vue-flow-container"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
    >
      <Background pattern="dots" />
      <Controls />
      <MiniMap />

      <template #node-step="{ data }">
        <div
          class="step-node"
          :class="{
            'completed': data.completed,
            'in-progress': data.inProgress,
            'clickable': data.hasAttachments || data.hasUpload
          }"
          @click="openStepModal(data)"
        >
          <div class="step-header">
            <div class="step-number">{{ data.stepNumber }}</div>
            <div class="step-status">
              <i v-if="data.completed" class="icon-check"></i>
              <i v-else-if="data.inProgress" class="icon-progress"></i>
              <i v-else class="icon-pending"></i>
            </div>
          </div>
          <div class="step-content">
            <h3>{{ data.title }}</h3>
            <p>{{ data.description }}</p>
            <div class="step-meta">
              <span v-if="data.hasAttachments" class="attachment-count">
                <i class="icon-attachment"></i> {{ data.attachments?.length || 0 }}
              </span>
              <span v-if="data.hasUpload" class="upload-indicator">
                <i class="icon-upload"></i> 可上传
              </span>
            </div>
          </div>
        </div>
      </template>
    </VueFlow>

    <!-- Step Detail Modal -->
    <StepModal
      v-if="selectedStep"
      :step="selectedStep"
      @close="closeStepModal"
      @update-step="updateStep"
      @upload-file="handleFileUpload"
    />

    <!-- Share Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click="closeShareModal">
      <div class="modal-content" @click.stop>
        <h3>分享流程图</h3>
        <div class="share-options">
          <div class="share-link">
            <label>分享链接：</label>
            <input :value="shareUrl" readonly @click="copyToClipboard" />
            <button @click="copyToClipboard" class="btn btn-sm">复制</button>
          </div>
          <div class="share-embed">
            <label>嵌入代码：</label>
            <textarea :value="embedCode" readonly></textarea>
            <button @click="copyEmbedCode" class="btn btn-sm">复制嵌入代码</button>
          </div>
        </div>
        <button @click="closeShareModal" class="btn btn-secondary">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import StepModal from './StepModal.vue'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'

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
  dueDate?: string
  assignee?: string
}

const nodes = ref([
  {
    id: '1',
    type: 'step',
    position: { x: 100, y: 100 },
    data: {
      id: '1',
      stepNumber: '1',
      title: 'Review DTS/DTA',
      description: 'Review from IRT vendor',
      completed: true,
      inProgress: false,
      hasAttachments: true,
      hasUpload: false,
      attachments: [],
      notes: ['检查DTS文档完整性', '验证DTA数据准确性']
    }
  },
  {
    id: '2',
    type: 'step',
    position: { x: 100, y: 250 },
    data: {
      id: '2',
      stepNumber: '2',
      title: 'Request Data',
      description: 'Dummy rand & kit data',
      completed: false,
      inProgress: true,
      hasAttachments: true,
      hasUpload: true,
      attachments: [],
      notes: ['请求虚拟随机化数据', '获取试验包数据']
    }
  },
  {
    id: '2a',
    type: 'step',
    position: { x: -100, y: 400 },
    data: {
      id: '2a',
      stepNumber: '2A',
      title: 'Production',
      description: 'Production List',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: true,
      attachments: []
    }
  },
  {
    id: '2b',
    type: 'step',
    position: { x: 300, y: 400 },
    data: {
      id: '2b',
      stepNumber: '2B',
      title: 'UAT',
      description: 'UAT Environment',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: true,
      attachments: []
    }
  }
])

const edges = ref([
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-2a', source: '2', target: '2a', animated: false },
  { id: 'e2-2b', source: '2', target: '2b', animated: false }
])

const selectedStep = ref<StepData | null>(null)
const showShareModal = ref(false)

const shareUrl = computed(() => {
  return `${window.location.origin}/flow/${btoa(JSON.stringify(nodes.value))}`
})

const embedCode = computed(() => {
  return `<iframe src="${shareUrl.value}" width="100%" height="600" frameborder="0"></iframe>`
})

const onNodeClick = (event: any) => {
  const node = event.node
  if (node.type === 'step') {
    openStepModal(node.data)
  }
}

const onEdgeClick = (event: any) => {
  console.log('Edge clicked:', event.edge)
}

const openStepModal = (stepData: StepData) => {
  selectedStep.value = stepData
}

const closeStepModal = () => {
  selectedStep.value = null
}

const updateStep = (updatedStep: StepData) => {
  const nodeIndex = nodes.value.findIndex(n => n.data.id === updatedStep.id)
  if (nodeIndex !== -1) {
    // 使用类型断言来处理复杂的节点数据结构
    (nodes.value[nodeIndex].data as any) = updatedStep
  }
}

const handleFileUpload = async (stepId: string, file: File, uploadToSftp: boolean = false) => {
  const step = nodes.value.find(n => n.data.id === stepId)?.data
  if (!step) return

  if (!step.attachments) {
    step.attachments = []
  }

  // 使用类型断言来处理文件数组
  ;(step.attachments as File[]).push(file)

  if (uploadToSftp) {
    await uploadToSftpServer(file, stepId)
  }
}

const uploadToSftpServer = async (file: File, stepId: string) => {
  // 在实际应用中，这里应该调用后端API来处理SFTP上传
  // 因为浏览器环境无法直接连接SFTP服务器
  const formData = new FormData()
  formData.append('file', file)
  formData.append('stepId', stepId)

  try {
    // 示例API调用
    // await axios.post('/api/sftp-upload', formData)
    console.log('File uploaded to SFTP server:', file.name)
  } catch (error) {
    console.error('SFTP upload failed:', error)
  }
}

const exportFlow = async () => {
  const flowElement = document.querySelector('.vue-flow-container')
  if (!flowElement) return

  const canvas = await html2canvas(flowElement as HTMLElement)
  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, 'dbl-process-flow.png')
    }
  })
}

const shareFlow = () => {
  showShareModal.value = true
}

const closeShareModal = () => {
  showShareModal.value = false
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(shareUrl.value)
  alert('链接已复制到剪贴板')
}

const copyEmbedCode = () => {
  navigator.clipboard.writeText(embedCode.value)
  alert('嵌入代码已复制到剪贴板')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

onMounted(() => {
  // 初始化设置
  console.log('Interactive FlowChart mounted')
})
</script>

<style scoped>
.interactive-flowchart {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.flowchart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar {
  display: flex;
  gap: 0.5rem;
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

.btn-tertiary {
  background: #f3f4f6;
  color: #374151;
}

.btn:hover {
  opacity: 0.9;
}

.vue-flow-container {
  flex: 1;
  background: #f8fafc;
}

.step-node {
  min-width: 200px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.step-node.completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.step-node.in-progress {
  border-color: #f59e0b;
  background: #fffbeb;
}

.step-node.clickable {
  cursor: pointer;
}

.step-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.step-number {
  background: #3b82f6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.step-status i {
  font-size: 1.25rem;
}

.icon-check {
  color: #10b981;
}

.icon-progress {
  color: #f59e0b;
}

.icon-pending {
  color: #6b7280;
}

.step-content h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
}

.step-content p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.step-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.attachment-count,
.upload-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
}

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
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
}

.share-options {
  margin: 1rem 0;
}

.share-link,
.share-embed {
  margin-bottom: 1rem;
}

.share-link label,
.share-embed label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.share-link input,
.share-embed textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.share-embed textarea {
  height: 80px;
  resize: vertical;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Icon styles */
.icon-check::before { content: "✓"; }
.icon-progress::before { content: "●"; }
.icon-pending::before { content: "○"; }
.icon-attachment::before { content: "📎"; }
.icon-upload::before { content: "↑"; }
</style>
