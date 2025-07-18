// Express.js 后端API示例
const express = require('express');
const multer = require('multer');
const Client = require('ssh2-sftp-client');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// 测试SFTP连接
app.post('/api/sftp/test', async (req, res) => {
  const { host, port, username, password } = req.body;
  const sftp = new Client();

  try {
    await sftp.connect({
      host,
      port,
      username,
      password
    });

    await sftp.end();
    res.json({ success: true, message: '连接测试成功' });
  } catch (error) {
    res.status(400).json({ success: false, message: '连接失败: ' + error.message });
  }
});

// 上传文件到SFTP
app.post('/api/sftp/upload', upload.single('file'), async (req, res) => {
  try {
    const config = JSON.parse(req.body.config);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: '没有文件' });
    }

    const sftp = new Client();
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password
    });

    const remotePath = path.join(config.remotePath, file.originalname);
    await sftp.put(file.path, remotePath);

    await sftp.end();

    // 清理临时文件
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      message: '文件上传成功',
      remotePath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上传失败: ' + error.message
    });
  }
});

// 获取流程图数据
app.get('/api/flowchart/:id', (req, res) => {
  // 这里应该从数据库获取流程图数据
  // 示例返回静态数据
  res.json({
    id: req.params.id,
    title: 'DBL Process Flow',
    nodes: [
      // 流程图节点数据
    ],
    edges: [
      // 连接线数据
    ]
  });
});

// 保存流程图数据
app.post('/api/flowchart/save', (req, res) => {
  // 这里应该保存到数据库
  const { title, nodes, edges } = req.body;

  // 生成唯一ID
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);

  res.json({
    success: true,
    id,
    shareUrl: `/flow/${id}`
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
