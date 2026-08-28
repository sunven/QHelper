# Inactive Repository Warning Repository Page Helper
Status: done

## What to build

Add an **Inactive Repository Warning** to GitHub Repository Home Pages: when the default branch's latest commit is older than 180 days, show a warning-colored floating button above the Star History View button with a tooltip stating the time since the last commit. See `.scratch/github-inactive-warning/PRD.md` for the full specification.

## Acceptance criteria

- [x] The warning appears only on the Repository Home Page of repositories whose default branch latest commit (committer date) is more than 90 days old.
- [x] Active repositories, archived repositories, empty repositories, and API failures show nothing.
- [x] The repository's own last-commit `<relative-time>` (matching the default branch head commit) is recolored with GitHub's attention color; no extra UI is injected.
- [x] Results are cached per owner/repo in storage.local with a 7-day TTL.
- [x] The helper participates in the Repository Page Helper Lifecycle (SPA navigation, retry, mutation recovery) without duplication.
- [x] Background message handling follows the star-history-background pattern with injected deps.
- [x] Tests cover threshold logic, message handling, cache TTL, and view rendering.

## Blocked by

None - can start immediately

## Comments

2026-08-28: Replaced the floating warning button with recoloring GitHub's own last-commit `<relative-time>` (attention color, matched via `datetime`). The button experiment was superseded the day after initial implementation; the verdict pipeline (background message, committer date, 7-day cache) is unchanged.
2026-08-28: Timestamp targeting fixed twice: file rows touched by the head commit share its `datetime`, and GitHub renders the file table before the latest-commit row in DOM order, so both "match all" and "first match in DOM order" recolored the wrong element. The highlight now targets `relative-time` inside `[data-testid="latest-commit"]` with the datetime still matched against the head committer date; no highlight when the container is absent.
2026-08-28: The `latest-commit` testid is the collapsed message box, not an ancestor of the timestamp; the hash+timestamp live in `[data-testid="latest-commit-details"]`. Targeting moved accordingly.
2026-08-28: Threshold lowered from 180 to 90 days; highlight restyled from muted amber to GitHub orange (`#bc4c00`/`#f0883e`) with bold weight and an opacity pulse honoring `prefers-reduced-motion`. Cached verdicts stay valid because inactivity is recomputed from the stored committer date on every response.

