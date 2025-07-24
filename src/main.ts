import './assets/main.css'
// 临时移除Vue Flow的默认样式，使用我们自己的简洁样式
// import '@vue-flow/core/dist/style.css'
// import '@vue-flow/core/dist/theme-default.css'
// import '@vue-flow/controls/dist/style.css'
// import '@vue-flow/minimap/dist/style.css'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')

// PWA 注册 - 仅在生产环境且支持 Service Worker 时注册
// 使用运行时检查避免在单文件构建中的模块解析问题
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // 检查是否为 PWA 构建模式（通过检查是否存在 sw.js）
  fetch('./sw.js', { method: 'HEAD' })
    .then(() => {
      // 如果 sw.js 存在，说明是 PWA 构建，尝试注册 Service Worker
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.log('PWA Service Worker registration failed:', error)
        })
    })
    .catch(() => {
      // sw.js 不存在，说明是单文件构建，不注册 Service Worker
      console.log('Running in standalone mode, no PWA features')
    })
}
