<template>
  <div class="todo-flowchart">
    <h1>Dummy IRT Process Flow</h1>
    <div class="export-buttons">
      <button @click="exportToJSON" class="export-btn">Export to JSON</button>
      <button @click="exportToPNG" class="export-btn">Export to PNG</button>
    </div>
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.7, x: 50, y: 0 }"
      :min-zoom="0.3"
      :max-zoom="1.5"
      :fit-view-on-init="true"
      :fit-view-options="{ padding: 0.2 }"
      :pan-on-scroll="false"
      :zoom-on-scroll="true"
      :zoom-on-pinch="true"
      :zoom-on-double-click="false"
      class="vue-flow-container"
      @node-click="onNodeClick"
    >
      <Background />
      <Controls />
      <MiniMap />

      <template #node-custom="{ data }">
        <div class="custom-node" :class="[
          { completed: data.completed },
          `category-${data.category}`
        ]">
          <div class="node-header">
            <div class="category-icon" :class="`icon-${data.category}`"></div>
            <div class="checkbox-container">
              <input
                type="checkbox"
                :checked="data.completed"
                @change="toggleComplete(data.id)"
                class="task-checkbox"
              />
            </div>
          </div>
          <div class="task-content">
            <h3 class="task-title">{{ data.title }}</h3>
            <p class="task-description">{{ data.description }}</p>
            <div v-if="data.notes" class="task-notes">
              <ul>
                <li v-for="note in data.notes" :key="note">{{ note }}</li>
              </ul>
            </div>
            <div v-if="data.links && data.links.length > 0" class="task-links">
              <div v-for="link in data.links" :key="link.url" class="link-item">
                <a :href="link.url" target="_blank" class="reference-link">
                  {{ link.label }} <span class="link-icon">↗</span>
                </a>
              </div>
            </div>
            <div class="badges">
              <div v-if="data.optional" class="optional-badge">Optional</div>
              <div v-if="data.category" class="category-badge" :class="`badge-${data.category}`">
                {{ data.category }}
              </div>
              <div v-if="data.vendor" class="vendor-badge" :class="`vendor-${data.vendor}`">
                {{ data.vendor }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { VueFlow, type Node, type Edge, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

interface TaskData {
  id: string
  title: string
  description: string
  completed: boolean
  notes?: string[]
  optional?: boolean
  category?: string
  links?: { label: string, url: string }[]
  vendor?: string
}

interface TaskNode extends Node {
  data: TaskData
}

const completedTasks: Ref<Set<string>> = ref(new Set())

const nodes: Ref<TaskNode[]> = ref([
  {
    id: '1',
    type: 'custom',
    position: { x: 200, y: 50 },
    data: {
      id: '1',
      title: 'Step 1: Confirm Vendor',
      description: 'Select the IRT vendor for your project',
      completed: false,
      category: 'analysis',
      notes: [
        'This will determine the flow and available resources for your project'
      ]
    }
  },
  {
    id: '1a',
    type: 'custom',
    position: { x: -100, y: 250 },
    data: {
      id: '1a',
      title: 'SH Vendor',
      description: 'Signant Health (SH) vendor selected',
      completed: false,
      category: 'analysis',
      vendor: 'sh'
    }
  },
  {
    id: '1b',
    type: 'custom',
    position: { x: 500, y: 250 },
    data: {
      id: '1b',
      title: 'CA Vendor',
      description: 'Calyx (CA) vendor selected',
      completed: false,
      category: 'analysis',
      vendor: 'ca'
    }
  },
  {
    id: '2a',
    type: 'custom',
    position: { x: -100, y: 450 },
    data: {
      id: '2a',
      title: 'Step 2: Review SH DTS/DTA',
      description: 'Review Data Transfer Specification/Data Transfer Agreement from Signant Health',
      completed: false,
      category: 'analysis',
      vendor: 'sh',
      links: [
        { label: 'SH DTS Template', url: 'https://signanthealth.com/dts-template' },
        { label: 'SH DTA Reference', url: 'https://signanthealth.com/dta-reference' }
      ]
    }
  },
  {
    id: '2b',
    type: 'custom',
    position: { x: 500, y: 450 },
    data: {
      id: '2b',
      title: 'Step 2: Review CA DTS/DTA',
      description: 'Review Data Transfer Specification/Data Transfer Agreement from Calyx',
      completed: false,
      category: 'analysis',
      vendor: 'ca',
      links: [
        { label: 'Calyx DTS Template', url: 'https://calyx.ai/dts-template' },
        { label: 'Calyx DTA Reference', url: 'https://calyx.ai/dta-reference' }
      ]
    }
  },
  {
    id: '3a',
    type: 'custom',
    position: { x: -100, y: 650 },
    data: {
      id: '3a',
      title: 'Step 3: Confirm SH Dummy Data Source',
      description: 'Select the source environment for Signant Health dummy data',
      completed: false,
      category: 'data',
      vendor: 'sh'
    }
  },
  {
    id: '3b',
    type: 'custom',
    position: { x: 500, y: 650 },
    data: {
      id: '3b',
      title: 'Step 3: Confirm CA Dummy Data Source',
      description: 'Select the source environment for Calyx dummy data',
      completed: false,
      category: 'data',
      vendor: 'ca'
    }
  },
  {
    id: '4a1',
    type: 'custom',
    position: { x: -300, y: 850 },
    data: {
      id: '4a1',
      title: 'SH Production Environment',
      description: 'Use production environment data from Signant Health',
      completed: false,
      category: 'data',
      vendor: 'sh'
    }
  },
  {
    id: '4a2',
    type: 'custom',
    position: { x: 100, y: 850 },
    data: {
      id: '4a2',
      title: 'SH UAT Environment',
      description: 'Use UAT environment data from Signant Health',
      completed: false,
      category: 'data',
      vendor: 'sh'
    }
  },
  {
    id: '4b1',
    type: 'custom',
    position: { x: 300, y: 850 },
    data: {
      id: '4b1',
      title: 'CA Production Environment',
      description: 'Use production environment data from Calyx',
      completed: false,
      category: 'data',
      vendor: 'ca'
    }
  },
  {
    id: '4b2',
    type: 'custom',
    position: { x: 700, y: 850 },
    data: {
      id: '4b2',
      title: 'CA UAT Environment',
      description: 'Use UAT environment data from Calyx',
      completed: false,
      category: 'data',
      vendor: 'ca'
    }
  },
  {
    id: '5a1',
    type: 'custom',
    position: { x: -300, y: 1050 },
    data: {
      id: '5a1',
      title: 'SH Dummy Data - Production',
      description: 'Download SAS macros for creating SH dummy data from production environment',
      completed: false,
      category: 'development',
      vendor: 'sh',
      links: [
        { label: 'SH Dummy RAND Production', url: './public/macros/dummy_rand_sh_prod.sas' },
        { label: 'SH Dummy KIT Production', url: './public/macros/dummy_kit_sh_prod.sas' }
      ]
    }
  },
  {
    id: '5a2',
    type: 'custom',
    position: { x: 100, y: 1050 },
    data: {
      id: '5a2',
      title: 'SH Dummy Data - UAT',
      description: 'Download SAS macros for creating SH dummy data from UAT environment',
      completed: false,
      category: 'development',
      vendor: 'sh',
      links: [
        { label: 'SH Dummy RAND UAT', url: './public/macros/dummy_rand_sh_uat.sas' },
        { label: 'SH Dummy KIT UAT', url: './public/macros/dummy_kit_sh_uat.sas' }
      ]
    }
  },
  {
    id: '5b1',
    type: 'custom',
    position: { x: 300, y: 1050 },
    data: {
      id: '5b1',
      title: 'CA Dummy Data - Production',
      description: 'Download SAS macros for creating Calyx dummy data from production environment',
      completed: false,
      category: 'development',
      vendor: 'ca',
      links: [
        { label: 'Calyx Dummy RAND Production', url: './public/macros/dummy_rand_calyx_prod.sas' },
        { label: 'Calyx Dummy KIT Production', url: './public/macros/dummy_kit_calyx_prod.sas' }
      ]
    }
  },
  {
    id: '5b2',
    type: 'custom',
    position: { x: 700, y: 1050 },
    data: {
      id: '5b2',
      title: 'CA Dummy Data - UAT',
      description: 'Download SAS macros for creating Calyx dummy data from UAT environment',
      completed: false,
      category: 'development',
      vendor: 'ca',
      links: [
        { label: 'Calyx Dummy RAND UAT', url: './public/macros/dummy_rand_calyx_uat.sas' },
        { label: 'Calyx Dummy KIT UAT', url: './public/macros/dummy_kit_calyx_uat.sas' }
      ]
    }
  }
])

const edges: Ref<Edge[]> = ref([
  // Step 1 to vendor selection
  { id: 'e1-1a', source: '1', target: '1a', type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e1-1b', source: '1', target: '1b', type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },

  // SH branch
  { id: 'e1a-2a', source: '1a', target: '2a', type: 'smoothstep', animated: true, style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e2a-3a', source: '2a', target: '3a', type: 'smoothstep', animated: true, style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e3a-4a1', source: '3a', target: '4a1', type: 'smoothstep', animated: true, style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e3a-4a2', source: '3a', target: '4a2', type: 'smoothstep', animated: true, style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e4a1-5a1', source: '4a1', target: '5a1', type: 'smoothstep', animated: true, style: { stroke: '#673ab7', strokeWidth: 2 } },
  { id: 'e4a2-5a2', source: '4a2', target: '5a2', type: 'smoothstep', animated: true, style: { stroke: '#673ab7', strokeWidth: 2 } },

  // CA branch
  { id: 'e1b-2b', source: '1b', target: '2b', type: 'smoothstep', animated: true, style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e2b-3b', source: '2b', target: '3b', type: 'smoothstep', animated: true, style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e3b-4b1', source: '3b', target: '4b1', type: 'smoothstep', animated: true, style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e3b-4b2', source: '3b', target: '4b2', type: 'smoothstep', animated: true, style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e4b1-5b1', source: '4b1', target: '5b1', type: 'smoothstep', animated: true, style: { stroke: '#388e3c', strokeWidth: 2 } },
  { id: 'e4b2-5b2', source: '4b2', target: '5b2', type: 'smoothstep', animated: true, style: { stroke: '#388e3c', strokeWidth: 2 } }
])

const { getNodes, getEdges, toObject } = useVueFlow()

// 导出功能
const exportToJSON = () => {
  const data = {
    nodes: nodes.value,
    edges: edges.value,
    completedTasks: Array.from(completedTasks.value),
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dbl-process-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const exportToPNG = async () => {
  const element = document.querySelector('.vue-flow-container')
  if (!element) return

  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: '#f8fafc',
      scale: 2
    })

    const link = document.createElement('a')
    link.download = `dbl-process-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL()
    link.click()
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const toggleComplete = (taskId: string): void => {
  const node = nodes.value.find(n => n.id === taskId)
  if (node) {
    node.data.completed = !node.data.completed
    if (node.data.completed) {
      completedTasks.value.add(taskId)
    } else {
      completedTasks.value.delete(taskId)
    }
  }
}

const onNodeClick = (event: any): void => {
  console.log('Node clicked:', event)
}
</script>

<style scoped>
.todo-flowchart {
  width: 100vw;
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 渐变背景 - 更素雅的色调 */
.todo-flowchart {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
}

.vue-flow-container {
  width: 100%;
  height: 100%;
}

h1 {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: #333;
  margin: 0;
  font-size: 22px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.export-buttons {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 10px;
}

.export-btn {
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.export-btn:hover {
  background: #45a049;
}

.custom-node {
  background: white;
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  min-width: 700px;
  max-width: 900px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.custom-node:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.custom-node.completed {
  background: linear-gradient(135deg, #e8f5e8, #f0fff0);
  border-color: #4caf50;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.category-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 10px;
}

.checkbox-container {
  flex-shrink: 0;
  margin-top: 5px;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  transform: scale(1.2);
}

.task-content {
  flex: 1;
}

.task-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.task-description {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.task-notes {
  margin: 10px 0;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.task-notes ul {
  margin: 0;
  padding-left: 20px;
}

.task-notes li {
  margin: 5px 0;
  font-size: 13px;
  color: #555;
  line-height: 1.3;
}

.task-links {
  margin: 10px 0;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 6px;
  border-left: 4px solid #0d6efd;
}

.link-item {
  margin: 5px 0;
}

.reference-link {
  color: #0d6efd;
  text-decoration: none;
  font-size: 14px;
}

.reference-link:hover {
  text-decoration: underline;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.optional-badge {
  display: inline-block;
  background: #ff9800;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.category-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.vendor-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.vendor-sh {
  background: linear-gradient(135deg, #d1c4e9, #b39ddb);
  color: #311b92;
  box-shadow: 0 2px 4px rgba(103, 58, 183, 0.3);
}

.vendor-ca {
  background: linear-gradient(135deg, #c8e6c9, #81c784);
  color: #1b5e20;
  box-shadow: 0 2px 4px rgba(56, 142, 60, 0.3);
}

.category-analysis {
  border-left: 4px solid #2196f3;
  background: linear-gradient(135deg, #ffffff, #f8fbff);
}

.category-data {
  border-left: 4px solid #4caf50;
  background: linear-gradient(135deg, #ffffff, #f8fff8);
}

.category-development {
  border-left: 4px solid #ff9800;
  background: linear-gradient(135deg, #ffffff, #fffaf8);
}

.category-validation {
  border-left: 4px solid #9c27b0;
  background: linear-gradient(135deg, #ffffff, #fdf8ff);
}

.completed .task-title {
  text-decoration: line-through;
  color: #888;
}

.completed .task-description {
  text-decoration: line-through;
  color: #aaa;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .custom-node {
    min-width: 500px;
    max-width: 600px;
  }
}

@media (max-width: 800px) {
  .custom-node {
    min-width: 400px;
    max-width: 500px;
  }
}

@media (max-width: 600px) {
  .custom-node {
    min-width: 300px;
    max-width: 400px;
    padding: 10px;
  }

  .task-title {
    font-size: 14px;
  }

  .task-description {
    font-size: 12px;
  }
}

/* 分类图标样式 */
.icon-analysis {
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  position: relative;
}

.icon-analysis::after {
  content: "📊";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
}

.icon-data {
  background: linear-gradient(135deg, #66bb6a, #43a047);
  position: relative;
}

.icon-data::after {
  content: "📁";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
}

.icon-development {
  background: linear-gradient(135deg, #ffa726, #ff9800);
  position: relative;
}

.icon-development::after {
  content: "⚙️";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
}

.icon-validation {
  background: linear-gradient(135deg, #ab47bc, #8e24aa);
  position: relative;
}

.icon-validation::after {
  content: "✅";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
}

/* 分类徽章样式 */
.badge-analysis {
  background: linear-gradient(135deg, #bbdefb, #90caf9);
  color: #0d47a1;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
}

.badge-data {
  background: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  color: #1b5e20;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.badge-development {
  background: linear-gradient(135deg, #ffe0b2, #ffcc80);
  color: #bf360c;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);
}

.badge-validation {
  background: linear-gradient(135deg, #f1c4f5, #e1bee7);
  color: #4a148c;
  box-shadow: 0 2px 4px rgba(156, 39, 176, 0.3);
}

/* 移除动画效果 */

/* 渐变背景动画 - 移除 */
/* @keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
} */

/* 流线型连接线样式 */
.vue-flow__edge-path {
  stroke-dasharray: 5,5;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}
</style>
