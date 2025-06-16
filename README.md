# GitHub 项目卡片生成器

一个简洁美观的 GitHub 项目卡片生成工具，输入项目地址即可生成精美的项目展示卡片，支持导出图片。

## ✨ 主要功能

- 🎨 **液态玻璃效果**：现代化的玻璃态卡片设计
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

## 🎯 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 部署
bun run deploy
```

## 📄 许可证

MIT License
