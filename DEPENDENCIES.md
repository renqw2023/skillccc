# ClawHub Clone - 依赖清单

完整的项目依赖列表及说明。

---

## 生产依赖 (8个)

安装命令：`npm install`

### 1. archiver (^7.0.1)

**用途**: 创建 ZIP 压缩包  
**使用场景**: Skill 下载功能  
**文件**: `server/index.js`

```javascript
const archiver = require('archiver');
const archive = archiver('zip', { zlib: { level: 9 } });
archive.append(fileBuffer, { name: 'file.md' });
await archive.finalize();
```

**官方文档**: https://www.archiverjs.com/

---

### 2. cors (^2.8.5)

**用途**: 处理跨域资源共享（CORS）  
**使用场景**: 允许前端访问后端 API  
**文件**: `server/index.js`

```javascript
const cors = require('cors');
app.use(cors());
```

**官方文档**: https://github.com/expressjs/cors

---

### 3. dotenv (^17.2.4)

**用途**: 加载环境变量  
**使用场景**: 从 `.env` 文件读取配置  
**文件**: `server/index.js`

```javascript
import dotenv from 'dotenv';
dotenv.config();
const token = process.env.GITHUB_TOKEN;
```

**官方文档**: https://github.com/motdotla/dotenv

---

### 4. express (^4.18.2)

**用途**: Web 服务器框架  
**使用场景**: 提供 REST API 服务  
**文件**: `server/index.js`

```javascript
const express = require('express');
const app = express();
app.get('/api/skills', (req, res) => {
    res.json({ skills: [] });
});
```

**官方文档**: https://expressjs.com/

---

### 5. gray-matter (^4.0.3)

**用途**: 解析 Markdown 文件的 YAML frontmatter  
**使用场景**: 提取 SKILL.md 中的元数据  
**文件**: `server/github-sync.js`

```javascript
import matter from 'gray-matter';
const { data, content } = matter(skillMdContent);
// data = { name: 'Trello', description: '...' }
// content = 'Markdown body...'
```

**官方文档**: https://github.com/jonschlinkert/gray-matter

---

### 6. marked (^11.1.1)

**用途**: Markdown 转 HTML  
**使用场景**: 渲染 Skill 文档  
**文件**: `src/pages/SkillPage.jsx`

```javascript
import { marked } from 'marked';
const html = marked.parse('# Title\nContent');
```

**官方文档**: https://marked.js.org/

---

### 7. react (^18.2.0)

**用途**: React UI 框架  
**使用场景**: 构建用户界面  
**文件**: 所有 `.jsx` 文件

```javascript
import React, { useState } from 'react';
function Component() {
    const [state, setState] = useState(0);
    return <div>{state}</div>;
}
```

**官方文档**: https://react.dev/

---

### 8. react-dom (^18.2.0)

**用途**: React DOM 渲染  
**使用场景**: 将 React 组件渲染到 DOM  
**文件**: `src/main.jsx`

```javascript
import ReactDOM from 'react-dom/client';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

**官方文档**: https://react.dev/

---

### 9. react-router-dom (^6.21.1)

**用途**: React 路由管理  
**使用场景**: 单页应用路由  
**文件**: `src/App.jsx`

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
<BrowserRouter>
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/skill/:owner/:slug" element={<SkillPage />} />
    </Routes>
</BrowserRouter>
```

**官方文档**: https://reactrouter.com/

---

## 开发依赖 (3个)

仅在开发环境安装：`npm install --save-dev`

### 1. @vitejs/plugin-react (^4.2.1)

**用途**: Vite 的 React 插件  
**使用场景**: 支持 React JSX 和热重载  
**文件**: `vite.config.js`

```javascript
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()]
});
```

**官方文档**: https://github.com/vitejs/vite-plugin-react

---

### 2. concurrently (^8.2.2)

**用途**: 并发运行多个命令  
**使用场景**: 同时启动前端和后端  
**文件**: `package.json`

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""
  }
}
```

**官方文档**: https://github.com/open-cli-tools/concurrently

---

### 3. vite (^5.0.10)

**用途**: 前端构建工具  
**使用场景**: 开发服务器和生产构建  
**文件**: `vite.config.js`

```javascript
import { defineConfig } from 'vite';
export default defineConfig({
    server: { port: 5173 },
    build: { outDir: 'dist' }
});
```

**官方文档**: https://vitejs.dev/

---

## 隐式依赖（由主依赖自动安装）

以下是一些重要的间接依赖：

- **axios / node-fetch**: HTTP 请求（Express 内部使用）
- **@babel/core**: JavaScript 编译器（React 工具链）
- **esbuild**: 快速打包器（Vite 内部使用）
- **postcss**: CSS 处理器（Vite 内部使用）

---

## 系统依赖

运行环境必须具备：

| 依赖 | 最低版本 | 用途 |
|------|----------|------|
| Node.js | v18.0.0 | JavaScript 运行时 |
| npm | v9.0.0 | 包管理器 |

可选依赖：

| 依赖 | 用途 |
|------|------|
| PM2 | 生产环境进程管理 |
| Nginx | 反向代理和静态文件服务 |
| Git | 版本控制 |

---

## 安装指南

### 完整安装

```bash
# 克隆项目
git clone <repo-url> clawhub-clone
cd clawhub-clone

# 安装所有依赖（生产 + 开发）
npm install

# 仅安装生产依赖
npm install --omit=dev
```

### 验证安装

```bash
# 检查依赖
npm list --depth=0

# 检查过时依赖
npm outdated

# 审计安全漏洞
npm audit
```

### 更新依赖

```bash
# 更新所有依赖到最新小版本
npm update

# 更新特定依赖
npm update express

# 更新到最新主版本（需手动修改 package.json）
npm install express@latest
```

---

## 依赖大小分析

**总大小**: ~180MB（含 node_modules）

**最大依赖**:
1. `vite` - ~40MB
2. `@vitejs/plugin-react` - ~15MB
3. `react-dom` - ~12MB
4. `express` - ~8MB

**优化建议**:
- 生产环境使用 `npm install --omit=dev` 可减少 ~55MB
- 使用 `npm dedupe` 去重依赖
- 考虑使用 `pnpm` 替代 `npm`（节省磁盘空间）

---

## 常见问题

### Q: 安装依赖时遇到网络错误？

A: 配置 npm 镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: 某个依赖安装失败？

A: 清除缓存后重试：
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q: 如何锁定依赖版本？

A: 使用 `package-lock.json`（已包含在项目中），确保团队成员安装相同版本。

### Q: 生产环境需要安装所有依赖吗？

A: 不需要。使用 `npm install --omit=dev` 仅安装生产依赖。开发依赖（vite、concurrently 等）仅用于本地开发。

---

## 许可证信息

所有依赖均为开源许可证：

| 依赖 | 许可证 |
|------|--------|
| archiver | MIT |
| cors | MIT |
| dotenv | BSD-2-Clause |
| express | MIT |
| gray-matter | MIT |
| marked | MIT |
| react | MIT |
| react-dom | MIT |
| react-router-dom | MIT |
| vite | MIT |

---

**最后更新**: 2026-02-09  
**文档版本**: 1.0.0
