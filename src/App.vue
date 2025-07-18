<script setup lang="ts">
import { ref } from 'vue'
import InteractiveFlowChart from './components/InteractiveFlowChart.vue'
import EmbeddableFlowChart from './components/EmbeddableFlowChart.vue'
import TodoFlowChart from './components/TodoFlowChart.vue'
import PWAInstallPrompt from './components/PWAInstallPrompt.vue'

const activeTab = ref('interactive')
</script>

<template>
  <div id="app">
    <!-- PWA安装提示 -->
    <PWAInstallPrompt />

    <header class="app-header">
      <h1>DBL Process Flow System</h1>
      <nav class="nav-tabs">
        <button
          @click="activeTab = 'interactive'"
          :class="{ active: activeTab === 'interactive' }"
          class="nav-tab"
        >
          交互式流程图
        </button>
        <button
          @click="activeTab = 'embed'"
          :class="{ active: activeTab === 'embed' }"
          class="nav-tab"
        >
          嵌入式预览
        </button>
        <button
          @click="activeTab = 'todo'"
          :class="{ active: activeTab === 'todo' }"
          class="nav-tab"
        >
          原版流程图
        </button>
      </nav>
    </header>

    <main class="app-main">
      <InteractiveFlowChart v-if="activeTab === 'interactive'" />
      <EmbeddableFlowChart
        v-else-if="activeTab === 'embed'"
        title="DBL Process Flow - 嵌入式预览"
        :readonly="false"
        :show-powered-by="true"
        width="100%"
        height="600px"
      />
      <TodoFlowChart v-else-if="activeTab === 'todo'" />
    </main>
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
}

.app-header h1 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.5rem;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.nav-tab {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab:hover {
  background: #e5e7eb;
}

.nav-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
