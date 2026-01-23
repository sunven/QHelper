# pnpm Workspace Spec

## ADDED Requirements

### Requirement: pnpm 包管理

系统 SHALL 使用 pnpm 作为包管理器。

#### Scenario: 依赖安装
- **WHEN** 运行 `pnpm install`
- **THEN** 依赖安装到 node_modules
- **THEN** 创建 pnpm-lock.yaml 锁定版本

#### Scenario: 依赖添加
- **WHEN** 运行 `pnpm add <package>`
- **THEN** 包添加到 package.json dependencies
- **THEN** 版本锁定到 pnpm-lock.yaml

### Requirement: 依赖隔离

系统 SHALL 使用 pnpm 的符号链接机制隔离依赖。

#### Scenario: 依赖解析
- **WHEN** 项目引用多个包的同一依赖
- **THEN** pnpm 使用符号链接避免重复
- **THEN** 磁盘使用更高效

### Requirement: 脚本管理

系统 SHALL 通过 package.json scripts 管理常用命令。

#### Scenario: 开发脚本
- **WHEN** 运行 `pnpm dev`
- **THEN** 执行 WXT 开发模式

#### Scenario: 构建脚本
- **WHEN** 运行 `pnpm build`
- **THEN** 执行 WXT 生产构建

#### Scenario: 类型检查脚本
- **WHEN** 运行 `pnpm type-check`
- **THEN** 执行 TypeScript 类型检查

#### Scenario: 代码质量脚本
- **WHEN** 运行 `pnpm lint`
- **THEN** 执行 Biome 检查
