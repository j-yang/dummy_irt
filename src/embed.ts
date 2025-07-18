import { createApp } from 'vue'
import EmbeddableFlowChart from './components/EmbeddableFlowChart.vue'
import './assets/main.css'

// 全局样式
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// 作为独立应用运行
if (typeof window !== 'undefined' && window.document) {
  const app = createApp(EmbeddableFlowChart)

  // 从URL参数或数据属性获取配置
  const container = document.getElementById('flowchart-app')
  if (container) {
    const config = {
      flowId: container.dataset.flowId || new URLSearchParams(window.location.search).get('flowId'),
      title: container.dataset.title || 'Flow Chart',
      hideHeader: container.dataset.hideHeader === 'true',
      readonly: container.dataset.readonly === 'true',
      showPoweredBy: container.dataset.showPoweredBy !== 'false',
      width: container.dataset.width || '100%',
      height: container.dataset.height || '600px'
    }

    app.provide('config', config)
    app.mount(container)
  }
}

// 作为库导出
export default EmbeddableFlowChart
export { EmbeddableFlowChart }
