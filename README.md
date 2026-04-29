# QHelper 前端助手

> 专为前端开发者设计的 Chrome/Chromium 浏览器扩展工具箱

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Chrome Version](https://img.shields.io/badge/chrome-1.2.0-green.svg)](https://github.com/sunven/QHelper)

## 简介

QHelper 前端助手是一款实用的浏览器扩展，集成了前端开发中常用的 10+ 工具，并新增了 **sidepanel-first 的网页总结能力**：在当前网页旁边打开侧边栏，边看原文边查看 AI 摘要。

## 功能特性

### 常用工具

| 工具 | 功能描述 |
|------|----------|
| JSON 格式化 | JSON 语法高亮、格式化、解析、错误检测 |
| 进制转换 | 2/8/10/16 进制之间的快速转换 |
| 时间戳转换 | Unix 时间戳与日期时间互转 |

### 编码工具

| 工具 | 功能描述 |
|------|----------|
| 字符串编码 | Base64、URL 编码、HTML 实体编码转换 |
| 代码美化 | 格式化压缩的 JavaScript/HTML/CSS 代码 |
| 代码压缩 | UglifyJS 压缩 JavaScript 代码 |

### 图片工具

| 工具 | 功能描述 |
|------|----------|
| 图片转 Base64 | 快速将图片转换为 Base64 编码 |
| 图片拼接 | 多张图片水平/垂直拼接 |

### AI / 阅读辅助

| 工具 | 功能描述 |
|------|----------|
| 网页总结（侧边栏） | 在当前网页旁边打开 Side Panel，提取正文并调用你配置的兼容 OpenAI 接口生成摘要 |

### 其他工具

| 工具 | 功能描述 |
|------|----------|
| 颜色转换 | RGB、HEX、HSL 颜色格式互转 |
| 清除 Cookie | 一键清除当前站点所有 Cookie |

### 特色功能

- GitHub 集成：在 GitHub 仓库首页添加 "Zread" 按钮
- Side Panel 网页总结：保留“边看边读”的 adjacent-reading 体验
- 本地存储：工具历史和网页总结配置保存在浏览器本地
- 隐私保护：默认不上传数据；仅当你配置接口并点击“开始总结”时，当前网页正文才会发送到你指定的接口
- 离线优先：除网页总结外，其余大多数工具均可离线运行

## 安装方式

### 从 Chrome 应用商店安装（推荐）

> 即将上架，敬请期待

### 开发版安装

1. 克隆本仓库
   ```bash
   git clone https://github.com/sunven/QHelper.git
   cd QHelper
   ```

2. 安装依赖
   ```bash
   pnpm install
   ```

3. 构建扩展
   ```bash
   pnpm build
   ```

4. 加载到浏览器
   - 打开 Chrome/Chromium 浏览器
   - 访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目目录下的 `.output/chrome-mv3` 文件夹

## 网页总结入口

- 打开扩展 popup，顶部可以直接点击 **“总结当前网页”**
- 或者在普通网页中 **右键**，选择 **“使用 QHelper 总结当前网页”**
- 两个入口都会在当前网页旁边打开 Side Panel

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 生产构建
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 技术栈

- **构建框架**: [WXT](https://wxt.dev/) - Web Extension Tools
- **前端框架**: React 19 + TypeScript
- **样式方案**: Tailwind CSS v4
- **图标库**: Lucide React

## 隐私政策

本扩展承诺：

- 不收集或上报匿名统计数据
- 不使用任何第三方追踪服务
- 工具历史和网页总结配置默认只保存在浏览器本地
- 仅当你主动配置接口并点击“开始总结”时，网页正文才会发送到你指定的兼容 OpenAI 接口

详细隐私政策请查看：[隐私政策](https://sunven.github.io/QHelper/privacy.html)

## 权限说明

| 权限 | 用途 |
|------|------|
| `cookies` | 用于"清除 Cookie"功能 |
| `tabs` | 用于在新标签页打开工具、获取当前网页信息 |
| `activeTab` | 用于从当前活动网页打开网页总结侧边栏 |
| `storage` | 用于存储用户偏好设置和 `webSummaryConfig` |
| `sidePanel` | 用于打开网页总结侧边栏 |
| `contextMenus` | 用于在网页右键菜单中展示“使用 QHelper 总结当前网页”入口 |
| `host_permissions` | 用于 GitHub 页面集成和网页总结内容提取 |

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[ISC](LICENSE)

## 作者

[sunven](https://github.com/sunven)

---

[Chrome 应用商店](https://chrome.google.com/webstore) · [报告问题](https://github.com/sunven/QHelper/issues) · [功能建议](https://github.com/sunven/QHelper/issues)
