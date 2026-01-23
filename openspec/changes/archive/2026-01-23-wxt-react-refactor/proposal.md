# Proposal: WXT + React 重构 QHelper

## Why

QHelper 当前使用手动打包的依赖、混合技术栈（Vue 2、jQuery、原生 JS），没有构建系统和类型安全。这导致代码维护困难、依赖更新复杂、开发体验差。

重构到 WXT + React + TypeScript 等现代技术栈，可以：
- 建立规范的构建流程和依赖管理
- 获得 TypeScript 类型安全
- 统一 UI 框架和组件库
- 改善开发体验和代码质量

## What Changes

- **新增构建系统**：使用 WXT 框架（基于 Vite）替代手动构建
- **新增包管理**：使用 pnpm 替代手动打包依赖
- **技术栈统一**：从 Vue 2/jQuery 混合迁移到 React 18
- **引入 UI 组件库**：使用 shadcn/ui（基于 Radix UI + Tailwind CSS）
- **引入代码质量工具**：使用 Biome 替代 ESLint + Prettier
- **类型安全**：全面使用 TypeScript

### 具体变化

- 新增 `wxt.config.ts`、`package.json`、`biome.json` 等配置文件
- 重构 `entrypoints/` 目录结构（background、popup、content scripts）
- 保留所有 9 个工具功能，迁移到 React 实现：
  - `json`：JSON 解析/格式化 + Diff + 历史记录
  - `convert`：字符串编解码
  - `codebeautify`：代码美化
  - `timestamp`：时间戳转换
  - `imagebase64`：图片转 Base64
  - `colorTransform`：颜色格式转换
  - `pictureSplicing`：图片拼接
  - `uglify`：JavaScript 压缩
  - `trans-radix`：进制转换
- 保留 GitHub 内容脚本功能（在 GitHub 页面注入 vscode.dev 按钮）

## Capabilities

### New Capabilities

- `wxt-framework`: WXT 扩展框架集成
- `react-ui-stack`: React + shadcn/ui UI 框架
- `type-safety`: TypeScript 类型安全
- `code-quality`: Biome 代码质量工具
- `pnpm-workspace`: pnpm 包管理

### Modified Capabilities

- `json-tool`: JSON 解析工具迁移到 React
- `convert-tool`: 字符串编解码工具迁移到 React
- `codebeautify-tool`: 代码美化工具迁移到 React
- `timestamp-tool`: 时间戳转换工具迁移到 React
- `imagebase64-tool`: 图片转 Base64 工具迁移到 React
- `colorTransform-tool`: 颜色格式转换工具迁移到 React
- `pictureSplicing-tool`: 图片拼接工具迁移到 React
- `uglify-tool`: JavaScript 压缩工具迁移到 React
- `trans-radix-tool`: 进制转换工具迁移到 React
- `github-content-script`: GitHub 内容脚本迁移到 React

## Impact

### 受影响的代码

目录结构调整：
- 保留原项目结构，新建 `entrypoints/`、`components/`、`tools/`、`lib/`、`hooks/`
- 迁移完成后可删除 `template/`、`static/` 等旧目录

### 新增依赖

- wxt: Chrome 扩展框架
- react / react-dom: UI 框架
- typescript: 类型检查
- tailwindcss: 样式引擎
- shadcn/ui 相关: class-variance-authority, clsx, tailwind-merge, lucide-react
- biome: 代码质量工具
- 工具特定依赖: uglify-js, diff, react-json-view

### 受影响的 API

- Chrome Extension APIs 保持不变 (Manifest V3)
- 工具页面 URL 结构可能变化（WXT 处理）

### 系统影响

- 开发流程需要 `pnpm dev` 启动开发服务器
- 构建产物在 `.output/` 目录（WXT 默认）
- 需要重新配置 Chrome 扩展加载路径
