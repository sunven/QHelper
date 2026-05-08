# Zread Favicon Local Asset Design

## Context

QHelper injects a Zread button into GitHub repository pages from `entrypoints/github.content.ts`. The shared DOM logic lives in `lib/github/zread-button.ts`.

The current merged CSP-safe implementation loads `public/icons/q-16.png` through `chrome.runtime.getURL('icons/q-16.png')` and exposes that file in `wxt.config.ts`. That avoids GitHub's Content Security Policy block, but it shows QHelper's icon instead of the Zread favicon.

The requested behavior is to use the visual asset served at `https://zread.ai/favicon.ico` while preserving the CSP-safe local resource loading model.

## Goal

Render the Zread button with the Zread favicon packaged inside the extension, not with the QHelper icon and not by loading the remote favicon URL from GitHub pages.

Success criteria:

- The injected button still links to `https://zread.ai/<owner>/<repo>`.
- The button image source resolves to an extension URL for `icons/zread-favicon.ico`.
- The packaged icon content comes from `https://zread.ai/favicon.ico`.
- GitHub pages can load the packaged icon through `web_accessible_resources`.
- The button still renders as text-only instead of throwing if extension runtime APIs are unavailable in a test-like environment.
- Source and tests do not use `https://zread.ai/favicon.ico` as the runtime `<img>` source.

## Architecture

Keep `entrypoints/github.content.ts` unchanged. It should continue to install the GitHub button by calling `installGitHubZreadButton(window, document)`.

Add a new packaged asset at `public/icons/zread-favicon.ico`. The asset should be downloaded from `https://zread.ai/favicon.ico` during implementation and committed to the repository. It should not be fetched at extension runtime or during normal builds.

Change `lib/github/zread-button.ts` so the existing local icon path points to `icons/zread-favicon.ico`. The existing safe runtime URL resolver should remain responsible for calling `globalThis.chrome?.runtime?.getURL(...)`. If the API is missing, it should still return `null` and the anchor should render only the `Zread` label.

Update `wxt.config.ts` so the manifest exposes `icons/zread-favicon.ico` through `web_accessible_resources`, scoped to `*://github.com/*`.

## Components

- `public/icons/zread-favicon.ico`
  - New committed asset copied from `https://zread.ai/favicon.ico`.
  - Source format remains ICO so the visual identity matches the source favicon as closely as possible.

- `lib/github/zread-button.ts`
  - Change the local icon path from `icons/q-16.png` to `icons/zread-favicon.ico`.
  - Keep the current safe `chrome.runtime.getURL` resolver and missing-runtime fallback.

- `wxt.config.ts`
  - Replace the web-accessible resource entry for `icons/q-16.png` with `icons/zread-favicon.ico`.
  - Keep the GitHub-only match pattern.

- `lib/github/zread-button.test.ts`
  - Update local icon URL assertions to expect `chrome-extension://.../icons/zread-favicon.ico`.
  - Keep coverage that missing runtime APIs render a text-only button.
  - Keep coverage that the Zread destination URL still points to `https://zread.ai/<owner>/<repo>`.

## Data Flow

GitHub loads the content script. The content script calls `installGitHubZreadButton`. Rendering still parses the owner and repository from the GitHub URL and metadata, builds the Zread page URL, and inserts a button into the supported GitHub header target.

The icon data path becomes:

1. The extension package includes `public/icons/zread-favicon.ico`.
2. `createZreadAnchor` asks the local icon resolver for `icons/zread-favicon.ico`.
3. In the extension runtime, the resolver returns `chrome-extension://<id>/icons/zread-favicon.ico`.
4. GitHub loads that packaged resource because the manifest declares it as web-accessible.
5. In tests or unsupported environments, the resolver returns `null`; the button still renders without an image.

## Error Handling

The resolver must not assume `chrome`, `chrome.runtime`, or `chrome.runtime.getURL` exists. If any part is unavailable, the feature should degrade to a text-only `Zread` button and keep the link behavior intact.

The implementation must not set the runtime image source to `https://zread.ai/favicon.ico`, because GitHub's CSP would block it again.

The favicon should be downloaded once during implementation. If the download fails, implementation should stop and report the network or source availability problem rather than adding a generated or unrelated replacement icon.

## Testing

Run targeted unit tests for the GitHub content script logic:

- `pnpm vitest run lib/github/zread-button.test.ts`

Then run the broader project checks that are relevant to a content-script asset and manifest change:

- `pnpm run type-check`
- `pnpm run lint`
- `pnpm run build`

Inspect the generated manifest and verify it exposes `icons/zread-favicon.ico` for `*://github.com/*`.

Expected result: all checks pass, the generated extension output includes `icons/zread-favicon.ico`, and no runtime source or test assertion uses the remote favicon URL as an `<img>` source.

## Out Of Scope

- Loading `https://zread.ai/favicon.ico` directly from GitHub pages.
- Changing the Zread destination URL.
- Redesigning the GitHub button placement.
- Adding build-time favicon downloading.
- Broadening web-accessible resource matches beyond GitHub.
