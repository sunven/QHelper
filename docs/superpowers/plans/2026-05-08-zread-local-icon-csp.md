# Zread Local Icon CSP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop GitHub release pages from blocking the injected Zread button icon by loading a packaged extension icon instead of `https://zread.ai/favicon.ico`.

**Architecture:** Keep the content-script entrypoint unchanged. Move icon URL creation into a safe helper in `lib/github/zread-button.ts`, render the image only when `chrome.runtime.getURL('icons/q-16.png')` is available, and expose that packaged icon through the WXT manifest.

**Tech Stack:** WXT, Chrome extension Manifest V3, TypeScript, Vitest, jsdom.

---

## File Structure

- Modify `lib/github/zread-button.ts`
  - Owns GitHub repository URL parsing, button insertion, and button DOM creation.
  - Will replace the remote favicon constant with a local icon path and a runtime URL resolver.

- Modify `lib/github/zread-button.test.ts`
  - Owns unit coverage for GitHub button behavior in jsdom.
  - Will mock `chrome.runtime.getURL`, assert the local icon URL, assert no remote favicon is emitted, and assert graceful text-only rendering when the runtime API is missing.

- Modify `wxt.config.ts`
  - Owns WXT and extension manifest configuration.
  - Will expose `icons/q-16.png` as a web-accessible resource for GitHub pages.

No new runtime files or icon assets are needed. The existing icon asset is `public/icons/q-16.png`.

---

### Task 1: Lock The Local Icon Runtime Behavior

**Files:**
- Modify: `lib/github/zread-button.test.ts`
- Test: `lib/github/zread-button.test.ts`

- [ ] **Step 1: Add a Chrome runtime stub helper near `stubMutationObserver`**

Add this helper after `stubMutationObserver`:

```ts
function stubChromeRuntimeGetUrl() {
  const getURL = vi.fn((path: string) => `chrome-extension://qhelper-test/${path}`);

  vi.stubGlobal('chrome', {
    runtime: {
      getURL,
    },
  });

  return { getURL };
}
```

- [ ] **Step 2: Update the existing root-page render test to expect a local extension icon**

In the test named `renders a single Zread button on repository root pages`, add the runtime stub before rendering and replace the favicon assertion block with this:

```ts
    const { getURL } = stubChromeRuntimeGetUrl();
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const button = document.querySelector<HTMLAnchorElement>(`#${ZREAD_BUTTON_ID}`);
    const icon = button?.querySelector('img');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Zread');
    expect(button?.href).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
    expect(button?.className).toContain('d-inline-flex');
    expect(button?.className).toContain('flex-items-center');
    expect(getURL).toHaveBeenCalledWith('icons/q-16.png');
    expect(icon?.src).toBe('chrome-extension://qhelper-test/icons/q-16.png');
    expect(icon?.src).not.toBe('https://zread.ai/favicon.ico');
    expect(icon?.alt).toBe('');
    expect(icon?.width).toBe(16);
    expect(icon?.height).toBe(16);
    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
```

The full test body should start by stubbing runtime before `renderGitHubHeader()`.

- [ ] **Step 3: Add a regression test for missing runtime APIs**

Add this test in the `syncZreadButton` describe block after the root-page render test:

```ts
  it('renders the Zread button without an icon when extension runtime APIs are unavailable', () => {
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const button = document.querySelector<HTMLAnchorElement>(`#${ZREAD_BUTTON_ID}`);
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Zread');
    expect(button?.href).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
    expect(button?.querySelector('img')).toBeNull();
  });
```

- [ ] **Step 4: Run the targeted test and verify it fails for the intended reason**

Run:

```bash
pnpm vitest run lib/github/zread-button.test.ts
```

Expected: FAIL. The updated root-page test should still receive `https://zread.ai/favicon.ico`, and the new missing-runtime test should still find an `<img>`.

- [ ] **Step 5: Commit the failing tests**

```bash
git add lib/github/zread-button.test.ts
git commit -m "test Zread button local icon behavior" \
  -m "Constraint: GitHub CSP blocks remote zread.ai favicon loads on release pages." \
  -m "Rejected: Keeping the remote favicon assertion | it preserves the failing browser behavior." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Preserve text-only fallback when extension runtime APIs are absent." \
  -m "Tested: pnpm vitest run lib/github/zread-button.test.ts fails before implementation." \
  -m "Not-tested: Passing implementation, typecheck, lint, and build are pending."
```

---

### Task 2: Resolve The Zread Icon From The Extension Package

**Files:**
- Modify: `lib/github/zread-button.ts`
- Test: `lib/github/zread-button.test.ts`

- [ ] **Step 1: Replace the remote favicon constant**

In `lib/github/zread-button.ts`, replace:

```ts
const ZREAD_FAVICON_URL = 'https://zread.ai/favicon.ico';
```

with:

```ts
const ZREAD_ICON_PATH = 'icons/q-16.png';
```

- [ ] **Step 2: Add the safe extension icon resolver**

Add this function above `createZreadAnchor`:

```ts
function getZreadIconUrl(): string | null {
  const getURL = globalThis.chrome?.runtime?.getURL;
  if (!getURL) {
    return null;
  }

  return getURL(ZREAD_ICON_PATH);
}
```

- [ ] **Step 3: Render the image only when a local runtime URL exists**

In `createZreadAnchor`, replace the current unconditional image creation:

```ts
  const icon = doc.createElement('img');
  icon.src = ZREAD_FAVICON_URL;
  icon.alt = '';
  icon.width = 16;
  icon.height = 16;
  icon.loading = 'lazy';
  icon.decoding = 'async';

  const label = doc.createElement('span');
  label.textContent = 'Zread';

  anchor.append(icon, label);
  return anchor;
```

with:

```ts
  const iconUrl = getZreadIconUrl();
  if (iconUrl) {
    const icon = doc.createElement('img');
    icon.src = iconUrl;
    icon.alt = '';
    icon.width = 16;
    icon.height = 16;
    icon.loading = 'lazy';
    icon.decoding = 'async';
    anchor.append(icon);
  }

  const label = doc.createElement('span');
  label.textContent = 'Zread';

  anchor.append(label);
  return anchor;
```

- [ ] **Step 4: Run the targeted test and verify it passes**

Run:

```bash
pnpm vitest run lib/github/zread-button.test.ts
```

Expected: PASS. The root-page test should use `chrome-extension://qhelper-test/icons/q-16.png`, and the missing-runtime test should render no `<img>`.

- [ ] **Step 5: Commit the implementation**

```bash
git add lib/github/zread-button.ts lib/github/zread-button.test.ts
git commit -m "load Zread icon from extension assets" \
  -m "Constraint: Content scripts run inside GitHub pages whose CSP rejects the remote Zread favicon." \
  -m "Rejected: Inlining the icon as a data URL | less maintainable than using the packaged extension asset." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Do not reintroduce remote image dependencies into the GitHub button DOM." \
  -m "Tested: pnpm vitest run lib/github/zread-button.test.ts" \
  -m "Not-tested: Manifest exposure and full project checks are handled in the next task."
```

---

### Task 3: Expose The Packaged Icon To GitHub Pages

**Files:**
- Modify: `wxt.config.ts`
- Test: generated WXT build output

- [ ] **Step 1: Add `web_accessible_resources` to the manifest**

In `wxt.config.ts`, add this property inside the `manifest` object after `icons`:

```ts
    web_accessible_resources: [
      {
        resources: ['icons/q-16.png'],
        matches: ['*://github.com/*'],
      },
    ],
```

The surrounding manifest section should look like this:

```ts
    icons: {
      16: '/icons/q-16.png',
      48: '/icons/q-48.png',
      128: '/icons/q-128.png',
    },
    web_accessible_resources: [
      {
        resources: ['icons/q-16.png'],
        matches: ['*://github.com/*'],
      },
    ],
    action: {
      default_popup: 'popup',
    },
```

- [ ] **Step 2: Run a build to verify WXT accepts the manifest change**

Run:

```bash
pnpm run build
```

Expected: PASS and a generated extension output under `.output/`.

- [ ] **Step 3: Inspect the generated manifest for the web-accessible resource**

Run:

```bash
node -e "const fs=require('fs'); const path=['.output/chrome-mv3/manifest.json','.output/chrome-mv3-dev/manifest.json'].find(fs.existsSync); if(!path){throw new Error('manifest not found')} const manifest=JSON.parse(fs.readFileSync(path,'utf8')); console.log(JSON.stringify(manifest.web_accessible_resources,null,2));"
```

Expected output contains:

```json
[
  {
    "resources": [
      "icons/q-16.png"
    ],
    "matches": [
      "*://github.com/*"
    ]
  }
]
```

- [ ] **Step 4: Commit the manifest exposure**

```bash
git add wxt.config.ts
git commit -m "expose Zread icon for GitHub pages" \
  -m "Constraint: GitHub must be allowed to load the extension-packaged icon URL emitted by the content script." \
  -m "Rejected: Relying on implicit icon accessibility | content-page loads should be explicit in Manifest V3." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Keep web-accessible resources scoped to GitHub unless another content script needs broader access." \
  -m "Tested: pnpm run build; generated manifest includes icons/q-16.png for *://github.com/*." \
  -m "Not-tested: Browser manual smoke test is handled after full verification."
```

---

### Task 4: Run Final Verification

**Files:**
- Verify: `lib/github/zread-button.ts`
- Verify: `lib/github/zread-button.test.ts`
- Verify: `wxt.config.ts`

- [ ] **Step 1: Search for forbidden remote favicon usage**

Run:

```bash
rg -n "zread\\.ai/favicon\\.ico|ZREAD_FAVICON_URL" lib entrypoints test wxt.config.ts
```

Expected: No matches.

- [ ] **Step 2: Run the targeted unit tests**

Run:

```bash
pnpm vitest run lib/github/zread-button.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the TypeScript check**

Run:

```bash
pnpm run type-check
```

Expected: PASS.

- [ ] **Step 4: Run lint**

Run:

```bash
pnpm run lint
```

Expected: PASS.

- [ ] **Step 5: Run production build**

Run:

```bash
pnpm run build
```

Expected: PASS.

- [ ] **Step 6: Commit any verification-only adjustments**

If lint or build requires formatting-only changes, commit them:

```bash
git add lib/github/zread-button.ts lib/github/zread-button.test.ts wxt.config.ts
git commit -m "verify Zread local icon CSP fix" \
  -m "Constraint: Final checks must pass before claiming the GitHub CSP fix is complete." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Keep verification fixes limited to formatting or generated-manifest compatibility." \
  -m "Tested: pnpm vitest run lib/github/zread-button.test.ts; pnpm run type-check; pnpm run lint; pnpm run build." \
  -m "Not-tested: Live browser smoke test on github.com/releases unless performed separately."
```

If there are no changes after verification, do not create an empty commit.

## Self-Review

- Spec coverage: Task 1 locks local icon and missing-runtime behavior; Task 2 implements safe runtime icon resolution; Task 3 exposes `icons/q-16.png` to GitHub pages; Task 4 verifies no remote favicon remains and runs the requested checks.
- Placeholder scan: No `TBD`, `TODO`, unspecified edge handling, or cross-task shorthand remains.
- Type consistency: The plan consistently uses `ZREAD_ICON_PATH`, `getZreadIconUrl`, `chrome.runtime.getURL('icons/q-16.png')`, and Manifest V3 `web_accessible_resources`.
