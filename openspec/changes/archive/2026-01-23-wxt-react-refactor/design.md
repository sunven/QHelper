# Design: WXT + React 重构 QHelper

## Context

### 当前状态

QHelper 是一个 Chrome/Chromium 浏览器扩展，提供 9 个前端开发工具。当前架构特点：

- **无构建系统**：所有依赖手动打包到 `static/` 目录
- **混合技术栈**：Vue 2、jQuery、Semantic UI、Element Plus、原生 JS 混合使用
- **无类型检查**：纯 JavaScript 开发
- **手动依赖管理**：无 package.json，依赖文件分散在项目中
- **Manifest V3**：已迁移到 Manifest V3（service worker）

### 约束条件

- 必须保留所有 9 个工具的功能
- 必须保留 GitHub 内容脚本功能
- 使用 pnpm 作为包管理器
- 使用 React 作为 UI 框架
- 使用 shadcn/ui 作为组件库
- 使用 Biome 作为代码质量工具
- JSON 工具保留现有的 diffview.js 和 difflib.js 库
- MD5 编码使用浏览器原生 Web Crypto API

## Goals / Non-Goals

**Goals:**

1. 建立基于 WXT 的规范扩展开发流程
2. 使用 pnpm 统一管理依赖
3. 使用 React + shadcn/ui 统一 UI 技术栈
4. 使用 TypeScript 提供类型安全
5.使用 Biome 提供代码质量保证
6. 迁移所有工具到新架构，保持功能不变

**Non-Goals:**

- 不改变现有工具的 UX/UI 布局（除非为了适配组件库）
- 不改变现有工具的核心行为
- 不使用 pnpm workspaces（monorepo 过度设计）
- 不添加新功能（功能保持不变）

## Decisions

### D1: 项目结构 - 独立入口点模式

**选择**：每个工具作为独立的 WXT entry point（类似当前模式）

**理由**：
- 每个工具独立打开在新标签页，符合现有 UX
- 工具间逻辑独立，不需要共享路由
- 构建时自动代码分割，加载更快
- 迁移过程可以逐个工具进行，风险更可控

**替代方案考虑**：
- 单一入口 + 内部路由：更像 SPA，但改变 UX，不必要

### D2: UI 库 - shadcn/ui

**选择**：shadcn/ui（基于 Radix UI + Tailwind CSS）

**理由**：
- 组件即代码，完全可控
- 基于 Radix UI，无障碍访问性好
- 使用 Tailwind CSS，样式灵活
- 与 React 生态良好集成
- 体积可控，按需复制组件

**替代方案考虑**：
- Chakra UI：简单易用，但设计风格固定
- Ant Design：组件丰富但体积较大
- MUI：成熟但设计风格固定

### D3: 代码质量工具 - Biome

**选择**：Biome（替代 ESLint + Prettier）

**理由**：
- 单一工具替代两个工具，配置简单
- Rust 编写，性能优异
- 原生 TypeScript 支持
- 与 Vite/WXT 良好兼容

**替代方案考虑**：
- ESLint + Prettier：生态丰富但配置复杂、性能较差

### D4: JSON 工具实现 - 保留现有库

**选择**：保留现有的 diffview.js 和 difflib.js，作为 public 资源引入

**理由**：
- 这两个库已经过充分测试，功能稳定
- 避免引入新的第三方库，减少风险
- 树形展示组件使用 react-json-view（成熟库）

**替代方案考虑**：
- react-diff-view：专门的 React diff 组件，但需要验证功能完整性

### D5: MD5 编码 - 浏览器原生 Web Crypto API

**选择**：使用浏览器原生 Web Crypto API

**理由**：
- 无需额外依赖
- 性能好，浏览器原生实现
- 安全性高

**替代方案考虑**：
- crypto-js：常用但体积大
- spark-md5：轻量但多一个依赖

### D6: 迁移顺序 - 从简单到复杂

**选择**：按工具复杂度从简单到复杂依次迁移

**理由**：
- 先验证基础架构和开发流程
- 复杂工具（如 JSON）最后迁移，有充分经验后进行
- 可以逐步测试和调整

**迁移顺序**：
1. timestamp（最简单）
2. convert
3. colorTransform
4. imagebase64
5. trans-radix
6. uglify
7. codebeautify
8. pictureSplicing
9. json（最复杂）

### D7: 依赖管理 - 标准化 npm 包

**选择**：用标准 npm 包替换手动打包的依赖

| 旧依赖 | 新依赖 |
|---------|---------|
| static/js/vue.js | `react` + `react-dom` |
| static/js/jquery.js | 保留必要工具中，其他用纯 JS |
| static/js/element-plus.js | shadcn/ui 组件 |
| static/js/underscore-min.js | `lodash`（如需要）|
| template/uglify/uglifyjs.js | `uglify-js` npm 包 |

## 项目结构

```
qhelper/
├── wxt.config.ts              # WXT 配置
├── biome.json                 # Biome 配置
├── tsconfig.json              # TypeScript 配置
├── tailwind.config.ts         # Tailwind 配置
├── components.json            # shadcn/ui 配置
├── package.json
├── pnpm-lock.yaml
│
├── entrypoints/               # WXT 入口点
│   ├── background.ts         # Service Worker
│   ├── popup.html            # 弹窗入口
│   ├── popup.tsx             # React 弹窗组件
│   └── content/              # 内容脚本
│       └── github.tsx       # GitHub 注入脚本
│
├── components/                # 共享组件
│   ├── ui/                  # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── radio-group.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   ├── alert.tsx
│   │   ├── scroll-area.tsx
│   │   └── utils.ts
│   │
│   └── layout/              # 自定义布局组件
│       └── tool-layout.tsx  # 工具页面通用布局
│
├── tools/                    # 9 个工具（每个独立入口）
│   ├── json/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── convert/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── codebeautify/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── timestamp/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── imagebase64/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── colorTransform/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── pictureSplicing/
│   │   ├── index.html
│   │   └── index.tsx
│   ├── uglify/
│   │   ├── index.html
│   │   └── index.tsx
│   └── trans-radix/
│       ├── index.html
│       └── index.tsx
│
├── lib/                      # 共享库函数
│   ├── chrome/
│   │   ├── storage.ts        # chrome.storage 封装
│   │   ├── tabs.ts           # chrome.tabs 封装
│   │   └── cookies.ts       # chrome.cookies 封装
│   │
│   ├── encoders/             # 编解码工具
│   │   ├── base64.ts
│   │   ├── uri.ts
│   │   └── unicode.ts
│   │
│   └── utils.ts              # 通用工具函数
│
├── hooks/                    # 自定义 React Hooks
│   ├── useExtensionStorage.ts
│   ├── useChromeTabs.ts
│   └── useChromeCookies.ts
│
├── types/                    # TypeScript 类型定义
│   └── index.d.ts
│
└── public/                   # 静态资源
    ├── icons/
    │   ├── q-16.png
    │   ├── q-48.png
    │   └── q-128.png
    └── libs/                # 保留的现有库
        ├── diffview.js
        └── difflib.js
```

## WXT 配置

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: 'QHelper前端助手',
    description: 'json解析',
    version: '1.2',
    permissions: ['cookies', 'tabs'],
    host_permissions: ['<all_urls>'],
    icons: {
      16: '/icons/q-16.png',
      48: '/icons/q-48.png',
      128: '/icons/q-128.png',
    },
    action: {
      default_popup: 'popup.html',
    },
  },

  typescript: {
    serviceWorker: true,
  },

  build: {
    emptyOutDir: true,
  },
});
```

## Biome 配置

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": {
        "useKeyWithClickEvents": "warn"
      },
      "correctness": {
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "globals": [
      "chrome",
      "browser"
    ]
  }
}
```

## 依赖清单

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "wxt": "^0.21.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.7.0",
    "lucide-react": "^0.468.0",
    "uglify-js": "^3.19.0",
    "react-json-view": "^1.5.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@wxt-dev/module-react": "^0.21.0",
    "typescript": "^5.7.2",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "biome": "^1.9.4"
  }
}
```

## Risks

| Risk | Mitigation |
|-------|-----------|
| JSON 工具 diff 功能迁移后行为不一致 | 保留原有库，充分测试 diff 结果 |
| 图片拼接工具 Canvas 操作在 React 中表现不同 | 使用 useRef 引用 Canvas，在 useEffect 中处理 |
| Uglify 工具使用 npm 包后输出结果不同 | 对比新旧版本输出，确保一致性 |
| 内容脚本 React 注入可能影响性能 | 使用轻量级实现，必要时考虑纯 JS |
| 依赖体积过大影响扩展加载 | 按需加载，代码分割 |
| Chrome Web Store 审核问题 | 确保 permissions 最小化，无内联脚本 |

## Trade-offs

| 方面 | 权衡 |
|-------|------|
| 保留 jQuery | 部分工具可能仍需 jQuery（convert 工具），但总体用 React 重写 |
| UI 库统一 | shadcn/ui 需要手动复制组件到项目，不是 npm 包，但带来完全可控性 |
| 开发体验 | Biome 比 ESLint+Prettier 配置简单，但生态插件较少 |
| 迁移速度 | 渐进式迁移较慢但风险可控，一次性迁移快但风险高 |

## Migration Plan

### 阶段 1: 基础架构搭建

1. 初始化 pnpm 项目
2. 安装 WXT、React、TypeScript
3. 配置 WXT 和 TypeScript
4. 初始化 Tailwind CSS
5. 初始化 shadcn/ui
6. 配置 Biome
7. 创建项目目录结构
8. 复制图标资源到 public/

### 阶段 2: 入口点迁移

1. 迁移 background.js → background.ts
2. 迁移 popup.html + popup.js → popup.html + popup.tsx
3. 迁移 content/openinvscode.js → content/github.tsx

### 阶段 3: 简单工具迁移

1. 迁移 timestamp 工具
2. 迁移 convert 工具
3. 迁移 colorTransform 工具
4. 迁移 imagebase64 工具

### 阶段 4: 中等复杂度工具迁移

1. 迁移 trans-radix 工具
2. 迁移 uglify 工具
3. 迁移 codebeautify 工具

### 阶段 5: 复杂工具迁移

1. 迁移 pictureSplicing 工具
2. 迁移 json 工具（最后，包含 diff 和历史记录功能）

### 阶段 6: 清理和验证

1. 全面测试所有工具功能
2. 删除旧的 template/、static/ 目录
3. 验证构建产物
4. Chrome Web Store 兼容性测试

### Rollback Strategy

- 保持旧代码直到完全验证新架构
- 使用 Git 分支管理，可以随时回滚
- 重要功能迁移前创建备份分支

## Open Questions

1. ~~JSON 工具 diff 功能实现方式~~ - 已决定保留现有库
2. ~~MD5 编码实现方式~~ - 已决定使用 Web Crypto API
3. ~~UI 库选择~~ - 已决定使用 shadcn/ui
4. ~~迁移顺序~~ - 已决定从简单到复杂
5. ~~是否使用 pnpm workspaces~~ - 已决定不使用（过度设计）
6. ~~代码质量工具选择~~ - 已决定使用 Biome
7. ~~是否保留 jQuery~~ - 将在新架构中用 React 完全替代

**无其他待解决问题。**
