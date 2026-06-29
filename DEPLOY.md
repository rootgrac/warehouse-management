# 仓库管理 - 部署指南

## 第一步：创建 Supabase 项目

### 方案 A：国内用户推荐（免翻墙）
1. 打开 [memfirecloud.com](https://memfirecloud.com) 注册账号
2. 创建一个新项目
3. 进入项目 → 设置 → API，复制 `URL` 和 `anon public key`

### 方案 B：Supabase 官方
1. 打开 [app.supabase.com](https://app.supabase.com) 注册账号
2. 创建一个新项目（选择离你最近的区域）
3. 进入项目 → Settings → API，复制 `Project URL` 和 `anon public key`

## 第二步：初始化数据库

1. 在 Supabase 控制台左侧找到 **SQL Editor**
2. 点击 **New query**
3. 将 `supabase_schema.sql` 文件的内容全部粘贴进去
4. 点击 **Run** 执行
5. 在左侧 **Database → Replication** 中，确认 `products` 表已开启 Realtime

## 第三步：配置环境变量

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env`，填入第一步获取的 URL 和 key：
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

## 第四步：生成 PWA 图标（可选）

在项目根目录执行以下操作生成图标文件，放到 `public/` 目录：
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

可以用在线工具生成：https://realfavicongenerator.net

如果跳过此步骤，PWA 安装功能仍可工作，只是桌面图标使用默认样式。

## 第五步：部署到云端

### 方案 A：Vercel（免费，国外速度好）
```bash
npm install -g vercel
vercel
```

### 方案 B：Netlify（免费）
1. 将项目推送到 GitHub
2. 在 [netlify.com](https://netlify.com) 导入项目
3. 设置构建命令：`npm run build`，输出目录：`dist`

### 方案 C：国内云服务器
```bash
# 构建
npm run build

# 将 dist/ 目录上传到你的服务器（Nginx/Apache）
# Nginx 示例配置：
# server {
#   listen 80;
#   server_name your-domain.com;
#   root /var/www/warehouse/dist;
#   index index.html;
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
# }
```

## 第六步：分享使用

1. 部署后会获得一个网址（如 `https://xxx.vercel.app`）
2. 把网址发给同事，在手机浏览器中打开
3. iPhone：Safari 打开 → 底部分享按钮 → 添加到主屏幕
4. Android：Chrome 打开 → 菜单 → 添加到主屏幕
5. 先注册账号，然后创建或加入团队即可开始使用
