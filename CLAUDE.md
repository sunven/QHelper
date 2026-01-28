# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QHelper is a Chrome/Chromium browser extension for frontend developers that provides a collection of developer utilities accessible through an extension popup. Each tool opens in a new browser tab.

## Tech Stack

- **Build Framework:** WXT (Web Extension Tools) - convention-based framework for building browser extensions
- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS v4 with CSS variables for theming (shadcn/ui "new-york" style)
- **Icons:** Lucide React
- **Extension API:** Chrome Extension Manifest v3
- **Package Manager:** pnpm
- **Linting/Formatting:** Biome
- **Type Checking:** TypeScript 5.9

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

### WXT Convention-Based Structure

The project follows WXT's entrypoint convention where files in `entrypoints/` automatically become extension pages/scripts:

```
entrypoints/
├── popup/           # Extension popup (main menu)
├── json/            # JSON formatter/parser with diff support
├── timestamp/       # Unix timestamp converter
├── convert/         # String encoding/decoding tools
├── codebeautify/    # Code beautification tool
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
// Always use these wrappers instead of raw chrome.* APIs
import { create } from '@/lib/chrome/tabs';
import { removeAll } from '@/lib/chrome/cookies';
import { get, set, remove, clear, onChanged } from '@/lib/chrome/storage';
```

Available wrappers:
- `lib/chrome/cookies.ts` - Cookie management (getAll, remove, removeAll)
- `lib/chrome/storage.ts` - chrome.storage.local wrapper with change listeners
- `lib/chrome/tabs.ts` - Tab creation and querying

### Custom React Hooks

Two custom hooks for extension-specific functionality:

```typescript
// Cookie management hook
import { useChromeCookies } from '@/hooks/useChromeCookies';

const { cookieCount, clearCookies } = useChromeCookies();

// Generic storage hook with change synchronization
import { useExtensionStorage } from '@/hooks/useExtensionStorage';

const { value, setValue, loading } = useExtensionStorage<T>(key, defaultValue);
```

### Path Aliases

TypeScript path alias is configured: `@/*` maps to project root.

```typescript
// Use this import style
import { something } from '@/lib/chrome/storage';
import { MyComponent } from '@/components/ui/button';
```

### UI Component System

UI components follow shadcn/ui patterns and are located in `components/ui/`:
- CSS variable-based theming (light/dark mode support)
- OKLCH color space for modern color handling
- Tailwind CSS utility classes for all styling

Global styles are in `index.css` with Tailwind directives and CSS variables.

### Content Scripts

`content/openinvscode.js` is injected into GitHub pages (`*://github.com/*`) at `document_end` to add a "vscode.dev" button for opening repositories in VSCode Web.

## Extension Permissions

From `wxt.config.ts`:
- `cookies` - For clear cookies functionality
- `tabs` - For tab management
- `host_permissions: ['<all_urls>']` - For tools that interact with web content

## Code Style (Biome)

- Single quotes for JavaScript
- Semicolons: "as needed"
- Space indentation
- Auto-organize imports enabled

## Tool Categories (Popup Menu)

- **Common:** JSON formatter, Radix conversion
- **Encoding:** String encode/decode, Code beautify, Uglify
- **Image:** Base64 converter, Image splicing
- **Other:** Timestamp converter, Color converter, Clear cookies
