# GitHub Content Script Spec

## ADDED Requirements

### Requirement: GitHub 页面检测

脚本 SHALL 只在 GitHub 仓库页面注入。

#### Scenario: 检测仓库页面
- **WHEN** 用户访问 GitHub 仓库页面（如 github.com/owner/repo）
- **THEN** 脚本注入并查找插入位置

#### Scenario: 忽略非仓库页面
- **WHEN** 用户访问 GitHub 非仓库页面
- **THEN** 脚本不注入按钮

### Requirement: vscode.dev 按钮注入

脚本 SHALL 在 GitHub 页面注入 vscode.dev 按钮。

#### Scenario: 注入按钮
- **WHEN** 用户访问 GitHub 仓库页面
- **THEN** 在页面头部注入 "vscode.dev" 按钮
- **THEN** 按钮样式为绿色背景、白色文字

### Requirement: 按钮链接生成

脚本 SHALL 生成正确的 vscode.dev 链接。

#### Scenario: 生成链接
- **WHEN** 仓库 URL 为 github.com/owner/repo
- **THEN** 按钮链接为 vscode.dev/github/owner/repo

#### Scenario: 新标签页打开
- **WHEN** 用户点击 vscode.dev 按钮
- **THEN** vscode.dev 在新标签页打开

### Requirement: 按钮位置

脚本 SHALL 在合适的位置插入按钮。

#### Scenario: 查找插入点
- **WHEN** 页面加载完成
- **THEN** 脚本查找页面头部导航区域
- **THEN** 按钮插入在现有按钮旁边

#### Scenario: 响应布局变化
- **WHEN** 页面布局变化
- **THEN** 按钮保持正确位置
