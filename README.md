# ClawHub Clone - 项目开发文档

完整的技术文档，记录项目的架构设计、开发细节和实现过程。

---

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [目录结构](#目录结构)
- [核心功能](#核心功能)
- [开发指南](#开发指南)
- [API 文档](#api-文档)
- [组件文档](#组件文档)
- [样式系统](#样式系统)
- [部署说明](#部署说明)

---

## 项目概述

**项目名称**: ClawHub Clone  
**项目描述**: ClawHub.ai 的开源克隆版本，一个面向 AI Agents 的 Skills 注册中心  
**版本**: 1.0.0  
**开发时间**: 2026年2月

### 主要特性

- 📦 **Skills 浏览**: 展示来自 `openclaw/skills` 仓库的所有 skills
- 🔍 **搜索功能**: 快速查找所需的 skills
- 📄 **详情页面**: 查看 skill 的完整文档和元数据
- 💾 **下载功能**: 
  - 复制安装命令（支持 npm/pnpm/bun）
  - 下载单个 skill 的 ZIP 包
  - 查看原始 SKILL.md 源码
- 🎨 **现代设计**: 复刻 ClawHub.ai 的设计风格
- 🌓 **深色模式**: 自动跟随系统主题
- 📱 **响应式布局**: 适配桌面和移动设备

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 框架 |
| React Router DOM | 6.21.1 | 路由管理 |
| Vite | 5.0.10 | 构建工具 |
| Marked | 11.1.1 | Markdown 渲染 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.18.2 | Web 服务器框架 |
| Archiver | 7.0.1 | ZIP 文件创建 |
| Gray Matter | 4.0.3 | YAML frontmatter 解析 |
| CORS | 2.8.5 | 跨域资源共享 |
| Dotenv | 17.2.4 | 环境变量管理 |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Concurrently | 8.2.2 | 并发运行脚本 |
| @vitejs/plugin-react | 4.2.1 | Vite React 插件 |

---

## 项目架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户浏览器                          │
│                    (http://localhost:5173)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Vite 开发服务器 (前端)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React SPA                                      │   │
│  │  ├── HomePage (Skills 列表)                     │   │
│  │  ├── SkillPage (Skill 详情)                     │   │
│  │  └── Components (组件)                          │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Proxy (/api -> :3001)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                Express 服务器 (后端)                     │
│                 (http://localhost:3001)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  REST API                                       │   │
│  │  ├── GET /api/skills                            │   │
│  │  ├── GET /api/skills/:owner/:slug               │   │
│  │  ├── GET /api/skills/:owner/:slug/download      │   │
│  │  ├── GET /api/stats                             │   │
│  │  ├── POST /api/sync                             │   │
│  │  └── POST /api/webhook                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  数据层                                         │   │
│  │  ├── skills-cache.json (40MB 本地缓存)         │   │
│  │  └── GitHub Sync Module (同步逻辑)             │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub API (openclaw/skills)                │
│             https://api.github.com/repos/...             │
└─────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
clawhub-clone/
├── public/                      # 静态资源
│   └── ccc.svg                  # 网站图标
├── server/                      # 后端代码
│   ├── index.js                 # Express 主服务器
│   ├── github-sync.js           # GitHub 数据同步模块
│   ├── sync-cli.js              # 同步命令行工具
│   └── skills-cache.json        # Skills 数据缓存 (40MB)
├── src/                         # 前端源码
│   ├── components/              # React 组件
│   │   ├── Footer.jsx           # 页脚组件
│   │   ├── Header.jsx           # 导航栏
│   │   ├── SearchBar.jsx        # 搜索栏
│   │   ├── SkillCard.jsx        # Skill 卡片
│   │   ├── InstallCard.jsx      # 安装引导卡片
│   │   └── SkillInstallSection.jsx  # Skill 安装/下载模块 ⭐新增
│   ├── pages/                   # 页面组件
│   │   ├── HomePage.jsx         # 首页（Skills 列表）
│   │   └── SkillPage.jsx        # Skill 详情页 ⭐已更新
│   ├── App.jsx                  # 应用根组件
│   ├── main.jsx                 # 应用入口
│   └── index.css                # 全局样式 ⭐已扩展
├── .env.example                 # 环境变量模板
├── .gitignore                   # Git 忽略文件
├── index.html                   # HTML 模板
├── package.json                 # 依赖配置
├── vite.config.js               # Vite 配置
├── DEPLOYMENT.md                # 部署指南 ⭐新增
└── README.md                    # 项目说明 (本文档)
```

---

## 核心功能

### 1. Skills 数据同步

**模块**: `server/github-sync.js`

#### 工作流程

1. **获取用户目录**: 访问 `openclaw/skills` 仓库的 `skills/` 目录
2. **遍历 Skills**: 对每个用户的每个 skill 进行处理
3. **提取元数据**: 
   - 读取 `_meta.json`（版本、发布时间等）
   - 解析 `SKILL.md`（名称、描述、文档）
   - 获取 `README.md`（可选）
4. **缓存数据**: 保存到 `skills-cache.json`

#### 数据结构

```javascript
{
  "updatedAt": "2026-02-08T15:30:00.000Z",
  "count": 2745,
  "skills": [
    {
      "id": "steipete/trello",
      "owner": "steipete",
      "slug": "trello",
      "displayName": "Trello",
      "description": "Manage Trello boards, lists, and cards via the Trello REST API.",
      "version": "1.0.0",
      "publishedAt": 1705320000000,
      "commit": "https://github.com/openclaw/skills/commit/abc123",
      "history": [
        {
          "version": "1.0.0",
          "publishedAt": 1705320000000
        }
      ],
      "readme": "# Trello Skill\n...",
      "skillMd": "---\nname: Trello\n...",
      "body": "Full skill documentation..."
    }
  ]
}
```

### 2. Skills 列表与搜索

**页面**: `HomePage.jsx`

#### 功能特性

- **分页显示**: 每页 24 个 skills
- **搜索**: 支持按名称、描述、作者搜索
- **排序**: 按发布时间倒序
- **统计**: 显示总 skills 数和贡献者数

#### 搜索逻辑

```javascript
const filtered = skills.filter(s =>
  s.displayName?.toLowerCase().includes(query) ||
  s.description?.toLowerCase().includes(query) ||
  s.owner?.toLowerCase().includes(query) ||
  s.slug?.toLowerCase().includes(query)
);
```

### 3. Skill 详情页 ⭐核心功能

**页面**: `SkillPage.jsx`  
**组件**: `SkillInstallSection.jsx`

#### 布局设计

采用**两栏响应式布局**：

```
┌─────────────────────────────────────────────────┐
│  ← Back to Skills                               │
├──────────────────────────┬──────────────────────┤
│  Skill Title             │  [Install Section]   │
│  Author | Version | Date │  ┌────────────────┐ │
│  Description             │  │ npm │pnpm│bun │ │
│                          │  │ Command Box    │ │
│  ─────────────────────── │  │ [GitHub][ZIP]  │ │
│                          │  │ View Source ▾  │ │
│  Version History         │  └────────────────┘ │
│  - v1.0.0  2024-01-15   │                      │
│                          │  (sticky position)   │
│  ─────────────────────── │                      │
│                          │                      │
│  # Documentation         │                      │
│  Markdown content...     │                      │
│                          │                      │
└──────────────────────────┴──────────────────────┘
```

#### 安装/下载功能详解

**1. 安装命令复制**

```javascript
// 包管理器切换
const PACKAGE_MANAGERS = [
    { id: 'npm', command: 'npx' },
    { id: 'pnpm', command: 'pnpm dlx' },
    { id: 'bun', command: 'bunx' }
];

// 生成命令
const installCommand = `${currentManager.command} ccc@latest install ${owner}/${slug}`;

// 复制到剪贴板
await navigator.clipboard.writeText(installCommand);
```

**2. ZIP 下载功能** ⭐重点实现

**后端 API**: `GET /api/skills/:owner/:slug/download`

```javascript
// 获取 skill 目录文件列表
const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/skills/${owner}/${slug}`;
const files = await (await fetch(treeUrl)).json();

// 创建 ZIP
const archive = archiver('zip', { zlib: { level: 9 } });
archive.pipe(res);

// 添加文件
for (const file of files) {
    const fileBuffer = Buffer.from(await (await fetch(file.download_url)).arrayBuffer());
    archive.append(fileBuffer, { name: file.name });
}

await archive.finalize();
```

**特点**:
- ✅ 只下载该 skill 的文件（不是整个仓库）
- ✅ 文件名: `{owner}-{slug}.zip`
- ✅ 动态创建，无需服务器存储
- ✅ 流式传输，节省内存

**3. 查看源码**

可折叠面板展示原始 `SKILL.md` 内容，便于开发者查看和复制。

---

## 开发指南

### 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 添加 GITHUB_TOKEN（可选）

# 3. 同步数据
npm run sync

# 4. 启动开发服务器
npm run dev
```

访问: http://localhost:5173/

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 并发启动前端和后端 |
| `npm run dev:client` | 仅启动 Vite (前端) |
| `npm run dev:server` | 仅启动 Express (后端) |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run sync` | 手动同步 GitHub 数据 |

### 添加新功能

#### 1. 添加新页面

```javascript
// src/pages/NewPage.jsx
function NewPage() {
    return <div>New Page</div>;
}
export default NewPage;
```

```javascript
// src/App.jsx
import NewPage from './pages/NewPage';

<Routes>
    <Route path="/new" element={<NewPage />} />
</Routes>
```

#### 2. 添加新组件

```javascript
// src/components/NewComponent.jsx
function NewComponent({ prop }) {
    return <div>{prop}</div>;
}
export default NewComponent;
```

#### 3. 添加新 API 端点

```javascript
// server/index.js
app.get('/api/new-endpoint', async (req, res) => {
    try {
        const data = await fetchData();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## API 文档

### 基础信息

**Base URL**: `http://localhost:3001/api`  
**数据格式**: JSON  
**认证**: 无需认证

### 端点列表

#### 1. 获取 Skills 列表

```http
GET /api/skills?page=1&limit=24&search=trello
```

**查询参数**:
- `page` (可选): 页码，从 1 开始，默认 1
- `limit` (可选): 每页数量，默认 24
- `search` (可选): 搜索关键词

**响应示例**:
```json
{
  "success": true,
  "updatedAt": "2026-02-08T15:30:00.000Z",
  "skills": [
    {
      "id": "steipete/trello",
      "owner": "steipete",
      "slug": "trello",
      "displayName": "Trello",
      "description": "Manage Trello boards...",
      "version": "1.0.0",
      "publishedAt": 1705320000000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 2745,
    "totalPages": 115,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 2. 获取 Skill 详情

```http
GET /api/skills/:owner/:slug
```

**路径参数**:
- `owner`: Skill 所有者
- `slug`: Skill 标识符

**响应示例**:
```json
{
  "success": true,
  "skill": {
    "id": "steipete/trello",
    "owner": "steipete",
    "slug": "trello",
    "displayName": "Trello",
    "description": "Manage Trello boards...",
    "version": "1.0.0",
    "publishedAt": 1705320000000,
    "commit": "https://github.com/...",
    "history": [
      {
        "version": "1.0.0",
        "publishedAt": 1705320000000
      }
    ],
    "body": "Full documentation...",
    "readme": "# Trello Skill\n...",
    "skillMd": "---\nname: Trello\n..."
  }
}
```

#### 3. 下载 Skill ZIP

```http
GET /api/skills/:owner/:slug/download
```

**响应**: 
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="{owner}-{slug}.zip"`
- 文件流

#### 4. 获取统计信息

```http
GET /api/stats
```

**响应示例**:
```json
{
  "success": true,
  "stats": {
    "totalSkills": 2745,
    "totalOwners": 456,
    "updatedAt": "2026-02-08T15:30:00.000Z"
  }
}
```

#### 5. 触发全量同步

```http
POST /api/sync
```

**响应**:
```json
{
  "success": true,
  "message": "Sync started in background"
}
```

#### 6. GitHub Webhook

```http
POST /api/webhook
```

**请求头**:
- `X-GitHub-Event`: 事件类型
- `X-Hub-Signature-256`: 签名（可选）

**请求体**: GitHub Webhook Payload

---

## 组件文档

### Header.jsx

**用途**: 顶部导航栏  
**Props**: 无

**功能**:
- 显示 Logo
- 提供回到首页的链接

---

### Search Bar.jsx

**用途**: 搜索输入框  
**Props**:
- `onSearch(query)`: 搜索回调函数
- `placeholder`: 占位符文本

**功能**:
- 实时搜索
- 支持键盘快捷键 (Ctrl/Cmd + K)

---

### SkillCard.jsx

**用途**: Skill 卡片组件  
**Props**:
- `skill`: Skill 对象

**显示内容**:
- Skill 名称
- 版本号
- 描述
- 作者头像和名称
- 发布时间

---

### SkillInstallSection.jsx ⭐新组件

**用途**: Skill 安装/下载模块  
**Props**:
- `skill`: Skill 对象

**功能**:
1. 包管理器切换（npm/pnpm/bun）
2. 安装命令复制
3. GitHub 链接跳转
4. ZIP 下载
5. 查看原始 SKILL.md

**状态管理**:
```javascript
const [activeManager, setActiveManager] = useState('npm');
const [copied, setCopied] = useState(false);
const [showRawContent, setShowRawContent] = useState(false);
```

---

## 样式系统

### 设计语言

基于 ClawHub.ai 的设计系统，使用 CSS 变量实现主题切换。

### 颜色系统

```css
:root {
  /* 背景色 */
  --bg: #f8f5ef;
  --bg-soft: #fdfaf4;
  --surface: #fff;
  
  /* 文本色 */
  --ink: #1d1a17;
  --ink-soft: #4c463f;
  
  /* 强调色 */
  --accent: #ff6b4a;
  --accent-deep: #e54f31;
  --seafoam: #2bc6a4;
  --gold: #f0c46a;
  
  /* 边框与阴影 */
  --line: #1d1a171f;
  --shadow: 0 24px 60px #1d1a171a;
}
```

### 深色模式

自动适配系统主题：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14110f;
    --ink: #f6efe4;
    --accent: #e86a47;
    /* ... */
  }
}
```

### 字体

- **标题**: Bricolage Grotesque
- **正文**: Manrope
- **代码**: IBM Plex Mono

### 关键类名

| 类名 | 用途 |
|------|------|
| `.skill-detail-layout` | 两栏网格布局 |
| `.skill-install-section` | 安装卡片容器 |
| `.command-box` | 命令展示框 |
| `.action-btn` | 操作按钮 |
| `.raw-content-section` | 源码查看器 |
| `.markdown-content` | Markdown 渲染容器 |

---

## 部署说明

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

**快速部署**:

```bash
# 1. 安装依赖
npm install

# 2. 同步数据
npm run sync

# 3. 构建前端
npm run build

# 4. 启动后端
pm2 start server/index.js --name clawhub-api

# 5. 配置 Nginx 反向代理（可选）
```

---

## 开发历程

### 2026-02-08

**功能开发**:
- ✅ 完成 Skill 详情页布局重构
- ✅ 实现安装命令复制功能
- ✅ 实现 ZIP 下载功能
- ✅ 添加原始内容查看器
- ✅ 优化响应式布局

**技术改进**:
- ✅ 添加 archiver 包支持 ZIP 创建
- ✅ 使用 GitHub API 动态获取文件
- ✅ 优化下载逻辑（仅下载单个 skill）

---

## 常见问题

### Q: 为什么需要同步数据？

A: 项目从 GitHub 仓库获取 skills 数据，为了提高访问速度和减少 API 调用，数据会缓存到本地 `skills-cache.json`。

### Q: 如何更新 skills 数据？

A: 运行 `npm run sync` 手动同步，或配置 GitHub Webhook 实现自动同步。

### Q: 下载 ZIP 时为什么很慢？

A: ZIP 是实时从 GitHub 获取文件并打包的。速度取决于网络和 GitHub API 响应时间。

### Q: 如何添加新的包管理器？

A: 修改 `SkillInstallSection.jsx` 中的 `PACKAGE_MANAGERS` 数组：

```javascript
const PACKAGE_MANAGERS = [
    { id: 'npm', label: 'npm', command: 'npx' },
    { id: 'pnpm', label: 'pnpm', command: 'pnpm dlx' },
    { id: 'bun', label: 'bun', command: 'bunx' },
    { id: 'yarn', label: 'yarn', command: 'yarn dlx' }  // 新增
];
```

---

## 性能指标

**首次加载** (未缓存):
- 页面加载: ~800ms
- JavaScript: ~150KB (gzipped)
- CSS: ~20KB (gzipped)

**数据同步**:
- 全量同步: ~3-5 分钟（2745 个 skills）
- 缓存大小: ~40MB

**API 响应时间**:
- Skills 列表: ~50ms
- Skill 详情: ~30ms
- ZIP 下载: ~2-5s (取决于文件大小和网络)

---

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，欢迎：
- 提交 Issue
- 发送 Pull Request
- 邮件联系: [your-email@example.com]

---

**最后更新**: 2026-02-09  
**文档版本**: 1.0.0
