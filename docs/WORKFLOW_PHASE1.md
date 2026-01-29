# QHelper 阶段 1 实施工作流计划

**文档版本：** 1.0
**日期：** 2026-01-28
**阶段：** 基础与质量（第 1-4 周）
**状态：** 计划完成

---

## 执行摘要

本工作流计划涵盖 QHelper 阶段 1 的完整实施过程，包括基础设施搭建、Bug 修复、测试框架建立、UX 一致性改进和状态持久化实现。

**时间周期：** 4 周（28 天）
**目标：** 为后续功能开发奠定坚实基础

---

## 阶段 1 任务概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           阶段 1 任务分布                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  第 1 周：基础设施搭建                                                         │
│  ├─ 创建新的目录结构                                                         │
│  ├─ 实现工具注册系统                                                         │
│  ├─ 创建状态管理 Hook                                                       │
│  └─ 实现错误边界组件                                                         │
│                                                                             │
│  第 2 周：Bug 修复                                                           │
│  ├─ 修复 MD5 编码问题                                                       │
│  ├─ 实现 JSON diff 功能                                                     │
│  └─ 为所有工具添加错误边界                                                   │
│                                                                             │
│  第 3 周：测试框架                                                           │
│  ├─ 配置 Vitest + React Testing Library                                    │
│  ├─ 创建 Chrome API Mock                                                  │
│  ├─ 编写 UI 组件测试                                                         │
│  └─ 编写工具冒烟测试                                                         │
│                                                                             │
│  第 4 周：UX 一致性与状态持久化                                              │
│  ├─ 创建标准布局组件                                                         │
│  ├─ 统一输入输出组件                                                         │
│  ├─ 实现工具历史持久化                                                       │
│  └─ 实现最近使用工具功能                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 第 1 周：基础设施搭建

### 任务 1.1：创建新的目录结构

**优先级：** P0 - 关键
**预计时间：** 2 小时
**依赖：** 无

#### 子任务

| ID | 任务 | 文件路径 | 说明 |
|----|------|----------|------|
| 1.1.1 | 创建 lib 子目录 | `lib/registry/` | 工具注册系统 |
| 1.1.2 | 创建 lib 子目录 | `lib/state/` | 状态管理 |
| 1.1.3 | 创建 lib 子目录 | `lib/services/` | 业务服务层 |
| 1.1.4 | 创建 hooks 子目录 | 无（hooks 已存在） | 新增 Hook 文件 |
| 1.1.5 | 创建 components 子目录 | `components/tool/` | 工具通用组件 |
| 1.1.6 | 创建 components 子目录 | `components/common/` | 通用组件 |
| 1.1.7 | 创建 types 目录 | `types/` | 类型定义 |
| 1.1.8 | 创建 constants 目录 | `constants/` | 常量定义 |
| 1.1.9 | 创建 config 目录 | `config/` | 配置文件 |
| 1.1.10 | 创建 tests 目录 | `tests/` | 测试文件 |

#### 验收标准

- [ ] 所有目录已创建
- [ ] 每个目录包含 `.gitkeep` 或初始文件
- [ ] 目录结构与架构设计文档一致

#### 操作步骤

```bash
# 执行这些命令
mkdir -p lib/registry lib/state lib/services
mkdir -p components/tool components/common
mkdir -p types constants config
mkdir -p tests/unit tests/integration tests/mocks
```

---

### 任务 1.2：实现工具注册系统

**优先级：** P0 - 关键
**预计时间：** 4 小时
**依赖：** 任务 1.1

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 1.2.1 | 创建工具元数据类型 | `lib/registry/ToolMetadata.ts` | 定义 ToolMetadata 接口 |
| 1.2.2 | 创建工具注册表 | `lib/registry/ToolRegistry.ts` | ToolRegistry 类 |
| 1.2.3 | 创建工具注册文件 | `lib/registry/tools.ts` | 所有工具的元数据 |
| 1.2.4 | 创建类型导出 | `types/index.ts` | 导出所有类型 |
| 1.2.5 | 创建工具常量 | `constants/tools.ts` | 工具分类常量 |

#### 验收标准

- [ ] ToolMetadata.ts 包含完整的接口定义
- [ ] ToolRegistry 实现单例模式
- [ ] 支持按分类获取工具
- [ ] 支持关键词搜索工具
- [ ] tools.ts 包含所有现有工具的元数据
- [ ] 编译无错误

#### 关键文件结构

```typescript
// lib/registry/ToolMetadata.ts
export enum ToolCategory {
  COMMON = 'common',
  ENCODING = 'encoding',
  IMAGE = 'image',
  SECURITY = 'security',
  WEB_FORMAT = 'web_format',
  DATA_FORMAT = 'data_format',
  AI = 'ai',
  OTHER = 'other',
}

export interface ToolMetadata {
  id: string;
  name: string;
  nameEn: string;
  category: ToolCategory;
  icon: string;
  description: string;
  keywords: string[];
  tags: string[];
  entry: string;
  version: string;
  features: string[];
  status: 'stable' | 'beta' | 'experimental';
}

// lib/registry/ToolRegistry.ts
export class ToolRegistry {
  private static instance: ToolRegistry;
  register(tool: ToolMetadata): void;
  get(id: string): ToolMetadata | undefined;
  getAll(): ToolMetadata[];
  getByCategory(category: ToolCategory): ToolMetadata[];
  search(query: string): ToolMetadata[];
}

export const toolRegistry = ToolRegistry.getInstance();
```

---

### 任务 1.3：创建状态管理 Hook

**优先级：** P0 - 关键
**预计时间：** 3 小时
**依赖：** 任务 1.1

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 1.3.1 | 创建工具状态 Hook | `hooks/useToolState.ts` | 自动持久化的状态管理 |
| 1.3.2 | 创建工具历史 Hook | `hooks/useToolHistory.ts` | 历史记录管理 |
| 1.3.3 | 创建全局设置 Hook | `hooks/useGlobalSettings.ts` | 全局设置管理 |

#### 验收标准

- [ ] useToolState 支持自动持久化
- [ ] useToolState 支持跨标签页同步
- [ ] useToolHistory 支持添加/清除历史
- [ ] useToolHistory 支持限制历史条目数
- [ ] useGlobalSettings 管理全局配置
- [ ] 所有 Hook 有完整的 TypeScript 类型

#### 关键文件结构

```typescript
// hooks/useToolState.ts
export function useToolState<T>(
  toolId: string,
  key: string,
  defaultValue: T
): {
  value: T;
  setValue: (value: T) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

// hooks/useToolHistory.ts
export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: unknown;
  output: unknown;
}

export function useToolHistory(toolId: string, maxSize?: number) {
  return {
    histories: HistoryEntry[],
    addHistory: (input, output) => Promise<void>,
    clearHistories: () => Promise<void>,
  };
}
```

---

### 任务 1.4：实现错误边界组件

**优先级：** P0 - 关键
**预计时间：** 2 小时
**依赖：** 任务 1.1

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 1.4.1 | 创建错误边界组件 | `components/tool/ToolErrorBoundary.tsx` | React 错误边界 |
| 1.4.2 | 创建错误显示组件 | `components/common/ErrorDisplay.tsx` | 友好的错误 UI |
| 1.4.3 | 创建加载状态组件 | `components/common/LoadingSpinner.tsx` | 加载指示器 |

#### 验收标准

- [ ] ToolErrorBoundary 捕获组件错误
- [ ] 显示友好的错误 UI
- [ ] 提供重试按钮
- [ ] 错误日志记录到 chrome.storage
- [ ] 加载状态组件支持不同大小

#### 关键文件结构

```typescript
// components/tool/ToolErrorBoundary.tsx
export class ToolErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error): State;
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
  handleRetry(): void;
  render(): ReactNode;
}

// 使用方式
<ToolErrorBoundary toolId="json">
  <JsonTool />
</ToolErrorBoundary>
```

---

### 任务 1.5：创建标准布局组件

**优先级：** P1 - 高
**预计时间：** 2 小时
**依赖：** 任务 1.1

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 1.5.1 | 创建标准布局组件 | `components/tool/ToolLayout.tsx` | 统一的工具页面布局 |
| 1.5.2 | 创建输入输出组件 | `components/tool/InputOutput.tsx` | 标准输入输出区域 |
| 1.5.3 | 创建操作按钮组件 | `components/tool/ToolActions.tsx` | 操作按钮组 |
| 1.5.4 | 创建历史面板组件 | `components/tool/ToolHistory.tsx` | 历史记录显示 |

#### 验收标准

- [ ] ToolLayout 提供一致的工具页面结构
- [ ] 支持标题、描述、图标
- [ ] InputOutput 支持复制、下载
- [ ] ToolActions 支持自定义操作按钮
- [ ] ToolHistory 支持历史记录显示和恢复

#### 关键文件结构

```typescript
// components/tool/ToolLayout.tsx
export function ToolLayout({
  title,
  description,
  icon,
  children,
  actions,
  footer,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 标题区域 */}
      {/* 操作按钮 */}
      {/* 主内容 */}
      {/* 页脚 */}
    </div>
  );
}
```

---

## 第 2 周：Bug 修复

### 任务 2.1：修复 MD5 编码问题

**优先级：** P0 - 关键
**预计时间：** 2 小时
**依赖：** 无

#### 问题分析

当前代码使用 `crypto.subtle.digest('MD5', data)`，但 Web Crypto API 不支持 MD5。

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 2.1.1 | 安装 crypto-js | `package.json` | 添加依赖 |
| 2.1.2 | 创建哈希服务 | `lib/services/HashService.ts` | 哈希函数封装 |
| 2.1.3 | 修复 MD5 实现 | `entrypoints/convert/index.tsx` | 替换损坏的实现 |
| 2.1.4 | 测试 MD5 功能 | 手动测试 | 验证修复效果 |

#### 实施步骤

```bash
# 安装依赖
pnpm add crypto-js
pnpm add -D @types/crypto-js
```

```typescript
// lib/services/HashService.ts
import CryptoJS from 'crypto-js';

export class HashService {
  static md5(text: string): string {
    return CryptoJS.MD5(text).toString();
  }

  static sha1(text: string): string {
    return CryptoJS.SHA1(text).toString();
  }

  static sha256(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }
}

// entrypoints/convert/index.tsx
import { HashService } from '@/lib/services/HashService';

// 使用
const hash = HashService.md5(inputText);
```

#### 验收标准

- [ ] MD5 编码功能正常工作
- [ ] 其他哈希算法不受影响
- [ ] 编译无错误
- [ ] 手动测试通过

---

### 任务 2.2：实现 JSON diff 功能

**优先级：** P0 - 关键
**预计时间：** 4 小时
**依赖：** 任务 1.5

#### 问题分析

当前 `diffTwo()` 函数只是一个 alert 提示，需要实现完整的 diff 功能。

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 2.2.1 | 安装 diff 库 | `package.json` | 添加依赖 |
| 2.2.2 | 创建 Diff 组件 | `components/tool/DiffViewer.tsx` | Diff 视觉展示组件 |
| 2.2.3 | 实现 diff 逻辑 | `entrypoints/json/index.tsx` | 实现完整的 diff 功能 |
| 2.2.4 | 添加 diff 测试 | 手动测试 | 验证功能 |

#### 实施步骤

```bash
# 安装依赖
pnpm add diff diff2html
pnpm add -D @types/diff
```

```typescript
// components/tool/DiffViewer.tsx
export function DiffViewer({
  oldText,
  newText,
}: DiffViewerProps) {
  const diff = diffLines(oldText, newText);
  return (
    <div dangerouslySetInnerHTML={{ __html: diff2html() }} />
  );
}

// entrypoints/json/index.tsx
import { DiffViewer } from '@/components/tool/DiffViewer';

function diffTwo() {
  setDiffMode(true);
}
```

#### 验收标准

- [ ] 支持双输入模式
- [ ] 显示行级别的 diff
- [ ] 高亮显示变更部分
- [ ] 支持复制结果
- [ ] 手动测试通过

---

### 任务 2.3：为所有工具添加错误边界

**优先级：** P1 - 高
**预计时间：** 2 小时
**依赖：** 任务 1.4

#### 子任务

| ID | 任务 | 工具 | 说明 |
|----|------|------|------|
| 2.3.1 | 包装 JSON 工具 | `entrypoints/json/index.tsx` | 添加错误边界 |
| 2.3.2 | 包装时间戳工具 | `entrypoints/timestamp/index.tsx` | 添加错误边界 |
| 2.3.3 | 包装其他工具 | 所有工具 | 批量添加 |
| 2.3.4 | 测试错误处理 | 手动测试 | 验证错误显示 |

#### 实施步骤

```typescript
// 统一的包装模式
import { ToolErrorBoundary } from '@/components/tool/ToolErrorBoundary';

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="json">
      <JsonTool />
    </ToolErrorBoundary>
  );
}
```

#### 验收标准

- [ ] 所有工具都包装在错误边界中
- [ ] 错误时显示友好 UI
- [ ] 提供重试选项
- [ ] 测试错误日志记录

---

## 第 3 周：测试框架

### 任务 3.1：配置 Vitest + React Testing Library

**优先级：** P0 - 关键
**预计时间：** 2 小时
**依赖：** 无

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 3.1.1 | 安装测试依赖 | `package.json` | 添加测试库 |
| 3.1.2 | 创建 Vitest 配置 | `vitest.config.ts` | 测试配置 |
| 3.1.3 | 创建测试设置 | `tests/setup/vitest-setup.ts` | 全局测试设置 |
| 3.1.4 | 创建 Chrome Mock | `tests/mocks/chrome.mock.ts` | Chrome API Mock |
| 3.1.5 | 添加测试脚本 | `package.json` | npm scripts |

#### 实施步骤

```bash
# 安装依赖
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup/vitest-setup.ts',
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/', 'tests/', 'entrypoints/'],
    },
  },
});

// package.json scripts
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

#### 验收标准

- [ ] Vitest 配置完成
- [ ] 运行 `pnpm test` 无错误
- [ ] Chrome Mock 正常工作
- [ ] 测试 UI 可访问

---

### 任务 3.2：编写 UI 组件测试

**优先级：** P1 - 高
**预计时间：** 3 小时
**依赖：** 任务 3.1

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 3.2.1 | Button 组件测试 | `tests/unit/components/Button.test.tsx` | 测试按钮变体和大小 |
| 3.2.2 | Input 组件测试 | `tests/unit/components/Input.test.tsx` | 测试输入组件 |
| 3.2.3 | Card 组件测试 | `tests/unit/components/Card.test.tsx` | 测试卡片组件 |
| 3.2.4 | ToolErrorBoundary 测试 | `tests/unit/components/ToolErrorBoundary.test.tsx` | 测试错误边界 |

#### 验收标准

- [ ] 所有 UI 组件有测试
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过

---

### 任务 3.3：编写工具冒烟测试

**优先级：** P1 - 高
**预计时间：** 2 小时
**依赖：** 任务 3.1

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 3.3.1 | JSON 工具测试 | `tests/unit/tools/json.test.tsx` | 基本功能测试 |
| 3.3.2 | 时间戳工具测试 | `tests/unit/tools/timestamp.test.tsx` | 基本功能测试 |
| 3.3.3 | convert 工具测试 | `tests/unit/tools/convert.test.tsx` | 基本功能测试 |

#### 验收标准

- [ ] 每个工具有基本测试
- [ ] 测试主要功能路径
- [ ] 所有测试通过

---

## 第 4 周：UX 一致性与状态持久化

### 任务 4.1：实现工具历史持久化

**优先级：** P0 - 关键
**预计时间：** 3 小时
**依赖：** 任务 1.3

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 4.1.1 | 迁移 JSON 工具 | `entrypoints/json/index.tsx` | 添加历史功能 |
| 4.1.2 | 创建历史面板 | `components/tool/ToolHistory.tsx` | 历史记录显示组件 |
| 4.1.3 | 添加历史按钮 | 工具页面 | 触发历史显示 |
| 4.1.4 | 测试历史功能 | 手动测试 | 验证持久化 |

#### 实施步骤

```typescript
// 使用 useToolHistory
import { useToolHistory } from '@/hooks/useToolHistory';

function JsonTool() {
  const { histories, addHistory, clearHistories } = useToolHistory('json');

  const handleFormat = (input: string) => {
    const output = JSON.stringify(JSON.parse(input), null, 2);
    addHistory({ input, output });
    return output;
  };

  return (
    <>
      {/* 工具界面 */}
      <ToolHistory
        histories={histories}
        onSelect={(item) => restoreFromHistory(item)}
        onClear={clearHistories}
      />
    </>
  );
}
```

#### 验收标准

- [ ] JSON 工具支持历史记录
- [ ] 历史持久化到 chrome.storage
- [ ] 可以从历史恢复
- [ ] 可以清除历史
- [ ] 最多保存 50 条记录

---

### 任务 4.2：实现最近使用工具功能

**优先级：** P1 - 高
**预计时间：** 2 小时
**依赖：** 任务 1.3

#### 子任务

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| 4.2.1 | 创建最近使用 Hook | `hooks/useRecentTools.ts` | 最近使用管理 |
| 4.2.2 | 更新弹窗显示 | `entrypoints/popup/index.tsx` | 显示最近使用 |
| 4.2.3 | 记录工具使用 | Background Service Worker | 统计使用次数 |

#### 实施步骤

```typescript
// hooks/useRecentTools.ts
export function useRecentTools(maxItems = 5) {
  const storageKey = 'recentTools';
  const { value: recentTools, setValue } = useExtensionStorage<string[]>(storageKey, []);

  const addRecentTool = async (toolId: string) => {
    const updated = [toolId, ...recentTools.filter(id => id !== toolId)].slice(0, maxItems);
    await setValue(updated);
  };

  return { recentTools, addRecentTool };
}

// entrypoints/popup/index.tsx
const { recentTools } = useRecentTools();

// 显示最近使用
{recentTools.map(toolId => (
  <ToolButton key={toolId} toolId={toolId} />
))}
```

#### 验收标准

- [ ] 弹窗显示最近使用的工具
- [ ] 点击工具后更新最近使用列表
- [ ] 最多显示 5 个工具
- [ ] 跨标签页同步

---

### 任务 4.3：统一 UX 模式

**优先级：** P1 - 高
**预计时间：** 4 小时
**依赖：** 任务 1.5

#### 子任务

| ID | 任务 | 说明 |
|----|------|------|
| 4.3.1 | 统一布局模式 | 所有工具使用 ToolLayout |
| 4.3.2 | 统一输入模式 | 使用标准 Input/Textarea 组件 |
| 4.3.3 | 统一操作按钮 | 按钮位置在右下角 |
| 4.3.4 | 统一错误显示 | 使用统一的错误样式 |
| 4.3.5 | 统一加载状态 | 使用 LoadingSpinner |

#### 实施步骤

```typescript
// 统一的工具模板
import { ToolLayout } from '@/components/tool/ToolLayout';
import { InputOutput } from '@/components/tool/InputOutput';
import { ToolActions } from '@/components/tool/ToolActions';

function ToolTemplate() {
  return (
    <ToolLayout
      title="工具名称"
      description="工具描述"
      icon={ToolIcon}
    >
      <InputOutput
        inputValue={input}
        outputValue={output}
        onInputChange={setInput}
      />
      <ToolActions>
        <Button onClick={handleAction}>执行</Button>
      </ToolActions>
    </ToolLayout>
  );
}
```

#### 验收标准

- [ ] 所有工具使用统一布局
- [ ] 按钮位置一致
- [ ] 错误显示一致
- [ ] 加载状态一致

---

## 阶段 1 检查点

### 每日检查

| 时间 | 检查项 | 负责人 |
|------|--------|--------|
| 每日结束 | 代码编译通过 | 开发者 |
| 每日结束 | 测试通过 | 开发者 |
| 每日结束 | 提交代码 | 开发者 |

### 每周检查

| 时间 | 检查项 | 验收标准 |
|------|--------|----------|
| 第 1 周结束 | 基础设施完成 | 目录结构、工具注册、状态管理、错误边界 |
| 第 2 周结束 | Bug 修复完成 | MD5、diff 功能正常，所有工具有错误边界 |
| 第 3 周结束 | 测试框架完成 | Vitest 配置完成，组件有测试 |
| 第 4 周结束 | UX 一致性完成 | 统一布局、状态持久化、最近使用 |

### 阶段 1 最终验收

#### 功能验收

| ID | 验收项 | 标准 |
|----|--------|------|
| FR-1.1.1 | MD5 修复 | MD5 编码正常工作 |
| FR-1.1.2 | JSON diff | 支持 diff 功能，视觉对比 |
| FR-1.1.3 | 错误边界 | 所有工具有错误边界 |
| FR-1.2.1 | 测试基础设施 | Vitest 配置完成 |
| FR-1.2.2 | 组件测试 | 核心组件有测试 |
| FR-1.2.3 | 工具测试 | 每个工具有冒烟测试 |
| FR-1.2.4 | 测试覆盖率 | 关键路径 >70% |
| FR-1.3.1 | 布局模式 | 统一卡片布局 |
| FR-1.3.2 | 输入模式 | 标准化组件 |
| FR-1.3.3 | 操作按钮 | 一致位置和标签 |
| FR-1.3.4 | 错误处理 | 统一错误显示 |
| FR-1.3.5 | 加载状态 | 加载指示器 |
| FR-1.4.1 | 工具历史 | JSON 工具历史持久化 |
| FR-1.4.2 | 用户偏好 | 工具偏好保存 |
| FR-1.4.3 | 最近使用 | 弹窗显示最近工具 |

#### 质量验收

| ID | 验收项 | 标准 |
|----|--------|------|
| Q-1 | TypeScript 覆盖 | 100% |
| Q-2 | Biome 检查 | 无警告 |
| Q-3 | 测试通过率 | 100% |
| Q-4 | 构建成功 | `pnpm build` 成功 |

---

## 依赖关系图

```
任务 1.1 (创建目录)
    │
    ├──> 任务 1.2 (工具注册系统)
    │
    ├──> 任务 1.3 (状态管理 Hook)
    │     │
    │     ├──> 任务 4.1 (历史持久化)
    │     │
    │     └──> 任务 4.2 (最近使用)
    │
    ├──> 任务 1.4 (错误边界)
    │     │
    │     ├──> 任务 2.3 (添加错误边界)
    │     │
    │     └──> 任务 1.5 (布局组件)
    │
    └──> 任务 1.5 (布局组件)
          │
          └──> 任务 4.3 (统一 UX)

任务 2.1 (修复 MD5)
任务 2.2 (JSON diff)

任务 3.1 (测试框架)
    │
    ├──> 任务 3.2 (组件测试)
    │
    └──> 任务 3.3 (工具测试)
```

---

## 风险管理

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 依赖安装失败 | 中 | 低 | 使用备用依赖或手动实现 |
| diff 库不兼容 | 中 | 低 | 提前验证兼容性，准备替代方案 |
| 测试框架配置问题 | 低 | 低 | 参考 WXT 官方文档，使用推荐配置 |
| 现有工具迁移困难 | 中 | 中 | 逐个迁移，保持向后兼容 |

---

## 时间线摘要

```
第 1 周 (Day 1-7):  基础设施搭建
  Day 1-2: 目录结构 + 工具注册系统
  Day 3-4: 状态管理 Hook
  Day 5-6: 错误边界组件
  Day 7:   布局组件

第 2 周 (Day 8-14): Bug 修复
  Day 8-9:   MD5 修复
  Day 10-12: JSON diff
  Day 13-14: 添加错误边界

第 3 周 (Day 15-21): 测试框架
  Day 15-16: 配置 Vitest
  Day 17-18: UI 组件测试
  Day 19-20: 工具冒烟测试
  Day 21:    测试覆盖率验证

第 4 周 (Day 22-28): UX 一致性
  Day 22-23: 历史持久化
  Day 24-25: 最近使用
  Day 26-27: 统一 UX
  Day 28:    最终验收
```

---

## 下一步

完成阶段 1 后，继续：

1. **阶段 2：安全与加密工具** (第 5-8 周)
   - JWT 解码器
   - 哈希生成器
   - 二维码工具
   - UUID/GUID 工具
   - 密码生成器

2. **阶段 3：Web 格式工具** (第 9-12 周)

3. **阶段 4：数据格式工具** (第 13-16 周)

4. **阶段 5：AI 集成** (第 17-20 周)

5. **阶段 6：开发体验** (第 21-24 周)

---

**文档状态：** 计划完成，准备实施

**下一步：** 使用 `/sc:implement` 开始执行任务，或手动开始实施
