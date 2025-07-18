<template>
  <div v-if="showInstallPrompt" class="install-prompt">
    <div class="install-content">
      <div class="install-icon">📱</div>
      <div class="install-text">
        <h3>安装 DBL Process Flow</h3>
        <p>将此应用安装到您的桌面，获得更好的使用体验</p>
      </div>
      <div class="install-actions">
        <button @click="installApp" class="install-btn primary">
          安装应用
        </button>
        <button @click="dismissPrompt" class="install-btn secondary">
          暂不安装
        </button>
      </div>
    </div>
  </div>

  <!-- iOS Safari 特殊提示 -->
  <div v-if="showIOSPrompt" class="ios-prompt">
    <div class="ios-content">
      <div class="ios-icon">📱</div>
      <div class="ios-text">
        <h3>添加到主屏幕</h3>
        <p>在Safari中，点击底部的分享按钮 📤，然后选择"添加到主屏幕"</p>
      </div>
      <button @click="dismissIOSPrompt" class="ios-close">×</button>
    </div>
  </div>

  <!-- 更新提示 -->
  <div v-if="showUpdatePrompt" class="update-prompt">
    <div class="update-content">
      <div class="update-icon">🔄</div>
      <div class="update-text">
        <h3>发现新版本</h3>
        <p>应用已更新，点击刷新使用最新版本</p>
      </div>
      <div class="update-actions">
        <button @click="updateApp" class="update-btn primary">
          立即更新
        </button>
        <button @click="dismissUpdatePrompt" class="update-btn secondary">
          稍后
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
const showIOSPrompt = ref(false)
const showUpdatePrompt = ref(false)
let deferredPrompt: any = null

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`用户选择: ${outcome}`)
    deferredPrompt = null
    showInstallPrompt.value = false
  }
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  // 24小时后再次显示提示
  localStorage.setItem('installPromptDismissed', Date.now().toString())
}

const dismissIOSPrompt = () => {
  showIOSPrompt.value = false
  localStorage.setItem('iosPromptDismissed', Date.now().toString())
}

const updateApp = () => {
  window.location.reload()
}

const dismissUpdatePrompt = () => {
  showUpdatePrompt.value = false
}

onMounted(() => {
  // 检查是否已经安装或在独立模式下运行
  if (isInStandaloneMode()) {
    return
  }

  // 检查是否是iOS设备
  if (isIOS()) {
    const dismissed = localStorage.getItem('iosPromptDismissed')
    if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
      showIOSPrompt.value = true
    }
    return
  }

  // 监听PWA安装事件
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e

    // 检查是否最近被忽略
    const dismissed = localStorage.getItem('installPromptDismissed')
    if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
      showInstallPrompt.value = true
    }
  })

  // 监听安装完成事件
  window.addEventListener('appinstalled', () => {
    console.log('PWA已安装')
    showInstallPrompt.value = false
    deferredPrompt = null
  })

  // 监听Service Worker更新
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showUpdatePrompt.value = true
    })
  }
})
</script>

<style scoped>
.install-prompt,
.ios-prompt,
.update-prompt {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
}

.install-content,
.ios-content,
.update-content {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.install-icon,
.ios-icon,
.update-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.install-text,
.ios-text,
.update-text {
  flex: 1;
}

.install-text h3,
.ios-text h3,
.update-text h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #374151;
}

.install-text p,
.ios-text p,
.update-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.4;
}

.install-actions,
.update-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.install-btn,
.update-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.install-btn.primary,
.update-btn.primary {
  background: #3b82f6;
  color: white;
}

.install-btn.primary:hover,
.update-btn.primary:hover {
  background: #2563eb;
}

.install-btn.secondary,
.update-btn.secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.install-btn.secondary:hover,
.update-btn.secondary:hover {
  background: #e5e7eb;
}

.ios-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
}

.ios-close:hover {
  color: #374151;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .install-prompt,
  .ios-prompt,
  .update-prompt {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
