<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InteractiveFlowChart from './components/InteractiveFlowChart.vue'
import EmbeddableFlowChart from './components/EmbeddableFlowChart.vue'
import ProjectManager from './components/ProjectManager.vue'
import PWAInstallPrompt from './components/PWAInstallPrompt.vue'
import DataSyncPanel from './components/DataSyncPanel.vue'
import IntroductionPanel from './components/IntroductionPanel.vue'
import { useStudyManager } from '@/composables/useStudyManager'

interface Project {
  id: string
  studyId: string
  studyName: string
  therapeuticArea: string
  irtVendor: string
  vendorDataSource: string
  leadProgrammer: string
  nextMilestone: string
  status: 'ongoing' | 'closed'
  createdAt: string
}

const activeTab = ref('introduction')
const currentProject = ref<Project | null>(null)

// 使用 IndexedDB study 管理器
const {
  studies,
  currentStudy,
  loading,
  error,
  initializeDB,
  loadStudies,
  createNewStudy,
  saveStudy,
  loadStudy,
  setCurrentStudy,
  updateFlowData,
  exportData,
  importData,
  clearError
} = useStudyManager()

// 处理项目打开事件
const handleOpenProject = async (project: any) => {
  currentProject.value = project
  activeTab.value = 'interactive'

  // 尝试从 IndexedDB 加载对应的 study 数据
  try {
    const study = await loadStudy(project.studyId)
    if (!study) {
      // 如果没有对应的 study，创建一个新的
      await createNewStudy(project.studyName, `Study for ${project.studyId}`)
    }
  } catch (err) {
    console.error('Failed to load study:', err)
  }

  // 更新URL，使用Study ID作为路径
  const basePath = window.location.pathname
  const newPath = basePath.endsWith('/') ? `${basePath}${project.studyId}` : `${basePath}/${project.studyId}`
  window.history.pushState({}, '', newPath)
}

// 返回项目列表
const backToProjects = () => {
  activeTab.value = 'projects'
  currentProject.value = null
  setCurrentStudy(null)

  // 返回到根路径
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/') || '/'
  window.history.pushState({}, '', basePath)
}

// 从URL加载项目
const loadFromURL = async () => {
  const pathParts = window.location.pathname.split('/')
  const studyId = pathParts[pathParts.length - 1]

  // 如果路径末尾不是根路径，则尝试加载项目
  if (studyId && studyId !== '' && !studyId.includes('.')) {
    // 从localStorage加载项目数���
    const saved = localStorage.getItem('projectManager_projects')
    if (saved) {
      const projects = JSON.parse(saved)
      const project = projects.find((p: any) => p.studyId === studyId)
      if (project) {
        currentProject.value = project
        activeTab.value = 'interactive'

        // 尝试加载对应的 study 数据
        try {
          await loadStudy(studyId)
        } catch (err) {
          console.error('Failed to load study from URL:', err)
        }
      } else {
        // 如果项目不存在，返回项目列表
        backToProjects()
      }
    }
  }
}

// 切换标签页时更新URL
const switchTab = (tabName: string) => {
  activeTab.value = tabName

  // 标签���切换不改变URL中的项目ID
  if (currentProject.value && tabName !== 'projects') {
    // 保持当前的项目URL
    return
  }
}

// 下载项目快捷方式（原复制项目链接）
const copyProjectLink = (project: any) => {
  const basePath = window.origin + window.location.pathname
  const projectUrl = basePath.endsWith('/') ? `${basePath}${project.studyId}` : `${basePath}/${project.studyId}`

  // 创建Windows快捷方式文件内容
  const shortcutContent = `[InternetShortcut]
URL=${projectUrl}
IconIndex=0
HotKey=0`

  // 创建Blob并触发下载
  const blob = new Blob([shortcutContent], { type: 'application/x-internet-shortcut' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.studyId}_项目快捷方式.url`
  a.click()
  URL.revokeObjectURL(url)

  // 显示下载成功���息
  alert(`项目快捷方式已下载！\n您可以双击此快捷方式文件访问项目: ${project.studyId}`)
}

// 组件挂载时从URL加载
onMounted(async () => {
  // ��始化 IndexedDB
  try {
    await initializeDB()
  } catch (err) {
    console.error('Failed to initialize IndexedDB:', err)
  }

  await loadFromURL()

  // 监听浏览器后退/前进按钮
  window.addEventListener('popstate', loadFromURL)
})
</script>

<template>
  <div id="app">
    <!-- PWA安装提示 -->
    <PWAInstallPrompt />

    <header class="app-header">
      <div class="header-content">
        <h1>Dummy IRT for Biopharma Studies</h1>
        <nav class="nav-tabs">
          <button
            @click="activeTab = 'introduction'"
            :class="{ active: activeTab === 'introduction' }"
            class="nav-tab"
          >
            📖 Introduction
          </button>
          <button
            @click="activeTab = 'projects'"
            :class="{ active: activeTab === 'projects' }"
            class="nav-tab"
          >
            📊 Project Management
          </button>
          <button
            @click="activeTab = 'interactive'"
            :class="{ active: activeTab === 'interactive' }"
            class="nav-tab"
            :disabled="!currentProject"
          >
            🎯 Flow Chart Tool
          </button>
          <button
            @click="activeTab = 'embed'"
            :class="{ active: activeTab === 'embed' }"
            class="nav-tab"
          >
            📱 Embed Preview
          </button>
          <button
            @click="activeTab = 'sync'"
            :class="{ active: activeTab === 'sync' }"
            class="nav-tab"
          >
            ☁️ Data Sync
          </button>
        </nav>
      </div>

      <!-- 项目信息显示 -->
      <div v-if="currentProject && activeTab === 'interactive'" class="project-info">
        <div class="project-breadcrumb">
          <button @click="backToProjects" class="breadcrumb-btn">← Back to Projects</button>
          <span class="project-name">{{ currentProject.studyName }}</span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <!-- 错误提示 -->
      <div v-if="error" class="error-banner">
        <span>{{ error }}</span>
        <button @click="clearError" class="error-close">×</button>
      </div>

      <!-- 加载指示器 -->
      <div v-if="loading" class="loading-banner">
        <span>Loading...</span>
      </div>

      <IntroductionPanel v-if="activeTab === 'introduction'" />
      <ProjectManager
        v-else-if="activeTab === 'projects'"
        @openProject="handleOpenProject"
        @copyProjectLink="copyProjectLink"
      />
      <InteractiveFlowChart
        v-else-if="activeTab === 'interactive'"
        :project="currentProject"
        :currentStudy="currentStudy"
        @updateFlowData="updateFlowData"
      />
      <EmbeddableFlowChart
        v-else-if="activeTab === 'embed'"
        title="Dummy IRT - Embed Preview"
        :readonly="false"
        :show-powered-by="true"
        width="100%"
        height="600px"
      />
      <DataSyncPanel v-else-if="activeTab === 'sync'" />
    </main>
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.app-header h1 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 500;
}

.nav-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.nav-tab {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #6b7280;
  font-size: 0.9rem;
}

.nav-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-tab.active {
  background: #374151;
  color: white;
}

.nav-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

/* 确保所有子组件都能充满空间 */
.app-main > * {
  flex: 1;
  height: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.project-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breadcrumb-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.breadcrumb-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.project-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.9rem;
}

/* 错误提示样式 */
.error-banner {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem 1.5rem;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  margin: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-close {
  background: none;
  border: none;
  color: #b91c1c;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0 0.5rem;
}

/* 加载指示器样式 */
.loading-banner {
  background: #e0f7fa;
  color: #00796b;
  padding: 0.75rem 1.5rem;
  border: 1px solid #b2ebf2;
  border-radius: 4px;
  margin: 1rem 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
