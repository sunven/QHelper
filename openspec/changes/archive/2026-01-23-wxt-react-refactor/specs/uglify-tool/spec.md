# Uglify Tool Spec

## ADDED Requirements

### Requirement: JavaScript 压缩

工具 SHALL 使用 UglifyJS 压缩 JavaScript 代码。

#### Scenario: 压缩代码
- **WHEN** 用户输入 JavaScript 代码并点击"压缩"按钮
- **THEN** 代码显示为压缩格式
- **THEN** 变量名被缩短（mangle 选项）
- **THEN** 空格和注释被移除

#### Scenario: 保留压缩选项

工具 SHALL 支持配置压缩选项。

#### Scenario: 启用 mangle
- **WHEN** 用户勾选"变量名缩短"选项
- **THEN** 压缩时缩短变量名

#### Scenario: 启用压缩
- **WHEN** 用户勾选"去除空格和注释"选项
- **THEN** 压缩时去除空格和注释

### Requirement: 代码复制

工具 SHALL 支持复制压缩后的代码。

#### Scenario: 复制到剪贴板
- **WHEN** 用户点击"复制"按钮
- **THEN** 压缩后的代码复制到剪贴板

### Requirement: 错误处理

工具 SHALL 显示 JavaScript 语法错误。

#### Scenario: 显示语法错误
- **WHEN** 用户输入无效的 JavaScript
- **THEN** 显示错误提示
- **THEN** 错误提示包含语法错误位置
