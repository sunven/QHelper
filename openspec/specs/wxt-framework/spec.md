# WXT Framework Spec

## ADDED Requirements

### Requirement: WXT 构建系统

系统 SHALL 使用 WXT 框架作为 Chrome 扩展构建系统。

#### Scenario: 开发模式启动
- **WHEN** 开发者运行 `pnpm dev`
- **THEN** WXT 启动开发服务器，支持热模块替换
- **THEN** 扩展在 `.output/chrome-mv3` 目录构建

#### Scenario: 生产构建
- **WHEN** 开发者运行 `pnpm build`
- **THEN** WXT 构建生产版本
- **THEN** manifest.json 自动生成并包含在输出目录

### Requirement: Manifest V3 配置

系统 SHALL 使用 Manifest V3 格式。

#### Scenario: Service Worker 配置
- **WHEN** manifest.json 生成
- **THEN** 包含 `background.service_worker` 指向 `background.js`
- **THEN** 包含 `manifest_version: 3`

#### Scenario: 权限配置
- **WHEN** manifest.json 生成
- **THEN** 包含 `permissions: ["cookies", "tabs"]`
- **THEN** 包含 `host_permissions: ["<all_urls>"]`

### Requirement: 入口点自动发现

系统 SHALL 自动发现 `entrypoints/` 目录中的入口点文件。

#### Scenario: 发现 background 入口点
- **WHEN** `entrypoints/background.ts` 存在
- **THEN** WXT 将其编译为 `background.js` service worker

#### Scenario: 发现 popup 入口点
- **WHEN** `entrypoints/popup.html` 存在
- **THEN** WXT 将其作为扩展弹窗入口

#### Scenario: 发现 content script 入口点
- **WHEN** `entrypoints/content/github.tsx` 存在
- **THEN** WXT 将其编译为内容脚本注入
