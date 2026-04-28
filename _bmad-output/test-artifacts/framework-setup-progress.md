---
stepsCompleted: ['step-01-preflight', 'step-02-select-framework', 'step-03-scaffold-framework', 'step-04-docs-and-scripts', 'step-05-validate-and-summary']
lastStep: 'step-05-validate-and-summary'
lastSaved: '2026-04-28'
---

## Step 1: Preflight Checks

### Stack Detection
- `test_stack_type` config: `auto`
- Detected stack: **frontend**
- Evidence: `package.json` with React 19, WXT 0.20, TypeScript 5.9; no backend manifests

### Prerequisites Validation
- [x] `package.json` exists
- [x] No existing E2E framework (no playwright.config, cypress.config, cypress.json)
- [x] Architecture/stack context available

### Project Context
- **Type**: Chrome Extension (Manifest V3)
- **Framework**: React 19 + WXT 0.20 + TypeScript 5.9
- **Bundler**: WXT (Vite-based)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Existing tests**: Vitest + Testing Library (7 unit test files)
- **Test files**: github-content-entrypoint, jsonDiff, md5, recentTools, zread-button, storage, tabs, cookies
- **Architecture docs**: None found
- **Chrome permissions**: cookies, tabs, storage, host_permissions: ['<all_urls>']
- **Auth**: Chrome extension APIs (no external auth)

### Key Considerations
- E2E framework needed for popup and tool page user flows
- Chrome extension testing requires loading `.output/` directory
- Extension context simulation needed for E2E tests

## Step 2: Framework Selection

### Selected Framework: Playwright

### Rationale
1. **Chrome Extension native support** — Playwright supports loading extensions via persistent context with `--load-extension` args; Cypress lacks native extension testing
2. **Multi-tab scenarios** — Extension popup opens tool pages in new tabs; Playwright's multi-page/context model maps naturally
3. **CI parallelism** — 10+ tool entrypoints benefit from built-in sharding
4. **Risk assessment** — P2×I3 (medium probability, high impact); Playwright significantly reduces E2E failure risk
5. **Existing stack alignment** — TypeScript-first, complements existing Vitest unit test infrastructure

### Alternatives Considered
- **Cypress**: Rejected due to lack of Chrome extension support and limited multi-tab capabilities

## Step 3: Scaffold Framework

### Execution Mode
- Config: `auto` → resolved to `sequential` (Chrome extension project requires cohesive setup)

### Created Files

#### Directory Structure
```
tests/
├── e2e/
│   ├── popup.spec.ts          # Popup打开和工具列表测试
│   └── json-tool.spec.ts      # JSON工具页面测试
└── support/
    ├── fixtures/
    │   ├── index.ts            # 合并的fixture导出
    │   ├── extension.ts       # 扩展加载fixture
    │   └── factories/
    │       └── test-data.ts   # 测试数据工厂
    ├── helpers/
    │   └── extension.ts       # 扩展信息获取工具函数
    └── page-objects/
        └── popup.page.ts      # Popup页面对象
```

#### Framework Config
- `playwright.config.ts` — 标准化超时、artifact、reporter、Chromium扩展加载
- `.env.example` — 环境模板
- `.nvmrc` — Node 22

#### NPM Scripts Added
- `test:e2e` — 构建扩展并运行E2E测试
- `test:e2e:ui` — 带Playwright UI运行
- `test:e2e:debug` — 调试模式运行

#### Dependencies
- `@playwright/test@^1.59.1` 已安装
- Playwright Chromium浏览器已安装

#### Design Decisions
- **扩展加载模式**: 通过`--disable-extensions-except` + `--load-extension`启动参数加载`.output/`目录
- **Extension ID获取**: 通过service worker URL解析扩展ID，无需硬编码
- **Fixture架构**: 纯函数 → Fixture包装模式（符合知识库最佳实践）
- **选择器策略**: data-testid优先，ARIA role次之

## Step 4: Documentation & Scripts

### Created
- `tests/README.md` — E2E测试文档，包含安装、运行、架构、选择器策略、CI集成说明

### NPM Scripts (already added in Step 3)
- `test:e2e`, `test:e2e:ui`, `test:e2e:debug` — 已在Step 3中添加到package.json

## Step 5: Validate & Summary

### Validation Results
- [x] All prerequisite checks passed
- [x] Directory structure complete (e2e, fixtures, factories, helpers, page-objects)
- [x] Playwright config with standardized timeouts and artifacts
- [x] Fixture architecture follows pure function → fixture pattern
- [x] Data factory created (test-data.ts)
- [x] Sample tests with proper selector strategy
- [x] Documentation complete
- [x] NPM scripts configured
- [x] TypeScript type-check passes
- [x] Biome lint passes
- [x] No hardcoded secrets
- [x] `.nvmrc` created

### Knowledge Fragments Applied
- `overview.md` — Fixture composition pattern
- `fixture-architecture.md` — Pure function → fixture → mergeTests
- `playwright-config.md` — Timeout standards, artifact config, reporters
- `selector-resilience.md` — data-testid > ARIA > text > CSS hierarchy
- `test-quality.md` — Deterministic, isolated, explicit assertion patterns

### Next Steps
1. `pnpm test:e2e` — 验证E2E测试框架运行
2. 为现有UI组件添加 `data-testid` 属性
3. 扩展测试覆盖更多工具页面（timestamp, convert, colorTransform等）
4. 考虑运行 `ci` 工作流搭建CI/CD管线
