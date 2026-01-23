# Implementation Tasks: WXT + React 重构 QHelper

## 1. 基础架构搭建

- [x] 1.1 初始化 pnpm 项目 (`pnpm init`)
- [x] 1.2 安装 WXT 核心依赖 (`pnpm add wxt typescript react react-dom`)
- [x] 1.3 安装开发依赖 (`pnpm add -D @types/react @types/react-dom @wxt-dev/module-react`)
- [x] 1.4 创建 `wxt.config.ts` 配置文件
- [x] 1.5 创建 `tsconfig.json` TypeScript 配置
- [x] 1.6 创建 `package.json` scripts（dev、build、type-check、lint）

## 2. 代码质量工具配置

- [x] 2.1 安装 Biome (`pnpm add -D biome`)
- [x] 2.2 创建 `biome.json` 配置文件
- [x] 2.3 配置 Biome 格式化规则（2 空格缩进、100 字符行宽）
- [x] 2.4 配置 Biome lint 规则（推荐规则 + React 特定规则）
- [x] 2.5 验证 Biome 配置（运行 `pnpm biome check`）

## 3. Tailwind CSS 和 shadcn/ui 配置

- [x] 3.1 安装 Tailwind CSS (`pnpm add -D tailwindcss postcss autoprefixer`)
- [x] 3.2 创建 `tailwind.config.ts` 配置
- [x] 3.3 创建 `postcss.config.js` 配置
- [x] 3.4 初始化 shadcn/ui (`npx shadcn-ui@latest init`)
- [x] 3.5 安装 shadcn/ui 基础依赖 (`pnpm add class-variance-authority clsx tailwind-merge lucide-react`)
- [x] 3.6 添加初始 shadcn 组件（button、input、textarea、select、dialog）

## 4. 项目目录结构创建

- [x] 4.1 创建 `entrypoints/` 目录
- [x] 4.2 创建 `components/` 目录和 `components/ui/` 子目录
- [x] 4.3 创建 `tools/` 目录和 9 个工具子目录
- [x] 4.4 创建 `lib/` 目录和子目录（chrome、encoders）
- [x] 4.5 创建 `hooks/` 目录
- [x] 4.6 创建 `types/` 目录
- [x] 4.7 创建 `public/` 目录和 `public/icons/` 子目录

## 5. 静态资源迁移

- [x] 5.1 复制图标文件 (`q-16.png`、`q-48.png`、`q-128.png`)`) 到 `public/icons/`
- [x] 5.2 复制 JSON diff 库 (`diffview.js`、`difflib.js`) 到 `public/libs/`
- [x] 5.3 配置 `wxt.config.ts` 引用图标路径

## 6. 共享 Chrome API 封装

- [x] 6.1 创建 `lib/chrome/storage.ts`（封装 `chrome.storage`）
- [x] 6.2 创建 `lib/chrome/tabs.ts`（封装 `chrome.tabs`）
- [x] 6.3 创建 `lib/chrome/cookies.ts`（封装 `chrome.cookies`）
- [x] 6.4 创建 `lib/chrome/index.ts` 导出所有封装

## 7. 共享 React Hooks

- [x] 7.1 创建 `hooks/useExtensionStorage.ts`（storage Hook）
- [x] 7.2 创建 `hooks/useChromeTabs.ts`（tabs Hook）
- [x] 7.3 创建 `hooks/useChromeCookies.ts`（cookies Hook）

## 8. Service Worker 迁移

- [x] 8.1 创建 `entrypoints/background.ts`
- [x] 8.2 迁移图标更新逻辑（从 `background.js`）
- [x] 8.3 配置 TypeScript 类型

## 9. Popup 弹窗迁移

- [x] 9.1 创建 `entrypoints/popup.html`
- [x] 9.2 创建 `entrypoints/popup.tsx`
- [x] 9.3 实现 React 工具列表组件（替代 jQuery 版）
- [x] 9.4 实现点击跳转逻辑（`chrome.tabs.create`）
- [x] 9.5 实现清除 Cookie 功能
- [x] 9.6 添加 shadcn 按钮和列表组件

## 10. GitHub 内容脚本迁移

- [x] 10.1 创建 `entrypoints/content/github.tsx`
- [x] 10.2 实现仓库页面检测逻辑
- [x] 10.3 实现 vscode.dev 按钮注入逻辑
- [x] 10.4 生成正确的 vscode.dev 链接
- [x] 10.5 配置 content script manifest 匹配规则（`*://github.com/*`）

## 11. 工具：timestamp（时间戳转换）

- [x] 11.1 创建 `tools/timestamp/index.html`
- [x] 11.2 创建 `tools/timestamp/index.tsx`
- [x] 11.3 实现时间戳转日期转换
- [x] 11.4 实现日期转时间戳转换
- [x] 11.5 实现当前时间显示
- [x] 11.6 添加 shadcn input 和 button 组件
- [x] 11.7 测试所有转换功能

## 12. 工具：convert（字符串编解码）

- [x] 12.1 创建 `tools/convert/index.html`
- [x] 12.2 创建 `tools/convert/index.tsx`
- [x] 12.3 创建 `lib/encoders/base64.ts`（Base64 编解码）
- [x] 12.4 创建 `lib/encoders/uri.ts`（URI 编解码）
- [x] 12.5 创建 `lib/encoders/unicode.ts`（Unicode 编解码）
- [x] 12.6 实现所有编解码按钮（HTML 转义、URI、Base64、MD5）
- [x] 12.7 实现 MD5 编码（使用浏览器原生 Web Crypto API）
- [x] 12.8 添加 shadcn textarea 和 button 组件
- [x] 12.9 测试所有编解码功能

## 13. 工具：colorTransform（颜色格式转换）

- [x] 13.1 创建 `tools/colorTransform/index.html`
- [x] 13.2 创建 `tools/colorTransform/index.tsx`
- [x] 13.3 实现 HEX 转 RGB 逻辑
- [x] 13.4 实现 RGB 转 HEX 逻辑
- [x] 13.5 实现 HSL 转换逻辑
- [x] 13.6 实现颜色预览功能
- [x] 13.7 添加原生颜色选择器
- [x] 13.8 添加 shadcn input 和 color 组件
- [x] 13.9 测试所有颜色转换功能

## 14. 工具：imagebase64（图片转 Base64）

- [x] 14.1 创建 `tools/imagebase64/index.html`
- [x] 14.2 创建 `tools/imagebase64/index.tsx`
- [x] 14.3 实现文件选择和读取（FileReader API）
- [x] 14.4 实现图片转 Base64 逻辑
- [x] 14.5 实现图片预览显示
- [x] 14.6 实现复制到剪贴板功能
- [x] 14.7 添加 shadcn button 和 avatar 组件
- [x] 14.8 测试图片转 Base64 功能

## 15. 工具：trans-radix（进制转换）

- [x] 15.1 创建 `tools/trans-radix/index.html`
- [x] 15.2 创建 `tools/trans-radix/index.tsx`
- [x] 15.3 实现进制转换核心逻辑
- [x] 15.4 实现双向转换（A→B 和 B→A）
- [x] 15.5 支持常用进制（2、8、10、16）快捷选择
- [x] 15.6 支持自定义进制（2-36）
- [x] 15.7 添加 shadcn input、select、radio-group 组件
- [x] 15.8 测试各种进制转换

## 16. 工具：uglify（JavaScript 压缩）

- [x] 16.1 安装 uglify-js (`pnpm add uglify-js`)
- [x] 16.2 创建 `tools/uglify/index.html`
- [x] 16.3 创建 `tools/uglify/index.tsx`
- [x] 16.4 实现代码压缩逻辑（使用 uglify-js）
- [x] 16.5 实现 mangle 选项（变量名缩短）
- [x] 16.6 实现压缩选项（去除空格和注释）
- [x] 16.7 实现语法错误检测和显示
- [x] 16.8 实现复制到剪贴板功能
- [x] 16.9 添加 shadcn textarea、button、tabs 组件
- [x] 16.10 测试压缩功能和错误处理

## 17. 工具：codebeautify（代码美化）

- [x] 17.1 创建 `tools/codebeautify/index.html`
- [x] 17.2 创建 `tools/codebeautify/index.tsx`
- [x] 17.3 安装代码格式化库（如 prettier 或 js-beautify）
- [x] 17.4 实现代码美化逻辑
- [x] 17.5 实现代码压缩逻辑
- [x] 17.6 支持多种语言（JavaScript、HTML、CSS）
- [x] 17.7 实现语法高亮（使用 highlight.js 或类似库）
- [x] 17.8 添加 shadcn textarea、button、tabs 组件
- [x] 17.9 测试代码美化和压缩功能

## 18. 工具：pictureSplicing（图片拼接）

- [x] 18.1 创建 `tools/pictureSplicing/index.html`
- [x] 18.2 创建 `tools/pictureSplicing/index.tsx`
- [x] 18.3 实现多图片选择和上传
- [x] 18.4 使用 Canvas 实现图片拼接逻辑
- [x] 18.5 实现水平拼接功能
- [x] 18.6 实现垂直拼接功能
- [x] 18.7 实现图片拖拽排序（使用 dnd-kit 或类似库）
- [x] 18.8 实现间距调整功能
- [x] 18.9 实现背景颜色设置
- [x] 18.10 实现下载拼接结果功能
- [x] 18.11 添加 shadcn button、input、card 组件
- [x] 18.12 测试图片拼接和下载功能

## 19. 工具：json（JSON 解析 - 最复杂）

- [x] 19.1 安装 react-json-view (`pnpm add react-json-view`)
- [x] 19.2 创建 `tools/json/index.html`
- [x] 19.3 创建 `tools/json/index.tsx`
- [x] 19.4 实现解析和验证（使用 JSONLint）
- [x] 19.5 使用 react-json-view 实现树形展示
- [x] 19.6 实现展开/折叠功能
- [x] 19.7 实现 URL 识别和可点击链接
- [x] 19.8 实现压缩模式（单行输出）
- [x] 19.9 集成 diffview.js 和 difflib.js 库
- [x] 19.10 实现双输入 Diff 模式
- [x] 19.11 实现差异高亮显示
- [x] 19.12 实现视图切换（格式化 ↔ Diff）
- [x] 19.13 实现历史记录保存（使用 chrome.storage）
- [x] 19.14 实现历史记录列表显示
- [x] 19.15 实现历史记录恢复功能
- [x] 19.16 实现历史记录删除功能
- [x] 19.17 实现导出文本文件功能
- [x] 19.18 实现语法错误显示
- [x] 19.19 添加 shadcn textarea、button、dialog、tabs 组件
- [x] 19.20 全面测试所有功能（格式化、Diff、历史记录、导出）

## 20. 共享组件开发

- [x] 20.1 创建 `components/layout/tool-layout.tsx`（工具页面通用布局）
- [x] 20.2 添加更多需要的 shadcn 组件（scroll-area、badge、alert）
- [x] 20.3 创建通用工具函数 `lib/utils.ts`

## 21. 构建和测试

- [x] 21.1 运行 `pnpm build` 验证生产构建
- [x] 21.2 检查 `.output/chrome-mv3/` 目录结构
- [x] 21.3 验证 manifest.json 生成正确
- [x] 21.4 在 Chrome 中加载扩展测试
- [x] 21.5 测试所有 9 个工具功能
- [x] 21.6 测试 GitHub 内容脚本功能
- [x] 21.7 运行 `pnpm biome check` 验证代码质量
- [x] 21.8 运行 `pnpm type-check` 验证 TypeScript 类型

## 22. 清理和文档

- [x] 22.1 更新 README.md（说明新的开发流程）
- [x] 22.2 更新 CLAUDE.md（说明新架构）
- [x] 22.3 备份或删除旧的 `template/` 目录
- [x] 22.4 备份或删除旧的 `static/` 目录
- [x] 22.5 删除旧的 `manifest.json`（WXT 自动生成）
- [x] 22.6 删除旧的 `background.js`（已迁移到 background.ts）
- [x] 22.7 创建 .gitignore 规则（node_modules、.output）
