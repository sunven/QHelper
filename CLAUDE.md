
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

QHelper 是一个面向前端开发者的 Chrome/Chromium 浏览器扩展，提供一系列实用工具，通过扩展弹窗菜单访问。每个工具会在新的浏览器标签页中打开。

## 架构

项目采用自包含架构，没有构建系统。所有依赖都直接打包在项目中。

```
template/           # 实用工具页面（每个都是独立的）
  ├── qhelper_popup.html  # 扩展主弹窗菜单
  ├── json/               # JSON 格式化/解析器（支持 diff）
  ├── convert/            # 字符串编码/解码工具
  ├── codebeautify/       # 代码美化工具
  ├── timestamp/          # 时间戳转换器
  ├── imagebase64/        # 图片转 Base64 工具
  ├── colorTransform/     # 颜色格式转换器
  ├── pictureSplicing/    # 图片拼接工具
  ├── trans-radix/        # 进制转换器
  └── uglify/             # JavaScript 压缩工具

content/            # 内容脚本（注入到网页中）
  └── openinvscode.js    # 在 GitHub 页面注入 "vscode.dev" 按钮

static/             # 共享静态资源
  ├── css/               # CSS 库（Element Plus, Semantic UI）
  ├── img/               # 扩展图标
  └── js/                # 共享 JavaScript 库（Vue, jQuery, Element Plus 等）
```

## 技术栈

- **扩展 API:** Chrome Extension Manifest v2
- **前端:** Vue.js 和原生 JS 混合使用
- **UI 库:** Element Plus, Semantic UI
- **工具库:** jQuery, Underscore.js

所有依赖都打包在 `/static/` 目录下，没有 package.json 或 npm 依赖管理。

## 开发

### 加载扩展

测试修改：
1. 打开 Chrome/Chromium 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 QHelper 项目目录

### 无需构建步骤

这是一个静态浏览器扩展，不需要构建步骤。修改 HTML/JS 文件后，重新加载扩展即可立即生效。

### 重新构建 UglifyJS 打包文件

如果修改了打包的 UglifyJS 库：

```bash
uglifyjs --self -c -m -o ./tmp/uglifyjs.js
```

## 内容脚本

`content/openinvscode.js` 内容脚本会被注入到 GitHub 页面（`*://github.com/*`），添加 "vscode.dev" 按钮用于在 VSCode Web 中打开仓库。

## 权限

扩展需要以下权限：
- `cookies` - 用于清除 Cookie 功能
- `<all_urls>` - 用于与网页内容交互的工具
- `tabs` - 用于标签页管理

## Manifest 版本

当前项目使用 Manifest v2（较旧的 Chrome 扩展格式）。如果迁移到 v3，需要注意：
- `background.scripts` 需要改为 `background.service_worker`
- `browser_action` 需要改为 `action`
- 内容安全策略会更严格
- 需要处理 `unsafe-eval` 策略问题
