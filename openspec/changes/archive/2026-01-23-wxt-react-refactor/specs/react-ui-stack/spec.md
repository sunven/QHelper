# React UI Stack Spec

## ADDED Requirements

### Requirement: React 框架集成

系统 SHALL 使用 React 18 作为 UI 框架。

#### Scenario: 入口点使用 React
- **WHEN** popup 或工具入口点渲染
- **THEN** 使用 `createRoot` API 挂载 React 组件

### Requirement: shadcn/ui 组件库

系统 SHALL 使用 shadcn/ui 组件库。

#### Scenario: shadcn 组件可用
- **WHEN** 组件需要 UI 元素
- **THEN** 可以从 `@/components/ui` 导入 shadcn 组件
- **THEN** 组件支持 className 和变体样式

#### Scenario: 按需添加组件
- **WHEN** 开发者运行 `npx shadcn-ui@latest add <component>`
- **THEN** 新组件添加到 `components/ui/` 目录
- **THEN** 更新 `components.json` 配置

### Requirement: Tailwind CSS 样式

系统 SHALL 使用 Tailwind CSS 进行样式设计。

#### Scenario: Tailwind 类可用
- **WHEN** 组件使用 Tailwind 类名
- **THEN** 样式正确应用

#### Scenario: 自定义主题
- **WHEN** `tailwind.config.ts` 配置自定义主题
- **THEN** Tailwind 使用自定义类和颜色

### Requirement: Lucide React 图标

系统 SHALL 使用 Lucide React 提供图标。

#### Scenario: 图标导入和使用
- **WHEN** 组件需要图标
- **THEN** 可以从 `lucide-react` 导入图标组件
