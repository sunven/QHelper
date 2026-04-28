---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets']
lastStep: 'step-02-identify-targets'
lastSaved: '2026-04-28'
inputDocuments:
  - '.claude/skills/bmad-tea/resources/knowledge/test-levels-framework.md'
  - '.claude/skills/bmad-tea/resources/knowledge/test-priorities-matrix.md'
  - '.claude/skills/bmad-tea/resources/knowledge/test-quality.md'
---

# QHelper 测试自动化覆盖计划

## 项目概况

- **技术栈**: Frontend (React 19 + Chrome Extension Manifest V3)
- **工具数量**: 25 个独立工具页面
- **现有 E2E 测试**: 4 spec 文件, ~27 用例 (仅冒烟 + JSON 基础)
- **现有单元测试**: 7 个 lib/ 测试文件
- **测试策略**: E2E 优先 (逻辑嵌入在 React 组件中)

## 风险评估

关键发现: **所有工具的业务逻辑直接嵌入 React 组件内部函数中**, 未提取为独立的纯函数。这意味着:
- 单元测试不适用于工具逻辑 (需要 DOM + React 环境)
- E2E 测试是最有效的覆盖手段
- 如需提取纯函数做单元测试, 需先重构

## 优先级分组

### P1 - 高优先级 (复杂度高, 使用频繁)

| 工具 | 行数 | 功能 | 理由 |
|------|------|------|------|
| json | 670 | JSON 格式化/压缩/diff | 最复杂, 670 行, 多种模式 |
| convert | 337 | 10 种编解码类型 | 编码逻辑密集, 错误处理多 |
| popup | 469 | 扩展入口, 导航 | 所有用例的起点 |
| jsonschema | 334 | JSON Schema 验证 | 验证正确性要求高 |
| cron | 278 | Cron 表达式解析 | 解析逻辑复杂 |
| password | 280 | 密码生成 | 安全相关 |

### P2 - 中优先级 (中等复杂度)

| 工具 | 行数 | 功能 | 理由 |
|------|------|------|------|
| timestamp | 171 | 时间戳转换 | 已有基础测试, 需扩展 |
| trans-radix | 192 | 进制转换 | 转换逻辑有边界情况 |
| csv2json | 250 | CSV 转 JSON | 数据转换准确性 |
| yaml | 225 | YAML ↔ JSON | 格式转换 |
| toml | 260 | TOML ↔ JSON | 格式转换 |
| xmlformatter | 265 | XML 格式化 | 格式化 + 验证 |
| markdown | 242 | Markdown 编辑器 | 实时预览 |
| htmlformat | 256 | HTML 格式化 | 格式化逻辑 |
| csstool | 223 | CSS 工具 | 美化/压缩 |
| scss | 222 | SCSS 编译 | 编译正确性 |
| svgoptimizer | 267 | SVG 优化 | 优化逻辑 |
| codebeautify | 159 | 代码美化 | 格式化 |
| uglify | 153 | JS 压缩 | 压缩逻辑 |

### P3 - 低优先级 (简单/专用)

| 工具 | 行数 | 功能 | 理由 |
|------|------|------|------|
| colorTransform | 155 | RGB ↔ HEX | 简单转换 |
| uuid | 196 | UUID 生成 | 输出生成, 逻辑简单 |
| urlparser | 188 | URL 解析 | 标准解析 |
| imagebase64 | 182 | 图片转 Base64 | 文件操作 |
| pictureSplicing | 343 | 图片拼接 | Canvas 操作, E2E 难测 |

## 测试级别选择

| 测试级别 | 适用范围 | 策略 |
|---------|---------|------|
| **E2E (Playwright)** | 所有 25 个工具的功能测试 | 主要手段 |
| **单元测试 (Vitest)** | lib/ 工具函数 | 已有 7 个, 补充未覆盖的 |
| **组件测试 (Testing Library)** | 共享组件 (CopyButton, FileUpload 等) | 如时间允许 |

## 每个工具的 E2E 测试场景

### 通用模式 (适用于所有工具)
- 页面正确加载, 关键元素可见
- 输入有效数据, 验证正确输出
- 输入无效数据, 验证错误提示
- 复制功能正常工作 (如有)

### 特定场景
- **json**: 格式化, 压缩, diff 对比, 大文件处理
- **convert**: 每种编码类型 (HTML, Unicode, URL, Base64, MD5, HTML2JS)
- **timestamp**: 时间戳→日期, 日期→时间戳, 实时时间显示
- **trans-radix**: 各种进制互转, 自定义进制, 无效输入
- **colorTransform**: RGB→HEX, HEX→RGB, 颜色选择器
- **cron**: 表达式解析, 运行时间计算
- **password**: 密码生成, 长度/字符类型配置

## 执行顺序

1. **阶段 1**: 补全 P1 工具的 E2E 功能测试 (6 个工具)
2. **阶段 2**: 补全 P2 工具的 E2E 功能测试 (13 个工具)
3. **阶段 3**: 补全 P3 工具的 E2E 功能测试 (5 个工具)
4. **阶段 4**: 补充 lib/ 单元测试
5. **阶段 5**: 补充 tool-pages.spec.ts 中缺失的 uglify, scss 冒烟测试
