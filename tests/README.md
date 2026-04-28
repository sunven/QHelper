# E2E Tests — QHelper Chrome Extension

## Setup

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium

# Build the extension (required before E2E tests)
pnpm build
```

## Running Tests

```bash
# Build + run all E2E tests
pnpm test:e2e

# Run with Playwright UI (interactive)
pnpm test:e2e:ui

# Debug mode (step through tests)
pnpm test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/popup.spec.ts
```

## Architecture

```
tests/
├── e2e/                       # Test specs
│   ├── popup.spec.ts          # Extension popup tests
│   └── json-tool.spec.ts      # JSON tool page tests
└── support/
    ├── fixtures/
    │   ├── index.ts            # Merged fixture exports
    │   └── extension.ts       # Extension loading fixture
    ├── helpers/
    │   └── extension.ts       # Extension info utilities
    └── page-objects/
        └── popup.page.ts      # Popup page object
```

### Extension Loading

Tests load the extension via Chrome launch args (`--load-extension`). The extension ID is resolved dynamically from the service worker URL — no hardcoded IDs.

### Fixture Pattern

```
Pure function → Fixture wrapper → Merged exports
```

- `getExtensionInfo()` — pure function, unit-testable
- `extension` fixture — injects browser context
- `tests/support/fixtures/index.ts` — single import point

## Selector Strategy

Priority: `data-testid` > ARIA roles > text content > CSS/ID

## CI Integration

```bash
# Headless CI run
pnpm build && npx playwright test --reporter=html,junit

# Sharded execution (4 shards)
npx playwright test --shard=1/4
```

Artifacts on failure:
- `test-results/` — traces, screenshots
- `playwright-report/` — HTML report
