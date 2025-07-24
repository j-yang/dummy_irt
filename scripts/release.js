const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 读取package.json获取版本信息
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// 检查是否存在standalone构建文件
const standaloneFile = path.join('dist-standalone', 'index.html');
if (!fs.existsSync(standaloneFile)) {
  console.error('❌ 找不到 dist-standalone/index.html 文件');
  console.log('请先运行: npm run build:standalone');
  process.exit(1);
}

// 获取文件大小信息
const stats = fs.statSync(standaloneFile);
const fileSizeKB = Math.round(stats.size / 1024);

console.log(`📦 准备发布版本 v${version}`);
console.log(`📄 文件大小: ${fileSizeKB}KB`);

try {
  // 检查是否安装了GitHub CLI
  execSync('gh --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ 请先安装 GitHub CLI: https://cli.github.com/');
  console.log('或者手动上传文件到 GitHub Release');
  process.exit(1);
}

// 创建发布说明
const releaseNotes = `## DBL Process Flow System v${version}

### 📱 单文件版本
- 自包含的HTML文件，包含所有功能
- 文件大小: ${fileSizeKB}KB
- 支持离线使用，可通过邮件分享
- 包含完整的流程图功能和localStorage状态保存

### 🚀 使用方法
1. 下载 \`dbl-flow-system.html\` 文件
2. 双击打开或在浏览器中打开
3. 开始使用流程图功能

### ✨ 功能特性
- ✅ 交互式流程图
- ✅ IRT vendor选择 (SH/CA)
- ✅ 步骤完成状态跟踪
- ✅ 文件上传功能
- ✅ 状态自动保存
- ✅ 完全离线使用

---
*此版本为单文件HTML格式，适合本地使用和分享*
`;

// 生成发布用的文件名
const releaseFileName = `dbl-flow-system-v${version}.html`;
const releaseFilePath = path.join('dist-standalone', releaseFileName);

// 复制文件并重命名
fs.copyFileSync(standaloneFile, releaseFilePath);

console.log(`📋 发布说明已准备好`);
console.log(`📁 文件已重命名为: ${releaseFileName}`);

try {
  // 创建GitHub Release
  const tagName = `v${version}`;

  console.log(`🚀 创建 GitHub Release: ${tagName}`);

  // 写入发布说明到临时文件
  const releaseNotesFile = 'release-notes.tmp';
  fs.writeFileSync(releaseNotesFile, releaseNotes);

  // 创建release并上传文件
  const createReleaseCmd = `gh release create ${tagName} "${releaseFilePath}" --title "DBL Flow System v${version}" --notes-file "${releaseNotesFile}"`;

  execSync(createReleaseCmd, { stdio: 'inherit' });

  // 清理临时文件
  fs.unlinkSync(releaseNotesFile);
  fs.unlinkSync(releaseFilePath);

  console.log(`✅ 发布成功！`);
  console.log(`🔗 查看发布: https://github.com/YOUR_USERNAME/YOUR_REPO/releases/tag/${tagName}`);

} catch (error) {
  console.error('❌ 发布失败:', error.message);
  console.log('\n📝 手动发布步骤:');
  console.log('1. 进入 GitHub 仓库');
  console.log('2. 点击 "Releases" → "Create a new release"');
  console.log(`3. 标签: v${version}`);
  console.log(`4. 上传文件: ${releaseFilePath}`);
  process.exit(1);
}
