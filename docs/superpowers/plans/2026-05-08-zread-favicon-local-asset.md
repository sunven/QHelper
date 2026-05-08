# Zread Favicon Local Asset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the Zread favicon visual asset in the GitHub Zread button while keeping image loading CSP-safe by packaging it as a local extension resource.

**Architecture:** Add `public/icons/zread-favicon.ico` as a committed asset downloaded once from `https://zread.ai/favicon.ico`. Update the existing local icon path, tests, and Manifest V3 `web_accessible_resources` entry from `icons/q-16.png` to `icons/zread-favicon.ico`. Keep runtime loading through `chrome.runtime.getURL(...)` and keep the text-only fallback when extension APIs are unavailable.

**Tech Stack:** WXT, Chrome extension Manifest V3, TypeScript, Vitest, jsdom, static extension assets.

---

## File Structure

- Create `public/icons/zread-favicon.ico`
  - Committed static asset copied from `https://zread.ai/favicon.ico`.
  - Used only as an extension-packaged image.

- Modify `lib/github/zread-button.ts`
  - Owns GitHub repository URL parsing, button insertion, and button DOM creation.
  - Will change `ZREAD_ICON_PATH` from `icons/q-16.png` to `icons/zread-favicon.ico`.

- Modify `lib/github/zread-button.test.ts`
  - Owns unit coverage for GitHub button behavior in jsdom.
  - Will update local runtime URL assertions to the Zread favicon asset path.

- Modify `wxt.config.ts`
  - Owns WXT and extension manifest configuration.
  - Will expose `icons/zread-favicon.ico` as a web-accessible resource for GitHub pages instead of `icons/q-16.png`.

No build-time downloader should be added. The favicon download is a one-time implementation step.

---

### Task 1: Add The Packaged Zread Favicon Asset

**Files:**
- Create: `public/icons/zread-favicon.ico`

- [ ] **Step 1: Download the favicon into the extension public icons directory**

Run:

```bash
curl -L --fail --show-error --output public/icons/zread-favicon.ico https://zread.ai/favicon.ico
```

Expected: command exits 0 and creates `public/icons/zread-favicon.ico`.

- [ ] **Step 2: Verify the downloaded asset shape**

Run:

```bash
file public/icons/zread-favicon.ico
ls -l public/icons/zread-favicon.ico
```

Expected: `file` reports an ICO image resource, and `ls` shows a non-empty file. A valid current result is approximately `2039` bytes and contains a PNG-backed icon.

- [ ] **Step 3: Commit the asset**

```bash
git add public/icons/zread-favicon.ico
git commit -m "package Zread favicon asset" \
  -m "Constraint: GitHub CSP blocks loading the remote Zread favicon from injected page DOM." \
  -m "Rejected: Fetching the favicon at build or runtime | it adds network availability to normal extension use." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Treat public/icons/zread-favicon.ico as the committed copy of the Zread favicon used by the GitHub button." \
  -m "Tested: curl --fail downloaded https://zread.ai/favicon.ico; file and ls verified a non-empty ICO asset." \
  -m "Not-tested: Code, manifest, and build wiring are handled in later tasks."
```

---

### Task 2: Update Button Runtime Path And Tests

**Files:**
- Modify: `lib/github/zread-button.ts`
- Modify: `lib/github/zread-button.test.ts`
- Test: `lib/github/zread-button.test.ts`

- [ ] **Step 1: Update the implementation icon path**

In `lib/github/zread-button.ts`, replace:

```ts
const ZREAD_ICON_PATH = 'icons/q-16.png';
```

with:

```ts
const ZREAD_ICON_PATH = 'icons/zread-favicon.ico';
```

- [ ] **Step 2: Update the test expectations**

In `lib/github/zread-button.test.ts`, update the root-page render test from:

```ts
    expect(getURL).toHaveBeenCalledWith('icons/q-16.png');
    expect(icon?.src).toBe('chrome-extension://qhelper-test/icons/q-16.png');
```

to:

```ts
    expect(getURL).toHaveBeenCalledWith('icons/zread-favicon.ico');
    expect(icon?.src).toBe('chrome-extension://qhelper-test/icons/zread-favicon.ico');
```

Do not change the missing-runtime fallback test. It should still assert no `<img>` when `chrome.runtime.getURL` is unavailable.

- [ ] **Step 3: Run the targeted unit test**

Run:

```bash
pnpm vitest run lib/github/zread-button.test.ts
```

Expected: PASS with the GitHub button test suite passing.

- [ ] **Step 4: Commit the path and test update**

```bash
git add lib/github/zread-button.ts lib/github/zread-button.test.ts
git commit -m "use packaged Zread favicon for GitHub button" \
  -m "Constraint: The GitHub button must show the Zread favicon without loading the remote favicon URL in page DOM." \
  -m "Rejected: Keeping icons/q-16.png | it shows QHelper branding instead of the requested Zread favicon." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Keep runtime icon loading through chrome.runtime.getURL and avoid direct remote image src values." \
  -m "Tested: pnpm vitest run lib/github/zread-button.test.ts" \
  -m "Not-tested: Manifest exposure and full build verification are handled in later tasks."
```

---

### Task 3: Expose The Zread Favicon In The Manifest

**Files:**
- Modify: `wxt.config.ts`
- Test: generated WXT build output

- [ ] **Step 1: Update the web-accessible resource path**

In `wxt.config.ts`, replace:

```ts
    web_accessible_resources: [
      {
        resources: ['icons/q-16.png'],
        matches: ['*://github.com/*'],
      },
    ],
```

with:

```ts
    web_accessible_resources: [
      {
        resources: ['icons/zread-favicon.ico'],
        matches: ['*://github.com/*'],
      },
    ],
```

Do not change the extension action icons. The extension itself should keep using QHelper's `q-16.png`, `q-48.png`, and `q-128.png`.

- [ ] **Step 2: Run a build to verify WXT accepts the manifest and copies the ICO**

Run:

```bash
pnpm run build
```

Expected: PASS and generated extension output under `.output/chrome-mv3/`.

- [ ] **Step 3: Inspect the generated manifest for the web-accessible resource**

Run:

```bash
node -e "const fs=require('fs'); const manifest=JSON.parse(fs.readFileSync('.output/chrome-mv3/manifest.json','utf8')); console.log(JSON.stringify(manifest.web_accessible_resources,null,2));"
```

Expected output contains:

```json
[
  {
    "resources": [
      "icons/zread-favicon.ico"
    ],
    "matches": [
      "*://github.com/*"
    ]
  }
]
```

- [ ] **Step 4: Verify the generated asset exists**

Run:

```bash
test -s .output/chrome-mv3/icons/zread-favicon.ico
```

Expected: command exits 0.

- [ ] **Step 5: Commit the manifest update**

```bash
git add wxt.config.ts
git commit -m "expose packaged Zread favicon for GitHub pages" \
  -m "Constraint: GitHub must be allowed to load the extension-packaged Zread favicon URL emitted by the content script." \
  -m "Rejected: Exposing q-16.png for this button | it no longer matches the requested Zread favicon asset." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Keep the Zread favicon web-accessible resource scoped to GitHub pages." \
  -m "Tested: pnpm run build; generated manifest includes icons/zread-favicon.ico for *://github.com/*; generated asset exists." \
  -m "Not-tested: Live browser smoke test on github.com/releases."
```

---

### Task 4: Run Final Verification

**Files:**
- Verify: `public/icons/zread-favicon.ico`
- Verify: `lib/github/zread-button.ts`
- Verify: `lib/github/zread-button.test.ts`
- Verify: `wxt.config.ts`

- [ ] **Step 1: Verify runtime code and tests do not directly use the remote favicon as an image source**

Run:

```bash
rg -n "zread\\.ai/favicon\\.ico|ZREAD_FAVICON_URL" lib entrypoints test wxt.config.ts
```

Expected: no matches.

- [ ] **Step 2: Verify the old QHelper icon path is no longer wired to the GitHub button or web-accessible resource**

Run:

```bash
rg -n "icons/q-16\\.png" lib/github/zread-button.ts lib/github/zread-button.test.ts wxt.config.ts
```

Expected: matches only in `wxt.config.ts` extension action icon configuration, not in `ZREAD_ICON_PATH`, GitHub button tests, or `web_accessible_resources`.

- [ ] **Step 3: Run the targeted unit tests**

Run:

```bash
pnpm vitest run lib/github/zread-button.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run the TypeScript check**

Run:

```bash
pnpm run type-check
```

Expected: PASS.

- [ ] **Step 5: Run lint**

Run:

```bash
pnpm run lint
```

Expected: PASS.

- [ ] **Step 6: Run production build**

Run:

```bash
pnpm run build
```

Expected: PASS. Existing Vite externalization and chunk-size warnings are acceptable if the build exits 0.

- [ ] **Step 7: Inspect generated manifest and output asset**

Run:

```bash
node -e "const fs=require('fs'); const manifest=JSON.parse(fs.readFileSync('.output/chrome-mv3/manifest.json','utf8')); console.log(JSON.stringify(manifest.web_accessible_resources,null,2)); if(!fs.existsSync('.output/chrome-mv3/icons/zread-favicon.ico')) throw new Error('missing generated zread favicon');"
```

Expected: output contains `icons/zread-favicon.ico` and `*://github.com/*`; command exits 0.

- [ ] **Step 8: Commit verification-only fixes if needed**

If lint or build requires formatting-only changes, commit them:

```bash
git add public/icons/zread-favicon.ico lib/github/zread-button.ts lib/github/zread-button.test.ts wxt.config.ts
git commit -m "verify packaged Zread favicon wiring" \
  -m "Constraint: Final checks must prove the GitHub button uses the packaged Zread favicon and not the remote favicon URL." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: Keep verification fixes limited to formatting or generated-manifest compatibility." \
  -m "Tested: rg remote favicon scan; rg q-16 GitHub wiring scan; pnpm vitest run lib/github/zread-button.test.ts; pnpm run type-check; pnpm run lint; pnpm run build; generated manifest and asset inspection." \
  -m "Not-tested: Live browser smoke test on github.com/releases."
```

If there are no changes after verification, do not create an empty commit.

## Self-Review

- Spec coverage: Task 1 commits the downloaded Zread favicon asset; Task 2 wires the button resolver and tests to `icons/zread-favicon.ico`; Task 3 exposes the ICO in the generated MV3 manifest; Task 4 verifies no direct remote favicon image source remains and runs targeted tests, typecheck, lint, build, manifest inspection, and output asset inspection.
- Placeholder scan: No placeholder steps, unspecified error handling, or cross-task shorthand remains.
- Type consistency: The plan consistently uses `ZREAD_ICON_PATH`, `icons/zread-favicon.ico`, `public/icons/zread-favicon.ico`, `chrome.runtime.getURL`, and Manifest V3 `web_accessible_resources`.
