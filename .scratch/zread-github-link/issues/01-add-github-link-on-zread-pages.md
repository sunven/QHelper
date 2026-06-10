# Add a GitHub link on Zread repository pages
Status: done

## What to build

Extend QHelper's repository-navigation behavior so Zread repository pages expose a GitHub link for the matching repository. Reuse the existing repository identity rules so root pages and subpages resolve to the same owner/repo pair, and keep the current GitHub-side Zread control intact.

## Acceptance criteria

- [x] Zread repository root pages show a GitHub link to the matching repository.
- [x] Zread repository subpages resolve to the same repository root.
- [x] Unsupported pages do not inject the reciprocal control.
- [x] The existing GitHub-to-Zread behavior still renders.
- [x] Tests cover parsing, DOM injection, cleanup, and regression behavior.

## Blocked by

None - can start immediately
