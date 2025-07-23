import './assets/main.css'
// 临时移除Vue Flow的默认样式，使用我们自己的简洁样式
// import '@vue-flow/core/dist/style.css'
// import '@vue-flow/core/dist/theme-default.css'
// import '@vue-flow/controls/dist/style.css'
// import '@vue-flow/minimap/dist/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)

// 注册 PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh!')
    // 可以在这里显示更新提示
    if (confirm('发现新版本，是否立即更新？')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
    // 应用已准备好离线工作
  },
})

app.mount('#app')
