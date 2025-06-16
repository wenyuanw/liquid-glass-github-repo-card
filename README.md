# GitHub 项目卡片生成器

一个采用 **Liquid Glass（液态玻璃）** 风格设计的 GitHub 项目卡片生成工具，输入项目地址即可生成具有现代化玻璃质感的精美项目展示卡片，支持导出图片。

## 预览

<img width="711" alt="preview" src="https://github.com/user-attachments/assets/9373e1bd-a123-43a8-8d23-792276f57316" />


## ✨ 主要功能

- 🎨 **Liquid Glass 风格**：采用液态玻璃视觉效果，呈现半透明、模糊背景和优雅的光影效果
- 📊 **项目统计**：展示 Stars、Forks、Watchers 等数据
- 📸 **导出功能**：支持完整截图和自动裁切卡片
- 📱 **响应式设计**：完美适配各种设备

## 🚀 使用方法

1. 输入 GitHub 项目地址（支持完整 URL 或 `owner/repo` 格式）
2. 点击"生成卡片"查看效果
3. 点击"下载卡片"导出图片

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

# 部署
bun run deploy
```

## 📃 许可证

MIT License
