<template>
  <div class="embeddable-flowchart" :class="{ 'fullscreen': isFullscreen }">
    <div v-if="!hideHeader" class="embed-header">
      <h3>{{ title }}</h3>
      <div class="embed-controls">
        <button @click="toggleFullscreen" class="control-btn">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
        <button @click="openInNewTab" class="control-btn">
          新窗口打开
        </button>
      </div>
    </div>

    <InteractiveFlowChart
      :nodes="flowData.nodes"
      :edges="flowData.edges"
      :readonly="readonly"
      @node-update="handleNodeUpdate"
    />

    <div v-if="showPoweredBy" class="powered-by">
      Powered by Vue Flow Chart
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InteractiveFlowChart from './InteractiveFlowChart.vue'

interface EmbedProps {
  flowId?: string
  title?: string
  hideHeader?: boolean
  readonly?: boolean
  showPoweredBy?: boolean
  width?: string
  height?: string
}

const props = withDefaults(defineProps<EmbedProps>(), {
  title: 'Flow Chart',
  hideHeader: false,
  readonly: false,
  showPoweredBy: true,
  width: '100%',
  height: '600px'
})

const flowData = ref<{nodes: any[], edges: any[]}>({
  nodes: [],
  edges: []
})

const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const openInNewTab = () => {
  const url = props.flowId
    ? `/flow/${props.flowId}`
    : window.location.href
  window.open(url, '_blank')
}

const handleNodeUpdate = (nodeData: any) => {
  if (!props.readonly) {
    // 更新节点数据
    const nodeIndex = flowData.value.nodes.findIndex((n: any) => n.id === nodeData.id)
    if (nodeIndex !== -1) {
      flowData.value.nodes[nodeIndex] = nodeData
    }
  }
}

const loadFlowData = async () => {
  if (props.flowId) {
    try {
      const response = await fetch(`/api/flowchart/${props.flowId}`)
      const data = await response.json()
      flowData.value = data
    } catch (error) {
      console.error('Failed to load flow data:', error)
    }
  }
}

onMounted(() => {
  loadFlowData()
})
</script>

<style scoped>
.embeddable-flowchart {
  width: v-bind(width);
  height: v-bind(height);
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.embeddable-flowchart.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: 100vw !important;
  height: 100vh !important;
  border: none;
  border-radius: 0;
}

.embed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.embed-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1rem;
}

.embed-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}

.control-btn:hover {
  opacity: 0.9;
}

.powered-by {
  padding: 0.25rem 0.5rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
  flex-shrink: 0;
}

:deep(.vue-flow-container) {
  flex: 1;
}
</style>
