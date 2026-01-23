# Code Quality Spec

## ADDED Requirements

### Requirement: Biome 格式化

系统 SHALL 使用 Biome 进行代码格式化。

#### Scenario: 格式化配置
- **WHEN** `biome.json` 配置格式化规则
- **THEN** 代码使用 2 空格缩进
- **THEN** 行宽限制为 100 字符

#### Scenario: 格式化执行
- **WHEN** 运行 `pnpm biome format`
- **THEN** 所有 .ts、.tsx、.js、.jsx 文件格式化

### Requirement: Biome Linting

系统 SHALL 使用 Biome 进行代码检查。

#### Scenario: Lint 规则配置
- **WHEN** `biome.json` 配置 lint 规则
- **THEN** 启用推荐规则
- **THEN** 配置 React 和 TypeScript 特定规则

#### Scenario: Lint 执行
- **WHEN** 运行 `pnpm biome check`
- **THEN** Biome 报告代码问题
- **THEN** 违反规则的代码导致错误

#### Scenario: 自动修复
- **WHEN** 运行 `pnpm biome check --write`
- **THEN** Biome 自动修复可修复的问题

### Requirement: Git Hook 集成（可选）

系统 MAY 支持 Git hooks 自动检查代码质量。

#### Scenario: Pre-commit hook
- **WHEN** 开发者提交代码
- **THEN** 可选的 pre-commit hook 自动运行 Biome 检查
