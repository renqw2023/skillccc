# GitHub OAuth 配置指南

为了实现 GitHub 登录功能，您需要按照以下步骤获取 `Client ID` 和 `Client Secret`：

### 第一步：在 GitHub 注册 OAuth App

1. 登录 GitHub，点击右上角头像 -> **Settings**。
2. 在左侧菜单最下方点击 **Developer settings**。
3. 选择 **OAuth Apps** -> 点击 **New OAuth App** 按钮。
4. 填写以下表单内容：
   - **Application name**: `SkillCCC` (可以随便填)
   - **Homepage URL**: `http://localhost:5173`
   - **Application description**: (可选，可以留空)
   - **Authorization callback URL**: `http://localhost:3001/api/auth/github/callback` (极为重要，必须填写这个后端回调地址)
5. 点击 **Register application**。

### 第二步：获取密钥

1. 注册成功后，您会看到 **Client ID**，请先复制出来。
2. 点击 **Generate a new client secret** 按钮。
3. **关键**: 复制生成的 **Client Secret**。注意，关闭页面后就再也看不到了，必须现在保存。

### 第三步：更新项目配置

在项目根目录的 `.env` 文件中，添加或更新以下内容：

```env
# GitHub OAuth 配置
GITHUB_CLIENT_ID=您的_Client_ID
GITHUB_CLIENT_SECRET=您的_Client_Secret

# Session 安全密钥 (随便填一串随机长度的字母数字即可)
SESSION_SECRET=a_random_long_string_123456
```

---

完成以上设置后，后端程序会自动读取这些配置来处理登录请求。
