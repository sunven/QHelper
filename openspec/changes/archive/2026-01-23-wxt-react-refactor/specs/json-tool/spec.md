# JSON Tool Spec

## ADDED Requirements

### Requirement: JSON 格式化

工具 SHALL 支持 JSON 格式化和压缩功能。

#### Scenario: 美化 JSON
- **WHEN** 用户输入有效的 JSON 并点击"美化"按钮
- **THEN** JSON 显示为格式化的树形结构
- **THEN** 支持折叠和展开嵌套对象和数组

#### Scenario: 压缩 JSON
- **WHEN** 用户点击"压缩"按钮
- **THEN** JSON 显示为单行压缩格式

### Requirement: JSON Diff 功能

工具 SHALL 支持对比两个 JSON 的差异。

#### Scenario: 执行 Diff
- **WHEN** 用户在"原 JSON"和"新 JSON"中输入内容并点击"Diff"按钮
- **THEN** 显示差异视图，高亮显示变化部分
- **THEN** 新增、删除、修改的内容有不同颜色标识

#### Scenario: 切换视图
- **WHEN** 用户点击"格式化视图"按钮
- **THEN** 返回到单 JSON 编辑器模式
- **WHEN** 用户点击"Diff"按钮
- **THEN** 切换到双输入 Diff 模式

### Requirement: 历史记录

工具 SHALL 支持 JSON 历史记录功能。

#### Scenario: 保存历史
- **WHEN** 用户点击"保存"按钮并输入名称
- **THEN** 当前 JSON 保存到历史记录
- **THEN** 历史记录使用 chrome.storage 持久化

#### Scenario: 恢复历史
- **WHEN** 用户从历史列表中选择一条记录
- **THEN** 编辑器加载该记录的 JSON 内容

#### Scenario: 删除历史
- **WHEN** 用户点击历史记录的删除图标
- **THEN** 该条记录从历史中删除

### Requirement: 全部展开/折叠

工具 SHALL 支持一键展开和折叠所有节点。

#### Scenario: 全部展开
- **WHEN** 用户点击"全部展开"按钮
- **THEN** 所有嵌套节点展开

#### Scenario: 全部折叠
- **WHEN** 用户点击"全部折叠"按钮
- **THEN** 所有嵌套节点折叠到第一层

### Requirement: 导出文本

工具 SHALL 支持导出 JSON 为文本文件。

#### Scenario: 下载为文本
- **WHEN** 用户点击"导出文本文件"并输入文件名
- **THEN** 浏览器下载 .txt 格式的 JSON 内容

### Requirement: 错误处理

工具 SHALL 显示 JSON 语法错误。

#### Scenario: 显示错误
- **WHEN** 用户输入无效的 JSON
- **THEN** 显示错误提示，包含错误位置和原因
- **THEN** 编辑器继续显示原始内容，不尝试渲染

### Requirement: 链接识别

工具 SHALL 识别并使 URL 可点击。

#### Scenario: 检测 URL
- **WHEN** JSON 字符串值包含有效的 URL
- **THEN** 值显示为可点击的链接
- **THEN** 点击在新标签页打开该 URL
