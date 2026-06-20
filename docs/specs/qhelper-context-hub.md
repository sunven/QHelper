# Spec: QHelper Context Hub

## Objective

QHelper Context Hub turns QHelper from a list of standalone tools into a context-aware developer input hub. The first version helps general developers paste or route structured development data into QHelper, lets QHelper detect what the data likely is, and recommends the next useful action.

The primary user is a developer working inside the browser who frequently handles JSON, URLs, encoded strings, timestamps, JWTs, Cron expressions, and similar structured snippets. The product goal is high-frequency use: the user should remember "send it to QHelper" instead of remembering which exact tool to open.

The MVP should:

- Provide a full Context Hub experience in the tools SPA.
- Provide a lightweight popup entry that can open the Context Hub and optionally pass pasted content later.
- Detect structured input locally without sending content to a network service.
- Recommend existing QHelper tools/actions instead of introducing a broad new tool category.
- Avoid saving processed content by default.

## Tech Stack

- Chrome/Chromium extension built with WXT `^0.20.25`
- React `^19.2.5`
- TypeScript `^6.0.3`
- Tailwind CSS v4
- pnpm package manager
- Vitest + React Testing Library for unit/component tests
- Playwright for extension E2E tests when browser behavior is required

## Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Type check: `pnpm type-check`
- Lint: `pnpm lint`
- Unit/component tests: `pnpm test:run`
- E2E tests: `pnpm test:e2e`

## Project Structure

- `lib/context-hub/` -> input detection, recommendation mapping, pure domain logic, and tests
- `components/tool/context-hub.tsx` -> Context Hub tool page UI
- `lib/registry/tools.ts` -> Context Hub tool metadata
- `components/tool/tool-routes.tsx` -> route registration for the Context Hub tool page
- `lib/tool-catalog.ts` -> launch metadata only if a special popup launch entry is needed
- `entrypoints/popup/index.tsx` -> popup surface entry for opening Context Hub
- `test/` and adjacent `*.test.ts(x)` files -> unit/component coverage
- `tests/e2e/` -> extension-level behavior only when needed
- `docs/specs/qhelper-context-hub.md` -> this living spec

## Code Style

Follow the existing QHelper style: strict TypeScript, root-relative imports with `@/*` where useful, single quotes, no semicolons after Biome formatting, and domain logic kept out of React components.

Example domain shape:

```ts
export type ContextInputKind =
  | 'json'
  | 'url'
  | 'base64'
  | 'timestamp'
  | 'jwt'
  | 'cron'
  | 'unknown'

export type ContextRecommendation = {
  id: string
  label: string
  toolId: string
  confidence: 'high' | 'medium' | 'low'
}

export function detectContextInput(value: string): ContextInputKind {
  const input = value.trim()
  if (!input) {
    return 'unknown'
  }

  if (looksLikeJson(input)) {
    return 'json'
  }

  return 'unknown'
}
```

Detection code should be deterministic and testable. React components should render state and call pure helpers; they should not contain the core detection rules.

## Testing Strategy

Use focused tests before broad checks.

- Unit tests for `lib/context-hub/` detection and recommendation behavior.
- Component tests for the Context Hub tool page: empty input, detected input, unknown input, clear input, and action rendering.
- Catalog/route tests should be updated if adding a new ordinary tool id changes expected tool lists.
- E2E tests are optional for the MVP unless popup-to-tool navigation passes data or depends on Chrome extension APIs.

Minimum pre-handoff verification for implementation:

- `pnpm type-check`
- `pnpm lint`
- `pnpm test:run`

## Boundaries

- Always: keep detection local and deterministic.
- Always: route recommendations to existing QHelper tools where possible.
- Always: default to not persisting user input or processed content.
- Always: preserve the current privacy model for web summary and AI features.
- Always: add focused tests for every detector added.
- Ask first: adding a dependency for detection/parsing.
- Ask first: changing Chrome extension permissions.
- Ask first: enabling automatic content capture from arbitrary pages.
- Ask first: persisting Context Hub input/history by default.
- Ask first: changing popup layout from grid-first to command-palette-first.
- Never: upload Context Hub input to external services without an explicit user action and existing AI configuration.
- Never: store secrets, tokens, JWTs, cookies, logs, or pasted config content by default.
- Never: edit `.output/`, `.wxt/`, `coverage/`, `playwright-report/`, `test-results/`, or `node_modules/` manually.

## Success Criteria

- A developer can open Context Hub from the tools SPA and paste structured data into one primary input.
- The MVP detects at least these input kinds locally: JSON, URL, Base64, Unix timestamp, JWT, and Cron.
- Each detected kind shows one or more useful next actions that open or map to existing QHelper tools.
- Unknown input gives a clear fallback instead of a false confident recommendation.
- Context Hub does not save pasted content by default.
- The popup exposes a clear entry to open Context Hub without replacing the existing tool catalog.
- Detection and recommendation logic has focused unit coverage.
- The feature passes `pnpm type-check`, `pnpm lint`, and `pnpm test:run` before handoff.

## Open Questions

- Should Context Hub be the default tool route eventually, replacing JSON as `DEFAULT_TOOL_ID`?
- Should popup support paste-and-open in the first implementation, or only open the Context Hub page?
- Should detected JWTs route to a new JWT decoder later, or should the MVP treat JWT as structured Base64/JSON and show a partial decode inside Context Hub?
- Should YAML and XML be included in MVP detection if existing tools already support them, or deferred until the first version proves useful?
- Should right-click "Process selected text with QHelper" be part of MVP or a follow-up once the tool page proves the core flow?

## Implementation Plan

### Phase 1: Domain Model and Detection

Build the Context Hub core as pure TypeScript under `lib/context-hub/`.

Components:

- `types.ts` defines input kinds, detection confidence, detected facts, and recommendation shapes.
- `detect.ts` owns deterministic local detection.
- `recommend.ts` maps detection results to existing QHelper tools and local actions.
- `jwt.ts` provides minimal local JWT structure parsing for header/payload preview only.

Detection order should prefer more specific formats before generic ones:

1. JWT: three base64url segments where header and payload decode as JSON objects.
2. JSON: valid JSON object or array.
3. URL: `http:`, `https:`, or URL-like input accepted by `new URL`.
4. Unix timestamp: 10-digit seconds or 13-digit milliseconds with a plausible date range.
5. Cron: five-field expression accepted by `cron-parser`.
6. Base64: decodes to UTF-8 text and is not already classified as JWT.
7. Unknown: no confident match.

Risks:

- Base64 and JWT overlap. Mitigation: detect JWT first.
- Numeric strings can be IDs, not timestamps. Mitigation: require 10 or 13 digits and plausible date range.
- Cron expressions can look like arbitrary short text. Mitigation: require exactly five fields for MVP and use `cron-parser` validation.

Verification checkpoint:

- Unit tests cover positive and negative examples for every MVP kind.
- Unknown detection is tested so the Hub does not over-recommend.

### Phase 2: Recommendations and Navigation Contract

Connect detection results to existing tools without requiring those tools to accept prefilled state in the MVP.

Recommendation examples:

- JSON -> open JSON formatter.
- URL -> open URL parser.
- Base64 -> open string encode/decode.
- Unix timestamp -> open timestamp converter.
- Cron -> open Cron parser.
- JWT -> show local header/payload preview in Context Hub and offer string decode/JSON tool actions.
- Unknown -> show a neutral fallback and suggest manual tool search/navigation.

Navigation should use `getToolNavigationPath` or catalog-derived paths instead of hard-coded extension URLs. Context Hub should not call internal setters from other tools.

Risks:

- "Open tool" without carrying input may feel incomplete. Mitigation: keep the first version honest and avoid cross-tool state coupling; add prefilled handoff later as a separate contract.
- Recommendations can drift if tool ids change. Mitigation: unit-test recommendation tool ids against `isOrdinaryToolId`.

Verification checkpoint:

- Recommendation tests assert expected tool ids and labels.
- Catalog tests still pass after adding the Context Hub tool.

### Phase 3: Context Hub Tool Page

Add `components/tool/context-hub.tsx` as an ordinary tool page.

UI structure:

- Primary textarea for pasted structured input.
- Detection summary showing kind, confidence, and short explanation.
- Recommended actions as buttons/links.
- Inline preview area for safe local facts, especially JWT header/payload and timestamp interpretation.
- Clear button.
- Privacy note stating input is processed locally and not saved by default.

The component should use `ToolPageShell toolId="context-hub"` and existing UI primitives from `components/ui/`. It should keep state local with `useState`, not `useToolHistory` or `useToolState`, to preserve the "not saved by default" policy.

Risks:

- Large pasted input can make detection expensive. Mitigation: keep detection lightweight, trim display summaries, and avoid rendering full parsed trees in the Hub.
- UI can become another dense tool page. Mitigation: make the first screen one input plus the next best action, not a dashboard.

Verification checkpoint:

- Component tests cover empty input, JSON input, URL input, JWT input, unknown input, clear behavior, and no history persistence calls.

### Phase 4: Catalog, Routing, and Popup Entry

Register Context Hub as an ordinary tool:

- Add metadata in `lib/registry/tools.ts`.
- Add route import and component mapping in `components/tool/tool-routes.tsx`.
- Let generated catalog aliases and sidebar navigation derive from the existing Tool Catalog.

Popup behavior:

- Add a visible popup launch entry by virtue of ordinary tool registration.
- Do not replace the existing popup grid in the MVP.
- Do not implement popup paste-and-open in the first implementation unless explicitly approved later.

Risks:

- Adding another tool to the Common category may make popup scanning worse. Mitigation: place Context Hub near the top of Common and keep the existing category structure.
- Making it the default route changes user muscle memory. Mitigation: do not change `DEFAULT_TOOL_ID` in MVP.

Verification checkpoint:

- `lib/tool-catalog.test.ts` passes with the new ordinary tool id.
- `components/ToolSideNavigation.test.tsx` still passes.
- The tools route can render the Context Hub page.

### Phase 5: Validation and Release Readiness

Run the minimum verification commands from this spec:

- `pnpm type-check`
- `pnpm lint`
- `pnpm test:run`

If implementation touches popup behavior beyond ordinary catalog registration, add or run targeted popup tests. If implementation introduces selected-text or active-page behavior later, require extension E2E coverage and a privacy review before release.

### Sequencing

Sequential:

1. Domain model and detection must land before UI.
2. Recommendations depend on detection result shape.
3. Tool page depends on detection and recommendations.
4. Catalog/route wiring depends on the component existing.

Parallelizable after Phase 1:

- Recommendation tests and UI layout can be developed in parallel if the detection result type is stable.
- Catalog test updates can be done independently once the chosen tool id is fixed.

### Decisions for MVP

- Context Hub remains an ordinary tool, not the default tool route.
- Popup entry opens Context Hub only; it does not pass pasted content yet.
- JWT gets a local preview inside Context Hub, not a full JWT decoder tool.
- YAML, XML, selected-text right-click, and active-page capture are follow-up features.
- Context Hub input is not saved to tool history or synced/local persisted state.

## Tasks

- [x] Task 1: Add Context Hub domain types and JWT parser
  - Acceptance: `lib/context-hub/` exposes stable types for input kind, confidence, detection result, facts, and recommendations; JWT helper decodes base64url header/payload JSON without verifying signatures.
  - Verify: `pnpm test:run -- lib/context-hub/jwt.test.ts`
  - Files: `lib/context-hub/types.ts`, `lib/context-hub/jwt.ts`, `lib/context-hub/jwt.test.ts`

- [x] Task 2: Implement structured input detection
  - Acceptance: `detectContextInput` classifies JWT, JSON, URL, Unix timestamp, Cron, Base64, and unknown according to the confirmed detection order.
  - Verify: `pnpm test:run -- lib/context-hub/detect.test.ts`
  - Files: `lib/context-hub/detect.ts`, `lib/context-hub/detect.test.ts`, `lib/context-hub/types.ts`

- [x] Task 3: Implement recommendation mapping
  - Acceptance: each detected kind maps to useful actions using existing tool ids; recommendation tests assert all target tool ids are ordinary tools where applicable.
  - Verify: `pnpm test:run -- lib/context-hub/recommend.test.ts`
  - Files: `lib/context-hub/recommend.ts`, `lib/context-hub/recommend.test.ts`, `lib/context-hub/types.ts`

- [x] Task 4: Add Context Hub tool page component
  - Acceptance: the tool page renders one primary textarea, detection summary, local preview/facts, recommended actions, clear button, and privacy note; it stores input only in component state.
  - Verify: `pnpm test:run -- components/tool/context-hub.test.tsx`
  - Files: `components/tool/context-hub.tsx`, `components/tool/context-hub.test.tsx`

- [x] Task 5: Register Context Hub in the tool catalog and routes
  - Acceptance: Context Hub appears as an ordinary Common tool, has a generated `/tools/context-hub.html` path, renders inside the tools SPA, and appears in sidebar/popup through existing catalog derivation.
  - Verify: `pnpm test:run -- lib/tool-catalog.test.ts entrypoints/tools/index.test.tsx components/ToolSideNavigation.test.tsx`
  - Files: `lib/registry/tools.ts`, `components/tool/tool-routes.tsx`, `lib/tool-catalog.test.ts`, `entrypoints/tools/index.test.tsx`, `components/ToolSideNavigation.test.tsx`

- [x] Task 6: Add focused UI route coverage if needed
  - Acceptance: tests prove `/context-hub.html` or equivalent route renders the Context Hub tool through `ToolActivityOutlet` without changing `DEFAULT_TOOL_ID`.
  - Verify: `pnpm test:run -- entrypoints/tools/ToolActivityOutlet.test.tsx entrypoints/tools/index.test.tsx`
  - Files: `entrypoints/tools/ToolActivityOutlet.test.tsx`, `entrypoints/tools/index.test.tsx`

- [x] Task 7: Run full local verification and update spec if decisions changed
  - Acceptance: implementation passes required checks; any changed MVP decision is reflected in this spec before handoff.
  - Verify: `pnpm type-check`, `pnpm lint`, `pnpm test:run`
  - Files: `docs/specs/qhelper-context-hub.md` only if decisions changed
