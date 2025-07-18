<template>
  <div class="todo-flowchart">
    <h1>Current Proposal - DBL Process</h1>
    <div class="export-buttons">
      <button @click="exportToJSON" class="export-btn">Export to JSON</button>
      <button @click="exportToPNG" class="export-btn">Export to PNG</button>
    </div>
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.5, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="1.2"
      :fit-view-on-init="true"
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
            <div class="badges">
              <div v-if="data.optional" class="optional-badge">Optional</div>
              <div v-if="data.category" class="category-badge" :class="`badge-${data.category}`">
                {{ data.category }}
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
      title: 'Step 1: Review DTS/DTA',
      description: 'Review DTS/DTA from IRT vendor',
      completed: false,
      category: 'analysis'
    }
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 200, y: 300 },
    data: {
      id: '2',
      title: 'Step 2: Request Dummy Data',
      description: 'Request dummy rand & kit from IRT vendor to check data structure and code list',
      completed: false,
      category: 'data'
    }
  },
  {
    id: '2a',
    type: 'custom',
    position: { x: 50, y: 550 },
    data: {
      id: '2a',
      title: 'Step 2A: Data from Production List',
      description: 'Process data from production list environment',
      completed: false,
      category: 'data'
    }
  },
  {
    id: '2b',
    type: 'custom',
    position: { x: 650, y: 550 },
    data: {
      id: '2b',
      title: 'Step 2B: Data from UAT Environment',
      description: 'Process data from UAT (User Acceptance Testing) environment',
      completed: false,
      category: 'data'
    }
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 200, y: 800 },
    data: {
      id: '3',
      title: 'Step 3: Create Dummy Data',
      description: 'Create dummy rand & kit date by A&R (either by internal team or A&R vendor) for DR code development use',
      notes: [
        'If necessary, double confirm the logic of dummy RAND with stats',
        'Need to discuss whether do we need standardize the macro',
        'It might be difficult due to different study design for KIT. Rand might be more straight forward'
      ],
      completed: false,
      category: 'development'
    }
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 200, y: 1100 },
    data: {
      id: '4',
      title: 'Step 4: Cross Check with Rave Data',
      description: 'Use IRT blinded report to cross check with Rave data (EX, DA) after LSLV',
      optional: true,
      completed: false,
      category: 'validation'
    }
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 200, y: 1350 },
    data: {
      id: '5',
      title: 'Step 5: Follow-up Inconsistencies',
      description: 'Follow-up with both study team and IRT vendor to address inconsistencies between IRT report and Rave data',
      optional: true,
      completed: false,
      category: 'validation'
    }
  }
])

const edges: Ref<Edge[]> = ref([
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e2-2a', source: '2', target: '2a', type: 'smoothstep', animated: true, style: { stroke: '#a1a1aa', strokeWidth: 2 } },
  { id: 'e2-2b', source: '2', target: '2b', type: 'smoothstep', animated: true, style: { stroke: '#a1a1aa', strokeWidth: 2 } },
  { id: 'e2a-3', source: '2a', target: '3', type: 'smoothstep', animated: true, style: { stroke: '#9ca3af', strokeWidth: 2 } },
  { id: 'e2b-3', source: '2b', target: '3', type: 'smoothstep', animated: true, style: { stroke: '#9ca3af', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true, style: { stroke: '#a8a29e', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', animated: true, style: { stroke: '#a3a3a3', strokeWidth: 2 } }
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
  padding: 15px;
  min-width: 600px;
  max-width: 800px;
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
