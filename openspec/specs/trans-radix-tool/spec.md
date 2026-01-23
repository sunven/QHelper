# Trans-Radix Tool Spec

## ADDED Requirements

### Requirement: 进制转换

工具 SHALL 支持不同进制之间的数值转换。

#### Scenario: 转换到目标进制
- **WHEN** 用户输入源进制、数值和目标进制
- **THEN** 显示转换后的数值

#### Scenario: 双向转换
- **WHEN** 用户点击"转换"按钮
- **THEN** 上方输入转换到下方
- **WHEN** 用户点击"反向转换"按钮
- **THEN** 下方输入转换到上方

### Requirement: 支持的进制

工具 SHALL 支持常见进制。

#### Scenario: 二进制转换
- **WHEN** 用户选择 2 进制
- **THEN** 正确转换二进制数值

#### Scenario: 八进制转换
- **WHEN** 用户选择 8 进制
- **THEN** 正确转换八进制数值

#### Scenario: 十进制转换
- **WHEN** 用户选择 10 进制
- **THEN** 正确转换十进制数值

#### Scenario: 十六进制转换
- **WHEN** 用户选择 16 进制
- **THEN** 正确转换十六进制数值

#### Scenario: 自定义进制
- **WHEN** 用户选择或输入 2-36 之间的任意进制
- **THEN** 正确转换该进制数值

### Requirement: 常用进制快速选择

工具 SHALL 提供常用进制快捷选项。

#### Scenario: 快速选择进制
- **WHEN** 用户点击常用进制按钮（2、8、10、16）
- **THEN** 自动设置进制选择器

### Requirement: 大数支持

工具 SHALL 支持大数值的进制转换。

#### Scenario: 处理大数
- **WHEN** 用户输入大数值
- **THEN** 正确转换不丢失精度
