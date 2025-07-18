# GitHub Pages 部署指南

## 快速部署步骤

### 1. 创建 GitHub 仓库
1. 在 GitHub 上创建一个新的公开仓库，建议命名为 `dummy_irt` 或 `todo-flowchart-app`
2. 复制仓库的 Git URL

### 2. 推送代码到 GitHub
```bash
# 在项目根目录执行
git add .
git commit -m "Initial commit - Todo FlowChart App"
git branch -M main
git remote add origin https://github.com/你的用户名/dummy_irt.git
git push -u origin main
```

### 3. 配置 GitHub Pages
1. 进入 GitHub 仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 下拉菜单中选择 "GitHub Actions"
5. 保存设置

### 4. 自动部署
- 每次向 main 分支推送代码时，GitHub Actions 会自动构建并部署
- 部署完成后，你的应用将在 `https://你的用户名.github.io/dummy_irt/` 可用

## 本地开发和手动部署

### 本地开发
```bash
npm install
npm run dev
```

### 手动部署（可选）
```bash
npm run deploy
```

## 项目功能

### 主要页面
- **主应用** (`/`): Vue.js 构建的交互式流程图应用
- **项目管理器** (`/project-manager.html`): 管理多个项目的页面
- **独立版本** (`/standalone.html`): 不依赖框架的纯HTML版本

### 核心功能
1. **多项目管理**: 每个项目有独立的进度跟踪
2. **本地存储**: 所有数据保存在浏览器本地
3. **文件管理**: 支持文件上传和管理（本地存储）
4. **PWA支持**: 可以安装为桌面应用
5. **响应式设计**: 支持各种设备尺寸

### 项目管理流程
1. 访问项目管理器页面
2. 创建新项目（填写项目名称、描述、负责人）
3. 下载项目专用的HTML文件
4. 在项目HTML文件中进行具体的流程管理

## 使用说明

### 创建新项目
1. 打开 `https://你的用户名.github.io/dummy_irt/project-manager.html`
2. 填写项目信息
3. 点击"创建项目"
4. 下载生成的项目文件

### 项目文件特点
- 每个项目生成独立的HTML文件
- 包含完整的流程图功能
- 数据存储在浏览器本地
- 可以保存为书签或桌面快捷方式

### 数据存储
- 项目列表存储在 `projectManager_projects`
- 每个项目的数据存储在 `todoFlow_project_${projectId}`
- 所有数据都在浏览器本地，不会丢失

## 技术栈
- Vue.js 3 + TypeScript
- Vite 构建工具
- Vue Flow 流程图库
- PWA 支持
- GitHub Pages 部署

## 注意事项
- 纯静态部署，无需服务器
- 数据存储在客户端本地
- 文件上传功能仅限本地管理
- SFTP功能在静态环境中不可用

## 故障排除
如果遇到部署问题：
1. 检查 GitHub Actions 的构建日志
2. 确认 Pages 设置正确
3. 验证仓库是否为公开状态
4. 检查分支名称是否为 `main`
