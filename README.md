<p align="center">
  <img src="https://github.com/user-attachments/assets/a0f557f9-a42e-445a-933e-41205ce75f9b" alt="Liquid Glass GitHub Repo Card" width="100%" />
</p>

# <p align="center">Liquid Glass GitHub Repo Card</p>

一个采用 **Liquid Glass（液态玻璃）** 风格设计的 GitHub 项目卡片生成工具，输入项目地址即可生成具有现代化玻璃质感的精美项目展示卡片，支持导出图片。

## 预览

<p align="center">
  <img src="https://github.com/user-attachments/assets/e648099e-ad43-4b9d-ae3d-0f699d020384" alt="Liquid Glass GitHub Repo Card" width="100%" />
</p>

## ✨ 主要功能

- 🎨 **Liquid Glass 风格**：采用液态玻璃视觉效果，呈现半透明、模糊背景和优雅的光影效果
- 📊 **项目统计**：展示 Stars、Forks、Watchers 等数据
- 📸 **导出功能**：支持完整截图和自动裁切卡片
- 🖼️ **OG 图片**：自动生成 Open Graph 图片，完美支持社交媒体分享
- 📱 **响应式设计**：完美适配各种设备

## 🚀 使用方法

1. 输入 GitHub 项目地址（支持完整 URL 或 `owner/repo` 格式）
2. 点击"生成卡片"查看效果
3. 点击"下载卡片"导出图片
4. 分享页面链接时自动显示项目的 OG 图片

## 🖼️ OG 图片功能

本项目支持自动生成 Open Graph 图片，让你的项目在社交媒体分享时更加吸引人：

### 功能特点
- **动态生成**：根据项目信息自动生成独特的 OG 图片
- **社交优化**：1200x630 尺寸，完美适配各大社交平台
- **智能降级**：项目信息获取失败时显示精美的默认图片
- **缓存优化**：图片缓存1小时，提升加载速度

### 使用方式
- **自动应用**：访问项目页面时自动设置 OG 标签
- **直接访问**：通过 `/og-image/{owner}/{repo}` 直接获取图片
- **社交分享**：在 Facebook、Twitter、LinkedIn 等平台分享时自动显示

### 测试 OG 图片
1. 打开 `test-og.html` 页面测试图片生成
2. 使用社交媒体调试工具验证效果：
   - [Facebook 分享调试器](https://developers.facebook.com/tools/debug/)
   - [Twitter Card 验证器](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## 🛠️ 技术栈

- **框架**：[Hono](https://hono.dev/)
- **运行时**：Cloudflare Workers
- **构建**：Vite + TypeScript

## 🎯 **快速开始**

### 📦 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wenyuanw/liquid-glass-github-repo-card)

点击上方按钮即可一键部署到 Cloudflare Workers。

### 🚀 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 构建项目
bun run build

# 部署到 Cloudflare Workers
bun run deploy
```

### ⚙️ 环境配置

为了获得更好的 GitHub API 体验，建议配置以下环境变量：

```bash
# 在 wrangler.toml 中添加或通过 Cloudflare Dashboard 设置
GITHUB_TOKEN = "your_github_personal_access_token"
```

**GitHub Token 的好处：**
- 提高 API 请求限制（从 60/小时 提升到 5000/小时）
- 支持访问私有仓库（如果 Token 有权限）
- 更稳定的服务体验

### 🔧 OG 图片配置

部署后需要更新 `src/renderer.tsx` 中的域名：

```typescript
const currentUrl = ogUrl || "https://your-domain.workers.dev" // 替换为你的实际域名
```

## 📃 许可证

MIT License
