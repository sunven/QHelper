# Zread Local Icon CSP Design

## Context

QHelper injects a Zread button into GitHub repository pages from `entrypoints/github.content.ts`. The shared DOM logic lives in `lib/github/zread-button.ts`.

The current button renders an image with `src="https://zread.ai/favicon.ico"`. GitHub release pages reject that image because their Content Security Policy `img-src` directive does not allow `zread.ai`. The visible failure is a browser console CSP error on GitHub releases pages.

## Goal

Render the Zread button with a local extension icon so GitHub pages do not attempt to load `https://zread.ai/favicon.ico`.

Success criteria:

- The injected button still links to `https://zread.ai/<owner>/<repo>`.
- The button image source is produced from the extension package, not from `zread.ai`.
- GitHub pages can load the packaged icon.
- The button still renders as text-only instead of throwing if extension runtime APIs are unavailable in a test-like environment.

## Architecture

Keep `entrypoints/github.content.ts` unchanged. It should continue to install the GitHub button by calling `installGitHubZreadButton(window, document)`.

Change `lib/github/zread-button.ts` so icon URL resolution is owned by a small helper near button creation. That helper should use `globalThis.chrome?.runtime?.getURL('/icons/q-16.png')` when available. If the API is missing, it should return `null` and the anchor should render only the `Zread` label.

Update `wxt.config.ts` so the manifest exposes the packaged 16px icon through `web_accessible_resources`. The existing file `public/icons/q-16.png` is the source asset.

## Components

- `lib/github/zread-button.ts`
  - Replace the remote favicon constant with a local icon path.
  - Add a safe resolver for the content-script runtime URL.
  - Only append the `<img>` element when a usable local URL exists.

- `wxt.config.ts`
  - Add a Manifest V3 `web_accessible_resources` entry for `/icons/q-16.png` matched to `*://github.com/*`.

- `lib/github/zread-button.test.ts`
  - Update the existing icon assertion to expect a `chrome-extension://.../icons/q-16.png` URL.
  - Add coverage that no remote `zread.ai/favicon.ico` URL is emitted.
  - Add coverage that missing runtime APIs do not prevent rendering the button label and link.

## Data Flow

GitHub loads the content script. The content script calls `installGitHubZreadButton`. Rendering still parses the owner and repository from the GitHub URL and metadata, builds the Zread URL, and inserts a button into the supported GitHub header target.

The only changed data path is the icon URL:

1. `createZreadAnchor` asks the local icon resolver for `/icons/q-16.png`.
2. In the extension runtime, the resolver returns `chrome-extension://<id>/icons/q-16.png`.
3. GitHub loads that packaged resource because the manifest declares it as web-accessible.
4. In tests or unsupported environments, the resolver returns `null`; the button still renders without an image.

## Error Handling

The resolver must not assume `chrome`, `chrome.runtime`, or `chrome.runtime.getURL` exists. If any part is unavailable, the feature should degrade to a text-only `Zread` button and keep the link behavior intact.

The implementation should not fall back to `https://zread.ai/favicon.ico`, because that recreates the CSP violation.

## Testing

Run targeted unit tests for the GitHub content script logic:

- `pnpm vitest run lib/github/zread-button.test.ts`

Then run the broader project checks that are relevant to a content-script TypeScript change:

- `pnpm run type-check`
- `pnpm run lint`
- `pnpm run build`

Expected result: all checks pass, and no test expects or creates `https://zread.ai/favicon.ico`.

## Out Of Scope

- Changing the Zread destination URL.
- Redesigning the GitHub button placement.
- Adding new icon assets.
- Changing the GitHub content script match pattern.
