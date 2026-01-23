# Image Base64 Tool Spec

## ADDED Requirements

### Requirement: 图片转 Base64

工具 SHALL 将图片转换为 Base64 编码。

#### Scenario: 选择图片文件
- **WHEN** 用户选择图片文件
- **THEN** 文件读取并转换为 Base64 编码

#### Scenario: 显示 Base64 结果
- **WHEN** 图片转换完成
- **THEN** 显示完整的 Data URI（data:image/...;base64,...）

#### Scenario: 显示图片预览
- **WHEN** 图片转换完成
- **THEN** 显示图片预览

### Requirement: 复制 Base64

工具 SHALL 支持复制 Base64 结果。

#### Scenario: 复制到剪贴板
- **WHEN** 用户点击"复制"按钮
- **THEN** Base64 字符串复制到剪贴板

### Requirement: 多图片支持

工具 SHALL 支持同时转换多张图片。

#### Scenario: 选择多个图片
- **WHEN** 用户选择多个图片文件
- **THEN** 每张图片独立转换并显示
