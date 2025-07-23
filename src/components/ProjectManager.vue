<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface Project {
  id: string
  studyId: string  // Study ID - 用户输入的实际研究ID
  studyName: string  // Study Name
  therapeuticArea: string  // TA (治疗领域) - 下拉选择
  irtVendor: string  // IRT Vendor - 下拉选择
  vendorDataSource: string  // Vendor Dummy Data Source - 下拉选择
  leadProgrammer: string  // Lead Programmer
  nextMilestone: string  // Next Milestone
  status: 'ongoing' | 'closed'  // 状态
  createdAt: string
}

const projects = ref<Project[]>([])
const showCreateForm = ref(false)
const stats = reactive({
  total: 0,
  active: 0,
  completed: 0
})

const newProject = reactive({
  studyId: '',
  studyName: '',
  therapeuticArea: '',
  irtVendor: '',
  vendorDataSource: '',
  leadProgrammer: '',
  nextMilestone: '',
  status: 'ongoing'
})

// 编辑项目相关状态
const editingProject = ref<string | null>(null)
const editForm = reactive<{
  studyId: string
  studyName: string
  therapeuticArea: string
  irtVendor: string
  vendorDataSource: string
  leadProgrammer: string
  nextMilestone: string
  status: 'ongoing' | 'closed'
}>({
  studyId: '',
  studyName: '',
  therapeuticArea: '',
  irtVendor: '',
  vendorDataSource: '',
  leadProgrammer: '',
  nextMilestone: '',
  status: 'ongoing'
})

// 下拉选项数据
const therapeuticAreas = [
  'Oncology',
  'Cardiovascular',
  'CNS',
  'Respiratory',
  'Immunology',
  'Metabolic',
  'Infectious Disease',
  'Dermatology',
  'Ophthalmology',
  'Other'
]

const irtVendors = [
  'IQVIA RTSM',
  'Medidata Rave RTSM',
  'Oracle InForm IWRS',
  'Bioclinica IRT',
  'Other'
]

const vendorDataSources = [
  'UAT Test Environment',
  'Production Data',
  'Staging Environment',
  'Development Environment'
]

// 生成唯一ID（用于系统内部）
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 创建新项目
const createProject = () => {
  if (!newProject.studyId.trim()) {
    alert('Please enter Study ID')
    return
  }
  if (!newProject.studyName.trim()) {
    alert('Please enter Study Name')
    return
  }
  if (!newProject.therapeuticArea) {
    alert('Please select Therapeutic Area (TA)')
    return
  }
  if (!newProject.irtVendor) {
    alert('Please select IRT Vendor')
    return
  }
  if (!newProject.vendorDataSource) {
    alert('Please select Vendor Dummy Data Source')
    return
  }

  const projectData: Project = {
    id: generateId(),
    studyId: newProject.studyId.trim(),
    studyName: newProject.studyName.trim(),
    therapeuticArea: newProject.therapeuticArea,
    irtVendor: newProject.irtVendor,
    vendorDataSource: newProject.vendorDataSource,
    leadProgrammer: newProject.leadProgrammer.trim(),
    nextMilestone: newProject.nextMilestone.trim(),
    status: 'ongoing',
    createdAt: new Date().toISOString()
  }

  projects.value.push(projectData)
  saveProjects()
  updateStats()
  resetForm()
  showCreateForm.value = false
}

// 删除项目
const deleteProject = (projectId: string) => {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    projects.value = projects.value.filter(p => p.id !== projectId)
    saveProjects()
    updateStats()

    // 清理项目相关的本地存储
    localStorage.removeItem(`todoFlow_project_${projectId}`)
  }
}

// 打开项目 - 导航到流程图页面
const openProject = (projectId: string) => {
  const project = projects.value.find(p => p.id === projectId)
  if (project) {
    // 将项目信息存储到localStorage，供流程图页面使用
    localStorage.setItem('currentProject', JSON.stringify(project))
    // 触发父组件切换到流程图页面
    emit('openProject', project)
  }
}

// 下载项目文件
const downloadProject = (projectId: string) => {
  const project = projects.value.find(p => p.id === projectId)
  if (project) {
    createProjectFile(project)
  }
}

// 创建项目专用的HTML文件
const createProjectFile = (project: Project) => {
  const projectHtml = generateProjectHTML(project)
  const blob = new Blob([projectHtml], { type: 'text/html' })

  // 创建临时URL和下载链接
  let downloadUrl = URL.createObjectURL(blob)
  let downloadLink = document.createElement('a')
  downloadLink.href = downloadUrl
  downloadLink.download = `project_${project.id}_${project.studyId.replace(/[^a-zA-Z0-9]/g, '_')}.html`

  // 触发下载
  downloadLink.click()

  // 释放URL资源
  URL.revokeObjectURL(downloadUrl)
}

// 生成项目HTML模板
const generateProjectHTML = (project: Project) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.studyId} - Dummy IRT Flow Chart</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .content { margin-top: 20px; padding: 20px; background: #fff; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 ${project.studyId}</h1>
        <p><strong>Study Name:</strong> ${project.studyName}</p>
        <p><strong>IRT Vendor:</strong> ${project.irtVendor}</p>
        <p><strong>Data Source:</strong> ${project.vendorDataSource}</p>
        <p><strong>Lead Programmer:</strong> ${project.leadProgrammer}</p>
    </div>
    <div class="content">
        <h2>🚀 Dummy IRT Flow Chart</h2>
        <p>This is the flow chart page for study: ${project.studyId}</p>
        <p>Project ID: ${project.id}</p>
    </div>
    <script>
        const projectData = {
            id: '${project.id}',
            studyId: '${project.studyId}',
            studyName: '${project.studyName}',
            irtVendor: '${project.irtVendor}',
            vendorDataSource: '${project.vendorDataSource}',
            leadProgrammer: '${project.leadProgrammer}',
            therapeuticArea: '${project.therapeuticArea}',
            nextMilestone: '${project.nextMilestone}',
            status: '${project.status}',
            createdAt: '${project.createdAt}'
        };
        console.log('Project loaded:', projectData);
    <\/script>
</body>
</html>`
  return htmlContent
}

// 更新统计信息
const updateStats = () => {
  stats.total = projects.value.length
  stats.active = projects.value.filter(p => p.status === 'ongoing').length
  stats.completed = projects.value.filter(p => p.status === 'closed').length
}

// 加载项目数据
const loadProjects = () => {
  const saved = localStorage.getItem('projectManager_projects')
  if (saved) {
    projects.value = JSON.parse(saved)
  }
}

// 保存项目数据
const saveProjects = () => {
  localStorage.setItem('projectManager_projects', JSON.stringify(projects.value))
}

// 定义事件
const emit = defineEmits<{
  openProject: [project: Project]
  copyProjectLink: [project: Project]
}>()

// 重置表单
const resetForm = () => {
  newProject.studyId = ''
  newProject.studyName = ''
  newProject.therapeuticArea = ''
  newProject.irtVendor = ''
  newProject.vendorDataSource = ''
  newProject.leadProgrammer = ''
  newProject.nextMilestone = ''
  newProject.status = 'ongoing'
}

// 重置编辑表单
const resetEditForm = () => {
  editForm.studyId = ''
  editForm.studyName = ''
  editForm.therapeuticArea = ''
  editForm.irtVendor = ''
  editForm.vendorDataSource = ''
  editForm.leadProgrammer = ''
  editForm.nextMilestone = ''
  editForm.status = 'ongoing'
}

// 复制项目链接
const copyProjectLink = (project: Project) => {
  emit('copyProjectLink', project)
}

// 组件挂载时加载数据
onMounted(() => {
  loadProjects()
  updateStats()
})

// 新增辅助方法
const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active'
    case 'completed': return 'Completed'
    case 'archived': return 'Archived'
    default: return 'Unknown'
  }
}

const getRandCount = (project: Project) => {
  // 这里可以从项目数据中获取RAND数量，暂时返回随机数
  return Math.floor(Math.random() * 50) + 10
}

const getKitCount = (project: Project) => {
  // 这里可以从项目数据中获取KIT数量，暂时返回随机数
  return Math.floor(Math.random() * 100) + 20
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// ��辑项目
const startEditProject = (project: Project) => {
  editingProject.value = project.id
  editForm.studyId = project.studyId
  editForm.studyName = project.studyName
  editForm.therapeuticArea = project.therapeuticArea
  editForm.irtVendor = project.irtVendor
  editForm.vendorDataSource = project.vendorDataSource
  editForm.leadProgrammer = project.leadProgrammer
  editForm.nextMilestone = project.nextMilestone
  editForm.status = project.status
}

// 保存编辑的项目
const saveEditProject = () => {
  // 添加表单验证，并确保字���不为undefined
  const studyId = editForm.studyId || ''
  const studyName = editForm.studyName || ''
  const leadProgrammer = editForm.leadProgrammer || ''
  const nextMilestone = editForm.nextMilestone || ''

  if (!studyId.trim()) {
    alert('Please enter Study ID')
    return
  }
  if (!studyName.trim()) {
    alert('Please enter Study Name')
    return
  }
  if (!editForm.therapeuticArea) {
    alert('Please select Therapeutic Area (TA)')
    return
  }
  if (!editForm.irtVendor) {
    alert('Please select IRT Vendor')
    return
  }
  if (!editForm.vendorDataSource) {
    alert('Please select Vendor Dummy Data Source')
    return
  }

  const projectIndex = projects.value.findIndex(p => p.id === editingProject.value)
  if (projectIndex !== -1) {
    projects.value[projectIndex] = {
      ...projects.value[projectIndex],
      studyId: studyId.trim(),
      studyName: studyName.trim(),
      therapeuticArea: editForm.therapeuticArea,
      irtVendor: editForm.irtVendor,
      vendorDataSource: editForm.vendorDataSource,
      leadProgrammer: leadProgrammer.trim(),
      nextMilestone: nextMilestone.trim(),
      status: editForm.status
    }
    saveProjects()
    updateStats()
    editingProject.value = null
    resetEditForm()

    // 添加保存成功提示
    alert('Project saved successfully!')
  }
}

// 取消编辑
const cancelEdit = () => {
  editingProject.value = null
  resetEditForm()
}
</script>

<template>
  <div class="project-manager">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>🧪 Dummy IRT Manager</h1>
        <p class="subtitle">Clinical Trial Virtual Randomization & Drug Management System</p>
        <p class="description">Generate Dummy RAND and KIT data for Dry Run phase</p>
      </div>

      <!-- 创建项目按钮 -->
      <button
        @click="showCreateForm = !showCreateForm"
        class="btn btn-primary"
        :class="{ active: showCreateForm }"
      >
        {{ showCreateForm ? 'Cancel Creation' : '+ Create New Study' }}
      </button>

      <!-- 创建项目表单 -->
      <div v-if="showCreateForm" class="project-form">
        <h2>Create New Study Project</h2>
        <form @submit.prevent="createProject">
          <div class="form-group">
            <label for="studyId">Study ID *</label>
            <input
              type="text"
              id="studyId"
              v-model="newProject.studyId"
              required
              placeholder="e.g., PROTO-2024-001"
            >
          </div>

          <div class="form-group">
            <label for="studyName">Study Name *</label>
            <input
              type="text"
              id="studyName"
              v-model="newProject.studyName"
              required
              placeholder="e.g., Phase III Oncology Study"
            >
          </div>

          <div class="form-group">
            <label for="therapeuticArea">TA (Therapeutic Area) *</label>
            <select
              id="therapeuticArea"
              v-model="newProject.therapeuticArea"
              required
            >
              <option value="">Please select therapeutic area</option>
              <option v-for="ta in therapeuticAreas" :key="ta" :value="ta">
                {{ ta }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="irtVendor">IRT Vendor *</label>
            <select
              id="irtVendor"
              v-model="newProject.irtVendor"
              required
            >
              <option value="">Please select IRT vendor</option>
              <option v-for="vendor in irtVendors" :key="vendor" :value="vendor">
                {{ vendor }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="vendorDataSource">Vendor Dummy Data Source *</label>
            <select
              id="vendorDataSource"
              v-model="newProject.vendorDataSource"
              required
            >
              <option value="">Please select data source</option>
              <option v-for="source in vendorDataSources" :key="source" :value="source">
                {{ source }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="leadProgrammer">Lead Programmer</label>
            <input
              type="text"
              id="leadProgrammer"
              v-model="newProject.leadProgrammer"
              placeholder="Lead programmer name"
            >
          </div>

          <div class="form-group">
            <label for="nextMilestone">Next Milestone</label>
            <input
              type="text"
              id="nextMilestone"
              v-model="newProject.nextMilestone"
              placeholder="e.g., First Patient First Visit"
            >
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Create Study</button>
            <button type="button" @click="resetForm" class="btn btn-secondary">Reset</button>
          </div>
        </form>
      </div>

      <!-- 统计信息 -->
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total Studies</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.active }}</div>
          <div class="stat-label">Ongoing Studies</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.completed }}</div>
          <div class="stat-label">Completed Studies</div>
        </div>
      </div>

      <!-- 说明信息 -->
      <div class="info-panel">
        <h3>🔒 Dummy IRT Instructions</h3>
        <ul>
          <li>• Generate virtual data for Dry Run phase</li>
          <li>• Support for major IRT vendors</li>
          <li>• Choose UAT or production environment data</li>
          <li>• Generate Dummy RAND and KIT data</li>
          <li>• Ensure trial process correctness</li>
        </ul>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <div class="projects-section">
        <div class="section-header">
          <h2>Clinical Research Projects</h2>
          <div class="view-controls">
            <span class="total-count">Total {{ stats.total }} studies</span>
          </div>
        </div>

        <!-- 项目列表 -->
        <div v-if="projects.length === 0" class="empty-state">
          <div class="empty-icon">🧪</div>
          <h3>No Research Projects</h3>
          <p>Create your first Dummy IRT research project</p>
          <p class="empty-hint">Start managing RAND and KIT virtual data</p>
        </div>

        <div v-else class="projects-grid">
          <div
            v-for="project in projects"
            :key="project.id"
            class="study-card"
            :class="{ 'status-active': project.status === 'ongoing' }"
          >
            <div class="card-header">
              <div class="study-title">
                <h3 class="study-id">{{ project.studyId }}</h3>
                <p class="study-name">{{ project.studyName }}</p>
              </div>
              <span class="status-badge" :class="project.status">
                {{ project.status === 'ongoing' ? 'Ongoing' : 'Closed' }}
              </span>
            </div>

            <div class="card-content">
              <div class="info-list">
                <div class="info-item">
                  <span class="label">TA:</span>
                  <span class="value">{{ project.therapeuticArea }}</span>
                </div>

                <div class="info-item">
                  <span class="label">IRT Vendor:</span>
                  <span class="value">{{ project.irtVendor }}</span>
                </div>

                <div class="info-item">
                  <span class="label">Data Source:</span>
                  <span class="value data-source" :class="project.vendorDataSource ? project.vendorDataSource.toLowerCase().replace(/\s+/g, '-') : ''">
                    {{ project.vendorDataSource || 'Not Set' }}
                  </span>
                </div>

                <div class="info-item">
                  <span class="label">Lead Programmer:</span>
                  <span class="value">{{ project.leadProgrammer || 'Not Assigned' }}</span>
                </div>

                <div class="info-item">
                  <span class="label">Next Milestone:</span>
                  <span class="value">{{ project.nextMilestone || 'Not Set' }}</span>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <div class="primary-actions">
                <button @click="openProject(project.id)" class="btn-primary-action">
                  Open Flow Chart
                </button>
                <button @click="startEditProject(project)" class="btn-secondary-action">
                  Edit
                </button>
              </div>
              <div class="secondary-actions">
                <button @click="copyProjectLink(project)" class="btn-tertiary-action">
                  Download Shortcut
                </button>
                <button @click="deleteProject(project.id)" class="btn-danger-action">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑项目表单 -->
      <div v-if="editingProject" class="edit-project-form">
        <h2>Edit Study Project</h2>
        <form @submit.prevent="saveEditProject">
          <div class="form-group">
            <label for="editStudyId">Study ID *</label>
            <input
              type="text"
              id="editStudyId"
              v-model="editForm.studyId"
              required
              placeholder="e.g., PROTO-2024-001"
            >
          </div>

          <div class="form-group">
            <label for="editStudyName">Study Name *</label>
            <input
              type="text"
              id="editStudyName"
              v-model="editForm.studyName"
              required
              placeholder="e.g., Phase III Oncology Study"
            >
          </div>

          <div class="form-group">
            <label for="editTherapeuticArea">TA (Therapeutic Area) *</label>
            <select
              id="editTherapeuticArea"
              v-model="editForm.therapeuticArea"
              required
            >
              <option value="">Please select therapeutic area</option>
              <option v-for="ta in therapeuticAreas" :key="ta" :value="ta">
                {{ ta }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editIrtVendor">IRT Vendor *</label>
            <select
              id="editIrtVendor"
              v-model="editForm.irtVendor"
              required
            >
              <option value="">Please select IRT vendor</option>
              <option v-for="vendor in irtVendors" :key="vendor" :value="vendor">
                {{ vendor }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editVendorDataSource">Vendor Dummy Data Source *</label>
            <select
              id="editVendorDataSource"
              v-model="editForm.vendorDataSource"
              required
            >
              <option value="">Please select data source</option>
              <option v-for="source in vendorDataSources" :key="source" :value="source">
                {{ source }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editLeadProgrammer">Lead Programmer</label>
            <input
              type="text"
              id="editLeadProgrammer"
              v-model="editForm.leadProgrammer"
              placeholder="Lead programmer name"
            >
          </div>

          <div class="form-group">
            <label for="editNextMilestone">Next Milestone</label>
            <input
              type="text"
              id="editNextMilestone"
              v-model="editForm.nextMilestone"
              placeholder="e.g., First Patient First Visit"
            >
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Study</button>
            <button type="button" @click="cancelEdit" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-manager {
  height: 100%;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 0;
  background: #ffffff;
}

.sidebar {
  background: #f8f9fa;
  border-right: 1px solid #e5e7eb;
  padding: 30px;
  overflow-y: auto;
}

.sidebar-header h1 {
  color: #374151;
  margin-bottom: 10px;
  font-size: 1.5em;
  font-weight: 500;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 30px;
  font-size: 0.9em;
}

.btn {
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  background: #ffffff;
  color: #374151;
}

.btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #374151;
  color: white;
  border-color: #374151;
}

.btn-primary:hover {
  background: #1f2937;
  border-color: #1f2937;
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ffffff;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.btn-info {
  background: #ffffff;
  color: #0891b2;
  border-color: #a7f3d0;
}

.btn-info:hover {
  background: #f0fdfa;
  border-color: #6ee7b7;
}

.btn-small {
  padding: 6px 10px;
  font-size: 12px;
}

.project-form {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #e5e7eb;
}

.project-form h2 {
  color: #374151;
  margin-bottom: 20px;
  font-size: 1.1em;
  font-weight: 500;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #9ca3af;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: white;
  cursor: pointer;
}

.form-group select:focus {
  outline: none;
  border-color: #9ca3af;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-top: 30px;
}

.stat-card {
  background: #f9fafb;
  color: #374151;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-number {
  font-size: 1.5em;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.8em;
  color: #6b7280;
}

.main-content {
  padding: 30px;
  overflow-y: auto;
  background: #ffffff;
}

.projects-section h2 {
  color: #374151;
  margin-bottom: 30px;
  font-size: 1.3em;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 20px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 新增试验卡片样式 */
.info-panel {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
}

.info-panel h3 {
  color: #0369a1;
  margin-bottom: 15px;
  font-size: 1em;
  font-weight: 600;
}

.info-panel ul {
  color: #374151;
  font-size: 0.9em;
  line-height: 1.6;
}

.info-panel li {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.total-count {
  color: #6b7280;
  font-size: 0.9em;
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 20px;
}

.empty-hint {
  color: #9ca3af;
  font-size: 0.9em;
  margin-top: 8px;
}

/* 试验卡片样式 */
.study-card {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.study-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.study-card.status-active {
  border-left: 4px solid #10b981;
}

.study-title h3 {
  color: #1f2937;
  font-size: 1.2em;
  font-weight: 700;
  margin: 0 0 4px 0;
  font-family: 'Courier New', monospace;
}

.study-name {
  color: #6b7280;
  font-size: 0.9em;
  margin: 0;
  line-height: 1.4;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 16px 0;
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-item .label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  min-width: 100px;
}

.info-item .value {
  color: #1f2937;
  font-size: 0.9em;
  font-weight: 500;
  text-align: right;
  margin-left: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.primary-actions {
  display: flex;
  gap: 10px;
}

.secondary-actions {
  display: flex;
  gap: 10px;
}

.btn-primary-action {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-primary-action:hover {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.25);
}

.btn-secondary-action {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-secondary-action:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(71, 85, 105, 0.15);
}

.btn-tertiary-action {
  background: #f9fafb;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-tertiary-action:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-danger-action {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-danger-action:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.edit-project-form {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #e5e7eb;
}

.edit-project-form h2 {
  color: #374151;
  margin-bottom: 20px;
  font-size: 1.1em;
  font-weight: 500;
}
</style>
