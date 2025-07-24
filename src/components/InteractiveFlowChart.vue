<template>
  <div class="interactive-flowchart">
    <div class="flowchart-header">
      <h1>Interactive Flow Chart</h1>
      <div class="toolbar">
        <button @click="exportFlow" class="btn btn-primary">Export Flow Chart</button>
        <button @click="toggleFullscreen" class="btn btn-tertiary">Fullscreen</button>
      </div>
    </div>

    <div class="flowchart-wrapper">
      <VueFlow
        ref="vueFlowRef"
        :key="flowKey"
        :default-zoom="1"
        :min-zoom="1"
        :max-zoom="1"
        :fit-view="false"
        :auto-connect="false"
        :elevate-edges-on-select="true"
        :pan-on-scroll="true"
        :zoom-on-scroll="false"
        :pan-on-drag="true"
        :node-dimensions-change="true"
        class="vue-flow-container"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @connect="onConnect"
        @pane-click="onPaneClick"
      >
        <Background pattern="dots" :gap="24" :size="1" />
        <Controls :show-zoom="false" :show-fit-view="true" />
        <MiniMap />

        <template #node-step="nodeProps">
          <div
            class="step-node"
            :class="{
              'completed': nodeProps.data.completed,
              'in-progress': nodeProps.data.inProgress,
              'dimmed': isDimmed(nodeProps.data),
              'highlighted': isHighlighted(nodeProps.data),
              'hovered': hoveredNodeId === nodeProps.data.id,
              'hidden': isNodeHidden(nodeProps.data)
            }"
            @click="onNodeClick(nodeProps.data)"
            @mouseenter="onNodeHover(nodeProps.data)"
            @mouseleave="onNodeLeave()"
          >
            <div class="step-header">
              <div class="step-number">{{ nodeProps.data.stepNumber }}</div>
              <div class="step-status">
                <div v-if="nodeProps.data.completed" class="icon-check">✓</div>
                <div v-else-if="nodeProps.data.inProgress" class="icon-progress">⏳</div>
                <div v-else class="icon-pending"> </div>
              </div>
              <!-- Completion status checkbox -->
              <div class="completion-checkbox" @click.stop="toggleNodeCompletion(nodeProps.data)">
                <input
                  type="checkbox"
                  :checked="nodeProps.data.completed"
                  :id="`checkbox-${nodeProps.data.id}`"
                  readonly
                />
                <label :for="`checkbox-${nodeProps.data.id}`" class="checkbox-label">
                  <span class="checkmark">✓</span>
                </label>
              </div>
            </div>
            <div class="step-content">
              <h3>{{ nodeProps.data.title }}</h3>
              <p>{{ nodeProps.data.description }}</p>

              <div class="step-meta">
                <span v-if="nodeProps.data.hasAttachments" class="attachment-count">
                  <div class="icon-attachment">📎</div> {{ nodeProps.data.attachments?.length || 0 }}
                </span>
                <span v-if="nodeProps.data.hasUpload" class="upload-indicator">
                  <div class="icon-upload">📤</div> Upload Available
                </span>
              </div>
            </div>
          </div>
        </template>

        <template #edge="edgeProps">
          <BaseEdge
            :id="edgeProps.id"
            :path="edgeProps.path"
            :marker-end="edgeProps.markerEnd"
            :style="getEdgeStyle(edgeProps.edge)"
          >
            <path :d="edgeProps.path" fill="none" :class="{
              'edge-path': true,
              'dimmed': isDimmedEdge(edgeProps.edge),
              'highlighted': isHighlightedEdge(edgeProps.edge),
            }" />
          </BaseEdge>
        </template>
      </VueFlow>
    </div>

    <!-- Step Detail Modal -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="selectedStep" class="modal-overlay" @click="closeStepModal">
          <div class="modal-content step-detail-modal" @click.stop>
            <div class="modal-header">
              <h3>{{ selectedStep.stepNumber }}: {{ selectedStep.title }}</h3>
              <button class="close-btn" @click="closeStepModal">×</button>
            </div>
            <div class="step-detail">
              <p class="description">{{ selectedStep.description }}</p>

              <!-- First step vendor selection area -->
              <div v-if="selectedStep.id === '1'" class="vendor-selection-section">
                <h4>Select IRT Vendor</h4>
                <p class="vendor-instruction">Please select the IRT vendor for your project. This will determine the subsequent process flow:</p>
                <div class="vendor-options">
                  <div class="vendor-option"
                       :class="{ 'selected': selectedVendor === 'sh' }"
                       @click="selectVendor('sh')">
                    <div class="vendor-logo">SH</div>
                    <div class="vendor-info">
                      <h5>Signant Health</h5>
                      <p>Leading clinical trial technology solutions provider</p>
                    </div>
                    <div class="vendor-check" v-if="selectedVendor === 'sh'">✓</div>
                  </div>
                  <div class="vendor-option"
                       :class="{ 'selected': selectedVendor === 'ca' }"
                       @click="selectVendor('ca')">
                    <div class="vendor-logo">CA</div>
                    <div class="vendor-info">
                      <h5>Calyx</h5>
                      <p>Professional clinical data management and analytics platform</p>
                    </div>
                    <div class="vendor-check" v-if="selectedVendor === 'ca'">✓</div>
                  </div>
                </div>
                <div v-if="selectedVendor" class="vendor-confirmation">
                  <div class="confirmation-message">
                    <span class="confirmation-icon">✓</span>
                    Selected {{ selectedVendor === 'sh' ? 'Signant Health' : 'Calyx' }} as IRT vendor
                  </div>
                </div>
              </div>

              <p class="status">
                <strong>Status:</strong>
                <span v-if="selectedStep.completed" class="status-completed">Completed</span>
                <span v-else-if="selectedStep.inProgress" class="status-progress">In Progress</span>
                <span v-else class="status-pending">Pending</span>
              </p>

              <div v-if="selectedStep.notes && selectedStep.notes.length > 0" class="notes">
                <strong>Notes:</strong>
                <ul>
                  <li v-for="note in selectedStep.notes" :key="note">{{ note }}</li>
                </ul>
              </div>

              <div v-if="selectedStep.links && selectedStep.links.length > 0" class="links">
                <strong>Related Links:</strong>
                <div class="link-list">
                  <a
                    v-for="link in selectedStep.links"
                    :key="link.label"
                    :href="link.url"
                    target="_blank"
                    class="link-btn"
                  >
                    {{ link.label }}
                  </a>
                </div>
              </div>

              <!-- SAS Macro Downloads Section -->
              <div v-if="selectedStep.hasAttachments && getSASMacros(selectedStep).length > 0" class="sas-macros-section">
                <strong>SAS Macros:</strong>
                <div class="macro-downloads">
                  <div
                    v-for="macro in getSASMacros(selectedStep)"
                    :key="macro.name"
                    class="macro-item"
                  >
                    <div class="macro-info">
                      <span class="macro-name">{{ macro.name }}</span>
                      <span class="macro-type">{{ macro.type }}</span>
                    </div>
                    <button
                      @click="downloadSASMacro(macro)"
                      class="btn btn-download"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="selectedStep.hasUpload" class="upload-section">
                <strong>File Upload:</strong>
                <div class="upload-area">
                  <label for="file-upload" class="file-upload-btn">
                    Choose File
                    <input id="file-upload" type="file" @change="onFileSelected" />
                  </label>
                  <span class="upload-note">Upload file to this step</span>
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button @click="closeStepModal" class="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { VueFlow, useVueFlow, BaseEdge, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'

// Import Vue Flow styles
import '@vue-flow/core/dist/style.css'

// Define types
interface StepData {
  id: string
  stepNumber: string
  title: string
  description: string
  completed: boolean
  inProgress: boolean
  hasAttachments: boolean
  hasUpload: boolean
  vendor?: string
  attachments?: File[]
  notes?: string[]
  links?: { label: string, url: string }[]
  dueDate?: string
  assignee?: string
}

// Define node and edge types with hidden property
interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: StepData
  hidden?: boolean
}

interface FlowEdge {
  id: string
  source: string
  target: string
  animated: boolean
  type: string
  style: { stroke: string; strokeWidth: number }
  hidden?: boolean
}

// Initialize nodes and edges first before Vue Flow
const nodesData: FlowNode[] = [
  {
    id: '1',
    type: 'step',
    position: { x: 500, y: 80 },
    data: {
      id: '1',
      stepNumber: '1',
      title: 'Confirm Vendor',
      description: 'Select the IRT vendor for your project',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      notes: ['This will determine the flow and available resources for your project']
    }
  },
  {
    id: '1a',
    type: 'step',
    position: { x: 200, y: 320 },
    data: {
      id: '1a',
      stepNumber: '1A',
      title: 'SH Vendor',
      description: 'Signant Health (SH) vendor selected',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'sh'
    }
  },
  {
    id: '1b',
    type: 'step',
    position: { x: 800, y: 320 },
    data: {
      id: '1b',
      stepNumber: '1B',
      title: 'CA Vendor',
      description: 'Calyx (CA) vendor selected',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'ca'
    }
  },
  {
    id: '2a',
    type: 'step',
    position: { x: 200, y: 560 },
    data: {
      id: '2a',
      stepNumber: '2A',
      title: 'Review SH DTS/DTA',
      description: 'Review Data Transfer Specification/Data Transfer Agreement from Signant Health',
      completed: false,
      inProgress: false,
      hasAttachments: true,
      hasUpload: true,
      vendor: 'sh',
      attachments: [],
      links: [
        { label: 'SH DTS Template', url: 'https://signanthealth.com/dts-template' },
        { label: 'SH DTA Reference', url: 'https://signanthealth.com/dta-reference' }
      ]
    }
  },
  {
    id: '2b',
    type: 'step',
    position: { x: 800, y: 560 },
    data: {
      id: '2b',
      stepNumber: '2B',
      title: 'Review CA DTS/DTA',
      description: 'Review Data Transfer Specification/Data Transfer Agreement from Calyx',
      completed: false,
      inProgress: false,
      hasAttachments: true,
      hasUpload: true,
      vendor: 'ca',
      attachments: [],
      links: [
        { label: 'Calyx DTS Template', url: 'https://calyx.ai/dts-template' },
        { label: 'Calyx DTA Reference', url: 'https://calyx.ai/dta-reference' }
      ]
    }
  },
  {
    id: '3a',
    type: 'step',
    position: { x: 200, y: 800 },
    data: {
      id: '3a',
      stepNumber: '3A',
      title: 'Confirm SH Data Source',
      description: 'Select the source environment for Signant Health dummy data',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'sh'
    }
  },
  {
    id: '3b',
    type: 'step',
    position: { x: 800, y: 800 },
    data: {
      id: '3b',
      stepNumber: '3B',
      title: 'Confirm CA Data Source',
      description: 'Select the source environment for Calyx dummy data',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'ca'
    }
  },
  {
    id: '4a1',
    type: 'step',
    position: { x: 80, y: 1040 },
    data: {
      id: '4a1',
      stepNumber: '4A-1',
      title: 'SH Production Environment',
      description: 'Use production environment data from Signant Health',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'sh'
    }
  },
  {
    id: '4a2',
    type: 'step',
    position: { x: 320, y: 1040 },
    data: {
      id: '4a2',
      stepNumber: '4A-2',
      title: 'SH UAT Environment',
      description: 'Use UAT environment data from Signant Health',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'sh'
    }
  },
  {
    id: '4b1',
    type: 'step',
    position: { x: 680, y: 1040 },
    data: {
      id: '4b1',
      stepNumber: '4B-1',
      title: 'CA Production Environment',
      description: 'Use production environment data from Calyx',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'ca'
    }
  },
  {
    id: '4b2',
    type: 'step',
    position: { x: 920, y: 1040 },
    data: {
      id: '4b2',
      stepNumber: '4B-2',
      title: 'CA UAT Environment',
      description: 'Use UAT environment data from Calyx',
      completed: false,
      inProgress: false,
      hasAttachments: false,
      hasUpload: false,
      vendor: 'ca'
    }
  },
  {
    id: '5a1',
    type: 'step',
    position: { x: 80, y: 1280 },
    data: {
      id: '5a1',
      stepNumber: '5A-1',
      title: 'SH Dummy Data - Production',
      description: 'Download SAS macros for creating SH dummy data from production environment',
      completed: false,
      inProgress: false,
      hasAttachments: true,
      hasUpload: false,
      vendor: 'sh',
      attachments: [],
      links: [
        { label: 'SH Dummy RAND Production', url: './public/macros/dummy_rand_sh_prod.sas' },
        { label: 'SH Dummy KIT Production', url: './public/macros/dummy_kit_sh_prod.sas' }
      ]
    }
  },
  {
    id: '5a2',
    type: 'step',
    position: { x: 320, y: 1280 },
    data: {
      id: '5a2',
      stepNumber: '5A-2',
      title: 'SH Dummy Data - UAT',
      description: 'Download SAS macros for creating SH dummy data from UAT environment',
      completed: false,
      inProgress: false,
      hasAttachments: true,
      hasUpload: false,
      vendor: 'sh',
      attachments: [],
      links: [
        { label: 'SH Dummy RAND UAT', url: './public/macros/dummy_rand_sh_uat.sas' },
        { label: 'SH Dummy KIT UAT', url: './public/macros/dummy_kit_sh_uat.sas' }
      ]
    }
  },
  {
    id: '5b1',
    type: 'step',
    position: { x: 680, y: 1280 },
    data: {
      id: '5b1',
      stepNumber: '5B-1',
      title: 'CA Dummy Data - Production',
      description: 'Download SAS macros for creating Calyx dummy data from production environment',
      completed: false,
      inProgress: false,
      hasAttachments: true,
      hasUpload: false,
      vendor: 'ca',
      attachments: [],
      links: [
        { label: 'Calyx Dummy RAND Production', url: './public/macros/dummy_rand_calyx_prod.sas' },
        { label: 'Calyx Dummy KIT Production', url: './public/macros/dummy_kit_calyx_prod.sas' }
      ]
    }
  },
  {
    id: '5b2',
    type: 'step',
    position: { x: 920, y: 1280 },
    data: {
      id: '5b2',
      stepNumber: '5B-2',
      title: 'CA Dummy Data - UAT',
      description: 'Download SAS macros for creating Calyx dummy data from UAT environment',
      completed: false,
      inProgress: false,
      hasAttachments: true,
      hasUpload: false,
      vendor: 'ca',
      attachments: [],
      links: [
        { label: 'Calyx Dummy RAND UAT', url: './public/macros/dummy_rand_calyx_uat.sas' },
        { label: 'Calyx Dummy KIT UAT', url: './public/macros/dummy_kit_calyx_uat.sas' }
      ]
    }
  }
];

const edgesData: FlowEdge[] = [
  // Step 1 to vendor selection
  { id: 'e1-1a', source: '1', target: '1a', animated: true, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e1-1b', source: '1', target: '1b', animated: true, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },

  // SH branch
  { id: 'e1a-2a', source: '1a', target: '2a', animated: true, type: 'smoothstep', style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e2a-3a', source: '2a', target: '3a', animated: true, type: 'smoothstep', style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e3a-4a1', source: '3a', target: '4a1', animated: true, type: 'smoothstep', style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e3a-4a2', source: '3a', target: '4a2', animated: true, type: 'smoothstep', style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e4a1-5a1', source: '4a1', target: '5a1', animated: true, type: 'smoothstep', style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e4a2-5a2', source: '4a2', target: '5a2', animated: true, type: 'smoothstep', style: { stroke: '#673ab7', strokeWidth: 2 } },

  // CA branch
  { id: 'e1b-2b', source: '1b', target: '2b', animated: true, type: 'smoothstep', style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e2b-3b', source: '2b', target: '3b', animated: true, type: 'smoothstep', style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e3b-4b1', source: '3b', target: '4b1', animated: true, type: 'smoothstep', style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e3b-4b2', source: '3b', target: '4b2', animated: true, type: 'smoothstep', style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e4b1-5b1', source: '4b1', target: '5b1', animated: true, type: 'smoothstep', style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e4b2-5b2', source: '4b2', target: '5b2', animated: true, type: 'smoothstep', style: { stroke: '#388e3c', strokeWidth: 2 } }
];

// Vue Flow setup with proper initialization
const nodes = ref(nodesData);
const edges = ref(edgesData);

// VueFlow state management - updated to use id parameter instead of deprecated options
const {
  onNodesChange,
  onEdgesChange,
  onConnect: onVueFlowConnect,
  addNodes,
  addEdges,
  setNodes,
  setEdges,
  setTransform,
  fitView: fitViewAction,
  project,
} = useVueFlow('interactive-flowchart');

// Reactive reference for the Vue Flow container
const flowKey = ref(`flow-${Date.now()}`);
const vueFlowRef = ref(null);
const elementsInitialized = ref(false);

// App state
const selectedStep = ref<StepData | null>(null);
const hoveredNodeId = ref<string | null>(null);
const activeVendor = ref('all'); // 'all', 'sh', 'ca'
const highlightedPath = ref<string[]>([]);
const selectedVendor = ref('');

// Pass only the necessary functions from useVueFlow to avoid issues
const fitView = () => {
  if (vueFlowRef.value) {
    // @ts-ignore - TypeScript might complain but this works at runtime
    vueFlowRef.value.fitView();
  }
};

// Computed properties
const shareUrl = computed(() => {
  return `${window.location.origin}/flow/${btoa(JSON.stringify(nodes.value))}`
})

const embedCode = computed(() => {
  return `<iframe src="${shareUrl.value}" width="100%" height="600" frameborder="0"></iframe>`
})

// Methods
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
  // 在实际应用中，这里应���调用后端API来处理SFTP上传
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
      saveAs(blob, 'flow-chart.png')
    }
  })
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const isDimmed = (data: StepData) => {
  // Determine if the node should be dimmed based on the active vendor and completion status
  if (activeVendor.value === 'all') return false
  if (data.vendor === activeVendor.value) return false
  return true
}

const isHighlighted = (data: StepData) => {
  // Determine if the node should be highlighted based on the active vendor
  return activeVendor.value !== 'all' && data.vendor === activeVendor.value
}

const isDimmedEdge = (edge: any) => {
  // Dim edges that are not part of the highlighted path
  return highlightedPath.value.length > 0 && !highlightedPath.value.includes(edge.id)
}

const isHighlightedEdge = (edge: any) => {
  // Highlight edges that are part of the highlighted path
  return highlightedPath.value.includes(edge.id)
}

const highlightPath = (vendor: 'sh' | 'ca' | 'all') => {
  activeVendor.value = vendor
  if (vendor === 'all') {
    highlightedPath.value = []
  } else {
    // Highlight the path for the selected vendor
    highlightedPath.value = edges.value
      .filter(edge => {
        const sourceNode = nodes.value.find(node => node.data.id === edge.source)
        const targetNode = nodes.value.find(node => node.data.id === edge.target)
        return sourceNode?.data.vendor === vendor || targetNode?.data.vendor === vendor
      })
      .map(edge => edge.id)
  }
}

// Edge style management
const getEdgeStyle = (edge: any) => {
  const baseStyle = { ...edge.style }

  if (isDimmedEdge(edge)) {
    return {
      ...baseStyle,
      stroke: baseStyle.stroke + '80', // Add transparency
      strokeWidth: 1,
      opacity: 0.6
    }
  }

  if (isHighlightedEdge(edge)) {
    return {
      ...baseStyle,
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))'
    }
  }

  return baseStyle
}

// Toggle step status (completed/not completed)
const toggleStepStatus = () => {
  if (selectedStep.value) {
    const step = { ...selectedStep.value }
    step.completed = !step.completed

    // If marking as complete, ensure it's not in progress
    if (step.completed) {
      step.inProgress = false
    }

    updateStep(step)
    selectedStep.value = step
  }
}

// 新增：直接在节点上切换完成状态的��法
const toggleNodeCompletion = (stepData: StepData) => {
  const nodeIndex = nodes.value.findIndex(n => n.data.id === stepData.id)
  if (nodeIndex !== -1) {
    const updatedData = { ...stepData }
    updatedData.completed = !updatedData.completed

    // 如果标记为完成，则确保不是进行中状态
    if (updatedData.completed) {
      updatedData.inProgress = false
    }

    // 更新节点数���
    nodes.value[nodeIndex].data = updatedData

    // 如果当前打开的模态框是同一个�����骤，也更新模态框中的数据
    if (selectedStep.value && selectedStep.value.id === stepData.id) {
      selectedStep.value = updatedData
    }
  }
}

// Handle new connections if users create them
const onConnect = (params: any) => {
  // This would be used if you want to allow users to create new connections
  console.log('Connection created:', params)

  // In this case we'll just log it, but you could add it to the edges array
  // edges.value.push({
  //   id: `e-${params.source}-${params.target}`,
  //   source: params.source,
  //   target: params.target,
  //   animated: true,
  //   type: 'smoothstep'
  // })
}

// Handle clicks on the pane (background)
const onPaneClick = () => {
  // Deselect any selected items when clicking on the background
  hoveredNodeId.value = null
}

// File upload functionality
const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0 && selectedStep.value) {
    const file = input.files[0]
    handleFileUpload(selectedStep.value.id, file, true)
    alert(`File "${file.name}" uploaded successfully`)

    // Reset the file input
    input.value = ''
  }
}

// Node interaction methods
const onNodeHover = (data: StepData) => {
  hoveredNodeId.value = data.id

  // Highlight connected edges when hovering on a node
  const connectedEdges = edges.value.filter(
    edge => edge.source === data.id || edge.target === data.id
  ).map(edge => edge.id)

  if (activeVendor.value === 'all') {
    highlightedPath.value = connectedEdges
  }
}

const onNodeLeave = () => {
  hoveredNodeId.value = null

  // Reset highlighted path if we're showing all vendors
  if (activeVendor.value === 'all') {
    highlightedPath.value = []
  }
}

// Add method to check if a node should be hidden based on vendor selection
const isNodeHidden = (data: StepData) => {
  // Don't hide the first step (vendor selection step)
  if (data.id === '1') return false

  // If no vendor is selected, show all nodes
  if (!selectedVendor.value) return false

  // Hide nodes that don't match the selected vendor
  return data.vendor && data.vendor !== selectedVendor.value
}

// Vendor selection method for modal
const selectVendor = (vendor: 'sh' | 'ca') => {
  selectedVendor.value = vendor
  onVendorChange()

  // Close modal after selection with a short delay to show the confirmation
  setTimeout(() => {
    closeStepModal()
  }, 1000)
}

// Vendor selection change handler
const onVendorChange = () => {
  const vendor = selectedVendor.value

  // Update activeVendor to sync with existing highlight logic
  activeVendor.value = vendor || 'all'

  // Mark the first step as completed when vendor is selected
  if (vendor) {
    const firstStepNode = nodes.value.find(node => node.data.id === '1')
    if (firstStepNode) {
      firstStepNode.data.completed = true
      firstStepNode.data.inProgress = false
    }
  }

  // Update nodes visibility
  nodes.value.forEach(node => {
    if (node.data.id === '1') return // Skip the vendor selection node

    if (vendor) {
      // Hide nodes that don't match the selected vendor
      node.hidden = node.data.vendor !== vendor
    } else {
      // Show all nodes if no vendor is selected
      node.hidden = false
    }
  })

  // Update edges visibility
  edges.value.forEach(edge => {
    if (vendor) {
      const sourceNode = nodes.value.find(node => node.data.id === edge.source)
      const targetNode = nodes.value.find(node => node.data.id === edge.target)

      // Hide edges if either source or target node is hidden
      edge.hidden = sourceNode?.hidden || targetNode?.hidden
    } else {
      edge.hidden = false
    }
  })

  // Update highlighted path for the selected vendor
  if (vendor) {
    highlightPath(vendor as 'sh' | 'ca')
  } else {
    highlightPath('all')
  }

  // Force Vue Flow to update
  nextTick(() => {
    setNodes([...nodes.value])
    setEdges([...edges.value])

    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      fitViewAction()
    }, 100)
  })
}

// 更新vendor相关的视图设置
const updateFlowForVendor = () => {
  // 应用vendor选择后的视图更新
  onVendorChange()
}

// 监听状态变化并自动保存
watch([nodes, edges, selectedVendor], () => {
  saveFlowState()
}, { deep: true })

// 在组件挂载时加载状态，在状态变化时保存
onMounted(() => {
  // 首先尝试从localStorage加载流程状态
  const loaded = loadFlowState()

  if (loaded) {
    console.log('Flow state loaded successfully from localStorage')
    // 如果成功加载了状态，更新Vue Flow
    setNodes(nodes.value)
    setEdges(edges.value)

    // 如���有选择的vendor，应用相关的视图更新
    if (selectedVendor.value) {
      nextTick(() => {
        updateFlowForVendor()
        setTimeout(() => {
          fitViewAction()
        }, 100)
      })
    }
  } else {
    // 如果没有保存的状态，使用默认初始化
    console.log('No saved state found, using default flow configuration')
    setNodes(nodes.value)
    setEdges(edges.value)

    setTimeout(() => {
      fitViewAction()
    }, 100)
  }
})

// 页面卸载前保存状态
onBeforeUnmount(() => {
  saveFlowState()
  // Reset Vue Flow state using proper methods
  setNodes([])
  setEdges([])
})

// 添加localStorage保存功能
const FLOW_STORAGE_KEY = 'dbl_flow_state'

// 保存流程状态到localStorage
const saveFlowState = () => {
  const flowState = {
    nodes: nodes.value.map(node => ({
      ...node,
      data: { ...node.data }
    })),
    edges: edges.value,
    selectedVendor: selectedVendor.value,
    timestamp: Date.now()
  }
  localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flowState))
  console.log('Flow state saved to localStorage')
}

// 从localStorage加载流程状态
const loadFlowState = () => {
  try {
    const saved = localStorage.getItem(FLOW_STORAGE_KEY)
    if (saved) {
      const flowState = JSON.parse(saved)
      console.log('Loading flow state from localStorage:', flowState.timestamp)

      // 恢复节点状态
      if (flowState.nodes && Array.isArray(flowState.nodes)) {
        nodes.value = flowState.nodes
      }

      // 恢复边状态
      if (flowState.edges && Array.isArray(flowState.edges)) {
        edges.value = flowState.edges
      }

      // 恢复选择的vendor
      if (flowState.selectedVendor) {
        selectedVendor.value = flowState.selectedVendor
        updateFlowForVendor() // 应用vendor相关的视图更新
      }

      return true
    }
  } catch (error) {
    console.error('Failed to load flow state from localStorage:', error)
  }
  return false
}

// 清除保存的状态
const clearFlowState = () => {
  localStorage.removeItem(FLOW_STORAGE_KEY)
  console.log('Flow state cleared from localStorage')
}

// SAS Macro download handling
const getSASMacros = (step: StepData) => {
  // Define the mapping based on step ID, vendor, and environment
  const macroMappings: Record<string, Array<{name: string, type: string, path: string}>> = {
    // SH Production Environment
    '5a1': [
      { name: 'dummy_rand_sh_prod.sas', type: 'RAND Macro', path: './macros/dummy_rand_sh_prod.sas' },
      { name: 'dummy_kit_sh_prod.sas', type: 'KIT Macro', path: './macros/dummy_kit_sh_prod.sas' }
    ],
    // SH UAT Environment
    '5a2': [
      { name: 'dummy_rand_sh_uat.sas', type: 'RAND Macro', path: './macros/dummy_rand_sh_uat.sas' },
      { name: 'dummy_kit_sh_uat.sas', type: 'KIT Macro', path: './macros/dummy_kit_sh_uat.sas' }
    ],
    // Calyx Production Environment
    '5b1': [
      { name: 'dummy_rand_calyx_prod.sas', type: 'RAND Macro', path: './macros/dummy_rand_calyx_prod.sas' },
      { name: 'dummy_kit_calyx_prod.sas', type: 'KIT Macro', path: './macros/dummy_kit_calyx_prod.sas' }
    ],
    // Calyx UAT Environment
    '5b2': [
      { name: 'dummy_rand_calyx_uat.sas', type: 'RAND Macro', path: './macros/dummy_rand_calyx_uat.sas' },
      { name: 'dummy_kit_calyx_uat.sas', type: 'KIT Macro', path: './macros/dummy_kit_calyx_uat.sas' }
    ]
  }

  return macroMappings[step.id] || []
}

const downloadSASMacro = async (macro: { name: string, type: string, path: string }) => {
  try {
    // Fetch the file content from the public/macros directory
    const response = await fetch(macro.path)

    if (!response.ok) {
      throw new Error(`Failed to fetch ${macro.name}: ${response.statusText}`)
    }

    const content = await response.text()

    // Create a blob with the content
    const blob = new Blob([content], { type: 'text/plain' })

    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = macro.name
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log(`Downloaded ${macro.name} successfully`)
  } catch (error) {
    console.error(`Error downloading ${macro.name}:`, error)
    alert(`Failed to download ${macro.name}. Please try again.`)
  }
}
</script>

<style scoped>
.interactive-flowchart {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
}

.flowchart-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.flowchart-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
  font-weight: 600;
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
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: #6b7280;
  color: white;
  box-shadow: 0 1px 2px rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.4);
}

.btn-tertiary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-tertiary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.flowchart-wrapper {
  position: relative;
  flex: 1;
  height: calc(100vh - 70px);
  overflow: auto;
}

.vue-flow-container {
  height: 100%;
  width: 100%;
  min-height: 1000px;
}

/* Custom node styling */
.step-node {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  min-width: 220px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.step-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: #3b82f6;
  opacity: 0.7;
}

.step-node:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.step-node.completed {
  border-color: #10b981;
  background: linear-gradient(to bottom, #f0fdf4 0%, white 100%);
}

.step-node.completed::before {
  background: #10b981;
}

.step-node.in-progress {
  border-color: #f59e0b;
  background: linear-gradient(to bottom, #fffbeb 0%, white 100%);
}

.step-node.in-progress::before {
  background: #f59e0b;
}

.step-node.dimmed {
  opacity: 0.4;
  filter: grayscale(0.7);
  transform: scale(0.95);
  transition: all 0.5s ease;
}

.step-node.highlighted {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px) scale(1.02);
  z-index: 2;
  transition: all 0.5s ease;
}

.step-node.dimmed:hover {
  opacity: 0.8;
  transform: translateY(-1px) scale(0.95);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.step-number {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.step-node.completed .step-number {
  background: #10b981;
}

.step-node.in-progress .step-number {
  background: #f59e0b;
}

.step-status {
  display: flex;
  align-items: center;
  font-size: 1rem;
}

.icon-check, .icon-progress, .icon-pending {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
}

.step-content p {
  margin: 0 0 0.75rem 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.step-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #e2e8f0;
}

.attachment-count,
.upload-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

/* 复选框样式 */
.completion-checkbox {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.completion-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-label {
  position: relative;
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  border-color: #3b82f6;
  background: #dbeafe;
}

.checkmark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.completion-checkbox input[type="checkbox"]:checked + .checkbox-label {
  background: #10b981;
  border-color: #059669;
}

.completion-checkbox input[type="checkbox"]:checked + .checkbox-label .checkmark {
  opacity: 1;
}

.completion-checkbox:hover .checkbox-label {
  transform: scale(1.05);
}

/* 已完成节点的��选框样式 */
.step-node.completed .completion-checkbox .checkbox-label {
  background: #10b981;
  border-color: #059669;
}

.step-node.completed .completion-checkbox .checkmark {
  opacity: 1;
}

/* Edge styling */
:deep(.edge-path) {
  stroke-width: 2;
  transition: all 0.5s ease;
}

:deep(.edge-path.dimmed) {
  opacity: 0.3;
  stroke-width: 1;
  stroke-dasharray: 5, 5;
}

:deep(.edge-path.highlighted) {
  stroke-width: 3;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* Modal styling */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
}

.close-btn:hover {
  color: #1e293b;
}

.step-detail-modal {
  max-width: 500px;
}

.step-detail {
  padding: 1.5rem;
  color: #374151;
}

.description {
  font-size: 0.925rem;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.925rem;
  margin-bottom: 1.25rem;
}

.status-completed,
.status-progress,
.status-pending {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-completed {
  background: #dcfce7;
  color: #10b981;
}

.status-progress {
  background: #fef3c7;
  color: #f59e0b;
}

.status-pending {
  background: #f3f4f6;
  color: #6b7280;
}

.notes, .links {
  margin-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1.25rem;
}

.notes ul {
  margin: 0.75rem 0 0 0;
  padding-left: 1.25rem;
}

.notes li {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.link-btn {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  color: #3b82f6;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.link-btn:hover {
  background: #e5e7eb;
  color: #2563eb;
}

.upload-section {
  margin-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1.25rem;
}

.upload-area {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-upload-btn {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.file-upload-btn:hover {
  background: #2563eb;
}

.file-upload-btn input {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.upload-note {
  color: #64748b;
  font-size: 0.75rem;
}

.modal-actions {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.status-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.status-btn:hover {
  background: #e5e7eb;
}

/* Vendor selector styling */
.vendor-selector {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.vendor-selector label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.vendor-dropdown {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vendor-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vendor-dropdown:hover {
  border-color: #6b7280;
}

/* Hide hidden nodes with CSS animation */
.step-node.hidden {
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  transition: all 0.3s ease;
}

/* Animation for nodes when they appear */
@keyframes node-appear {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.step-node {
  animation: node-appear 0.4s ease-out forwards;
}

/* Animation for edges */
@keyframes edge-appear {
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

:deep(.edge-path) {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: edge-appear 1.5s ease-in-out forwards;
}

/* Vendor selection section styling */
.vendor-selection-section {
  margin: 1.25rem 0;
  padding: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.vendor-selection-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  color: #1e293b;
  font-weight: 600;
}

.vendor-instruction {
  margin: 0 0 1rem 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}

.vendor-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.vendor-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.vendor-option:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.vendor-option.selected {
  border-color: #3b82f6;
  background: linear-gradient(to right, #dbeafe 0%, #f8fafc 100%);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.vendor-logo {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.vendor-option.selected .vendor-logo {
  background: #1d4ed8;
}

.vendor-info {
  flex: 1;
}

.vendor-info h5 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
}

.vendor-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.vendor-check {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
  margin-left: 1rem;
  animation: checkmark-appear 0.3s ease;
}

@keyframes checkmark-appear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.vendor-confirmation {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  animation: confirmation-appear 0.5s ease;
}

@keyframes confirmation-appear {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirmation-message {
  display: flex;
  align-items: center;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 500;
}

.confirmation-icon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

/* SAS Macro section styling */
.sas-macros-section {
  margin-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1.25rem;
}

.macro-downloads {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.macro-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.macro-item:hover {
  border-color: #3b82f6;
  background: #e0f2fe;
}

.macro-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.macro-name {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
}

.macro-type {
  font-size: 0.75rem;
  color: #6b7280;
}

.btn-download {
  padding: 0.375rem 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-download:hover {
  background: #2563eb;
}
</style>
