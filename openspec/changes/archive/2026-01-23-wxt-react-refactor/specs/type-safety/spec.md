# Type Safety Spec

## ADDED Requirements

### Requirement: TypeScript 配置

系统 SHALL 使用 TypeScript 进行类型检查。

#### Scenario: tsconfig.json 配置
- **WHEN** 项目初始化
- **THEN** 创建 `tsconfig.json` 启用严格模式
- **THEN** 配置支持 JSX 和模块解析

#### Scenario: 类型错误检查
- **WHEN** 代码中有类型错误
- **THEN** TypeScript 编译器报告错误
- **THEN** 构建失败

### Requirement: Chrome API 类型定义

系统 SHALL 正确识别 Chrome Extension API 类型。

#### Scenario: chrome 全局变量
- **WHEN** 代码使用 `chrome.tabs` 或 `chrome.storage`
- **THEN** TypeScript 提供正确的类型提示

#### Scenario: WXT 模块类型
- **WHEN** 代码使用 WXT 特定 API
- **THEN** `@wxt-dev/module-react` 提供类型定义

### Requirement: React 组件类型

系统 SHALL 为 React 组件提供类型安全。

#### Scenario: Props 类型定义
- **WHEN** React 组件定义 Props 接口
- **THEN** 传递不匹配的 props 时 TypeScript 报错

#### Scenario: Hook 类型推断
- **WHEN** 使用 `useState`、`useRef` 等 hooks
- **THEN** TypeScript 正确推断状态和 ref 类型
