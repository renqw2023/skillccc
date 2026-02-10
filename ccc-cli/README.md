# CCC CLI - AI Agent Skills 命令行工具

一个用于安装 AI Agent Skills 的命令行工具，从 [www.ccc.onl](https://www.ccc.onl) 下载并管理 skills。

---

## 功能特性

- 📦 **安装 Skills**: 从 www.ccc.onl 下载并安装 skills
- 📋 **列表查看**: 浏览所有可用的 skills
- 🔍 **搜索功能**: 按名称或描述搜索 skills
- 🎨 **美观输出**: 带颜色和进度提示的终端界面

---

## 安装

### 方式一：使用 npx（推荐，无需安装）

```bash
npx @renwin/ccc@latest install owner/skill-name
```

### 方式二：全局安装

```bash
npm install -g @renwin/ccc
```

---

## 使用方法

### 安装 Skill

```bash
# 基本用法
npx @renwin/ccc install owner/skill-name

# 指定安装目录
npx @renwin/ccc install owner/skill-name --dir my-skills

# 示例
npx @renwin/ccc install easonc13/sui-move
npx @renwin/ccc install byungkyu/trello-api
```

安装后的文件位置：`.skills/skill-name/`

### 查看所有 Skills

```bash
# 列出所有 skills
npx @renwin/ccc list

# 搜索 skills
npx @renwin/ccc list --search trello
```

### 查看帮助

```bash
npx @renwin/ccc --help
npx @renwin/ccc install --help
```

---

## 命令详解

### `ccc install <skill>`

安装指定的 skill。

**参数**:
- `<skill>` - Skill 名称，格式：`owner/skill-name`

**选项**:
- `-d, --dir <directory>` - 安装目录（默认：`.skills`）

**示例**:
```bash
npx @renwin/ccc install easonc13/sui-move
npx @renwin/ccc install byungkyu/trello-api --dir my-skills
```

### `ccc list`

列出所有可用的 skills。

**选项**:
- `-s, --search <query>` - 搜索关键词

**示例**:
```bash
npx @renwin/ccc list
npx @renwin/ccc list --search calendar
```

---

## 工作原理

1. **连接 API**: CLI 工具连接到 https://www.ccc.onl/api
2. **验证 Skill**: 检查 skill 是否存在
3. **下载 ZIP**: 从服务器下载 skill 的 ZIP 包
4. **解压文件**: 解压到目标目录
5. **完成提示**: 显示安装位置和下一步操作

---

## 依赖

- **commander** - CLI 框架
- **chalk** - 终端颜色
- **ora** - 加载动画
- **adm-zip** - ZIP 解压
- **node-fetch** - HTTP 请求

---

## 配置

CLI 工具默认连接到生产 API (`https://www.ccc.onl/api`)。

要修改 API 地址（如用于本地开发），可以使用环境变量：

```bash
export CCC_API_BASE=http://localhost:3001/api
npx @renwin/ccc install skill
```

---

## 许可证

MIT

---

## 相关链接

- **网站**: [www.ccc.onl](https://www.ccc.onl)
- **GitHub 仓库**: [github.com/renqw2023/skills](https://github.com/renqw2023/skills)
- **npm 包**: [npmjs.com/package/@renwin/ccc](https://www.npmjs.com/package/@renwin/ccc)

---

## 支持

如有问题或建议，请访问 [www.ccc.onl](https://www.ccc.onl) 或提交 Issue 到 [GitHub](https://github.com/renqw2023/skills)。
