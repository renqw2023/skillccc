# 生产环境部署指南

本文档提供 ClawHub Clone 项目的完整部署指南，适用于生产环境。

---

## 目录

- [系统要求](#系统要求)
- [环境准备](#环境准备)
- [安装步骤](#安装步骤)
- [配置说明](#配置说明)
- [部署方式](#部署方式)
- [运维管理](#运维管理)
- [故障排查](#故障排查)

---

## 系统要求

### 硬件配置

**最低配置**:
- CPU: 1核
- 内存: 1GB RAM
- 磁盘: 5GB 可用空间

**推荐配置**:
- CPU: 2核+
- 内存: 2GB+ RAM
- 磁盘: 10GB+ 可用空间

### 软件环境

- **操作系统**: Linux (推荐 Ubuntu 20.04+) / Windows Server / macOS
- **Node.js**: v18.0.0 或更高版本
- **npm**: v9.0.0 或更高版本
- **Git**: v2.0+ (可选)

---

## 环境准备

### 1. 安装 Node.js

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
下载并安装：https://nodejs.org/

#### 验证安装
```bash
node --version  # 应显示 v18+
npm --version   # 应显示 v9+
```

### 2. 安装 PM2（进程管理器）

```bash
npm install -g pm2
```

### 3. 安装 Nginx（可选，用于反向代理）

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install nginx
```

---

## 安装步骤

### 1. 获取项目代码

```bash
# 克隆仓库（如果使用 Git）
git clone <your-repo-url> clawhub-clone
cd clawhub-clone

# 或直接上传代码到服务器
```

### 2. 安装依赖

```bash
# 安装所有依赖
npm install
```

#### 依赖清单

**生产依赖** (8个):
```json
{
  "archiver": "^7.0.1",          // ZIP 文件创建
  "cors": "^2.8.5",              // 跨域资源共享
  "dotenv": "^17.2.4",           // 环境变量管理
  "express": "^4.18.2",          // Web 服务器框架
  "gray-matter": "^4.0.3",       // YAML frontmatter 解析
  "marked": "^11.1.1",           // Markdown 渲染
  "react": "^18.2.0",            // React 框架
  "react-dom": "^18.2.0",        // React DOM
  "react-router-dom": "^6.21.1"  // React 路由
}
```

**开发依赖** (3个):
```json
{
  "@vitejs/plugin-react": "^4.2.1",  // Vite React 插件
  "concurrently": "^8.2.2",          // 并发运行脚本
  "vite": "^5.0.10"                  // 前端构建工具
}
```

### 3. 同步 Skills 数据

```bash
# 首次部署需要同步数据
npm run sync
```

> **注意**: 此步骤会从 GitHub 下载所有 skills 数据（约 2745 个），需要几分钟时间。数据会缓存到 `server/skills-cache.json`（约 40MB）。

---

## 配置说明

### 1. 环境变量配置

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# GitHub Token（可选，用于提高 API 速率限制）
# 创建地址: https://github.com/settings/tokens
# 需要权限: public_repo
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 服务器端口（默认 3001）
PORT=3001

# GitHub Webhook 密钥（用于自动同步）
WEBHOOK_SECRET=your_random_secret_here
```

### 2. GitHub Token 获取步骤

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选 `public_repo` 权限
4. 生成并复制 token
5. 粘贴到 `.env` 文件中

> **为什么需要 Token?**  
> GitHub API 未认证请求限制为 60次/小时，认证后提升至 5000次/小时。

---

## 部署方式

### 方式一：PM2 部署（推荐）

#### 1. 构建前端

```bash
npm run build
```

生成的文件在 `dist/` 目录。

#### 2. 创建 PM2 配置文件

创建 `ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [
    {
      name: 'clawhub-api',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

#### 3. 启动服务

```bash
# 启动后端 API
pm2 start ecosystem.config.cjs

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 4. 配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/clawhub`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/clawhub-clone/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/clawhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 方式二：Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server/index.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  clawhub:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    volumes:
      - ./server/skills-cache.json:/app/server/skills-cache.json
    restart: unless-stopped
```

#### 3. 启动

```bash
docker-compose up -d
```

---

### 方式三：直接运行（仅开发/测试）

```bash
# 构建前端
npm run build

# 启动后端（前台运行）
node server/index.js
```

---

## 运维管理

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs clawhub-api

# 重启服务
pm2 restart clawhub-api

# 停止服务
pm2 stop clawhub-api

# 监控
pm2 monit
```

### 数据同步

#### 手动同步

```bash
npm run sync
```

#### 自动同步（GitHub Webhook）

1. **在 GitHub 仓库设置 Webhook**:
   - URL: `https://your-domain.com/api/webhook`
   - Content type: `application/json`
   - Secret: 与 `.env` 中的 `WEBHOOK_SECRET` 一致
   - 事件: Push events

2. 服务器会自动接收更新并增量同步

### 日志管理

**PM2 日志位置**:
- 标准输出: `~/.pm2/logs/clawhub-api-out.log`
- 错误输出: `~/.pm2/logs/clawhub-api-error.log`

**日志轮转**:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 故障排查

### 问题 1: 端口已被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**:
```bash
# 查找占用进程
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# 杀死进程
kill -9 <PID>
```

### 问题 2: 无法连接到 GitHub API

**错误信息**: `Failed to fetch skill files`

**解决方案**:
1. 检查网络连接
2. 检查 GitHub Token 是否有效
3. 检查 API 速率限制：https://api.github.com/rate_limit

### 问题 3: 前端页面空白

**解决方案**:
1. 确认 `npm run build` 成功执行
2. 检查 `dist/` 目录是否存在
3. 检查 Nginx 配置的 `root` 路径是否正确

### 问题 4: 下载 ZIP 失败

**解决方案**:
1. 检查服务器内存是否充足
2. 检查 GitHub API 是否可访问
3. 查看后端日志：`pm2 logs clawhub-api`

---

## 安全建议

1. **使用 HTTPS**: 配置 SSL 证书（推荐 Let's Encrypt）
2. **环境变量保护**: 不要提交 `.env` 到版本控制
3. **防火墙**: 只开放必要端口（80, 443）
4. **定期更新**: 定期更新依赖包
   ```bash
   npm audit
   npm update
   ```

---

## 性能优化

1. **启用 Gzip 压缩**（Nginx）:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **使用 CDN**: 将静态文件托管到 CDN

3. **缓存优化**: 配置浏览器缓存策略

4. **PM2 集群模式**: 利用多核 CPU
   ```javascript
   instances: 'max',  // 使用所有 CPU 核心
   exec_mode: 'cluster'
   ```

---

## 监控与告警

### 推荐工具

- **PM2 Plus**: https://pm2.io/
- **Uptime Robot**: 网站可用性监控
- **Sentry**: 错误追踪

---

## 备份策略

**需要备份的内容**:
- `server/skills-cache.json` - Skills 数据缓存
- `.env` - 环境变量配置

**备份命令**:
```bash
# 创建备份目录
mkdir -p backups

# 备份数据
cp server/skills-cache.json backups/skills-cache-$(date +%Y%m%d).json
cp .env backups/.env-$(date +%Y%m%d)
```

---

## 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 安装新依赖（如有）
npm install

# 3. 重新构建前端
npm run build

# 4. 重启服务
pm2 restart clawhub-api

# 5. 重新加载 Nginx（如更新了配置）
sudo nginx -t && sudo systemctl reload nginx
```

---

## 扩展阅读

- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [GitHub API 文档](https://docs.github.com/en/rest)

---

## 技术支持

如遇到部署问题，请检查：
1. 后端日志: `pm2 logs clawhub-api`
2. Nginx 日志: `/var/log/nginx/error.log`
3. 系统日志: `journalctl -u nginx`
