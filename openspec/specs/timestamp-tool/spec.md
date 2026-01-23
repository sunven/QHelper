# Timestamp Tool Spec

## ADDED Requirements

### Requirement: 时间戳转换

工具 SHALL 支持时间戳与日期格式的相互转换。

#### Scenario: 时间戳转日期
- **WHEN** 用户输入时间戳（秒或毫秒）
- **THEN** 显示对应的日期时间
- **THEN** 显示多种日期格式（ISO、本地化等）

#### Scenario: 日期转时间戳
- **WHEN** 用户输入日期时间字符串
- **THEN** 显示对应的 Unix 时间戳（秒和毫秒）

### Requirement: 当前时间

工具 SHALL 显示当前时间戳。

#### Scenario: 显示当前时间
- **WHEN** 工具页面加载
- **THEN** 显示当前的时间戳
- **THEN** 每秒更新一次

### Requirement: 批量转换

工具 SHALL 支持批量时间戳转换。

#### Scenario: 批量转换
- **WHEN** 用户输入多个时间戳（每行一个）
- **THEN** 每行显示对应的日期时间
