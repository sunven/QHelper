# GitHub Content Script Spec

## ADDED Requirements

### Requirement: GitHub 仓库首页检测

脚本 SHALL 只在 GitHub 仓库首页显示按钮逻辑。

#### Scenario: 检测仓库首页
- **WHEN** 用户访问 GitHub 仓库首页（如 github.com/owner/repo）
- **THEN** 脚本注入并查找插入位置

#### Scenario: 忽略非仓库页面
- **WHEN** 用户访问 GitHub 非仓库页面
- **THEN** 脚本不注入按钮

### Requirement: Zread 按钮注入

脚本 SHALL 只在 GitHub 仓库首页注入 Zread 按钮。

#### Scenario: 注入按钮
- **WHEN** 用户访问 GitHub 仓库首页
- **THEN** 在仓库头部注入 "Zread" 按钮
- **THEN** 如果 Watch / Fork / Star 区域可用，按钮优先插入在该区域附近

#### Scenario: 忽略仓库子页面
- **WHEN** 用户访问 GitHub 仓库子页面（如 issues、pulls、blob、tree）
- **THEN** 脚本不注入按钮

### Requirement: 按钮链接生成

脚本 SHALL 生成正确的 Zread 链接。

#### Scenario: 生成链接
- **WHEN** 仓库 URL 为 github.com/owner/repo
- **THEN** 按钮链接为 https://zread.ai/owner/repo

#### Scenario: 新标签页打开
- **WHEN** 用户点击 "Zread" 按钮
- **THEN** Zread 页面在新标签页打开

### Requirement: 按钮位置

脚本 SHALL 在合适的位置插入按钮。

#### Scenario: 查找插入点
- **WHEN** 页面加载完成
- **THEN** 脚本查找页面头部导航区域
- **THEN** 按钮插入在现有操作按钮旁边或仓库头部的明显位置

#### Scenario: 响应布局变化
- **WHEN** 页面布局变化
- **THEN** 按钮保持在仓库头部的可见位置
