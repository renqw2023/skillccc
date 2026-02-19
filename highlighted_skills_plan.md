# Highlighted Skills 功能实现计划

复刻 ClawHub.ai 的 Highlighted skills 区域，实现下载排行和自动精选高亮功能。

---

## 📋 功能概述

### 核心功能
1. **下载统计**: 记录每个 skill 的下载次数
2. **精选区域**: 在首页显示 Top 10 下载量最高的 skills
3. **Highlighted 标签**: 自动标记热门 skills
4. **实时更新**: 每次下载自动更新统计

### 技术特点
- ✅ 无需数据库，使用 JSON 文件存储
- ✅ API 驱动，前后端分离
- ✅ 自动排序，无需手动维护
- ✅ 响应式设计，移动端友好

---

## 🎯 实现方案

### 1. 后端实现

#### 新增文件: `server/downloads.js`
下载统计管理模块

**功能**:
- 加载/保存下载统计
- 增加下载计数
- 获取下载统计

```javascript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_FILE = path.join(__dirname, 'downloads.json');

// 加载下载统计
export async function loadDownloads() {
    try {
        const data = await fs.readFile(DOWNLOADS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 保存下载统计
export async function saveDownloads(downloads) {
    await fs.writeFile(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));
}

// 增加下载计数
export async function incrementDownload(skillId) {
    const downloads = await loadDownloads();
    if (!downloads[skillId]) {
        downloads[skillId] = { count: 0, lastDownload: null, history: [] };
    }
    downloads[skillId].count++;
    downloads[skillId].lastDownload = new Date().toISOString();
    await saveDownloads(downloads);
    return downloads[skillId].count;
}

// 获取下载统计
export async function getDownloadStats(skillId) {
    const downloads = await loadDownloads();
    return downloads[skillId] || { count: 0, lastDownload: null };
}
```

---

#### 修改文件: `server/index.js`

**修改 1**: 导入下载统计模块
```javascript
import { incrementDownload, loadDownloads } from './downloads.js';
```

**修改 2**: 在下载 API 中添加统计
```javascript
app.get('/api/skills/:owner/:slug/download', async (req, res) => {
    const { owner, slug } = req.params;
    const skillId = `${owner}/${slug}`;
    
    // ... 现有的 ZIP 创建逻辑 ...
    
    // 增加下载计数
    await incrementDownload(skillId);
    
    // ... 发送 ZIP 文件 ...
});
```

**修改 3**: 新增 API 端点
```javascript
// 获取精选 skills
app.get('/api/skills/highlighted', async (req, res) => {
    try {
        const cache = await getSkillsCache();
        const downloads = await loadDownloads();
        
        // 合并下载数据
        const skillsWithDownloads = cache.skills.map(skill => ({
            ...skill,
            downloadCount: downloads[skill.id]?.count || 0
        }));
        
        // 排序并取 Top 10
        const highlighted = skillsWithDownloads
            .sort((a, b) => b.downloadCount - a.downloadCount)
            .slice(0, 10);
        
        res.json({ success: true, skills: highlighted });
    } catch (error) {
        console.error('Error fetching highlighted skills:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 获取单个 skill 的下载统计
app.get('/api/skills/:owner/:slug/stats', async (req, res) => {
    try {
        const { owner, slug } = req.params;
        const skillId = `${owner}/${slug}`;
        const downloads = await loadDownloads();
        const stats = downloads[skillId] || { count: 0, lastDownload: null };
        
        res.json({ success: true, ...stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
```

---

### 2. 前端实现

#### 新增文件: `src/components/HighlightedSkills.jsx`

精选 skills 展示组件

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HighlightedSkills() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHighlighted();
    }, []);

    const fetchHighlighted = async () => {
        try {
            const res = await fetch('/api/skills/highlighted');
            const data = await res.json();
            if (data.success) {
                setSkills(data.skills);
            }
        } catch (err) {
            console.error('Failed to fetch highlighted skills:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDownloads = (count) => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return count;
    };

    if (loading) return null;
    if (skills.length === 0) return null;

    return (
        <section className="highlighted-section">
            <div className="highlighted-header">
                <h2 className="highlighted-title">Highlighted skills</h2>
                <p className="highlighted-subtitle">
                    Curated signal — highlighted for quick trust.
                </p>
            </div>

            <div className="highlighted-grid">
                {skills.map(skill => (
                    <Link
                        key={skill.id}
                        to={`/skill/${skill.owner}/${skill.slug}`}
                        className="highlighted-card"
                    >
                        <span className="highlighted-badge">Highlighted</span>
                        
                        <h3 className="highlighted-skill-name">
                            {skill.displayName || skill.slug}
                        </h3>
                        
                        <p className="highlighted-skill-desc">
                            {skill.description || 'No description available'}
                        </p>
                        
                        <div className="highlighted-stats">
                            <span className="stat-item">
                                ↓ {formatDownloads(skill.downloadCount)}
                            </span>
                            <span className="stat-item">
                                by {skill.owner}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default HighlightedSkills;
```

---

#### 修改文件: `src/pages/HomePage.jsx`

在搜索栏下方添加精选区域

```jsx
import HighlightedSkills from '../components/HighlightedSkills';

function HomePage() {
    // ... 现有代码 ...

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                {/* ... 搜索框等 ... */}
            </section>

            {/* Highlighted Skills - 新增 */}
            <HighlightedSkills />

            {/* All Skills */}
            <section className="skills-list">
                {/* ... 现有的 skills 列表 ... */}
            </section>
        </div>
    );
}
```

---

#### 修改文件: `src/index.css`

添加精选区域样式

```css
/* ============================================
   Highlighted Skills Section
   ============================================ */

.highlighted-section {
    margin: 64px auto 80px;
    max-width: 1200px;
    padding: 0 24px;
}

.highlighted-header {
    margin-bottom: 32px;
}

.highlighted-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--ink);
}

.highlighted-subtitle {
    font-size: 0.95rem;
    color: var(--ink-soft);
}

.highlighted-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.highlighted-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 24px;
    transition: all var(--transition-base);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 180px;
}

.highlighted-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow);
    border-color: var(--accent);
}

.highlighted-badge {
    display: inline-block;
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--seafoam);
    background: rgba(43, 198, 164, 0.12);
    border-radius: 999px;
    width: fit-content;
}

.highlighted-skill-name {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0;
}

.highlighted-skill-desc {
    font-size: 0.875rem;
    color: var(--ink-soft);
    line-height: 1.5;
    margin: 0;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.highlighted-stats {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 0.875rem;
    color: var(--ink-soft);
    padding-top: 8px;
    border-top: 1px solid var(--line);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* 深色模式 */
[data-theme="dark"] .highlighted-badge {
    color: #72ebe8;
    background: rgba(114, 235, 232, 0.15);
}

/* 响应式 */
@media (max-width: 768px) {
    .highlighted-grid {
        grid-template-columns: 1fr;
    }
    
    .highlighted-section {
        margin: 48px auto 60px;
    }
}
```

---

## 📝 数据结构

### downloads.json
```json
{
  "steipete/trello": {
    "count": 4490,
    "lastDownload": "2026-02-10T12:00:00.000Z",
    "history": []
  },
  "owner/skill-name": {
    "count": 1234,
    "lastDownload": "2026-02-10T10:30:00.000Z",
    "history": []
  }
}
```

---

## ✅ 验证步骤

### 1. 后端测试
```bash
# 测试精选 API
curl http://localhost:3001/api/skills/highlighted

# 测试统计 API
curl http://localhost:3001/api/skills/steipete/trello/stats

# 下载 skill 并验证统计增加
curl http://localhost:3001/api/skills/steipete/trello/download
```

### 2. 前端测试
1. 访问首页 http://localhost:5173
2. 查看 Highlighted Skills 区域是否显示
3. 确认显示 Top 10 下载量最高的 skills
4. 点击卡片跳转到详情页
5. 下载 skill ZIP，刷新页面查看下载数是否增加

---

## 📦 文件清单

### 新增文件 (2个)
- ✨ `server/downloads.js` - 下载统计模块
- ✨ `src/components/HighlightedSkills.jsx` - 精选区域组件

### 修改文件 (3个)
- 📝 `server/index.js` - 添加 API 端点
- 📝 `src/pages/HomePage.jsx` - 集成精选区域
- 📝 `src/index.css` - 添加样式

### 自动生成 (1个)
- 🔧 `server/downloads.json` - 下载数据存储

---

## ⏱️ 时间估算

| 任务 | 预计时间 |
|------|---------|
| 后端模块开发 | 1 小时 |
| API 端点实现 | 1 小时 |
| 前端组件开发 | 1.5 小时 |
| 样式调整 | 0.5 小时 |
| 测试验证 | 1 小时 |
| **总计** | **5 小时** |

---

## 🚀 部署注意事项

1. **生产环境**:
   - 确保 `server/downloads.json` 有写入权限
   - 建议定期备份 `downloads.json`
   - 监控文件大小，避免过大

2. **性能优化**:
   - 考虑添加缓存机制
   - 定期归档历史数据
   - 未来可迁移到数据库

---

**创建时间**: 2026-02-10  
**功能状态**: 📋 计划阶段  
**优先级**: 高
