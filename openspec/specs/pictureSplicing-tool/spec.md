# Picture Splicing Tool Spec

## ADDED Requirements

### Requirement: 图片拼接

工具 SHALL 支持将多张图片水平或垂直拼接。

#### Scenario: 水平拼接
- **WHEN** 用户选择多张图片并选择水平拼接
- **THEN** 图片从左到右拼接
- **THEN** 生成一张新图片

#### Scenario: 垂直拼接
- **WHEN** 用户选择多张图片并选择垂直拼接
- **THEN** 图片从上到下拼接
- **THEN** 生成一张新图片

### Requirement: 图片拖拽排序

工具 SHALL 支持拖拽调整图片顺序。

#### Scenario: 拖拽重排
- **WHEN** 用户拖拽图片到新位置
- **THEN** 图片列表重新排序
- **THEN** 拼接结果使用新顺序

### Requirement: 间距调整

工具 SHALL 支持调整图片间间距。

#### Scenario: 设置间距
- **WHEN** 用户调整间距值
- **THEN** 图片间添加对应间距

### Requirement: 背景颜色

工具 SHALL 支持设置背景颜色。

#### Scenario: 设置背景色
- **WHEN** 用户选择背景颜色
- **THEN** 拼接结果使用该背景填充间隙

### Requirement: 下载拼接结果

工具 SHALL 支持下载拼接后的图片。

#### Scenario: 下载图片
- **WHEN** 用户点击"下载"按钮
- **THEN** 拼接后的图片下载到本地
