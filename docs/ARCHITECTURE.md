# QHelper 系统架构设计

**文档版本：** 1.0
**日期：** 2026-01-28
**状态：** 设计阶段

---

## 1. 架构概览

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              QHelper 浏览器扩展                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌─────────────────────────────────────────────────┐   │
│  │   用户界面   │     │                    工具层                        │   │
│  ├──────────────┤     ├─────────────────────────────────────────────────┤   │
│  │              │     │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  Popup 弹窗  │────▶│  │ JSON    │ │ 时间戳  │ │ Base64  │  ...      │   │
│  │  - 工具列表  │     │  │ 工具    │ │ 工具    │ │ 工具    │            │   │
│  │  - 搜索     │     │  └─────────┘ └─────────┘ └─────────┘            │   │
│  │  - 收藏夹   │     │                                                         │
│  │              │     │  每个工具独立运行在新标签页                               │
│  └──────────────┘     └─────────────────────────────────────────────────┘   │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          应用层 (Application Layer)                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ 工具注册系统 │  │  状态管理    │  │  错误处理    │              │   │
│  │  │ ToolRegistry │  │StateManager  │  │ErrorBoundary │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  历史管理   │  │  AI 集成     │  │  主题系统    │              │   │
│  │  │HistoryManager│  │  AIService   │  │  ThemeProvider│             │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          服务层 (Service Layer)                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │StorageService│  │CryptoService │  │  AIService   │              │   │
│  │  │(chrome.storage)│ │ (crypto-js)  │  │ (OpenAI/etc) │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐                                │   │
│  │  │ClipboardSvc  │  │  FormatterSvc │                                │   │
│  │  └──────────────┘  └──────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Chrome API 抽象层                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │  Tabs    │  │ Cookies  │  │ Storage  │  │ Runtime  │           │   │
│  │  │  API     │  │   API    │  │   API    │  │   API    │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Background Service Worker                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  - 消息总线                                                         │   │
│  │  - 共享缓存                                                         │   │
│  │  - AI API 代理（隐藏 API 密钥）                                      │   │
│  │  - 定时任务                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **构建框架** | WXT | 浏览器扩展开发框架 |
| **前端框架** | React 19 | UI 框架 |
| **语言** | TypeScript 5.9 | 类型安全 |
| **样式** | Tailwind CSS v4 | 样式系统 |
| **组件库** | Shadcn/UI | UI 组件 |
| **图标** | Lucide React | 图标库 |
| **状态管理** | React Hooks | 本地状态 |
| **存储** | chrome.storage.local | 数据持久化 |
| **测试** | Vitest + React Testing Library | 单元测试 |
| **代码质量** | Biome | Linting & Formatting |

---

## 2. 目录结构设计

```
qhelper/
├── entrypoints/                    # WXT 约定的入口点目录
│   ├── popup/                      # 扩展弹窗
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── ToolList.tsx
│   │       ├── ToolSearch.tsx
│   │       └── ToolCategories.tsx
│   │
│   ├── background.ts               # Service Worker
│   │
│   └── [tool-id]/                  # 工具目录（自动发现）
│       ├── index.html              # 工具 HTML 模板
│       ├── index.tsx               # 工具入口组件
│       ├── metadata.ts             # 工具元数据声明
│       ├── components/             # 工具专用组件
│       │   └── [ToolName]Tool.tsx
│       └── hooks/                  # 工具专用 hooks
│           └── use[ToolName].ts
│
├── lib/                            # 核心库
│   ├── chrome/                     # Chrome API 抽象层
│   │   ├── storage.ts              # Storage API 封装
│   │   ├── cookies.ts              # Cookies API 封装
│   │   ├── tabs.ts                 # Tabs API 封装
│   │   └── runtime.ts              # Runtime API 封装
│   │
│   ├── registry/                   # 工具注册系统
│   │   ├── ToolRegistry.ts         # 注册表核心
│   │   ├── ToolMetadata.ts         # 元数据类型定义
│   │   └── tools.ts                # 工具注册集合
│   │
│   ├── state/                      # 状态管理
│   │   ├── StateManager.ts         # 全局状态管理器
│   │   ├── HistoryManager.ts       # 历史记录管理
│   │   └── PreferencesManager.ts   # 偏好设置管理
│   │
│   ├── services/                   # 业务服务层
│   │   ├── StorageService.ts       # 存储服务
│   │   ├── CryptoService.ts        # 加密服务
│   │   ├── ClipboardService.ts     # 剪贴板服务
│   │   ├── FormatterService.ts     # 格式化服务
│   │   └── AIService.ts            # AI 服务（阶段 5）
│   │
│   ├── ai/                         # AI 模块（阶段 5）
│   │   ├── providers/
│   │   │   ├── OpenAIProvider.ts
│   │   │   ├── AnthropicProvider.ts
│   │   │   └── CustomProvider.ts
│   │   ├── AIClient.ts
│   │   └── prompt-templates.ts
│   │
│   └── utils/                      # 工具函数
│       ├── string.ts               # 字符串工具
│       ├── validation.ts           # 验证工具
│       └── performance.ts          # 性能工具
│
├── hooks/                          # React Hooks
│   ├── useExtensionStorage.ts      # 扩展存储 Hook（已有）
│   ├── useChromeCookies.ts         # Cookie Hook（已有）
│   ├── useToolState.ts             # 工具状态 Hook（新增）
│   ├── useToolHistory.ts           # 工具历史 Hook（新增）
│   ├── useAI.ts                    # AI Hook（阶段 5）
│   └── useDebounce.ts              # 防抖 Hook
│
├── components/                     # 共享组件
│   ├── ui/                         # 基础 UI 组件（shadcn/ui）
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── label.tsx
│   │   └── ...
│   │
│   ├── tool/                       # 工具通用组件
│   │   ├── ToolLayout.tsx          # 标准工具布局
│   │   ├── ToolErrorBoundary.tsx   # 工具错误边界
│   │   ├── ToolInput.tsx           # 标准输入组件
│   │   ├── ToolOutput.tsx          # 标准输出组件
│   │   ├── ToolHistory.tsx         # 历史记录组件
│   │   ├── ToolActions.tsx         # 操作按钮组
│   │   └── ToolLoading.tsx         # 加载状态组件
│   │
│   ├── layout/                     # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   │
│   └── common/                     # 通用组件
│       ├── ErrorDisplay.tsx        # 错误显示
│       ├── LoadingSpinner.tsx      # 加载指示器
│       ├── CopyButton.tsx          # 复制按钮
│       └── StatusBadge.tsx         # 状态标签
│
├── types/                          # TypeScript 类型定义
│   ├── tool.ts                     # 工具类型
│   ├── storage.ts                  # 存储类型
│   ├── ai.ts                       # AI 类型
│   └── index.ts                    # 导出所有类型
│
├── constants/                      # 常量定义
│   ├── tools.ts                    # 工具分类常量
│   ├── storage.ts                  # 存储键名
│   ├── ai.ts                       # AI 相关常量
│   └── ui.ts                       # UI 常量
│
├── config/                         # 配置文件
│   ├── storage.schema.ts           # 存储模式定义
│   ├── tools.config.ts             # 工具配置
│   └── ai.config.ts                # AI 配置
│
├── tests/                          # 测试文件
│   ├── unit/                       # 单元测试
│   ├── integration/                # 集成测试
│   ├── setup/                      # 测试设置
│   │   └── vitest-setup.ts
│   └── mocks/                      # Mock 数据
│       └── chrome.mock.ts
│
├── public/                         # 静态资源
│   └── icons/                      # 图标
│
├── docs/                           # 文档
│   ├── ROADMAP_REQUIREMENTS.md
│   └── ARCHITECTURE.md
│
├── wxt.config.ts                   # WXT 配置
├── package.json
├── tsconfig.json
├── biome.json
└── vitest.config.ts                # Vitest 配置
```

---

## 3. 核心模块设计

### 3.1 工具注册系统 (Tool Registry)

**目标：** 消除硬编码，实现工具自动发现和注册。

#### 3.1.1 元数据类型定义

```typescript
// lib/registry/ToolMetadata.ts

import type { LucideIconName } from 'lucide-react';

/**
 * 工具分类枚举
 */
export enum ToolCategory {
  COMMON = 'common',              // 常用
  ENCODING = 'encoding',          // 编码转换
  IMAGE = 'image',                // 图片工具
  DATA_FORMAT = 'data_format',    // 数据格式
  SECURITY = 'security',          // 安全与加密
  WEB_FORMAT = 'web_format',      // Web 格式
  AI = 'ai',                      // AI 工具
  OTHER = 'other',                // 其他
}

/**
 * 工具元数据接口
 */
export interface ToolMetadata {
  // 基础信息
  id: string;                      // 唯一标识符（如 'json', 'timestamp'）
  name: string;                    // 显示名称（中文）
  nameEn: string;                  // 英文名称（用于搜索）
  category: ToolCategory;          // 分类
  icon: LucideIconName;            // 图标名称（lucide-react）

  // 描述
  description: string;             // 简短描述
  keywords: string[];              // 搜索关键词
  tags: string[];                  // 功能标签

  // 入口点
  entry: string;                   // HTML 入口文件路径（如 'json.html'）
  componentPath?: string;          // 组件路径（可选，用于动态导入）

  // 权限
  permissions?: chrome.permissions.Permissions; // 所需权限

  // 版本
  version: string;                 // 工具版本

  // 功能标志
  features: ToolFeature[];         // 支持的功能列表

  // 状态
  status: ToolStatus;              // 开发状态
}

/**
 * 工具功能标志
 */
export enum ToolFeature {
  // 输入/输出
  SINGLE_INPUT = 'single_input',           // 单输入模式
  DUAL_INPUT = 'dual_input',               // 双输入模式（如 diff）
  FILE_INPUT = 'file_input',               // 文件输入支持
  DRAG_DROP = 'drag_drop',                // 拖放支持

  // 功能
  HISTORY = 'history',                     // 历史记录
  EXPORT = 'export',                       // 导出功能
  IMPORT = 'import',                       // 导入功能
  COPY_RESULT = 'copy_result',             // 复制结果

  // AI 相关（阶段 5）
  AI_ASSIST = 'ai_assist',                 // AI 辅助
  AI_GENERATE = 'ai_generate',             // AI 生成

  // 实时
  REAL_TIME = 'real_time',                 // 实时处理
}

/**
 * 工具状态
 */
export enum ToolStatus {
  STABLE = 'stable',                       // 稳定
  BETA = 'beta',                           // 测试版
  EXPERIMENTAL = 'experimental',           // 实验性
  DEPRECATED = 'deprecated',               // 已弃用
}
```

#### 3.1.2 注册表核心

```typescript
// lib/registry/ToolRegistry.ts

import type { ToolMetadata, ToolCategory } from './ToolMetadata';
import { tools as toolList } from './tools';

/**
 * 工具注册表
 *
 * 负责工具的注册、查询、搜索和分类
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolMetadata> = new Map();
  private categoryIndex: Map<ToolCategory, Set<string>> = new Map();
  private keywordIndex: Map<string, Set<string>> = new Map();

  private constructor() {
    this.initializeIndexes();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * 初始化索引
   */
  private initializeIndexes(): void {
    toolList.forEach(tool => this.register(tool));
  }

  /**
   * 注册工具
   */
  public register(tool: ToolMetadata): void {
    // 注册主索引
    this.tools.set(tool.id, tool);

    // 注册分类索引
    if (!this.categoryIndex.has(tool.category)) {
      this.categoryIndex.set(tool.category, new Set());
    }
    this.categoryIndex.get(tool.category)!.add(tool.id);

    // 注册关键词索引
    tool.keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      if (!this.keywordIndex.has(key)) {
        this.keywordIndex.set(key, new Set());
      }
      this.keywordIndex.get(key)!.add(tool.id);
    });

    // 注册名称索引
    const nameKeys = [
      tool.name.toLowerCase(),
      tool.nameEn.toLowerCase(),
      ...tool.tags,
    ];
    nameKeys.forEach(key => {
      if (!this.keywordIndex.has(key)) {
        this.keywordIndex.set(key, new Set());
      }
      this.keywordIndex.get(key)!.add(tool.id);
    });
  }

  /**
   * 获取工具元数据
   */
  public get(id: string): ToolMetadata | undefined {
    return this.tools.get(id);
  }

  /**
   * 获取所有工具
   */
  public getAll(): ToolMetadata[] {
    return Array.from(this.tools.values());
  }

  /**
   * 按分类获取工具
   */
  public getByCategory(category: ToolCategory): ToolMetadata[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.tools.get(id))
      .filter((tool): tool is ToolMetadata => tool !== undefined);
  }

  /**
   * 搜索工具
   */
  public search(query: string): ToolMetadata[] {
    if (!query.trim()) return this.getAll();

    const lowerQuery = query.toLowerCase();
    const results = new Set<ToolMetadata>();

    // 精确匹配 ID
    if (this.tools.has(lowerQuery)) {
      results.add(this.tools.get(lowerQuery)!);
    }

    // 关键词匹配
    for (const [keyword, toolIds] of this.keywordIndex) {
      if (keyword.includes(lowerQuery)) {
        toolIds.forEach(id => {
          const tool = this.tools.get(id);
          if (tool) results.add(tool);
        });
      }
    }

    return Array.from(results);
  }

  /**
   * 获取分类列表
   */
  public getCategories(): ToolCategory[] {
    return Array.from(this.categoryIndex.keys());
  }
}

/**
 * 导出单例
 */
export const toolRegistry = ToolRegistry.getInstance();
```

#### 3.1.3 工具注册文件

```typescript
// lib/registry/tools.ts

import type { ToolMetadata } from './ToolMetadata';
import { ToolCategory, ToolStatus } from './ToolMetadata';

/**
 * 所有工具的注册列表
 *
 * 新增工具时，在此处添加工具元数据
 */
export const tools: ToolMetadata[] = [
  // ===== 常用工具 =====
  {
    id: 'json',
    name: 'JSON 格式化',
    nameEn: 'JSON Formatter',
    category: ToolCategory.COMMON,
    icon: 'Code',
    description: 'JSON 格式化、压缩、diff 对比',
    keywords: ['json', '格式化', '解析', '格式', 'formatter'],
    tags: ['json', 'format', 'diff'],
    entry: 'json.html',
    version: '1.0.0',
    features: [
      'single_input',
      'history',
      'export',
      'copy_result',
      'dual_input', // for diff
    ],
    status: ToolStatus.STABLE,
  },

  {
    id: 'trans-radix',
    name: '进制转换',
    nameEn: 'Radix Converter',
    category: ToolCategory.COMMON,
    icon: 'Calculator',
    description: '二进制、八进制、十进制、十六进制转换',
    keywords: ['进制', '转换', '二进制', '十六进制', 'radix', 'base'],
    tags: ['convert', 'number', 'base'],
    entry: 'trans-radix.html',
    version: '1.0.0',
    features: ['single_input', 'real_time'],
    status: ToolStatus.STABLE,
  },

  // ===== 编码转换 =====
  {
    id: 'convert',
    name: '字符串编解码',
    nameEn: 'String Encode/Decode',
    category: ToolCategory.ENCODING,
    icon: 'Code',
    description: 'Base64、URL、HTML 实体编解码',
    keywords: ['编码', '解码', 'base64', 'url', 'encode', 'decode'],
    tags: ['encode', 'decode', 'base64', 'url'],
    entry: 'convert.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result'],
    status: ToolStatus.STABLE,
  },

  {
    id: 'codebeautify',
    name: '代码美化',
    nameEn: 'Code Beautify',
    category: ToolCategory.ENCODING,
    icon: 'Wand2',
    description: 'JavaScript/HTML/CSS 代码美化',
    keywords: ['美化', '格式化', '代码', 'beautify', 'format'],
    tags: ['code', 'beautify', 'format'],
    entry: 'codebeautify.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.STABLE,
  },

  {
    id: 'uglify',
    name: '代码压缩',
    nameEn: 'Uglify',
    category: ToolCategory.ENCODING,
    icon: 'Zap',
    description: 'JavaScript 代码压缩混淆',
    keywords: ['压缩', '混淆', 'uglify', 'minify'],
    tags: ['code', 'minify', 'compress'],
    entry: 'uglify.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.STABLE,
  },

  // ===== 图片工具 =====
  {
    id: 'imagebase64',
    name: '图片 Base64',
    nameEn: 'Image to Base64',
    category: ToolCategory.IMAGE,
    icon: 'Image',
    description: '图片转 Base64 编码',
    keywords: ['图片', 'base64', '转换', 'image', 'base64'],
    tags: ['image', 'base64', 'convert'],
    entry: 'imagebase64.html',
    version: '1.0.0',
    features: ['file_input', 'drag_drop', 'copy_result'],
    status: ToolStatus.STABLE,
  },

  {
    id: 'pictureSplicing',
    name: '图片拼接',
    nameEn: 'Image Splicer',
    category: ToolCategory.IMAGE,
    icon: 'ImagePlus',
    description: '多张图片纵向/横向拼接',
    keywords: ['图片', '拼接', '合并', 'image', 'splice', 'merge'],
    tags: ['image', 'splice', 'merge'],
    entry: 'pictureSplicing.html',
    version: '1.0.0',
    features: ['file_input', 'drag_drop', 'export'],
    status: ToolStatus.STABLE,
  },

  // ===== 其他工具 =====
  {
    id: 'timestamp',
    name: '时间戳转换',
    nameEn: 'Timestamp Converter',
    category: ToolCategory.OTHER,
    icon: 'CalendarClock',
    description: 'Unix 时间戳与日期时间互转',
    keywords: ['时间戳', '日期', '转换', 'timestamp', 'date', 'time'],
    tags: ['time', 'timestamp', 'date', 'convert'],
    entry: 'timestamp.html',
    version: '1.0.0',
    features: ['real_time'],
    status: ToolStatus.STABLE,
  },

  {
    id: 'colorTransform',
    name: '颜色转换',
    nameEn: 'Color Converter',
    category: ToolCategory.OTHER,
    icon: 'Palette',
    description: 'RGB、HEX、HSL 颜色格式转换',
    keywords: ['颜色', '转换', 'rgb', 'hex', 'hsl', 'color'],
    tags: ['color', 'convert', 'rgb', 'hex', 'hsl'],
    entry: 'colorTransform.html',
    version: '1.0.0',
    features: ['real_time'],
    status: ToolStatus.STABLE,
  },

  // ===== 阶段 2：安全与加密工具 =====
  {
    id: 'jwt',
    name: 'JWT 解码器',
    nameEn: 'JWT Decoder',
    category: ToolCategory.SECURITY,
    icon: 'Lock',
    description: 'JSON Web Token 解码和验证',
    keywords: ['jwt', 'token', '解码', 'decode', 'auth'],
    tags: ['jwt', 'token', 'auth', 'decode'],
    entry: 'jwt.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result'],
    status: ToolStatus.BETA,
  },

  {
    id: 'hash',
    name: '哈希生成器',
    nameEn: 'Hash Generator',
    category: ToolCategory.SECURITY,
    icon: 'Hash',
    description: 'SHA-1、SHA-256、SHA-512、bcrypt 哈希生成',
    keywords: ['哈希', 'hash', 'sha', 'bcrypt', '加密'],
    tags: ['hash', 'sha', 'bcrypt', 'crypto'],
    entry: 'hash.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result'],
    status: ToolStatus.BETA,
  },

  {
    id: 'qrcode',
    name: '二维码工具',
    nameEn: 'QR Code',
    category: ToolCategory.SECURITY,
    icon: 'QrCode',
    description: '二维码生成和扫描',
    keywords: ['二维码', 'qr', '生成', '扫描'],
    tags: ['qr', 'qrcode', 'barcode'],
    entry: 'qrcode.html',
    version: '1.0.0',
    features: ['single_input', 'file_input', 'export'],
    status: ToolStatus.BETA,
  },

  {
    id: 'uuid',
    name: 'UUID 工具',
    nameEn: 'UUID Generator',
    category: ToolCategory.SECURITY,
    icon: 'Fingerprint',
    description: 'UUID/GUID 生成、验证、格式化',
    keywords: ['uuid', 'guid', '生成', 'id'],
    tags: ['uuid', 'guid', 'id', 'generate'],
    entry: 'uuid.html',
    version: '1.0.0',
    features: ['copy_result', 'history'],
    status: ToolStatus.BETA,
  },

  {
    id: 'password',
    name: '密码生成器',
    nameEn: 'Password Generator',
    category: ToolCategory.SECURITY,
    icon: 'Key',
    description: '安全密码生成',
    keywords: ['密码', '生成', '安全', 'password'],
    tags: ['password', 'generate', 'security'],
    entry: 'password.html',
    version: '1.0.0',
    features: ['copy_result', 'history'],
    status: ToolStatus.BETA,
  },

  // ===== 阶段 3：Web 格式工具 =====
  {
    id: 'markdown',
    name: 'Markdown 编辑器',
    nameEn: 'Markdown Editor',
    category: ToolCategory.WEB_FORMAT,
    icon: 'FileText',
    description: 'Markdown 编辑和预览',
    keywords: ['markdown', 'md', '编辑', '预览'],
    tags: ['markdown', 'md', 'editor'],
    entry: 'markdown.html',
    version: '1.0.0',
    features: ['single_input', 'export', 'history'],
    status: ToolStatus.BETA,
  },

  {
    id: 'html-format',
    name: 'HTML 格式化',
    nameEn: 'HTML Formatter',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Code2',
    description: 'HTML 美化、压缩、格式化',
    keywords: ['html', '格式化', '美化', '压缩'],
    tags: ['html', 'format', 'beautify'],
    entry: 'html-format.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  {
    id: 'css-format',
    name: 'CSS 工具',
    nameEn: 'CSS Tools',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Palette',
    description: 'CSS 格式化、压缩、autoprefixer',
    keywords: ['css', '格式化', '压缩', 'prefix'],
    tags: ['css', 'format', 'minify'],
    entry: 'css-format.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  {
    id: 'scss',
    name: 'SCSS 编译器',
    nameEn: 'SCSS Compiler',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Code',
    description: 'SCSS/SASS 编译为 CSS',
    keywords: ['scss', 'sass', '编译', 'css'],
    tags: ['scss', 'sass', 'compile', 'css'],
    entry: 'scss.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  {
    id: 'svg',
    name: 'SVG 优化器',
    nameEn: 'SVG Optimizer',
    category: ToolCategory.WEB_FORMAT,
    icon: 'Image',
    description: 'SVG 压缩和优化',
    keywords: ['svg', '优化', '压缩'],
    tags: ['svg', 'optimize', 'compress'],
    entry: 'svg.html',
    version: '1.0.0',
    features: ['file_input', 'drag_drop', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  // ===== 阶段 4：数据格式工具 =====
  {
    id: 'cron',
    name: 'Cron 表达式',
    nameEn: 'Cron Expression',
    category: ToolCategory.DATA_FORMAT,
    icon: 'Clock',
    description: 'Cron 表达式解析和生成',
    keywords: ['cron', '表达式', '定时', 'schedule'],
    tags: ['cron', 'schedule', 'expression'],
    entry: 'cron.html',
    version: '1.0.0',
    features: ['single_input', 'ai_generate'],
    status: ToolStatus.BETA,
  },

  {
    id: 'yaml',
    name: 'YAML 转换器',
    nameEn: 'YAML Converter',
    category: ToolCategory.DATA_FORMAT,
    icon: 'FileJson',
    description: 'YAML 与 JSON 互转',
    keywords: ['yaml', 'json', '转换'],
    tags: ['yaml', 'json', 'convert'],
    entry: 'yaml.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  {
    id: 'toml',
    name: 'TOML 解析器',
    nameEn: 'TOML Parser',
    category: ToolCategory.DATA_FORMAT,
    icon: 'FileCode',
    description: 'TOML 解析和转换为 JSON',
    keywords: ['toml', '解析', 'json'],
    tags: ['toml', 'parse', 'json'],
    entry: 'toml.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  {
    id: 'json-schema',
    name: 'JSON Schema',
    nameEn: 'JSON Schema Validator',
    category: ToolCategory.DATA_FORMAT,
    icon: 'CheckCircle',
    description: 'JSON Schema 验证和生成',
    keywords: ['json', 'schema', '验证', 'generate'],
    tags: ['json', 'schema', 'validate'],
    entry: 'json-schema.html',
    version: '1.0.0',
    features: ['single_input', 'ai_generate'],
    status: ToolStatus.BETA,
  },

  {
    id: 'xml',
    name: 'XML 工具',
    nameEn: 'XML Formatter',
    category: ToolCategory.DATA_FORMAT,
    icon: 'FileCode',
    description: 'XML 格式化、压缩、与 JSON 互转',
    keywords: ['xml', '格式化', 'json', '转换'],
    tags: ['xml', 'format', 'json'],
    entry: 'xml.html',
    version: '1.0.0',
    features: ['single_input', 'copy_result', 'export'],
    status: ToolStatus.BETA,
  },

  // ===== 阶段 5：AI 工具 =====
  {
    id: 'ai-regex',
    name: 'AI 正则生成器',
    nameEn: 'AI Regex Generator',
    category: ToolCategory.AI,
    icon: 'Sparkles',
    description: '使用 AI 从自然语言生成正则表达式',
    keywords: ['ai', '正则', 'regex', '生成'],
    tags: ['ai', 'regex', 'generate'],
    entry: 'ai-regex.html',
    version: '1.0.0',
    features: ['single_input', 'ai_generate', 'copy_result', 'history'],
    status: ToolStatus.EXPERIMENTAL,
  },
];
```

---

### 3.2 状态管理架构

**目标：** 统一工具状态管理模式，自动持久化。

#### 3.2.1 工具状态 Hook

```typescript
// hooks/useToolState.ts

import { useState, useEffect, useCallback } from 'react';
import * as storage from '@/lib/chrome/storage';

/**
 * 工具状态 Hook
 *
 * 为工具提供统一的状态管理，自动持久化到 chrome.storage.local
 *
 * @template T - 状态数据类型
 * @param toolId - 工具 ID（用于存储键名前缀）
 * @param key - 状态键名
 * @param defaultValue - 默认值
 * @returns [value, setValue, loading, error]
 */
export function useToolState<T>(
  toolId: string,
  key: string,
  defaultValue: T,
): {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 构造存储键
  const storageKey = `tool.${toolId}.${key}`;

  // 加载初始值
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        const stored = await storage.get<T>(storageKey);
        setValueState(stored ?? defaultValue);
      } catch (err) {
        setError(err as Error);
        console.error(`Failed to load tool state:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [storageKey, defaultValue]);

  // 监听变化
  useEffect(() => {
    const unsubscribe = storage.onChanged((changes, areaName) => {
      if (areaName === 'local' && storageKey in changes) {
        setValueState(changes[storageKey].newValue ?? defaultValue);
      }
    });

    return unsubscribe;
  }, [storageKey, defaultValue]);

  // 更新值
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    try {
      const valueToSet = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(value)
        : newValue;

      setValueState(valueToSet);
      await storage.set(storageKey, valueToSet);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to save tool state:`, err);
      // 重新加载以恢复值
      const stored = await storage.get<T>(storageKey);
      setValueState(stored ?? defaultValue);
    }
  }, [storageKey, value, defaultValue]);

  return { value, setValue, loading, error };
}
```

#### 3.2.2 工具历史 Hook

```typescript
// hooks/useToolHistory.ts

import { useState, useEffect, useCallback } from 'react';
import * as storage from '@/lib/chrome/storage';
import { generateId } from '@/lib/utils';

/**
 * 历史记录条目
 */
export interface HistoryEntry<TInput, TOutput> {
  id: string;
  timestamp: number;
  input: TInput;
  output: TOutput;
  metadata?: Record<string, unknown>;
}

/**
 * 工具历史 Hook
 *
 * @template TInput - 输入类型
 * @template TOutput - 输出类型
 * @param toolId - 工具 ID
 * @param maxSize - 最大历史条目数（默认 50）
 */
export function useToolHistory<TInput, TOutput>(
  toolId: string,
  maxSize: number = 50,
) {
  const [histories, setHistories] = useState<HistoryEntry<TInput, TOutput>[]>([]);
  const [loading, setLoading] = useState(true);

  const storageKey = `histories.${toolId}`;

  // 加载历史
  useEffect(() => {
    const loadHistories = async () => {
      try {
        setLoading(true);
        const stored = await storage.get<HistoryEntry<TInput, TOutput>[]>(storageKey, []);
        setHistories(stored);
      } catch (error) {
        console.error(`Failed to load histories:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadHistories();
  }, [storageKey]);

  // 添加历史记录
  const addHistory = useCallback(async (input: TInput, output: TOutput, metadata?: Record<string, unknown>) => {
    const newEntry: HistoryEntry<TInput, TOutput> = {
      id: generateId(),
      timestamp: Date.now(),
      input,
      output,
      metadata,
    };

    const updatedHistories = [newEntry, ...histories].slice(0, maxSize);
    setHistories(updatedHistories);
    await storage.set(storageKey, updatedHistories);

    return newEntry;
  }, [histories, maxSize, storageKey]);

  // 清除历史
  const clearHistories = useCallback(async () => {
    setHistories([]);
    await storage.set(storageKey, []);
  }, [storageKey]);

  // 删除单条历史
  const removeHistory = useCallback(async (id: string) => {
    const updated = histories.filter(h => h.id !== id);
    setHistories(updated);
    await storage.set(storageKey, updated);
  }, [histories, storageKey]);

  return {
    histories,
    loading,
    addHistory,
    clearHistories,
    removeHistory,
  };
}
```

---

### 3.3 错误处理架构

#### 3.3.1 工具错误边界

```typescript
// components/tool/ToolErrorBoundary.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  toolId: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * 工具错误边界组件
 *
 * 捕获工具组件中的错误，显示友好的错误 UI
 */
export class ToolErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Tool error (${this.props.toolId}):`, error, errorInfo);
    this.setState({ errorInfo });

    // 调用错误回调
    this.props.onError?.(error, errorInfo);

    // 记录到存储（用于分析）
    this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const errorLog = {
        toolId: this.props.toolId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now(),
      };

      const logs = await chrome.storage.local.get('errorLogs');
      const updatedLogs = {
        ...logs,
        errorLogs: [...(logs.errorLogs || []), errorLog].slice(-100), // 保留最近 100 条
      };

      await chrome.storage.local.set(updatedLogs);
    } catch {
      // 忽略记录错误
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2">
              工具出现问题
            </h2>

            <p className="text-muted-foreground mb-4">
              抱歉，{this.props.toolId} 工具遇到了一个错误。
            </p>

            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  查看错误详情
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto max-h-40">
                  <code>{this.state.error.toString()}</code>
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleRetry} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 3.4 标准工具布局组件

```typescript
// components/tool/ToolLayout.tsx

import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ToolLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

/**
 * 标准工具布局组件
 *
 * 为所有工具提供一致的布局结构
 */
export function ToolLayout({
  title,
  description,
  icon: Icon,
  children,
  actions,
  footer,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* 标题区域 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        {actions && (
          <div className="mb-4 flex gap-2">
            {actions}
          </div>
        )}

        {/* 主内容区域 */}
        <Card>
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>

        {/* 页脚区域 */}
        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. AI 集成架构（阶段 5）

### 4.1 AI 服务抽象层

```typescript
// lib/ai/AIClient.ts

/**
 * AI 提供商接口
 */
export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, options?: AIOptions): Promise<string>;
  estimateCost(inputTokens: number, outputTokens: number): number;
}

/**
 * AI 选项
 */
export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * AI 响应
 */
export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/**
 * AI 客户端
 */
export class AIClient {
  private provider: AIProvider;
  private apiKey: string;

  constructor(provider: AIProvider, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  /**
   * 生成补全
   */
  async generateCompletion(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const response = await this.provider.generateCompletion(prompt, options);
    return response;
  }

  /**
   * 估算成本
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    return this.provider.estimateCost(inputTokens, outputTokens);
  }
}
```

### 4.2 OpenAI 提供商实现

```typescript
// lib/ai/providers/OpenAIProvider.ts

import type { AIProvider, AIOptions, AIResponse } from '../AIClient';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCompletion(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o-mini',
        messages: [
          ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      model: data.model,
    };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // GPT-4o-mini 定价（示例）
    const inputCost = (inputTokens / 1000000) * 0.15; // $0.15 per 1M tokens
    const outputCost = (outputTokens / 1000000) * 0.60; // $0.60 per 1M tokens
    return inputCost + outputCost;
  }
}
```

### 4.3 AI Hook

```typescript
// hooks/useAI.ts

import { useState, useCallback } from 'react';
import { AIClient } from '@/lib/ai/AIClient';
import { OpenAIProvider } from '@/lib/ai/providers/OpenAIProvider';
import { AnthropicProvider } from '@/lib/ai/providers/AnthropicProvider';

interface UseAIOptions {
  provider?: 'openai' | 'anthropic' | 'custom';
  model?: string;
}

export function useAI(options: UseAIOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, systemPrompt?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 从存储获取 API 密钥
      const { aiProvider, aiApiKey, aiModel } = await chrome.storage.local.get({
        aiProvider: options.provider || 'openai',
        aiApiKey: '',
        aiModel: options.model,
      });

      if (!aiApiKey) {
        throw new Error('请先在设置中配置 API 密钥');
      }

      // 创建客户端
      let provider;
      switch (aiProvider) {
        case 'openai':
          provider = new OpenAIProvider(aiApiKey);
          break;
        case 'anthropic':
          provider = new AnthropicProvider(aiApiKey);
          break;
        default:
          throw new Error(`不支持的 AI 提供商: ${aiProvider}`);
      }

      const client = new AIClient(provider, aiApiKey);
      const result = await client.generateCompletion(prompt, { systemPrompt, model: aiModel });

      setResponse(result.content);

      // 记录使用统计
      const stats = await chrome.storage.local.get('aiStats');
      const updatedStats = {
        aiStats: {
          ...(stats.aiStats || {}),
          totalTokens: ((stats.aiStats?.totalTokens || 0) + result.inputTokens + result.outputTokens),
          totalRequests: ((stats.aiStats?.totalRequests || 0) + 1),
          totalCost: ((stats.aiStats?.totalCost || 0) + provider.estimateCost(result.inputTokens, result.outputTokens)),
        },
      };
      await chrome.storage.local.set(updatedStats);

      return result.content;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    generate,
    loading,
    error,
    response,
  };
}
```

---

## 5. Background Service Worker 设计

```typescript
// entrypoints/background.ts

import { runtime } from 'wxt/browser';

/**
 * 消息类型
 */
enum MessageType {
  AI_REQUEST = 'AI_REQUEST',
  CACHE_GET = 'CACHE_GET',
  CACHE_SET = 'CACHE_SET',
  STATS_RECORD = 'STATS_RECORD',
}

/**
 * 消息响应
 */
interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * 共享缓存
 */
const cache = new Map<string, { value: unknown; expiry: number }>();

/**
 * 清理过期缓存
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (item.expiry < now) {
      cache.delete(key);
    }
  }
}

/**
 * 处理 AI 请求（隐藏 API 密钥）
 */
async function handleAIRequest(data: { provider: string; model: string; prompt: string }): Promise<MessageResponse> {
  try {
    // 从存储获取 API 密钥
    const { aiApiKey } = await chrome.storage.local.get('aiApiKey');

    if (!aiApiKey) {
      return { success: false, error: 'API 密钥未配置' };
    }

    // 执行 AI 请求
    // ...（AI 调用逻辑）

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 消息监听器
 */
runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, data } = message;

  switch (type) {
    case MessageType.AI_REQUEST:
      handleAIRequest(data).then(sendResponse);
      return true; // 异步响应

    case MessageType.CACHE_GET: {
      const item = cache.get(data.key);
      if (item && item.expiry > Date.now()) {
        sendResponse({ success: true, data: item.value });
      } else {
        sendResponse({ success: false, error: '缓存未找到或已过期' });
      }
      break;
    }

    case MessageType.CACHE_SET:
      cache.set(data.key, {
        value: data.value,
        expiry: Date.now() + (data.ttl || 600000), // 默认 10 分钟
      });
      sendResponse({ success: true });
      break;

    case MessageType.STATS_RECORD:
      // 记录使用统计
      chrome.storage.local.get('stats').then(({ stats = {} }) => {
        const updatedStats = {
          ...stats,
          [data.toolId]: ((stats[data.toolId] || 0) + 1),
        };
        chrome.storage.local.set({ stats: updatedStats });
      });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: '未知消息类型' });
  }
});

/**
 * 定时任务：每 5 分钟清理缓存
 */
setInterval(cleanupCache, 300000);

console.log('QHelper background service worker started');
```

---

## 6. 数据流设计

### 6.1 工具加载流程

```
用户点击扩展图标
       │
       ▼
┌──────────────────┐
│  Popup 弹窗加载  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ToolRegistry     │
│ 初始化           │
│ - 加载工具元数据 │
│ - 构建索引       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 渲染工具列表     │
│ - 按分类分组     │
│ - 显示最近使用   │
│ - 显示搜索框     │
└──────────────────┘
         │
         ▼
   用户点击工具
         │
         ▼
┌──────────────────┐
│ chrome.tabs      │
│ .create()        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 工具页面加载     │
│ - 加载 index.html│
│ - 挂载 React     │
│ - 加载工具状态   │
└──────────────────┘
```

### 6.2 状态持久化流程

```
工具组件调用 useToolState()
         │
         ▼
┌──────────────────┐
│ 从 chrome.storage │
│ 加载初始值       │
└────────┬─────────┘
         │
         ▼
    状态更新
         │
         ▼
┌──────────────────┐
│ 乐观更新 UI      │
│ (立即更新)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 异步保存到       │
│ chrome.storage   │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  成功      失败
    │         │
    │         ▼
    │    回滚到原值
    │         │
    └────┬────┘
         │
         ▼
    监听其他标签页
    的变更事件
         │
         ▼
    同步更新
```

---

## 7. 安全架构

### 7.1 API 密钥加密存储

```typescript
// lib/services/EncryptionService.ts

/**
 * 加密服务
 *
 * 使用 Web Crypto API 加密敏感数据
 */
export class EncryptionService {
  private static algorithm = 'AES-GCM';
  private static keyLength = 256;

  /**
   * 生成加密密钥
   */
  private static async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * 派生密钥（从主密码）
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * 加密数据
   */
  static async encrypt(data: string, password: string): Promise<{ encrypted: string; salt: string }> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      key,
      encoder.encode(data),
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
    };
  }

  /**
   * 解密数据
   */
  static async decrypt(encryptedData: string, saltB64: string, password: string): Promise<string> {
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const key = await this.deriveKey(password, salt);

    // 从存储获取 IV（与加密数据一起存储）
    // ... 简化示例

    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv: new Uint8Array(12) },
      key,
      Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0)),
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
```

### 7.2 内容安全策略

```typescript
// wxt.config.ts - CSP 配置

export default defineConfig({
  manifest: {
    content_security_policy: {
      extension_pages: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com https://api.anthropic.com;",
    },
  },
});
```

---

## 8. 性能优化策略

### 8.1 代码分割

```typescript
// 动态导入工具组件
const loadTool = async (toolId: string) => {
  const tool = await import(`@/entrypoints/${toolId}/index.tsx`);
  return tool.default;
};

// React.lazy 使用
const JsonTool = React.lazy(() => import('@/entrypoints/json/index.tsx'));
```

### 8.2 懒加载非关键依赖

```typescript
// 按需加载重的依赖
async function loadDiffLibrary() {
  const [diffMatchPatch, diff2Html] = await Promise.all([
    import('diff-match-patch'),
    import('diff2html'),
  ]);
  return { diffMatchPatch, diff2Html };
}
```

---

## 9. 测试策略

### 9.1 测试配置

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
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/entrypoints/**/index.html',
      ],
    },
  },
});
```

### 9.2 Chrome API Mock

```typescript
// tests/mocks/chrome.mock.ts

export const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(),
  },
  cookies: {
    getAll: vi.fn(),
    remove: vi.fn(),
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};

global.chrome = mockChrome as any;
```

---

## 10. 实施优先级

### 阶段 1：基础设施（第 1-4 周）

1. **创建目录结构** - 建立新的文件组织
2. **实现工具注册系统** - ToolRegistry + 元数据类型
3. **创建状态管理 Hook** - useToolState, useToolHistory
4. **实现错误边界** - ToolErrorBoundary
5. **创建标准布局组件** - ToolLayout
6. **配置测试框架** - Vitest + 测试设置

### 阶段 2：迁移现有工具（第 2-4 周）

1. **迁移工具到新架构** - 逐个迁移现有工具
2. **修复已知 Bug** - MD5、diff 功能
3. **添加测试** - 为每个迁移的工具添加测试

### 阶段 3：新增工具（第 5 周开始）

1. **按阶段实现新工具** - 根据路线图添加
2. **每个工具遵循标准模式** - 使用统一架构

---

## 11. 架构决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| **状态管理** | React Hooks | 轻量级，无需额外依赖，适合工具场景 |
| **工具注册** | 声明式 + 自动发现 | 易于添加新工具，无需修改弹窗代码 |
| **存储** | chrome.storage.local | 本地优先，隐私保护，无需后端 |
| **AI 集成** | 用户自带密钥 | 零成本给开发者，隐私保护 |
| **错误处理** | 错误边界 + 友好 UI | 提升用户体验，便于调试 |
| **测试** | Vitest + React Testing Library | 与 Vite 生态兼容，快速执行 |

---

**文档状态：** 完成设计，待审阅

**下一步：** 使用 `/sc:workflow` 生成实施计划，或使用 `/sc:implement` 开始编码
