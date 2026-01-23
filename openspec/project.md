# 项目上下文

## 项目目的

QHelper 是一个面向前端开发者的 Chrome/Chromium 浏览器扩展，提供一系列实用工具，帮助开发者快速完成日常开发任务。所有工具通过扩展弹窗菜单访问，每个工具会在新的浏览器标签页中打开。

### 核心功能
- **JSON 格式化/解析** - 支持美化、压缩、diff 对比、历史保存
- **字符串编解码** - URL、Base64 等编码转换
- **代码美化** - HTML/CSS/JS 代码格式化
- **时间戳转换** - Unix 时间戳与日期时间互转
- **图片 Base64** - 图片转 Base64 编码
- **颜色转换** - 各种颜色格式转换
- **图片拼接** - 多张图片合并工具
- **进制转换** - 不同进制数字转换
- **Uglify** - JavaScript 代码压缩
- **清除 Cookie** - 快速清除当前站点 Cookie
- **GitHub 集成** - 在 GitHub 页面注入 "vscode.dev" 按钮

## 技术栈

### 扩展框架
- **Chrome Extension Manifest v3** - 最新扩展规范
- **Service Worker** - 后台服务（替代 v2 的 background page）

### 前端技术
- **Vue.js 2.x** - 主要 UI 框架（用于 JSON 工具等）
- **jQuery** - DOM 操作和事件处理
- **Underscore.js** - 工具函数库

### UI 库
- **Element Plus** - Vue UI 组件库
- **Semantic UI** - CSS 框架
- **SyntaxHighlighter** - 代码高亮

### 工具库
- **UglifyJS** - JavaScript 压缩器（自打包版本）
- **jsonlint** - JSON 语法验证
- **localforage** - 离线存储
- **difflib** - 文本 diff 算法

## 项目约定

### 代码风格

#### JavaScript
- 使用 jQuery 的 `$` 别名进行 DOM 操作
- Vue 组件注册使用 Vue.component 方式
- 使用 IIFEI（立即执行函数表达式）封装代码，避免全局污染
- 使用 `'use strict'` 严格模式
- 使用 ES5 语法，兼容性优先

#### HTML
- 使用简化的 HTML 结构，内联样式用于弹窗
- 模板文件存放在 `template/` 目录下
- 使用相对路径引用静态资源

#### 命名约定
- 文件名：小写，单词间用连字符分隔（如 `qhelper_popup.html`）
- 变量名：驼峰命名（如 `jsoncon`, `currentTab`）
- 组件名：vue- 前缀 + 功能描述（如 `vue-item`, `vue-outer`）

### 架构模式

#### 自包含架构
- 无构建系统（无 package.json、无 npm）
- 所有依赖库直接打包在 `static/` 目录下
- 修改 HTML/JS 后重新加载扩展即可生效

#### 目录结构
```
template/           # 实用工具页面（每个都是独立的）
  ├── qhelper_popup.html  # 扩展主弹窗菜单
  ├── json/               # JSON 格式化/解析器
  ├── convert/            # 字符串编码/解码工具
  ├── codebeautify/       # 代码美化工具
  ├── timestamp/          # 时间戳转换器
  ├── imagebase64/        # 图片转 Base64 工具
  ├── colorTransform/     # 颜色格式转换器
  ├── pictureSplicing/    # 图片拼接工具
  ├── trans-radix/        # 进制转换器
  └── uglify/             # JavaScript 压缩工具

content/            # 内容脚本（注入到网页中）
  └── openinvscode.js    # GitHub 页面注入脚本

static/             # 共享静态资源
  ├── css/               # CSS 库（Element Plus, Semantic UI）
  ├── img/               # 扩展图标
  ├── js/                # 共享 JavaScript 库
  └── semantic/           # Semantic UI 资源

background.js       # Service Worker 后台脚本
manifest.json       # 扩展清单文件
```

#### 模块化模式
- 每个工具页面是独立的 HTML + JS 组合
- 通过 `chrome.tabs.create()`` 在新标签页打开工具
- 弹窗菜单使用 `type` 和 `data-url` 属性区分操作类型

### 测试策略

**当前状态：无自动化测试**

项目目前不包含自动化测试。测试通过以下方式进行：
- 手动在浏览器中加载扩展
- 逐个工具进行功能验证
- Chrome 扩展商店审核作为质量保证

### Git 工作流

#### 分支策略
- `master` - 主分支，稳定版本
- `v2.x` - Manifest v3 迁移分支

#### 提交约定
项目使用简洁的中文提交消息：
- `migrate to Manifest V3` - 迁移到 Manifest v3
- `add trans-radix` - 添加进制转换功能
- `fix insert bug` - 修复插入 bug

## 领域知识

### Chrome Extension API
- `chrome.tabs` - 标签页管理，用于打开工具页面
- `chrome.cookies` - Cookie 操作，用于清除功能
- `chrome.action` - 扩展图标和弹窗（v3 新 API）
- `chrome.runtime` - 扩展运行时 API

### Service Worker vs Background Page
- Manifest v3 使用 Service Worker 替代 Background Page
- Service Worker 是事件驱动的，不能持久化 DOM
- 生命周期短暂，需要处理持久化状态

### 内容脚本注入
- 通过 `content_scripts` 配置注入
- 支持 CSS 选择器匹配（如 `*://github.com/*`）
- `run_at: "document_end"` 在 DOM 加载完成后注入

## 重要约束

### 技术约束
- **无构建步骤** - 必须保持静态文件结构
- **浏览器兼容性** - 目标是 Chrome/Chromium 及其衍生浏览器
- **依赖自包含** - 所有库必须本地化，不能使用 CDN
- **无模块系统** - 不能使用 ES Modules 或 CommonJS

### 权限约束
- `cookies` - 清除 Cookie 功能所需
- `tabs` - 标签页管理所需
- `<all_urls>` - 与网页内容交互所需
- Service Worker 权限比 Manifest v2 更严格

### Manifest v3 迁移约束
- 已完成 v2 到 v3 的迁移
- 不能再使用 `browser_action`，已改用 `action`
- 不能再使用 `background.scripts`，已改用 `background.service_worker`
- CSP 更严格，需注意 `unsafe-eval` 策略

## 外部依赖

### 浏览器 API
- Chrome Extension APIs (v3)
- 标准的 Web APIs（localStorage, File API 等）

### 库文件（均已本地化）
- Vue.js 2.x
- jQuery
- Underscore.js
- Element Plus 及其图标库
- Semantic UI
- UglifyJS（自打包）
- jsonlint
- localforage
- difflib
- FileSaver.js
- SyntaxHighlighter

### 无外部服务依赖
项目不依赖任何后端服务或第三方 API，完全运行在浏览器端。
