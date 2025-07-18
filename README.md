# DBL Process Flow - 交互式流程图

一个基于Vue Flow的交互式流程图组件，支持文件附件管理和SFTP上传功能。

## 🆕 PWA版本 - 推荐！

**最佳分发方式**：PWA（Progressive Web App）让用户直接从浏览器安装应用到桌面，享受原生应用体验。

### ✨ PWA优势
- 📱 **一键安装**: 用户访问网站即可安装到桌面
- 🔄 **自动更新**: 无需手动下载新版本
- 🌐 **跨平台**: Windows、Mac、Linux、Android、iOS全支持
- 📦 **轻量级**: 只有几MB，比exe文件小得多
- 🔒 **安全**: 通过HTTPS加密传输
- ⚡ **快速**: 离线缓存，秒开应用

### 🚀 快速部署PWA
```bash
# 1. 构建PWA版本
npm run build

# 2. 部署到任何支持HTTPS的服务器
# 推荐: GitHub Pages, Netlify, Vercel

# 3. 用户访问链接即可安装
```

详细部署指南请查看: [PWA-DEPLOYMENT.md](./PWA-DEPLOYMENT.md)

## 功能特性

- ✅ 交互式流程图节点
- ✅ 步骤状态管理（未完成/进行中/已完成）
- ✅ 文件附件管理（支持拖拽上传）
- ✅ SFTP文件上传功能
- ✅ 文件预览（图片、文本）
- ✅ 流程图导出（PNG格式）
- ✅ 分享链接生成
- ✅ 全屏显示模式
- ✅ 响应式设计
- ✅ 多种嵌入方式
- 🆕 **PWA支持**: 可安装到桌面
- 🆕 **离线使用**: 无网络也能工作
- 🆕 **自动更新**: 始终保持最新版本

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

### 3. 构建PWA版本

```bash
npm run build
```

## 部署方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **PWA** ⭐推荐 | 所有场景 | 跨平台、自动更新、轻量 | 需要HTTPS |
| iframe嵌入 | 外部分享 | 安全隔离、易分享 | 功能受限 |
| 独立脚本 | 第三方集成 | 无框架依赖 | 配置复杂 |
| Vue组件 | 系统集成 | 深度集成 | 需要Vue环境 |

## 用户安��体验

### 🖥️ 桌面版
1. 访问您的网站
2. 浏览器显示"安装"提示
3. 点击安装，应用添加到桌面

### 📱 移动版
1. 在手机浏览器打开
2. 显示"添加到主屏幕"
3. 安装后像原生应用一样使用

## 技术架构

- **前端**: Vue 3 + TypeScript
- **流程图**: Vue Flow
- **PWA**: Vite PWA Plugin
- **文件处理**: File API + FileSaver
- **上传**: SFTP + Express.js
- **构建**: Vite + Rollup

## 快速体验

```bash
# 克隆项目
git clone [your-repo-url]

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建PWA
npm run build
```

## 许可证

MIT License

---

💡 **提示**: PWA是现代Web应用的最佳实践，推荐优先使用PWA方式部署和分发。
