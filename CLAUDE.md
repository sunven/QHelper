# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QHelper is a Chrome/Chromium browser extension for frontend developers. The popup, tool workspace, side panel, content scripts, and background worker all share one WXT extension build.

## Tech Stack

- **Build Framework:** WXT (Web Extension Tools) - convention-based framework for building browser extensions
- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS v4 with CSS variables for theming (shadcn/ui "new-york" style)
- **Icons:** Lucide React
- **Extension API:** Chrome Extension Manifest v3
- **Package Manager:** pnpm
- **Linting/Formatting:** Biome
- **Type Checking:** TypeScript 6

## Development Commands

```bash
# Development with hot-reload
pnpm dev

# Production build
pnpm build

# Type checking
pnpm type-check

# Lint code
pnpm lint

# Format code
pnpm format
```

**Build Output:** `.output/` directory (gitignored)

**Loading the Extension:**

1. Run `pnpm build` or `pnpm dev`
2. Open Chrome/Chromium and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `.output/` directory (for production build)

## Architecture

### WXT Entrypoints

```
entrypoints/
├── popup/           # Extension popup (main menu)
├── json/            # JSON formatter/parser with diff support
├── timestamp/       # Unix timestamp converter
├── convert/         # String encoding/decoding tools
├── uglify/          # JavaScript minifier
├── imagebase64/     # Image to Base64 converter
├── colorTransform/  # Color format converter
├── pictureSplicing/ # Image splicing tool
├── trans-radix/     # Number base converter
└── background.ts    # Service worker (replaces background page from v2)
```

Each tool directory contains:

- `index.html` - HTML shell with `<div id="app"></div>`
- `index.tsx` - React component mounted to the #app div
- Component files as needed

### Chrome API Abstraction Layer

All Chrome API interactions are centralized in `lib/chrome/`:

```typescript
import { create } from '@/lib/chrome/tabs'
import { removeAll } from '@/lib/chrome/cookies'
import { get, set, remove, clear, onChanged } from '@/lib/chrome/storage'
```

Entrypoints may call extension APIs directly when the call is tightly coupled to that surface, such as `chrome.scripting.executeScript` in the side panel or DevTools APIs in `entrypoints/devtools/`.

### Settings And Persisted Data

Use `defineSetting(key, defaults)` from `lib/settings.ts` for low-sensitivity synced Tool Settings. It handles sync storage, local fallback, subscriptions, and reset behavior.

Use local persisted data for captured content, tool history, API credentials, and large local workspaces. Examples:

- `lib/chrome/local-persisted-data.ts` for device-local extension storage.
- `hooks/useToolState.ts` and `hooks/useToolHistory.ts` for tool state/history.
- `lib/text-preview/workspaceStore.ts` for large pasted text in `window.localStorage`.

### Path Aliases

TypeScript path alias is configured: `@/*` maps to project root.

```typescript
// Use this import style
import { something } from '@/lib/chrome/storage'
import { MyComponent } from '@/components/ui/button'
```

### UI Component System

UI components follow shadcn/ui patterns and are located in `components/ui/`:

- CSS variable-based theming (light/dark mode support)
- OKLCH color space for modern color handling
- Tailwind CSS utility classes for all styling

Global styles are in `index.css` with Tailwind directives and CSS variables.

### Content Scripts And Page Access

Keep page helpers scoped and user-driven where practical.

- `entrypoints/github.content.ts` delegates GitHub Zread behavior to `lib/github/zread-button.ts`.
- `entrypoints/dictionary.content.tsx` installs the dictionary controller on matched pages, but the real selection lookup mounts only when the synced Tool Setting is enabled.
- Web Summary does not use a persistent page content script. The side panel extracts page content with `chrome.scripting.executeScript` after a user-triggered popup/context-menu action.

## Extension Permissions

From `wxt.config.ts`:

- `cookies` - For clear cookies functionality
- `tabs` - For tab management
- `activeTab` and `scripting` - For user-triggered page extraction and page helpers
- `host_permissions: ['<all_urls>']` - For extension page helpers that still need broad match coverage

## Code Style (Biome)

- Single quotes for JavaScript
- Semicolons omitted where Biome removes them
- Space indentation
- Auto-organize imports enabled

## Tool Categories (Popup Menu)

- **Common:** JSON formatter, Radix conversion
- **Encoding:** String encode/decode, Uglify
- **Image:** Base64 converter, Image splicing
- **Other:** Timestamp converter, Color converter, Clear cookies

## Agent skills

### Issue tracker

Issues and PRDs are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The repo uses the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo with root `CONTEXT.md` and root `docs/adr/` when ADRs are added. See `docs/agents/domain.md`.
