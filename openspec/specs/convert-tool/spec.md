# Convert Tool Spec

## ADDED Requirements

### Requirement: 字符串编解码

工具 SHALL 支持多种字符串编码和解码格式。

#### Scenario: HTML 转义
- **WHEN** 用户输入文本并点击"HTML转义"按钮
- **THEN** 结果区域显示转义后的 HTML（< → &lt;，> → &gt; 等）

#### Scenario: HTML 反转义
- **WHEN** 用户输入转义的 HTML 并点击"HTML反转义"按钮
- **THEN** 结果区域显示原始 HTML

#### Scenario: Unicode 编码
- **WHEN** 用户输入文本并点击"Unicode编码"按钮
- **THEN** 结果区域显示 Unicode 编码格式

#### Scenario: Unicode 解码
- **WHEN** 用户输入 Unicode 编码并点击"Unicode解码"按钮
- **THEN** 结果区域显示解码后的文本

#### Scenario: UTF8(URL) 编码
- **WHEN** 用户输入文本并点击"UTF8(URL)编码"按钮
- **THEN** 结果区域显示 URL 编码格式

#### Scenario: UTF8(URL) 解码
- **WHEN** 用户输入 URL 编码文本并点击"UTF8(URL)解码"按钮
- **THEN** 结果区域显示解码后的文本

#### Scenario: Base64 编码
- **WHEN** 用户输入文本并点击"base64编码"按钮
- **THEN** 结果区域显示 Base64 编码结果

#### Scenario: Base64 解码
- **WHEN** 用户输入 Base64 并点击"base64解码"按钮
- **THEN** 结果区域显示解码后的文本

#### Scenario: MD5 编码
- **WHEN** 用户输入文本并点击"md5编码"按钮
- **THEN** 结果区域显示 MD5 哈希值
- **THEN** 使用浏览器原生 Web Crypto API 计算

#### Scenario: html2js 转换
- **WHEN** 用户输入 HTML 并点击"html2js"按钮
- **THEN** 结果区域显示转换为 JS 字符串格式
