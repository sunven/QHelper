# Repository Guidelines

## Project Overview

QHelper is a Chrome/Chromium extension for frontend developer tools. It is built with WXT, React 19, TypeScript, Tailwind CSS v4, and pnpm. The extension includes popup pages, tool pages, content scripts, side panel web summary, GitHub integrations, bookmark utilities, and Chrome API wrappers.

## Environment

- Use Node.js 22 as declared in `.nvmrc`.
- Use `pnpm` for package management. Do not switch to npm, yarn, or bun.
- WXT dev server is configured on port `3001` in `wxt.config.ts`.
- Generated output lives under `.output/` and `.wxt/`; do not edit generated files directly.

## Common Commands

- `pnpm install` - install dependencies.
- `pnpm dev` - run WXT development mode with extension hot reload.
- `pnpm build` - build the production Chrome MV3 extension into `.output/chrome-mv3`.
- `pnpm type-check` - run TypeScript with `tsc --noEmit`.
- `pnpm lint` - run Biome checks.
- `pnpm format` - format with Biome.
- `pnpm test` - run Vitest in watch mode.
- `pnpm test:run` - run unit/component tests once.
- `pnpm test:coverage` - run coverage.
- `pnpm test:e2e` - build the extension and run Playwright E2E tests.
- `pnpm test:e2e:ui` / `pnpm test:e2e:debug` - interactive E2E modes.

## Source Layout

- `entrypoints/` contains WXT extension entrypoints:
  - `background.ts` for background behavior.
  - `popup/` for the extension popup.
  - `tools/` for the main tools SPA.
  - `sidepanel/` for web summary UI.
  - `*.content.ts(x)` for content scripts.
  - `sandbox/` and `*.sandbox.html` for worker-like isolated execution.
- `components/tool/` contains individual tool UIs and tool shell components.
- `components/ui/` contains reusable UI primitives.
- `lib/` contains domain logic and browser service wrappers:
  - `lib/chrome/` wraps Chrome APIs.
  - `lib/web-summary/`, `lib/github/`, `lib/bookmarks/`, `lib/dictionary/`, and similar folders hold feature logic.
  - `lib/registry/` and `lib/tool-catalog.ts` define tool metadata and routing support.
- `hooks/`, `constants/`, and `types/` hold shared React hooks, constants, and types.
- `test/` contains Vitest setup and entrypoint-focused tests.
- `tests/e2e/` contains Playwright extension tests.
- `tests/support/` contains Playwright fixtures, helpers, and page objects.

## Coding Conventions

- TypeScript is strict; keep types explicit where inference becomes unclear.
- Use the `@/*` path alias for root-relative imports when it improves readability.
- Follow Biome formatting:
  - Spaces for indentation.
  - Single quotes in JavaScript/TypeScript.
  - Semicolons are omitted where Biome removes them.
  - Imports are organized by Biome.
- Prefer existing UI primitives from `components/ui/` and existing tool shell components before creating new layout patterns.
- Keep Chrome API access behind the wrappers in `lib/chrome/` when practical so logic remains testable.
- Keep domain logic in `lib/` and UI state/rendering in React components.
- Do not add broad abstractions for a single tool unless the pattern is already repeated elsewhere.

## Extension-Specific Notes

- Manifest permissions and WXT hooks are defined in `wxt.config.ts`.
- Tool route aliases are generated during `build:done`; update `lib/tools-spa.ts`, `lib/tool-catalog.ts`, and registry metadata consistently when adding or renaming tool routes.
- When changing content scripts, consider both DOM behavior and extension permission/CSP constraints.
- When changing side panel web summary, preserve the privacy model: page content is sent only after the user configures an API and starts summary generation.
- Avoid importing Node-only modules into browser entrypoints unless WXT/Vite explicitly bundles a browser-safe replacement.

## Testing Guidance

- Add or update focused Vitest tests next to changed logic or components using the existing `*.test.ts(x)` pattern.
- Use `test/setup.ts` for global test setup instead of repeating setup in individual tests.
- E2E tests load the built extension via Playwright; run `pnpm test:e2e` for behavior that depends on real extension loading, popup pages, side panel, or Chrome extension APIs.
- Selector preference for E2E tests is `data-testid`, then ARIA roles, then visible text, then CSS selectors.
- Before handing off non-trivial changes, run at least:
  - `pnpm type-check`
  - `pnpm lint`
  - `pnpm test:run`
- Run targeted tests first when iterating, then broader checks before finalizing.

## Generated and Local Artifacts

Do not manually edit or commit generated/runtime artifacts unless the user explicitly asks:

- `.output/`
- `.wxt/`
- `coverage/`
- `playwright-report/`
- `test-results/`
- `node_modules/`

## Git Hygiene

- The worktree may contain user changes. Do not revert unrelated modifications or deletions.
- Keep edits scoped to the requested task.
- If a command or formatter changes files outside the intended scope, inspect the diff before proceeding.
- Never run destructive git commands such as `git reset --hard` or `git checkout --` unless explicitly requested.
