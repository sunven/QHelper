# Inactive Repository Warning on GitHub
Status: ready-for-agent

## Problem Statement

When a developer opens a GitHub repository to evaluate it as a dependency or reference, the first visible signal of abandonment is buried in the commit history. A repository can look healthy from its README and star count while its default branch has been silent for many months. There is no ambient cue at reading time that the project has stopped receiving commits.

## Solution

Add an **Inactive Repository Warning** as a **Repository Page Helper** on the GitHub **Repository Home Page**. When the repository's default branch has received no new commits for more than 90 days, the repository's own last-commit timestamp on the home page is recolored with an attention-grabbing warning color and a gentle pulse animation. Active repositories leave the timestamp untouched.

## User Stories

1. As a developer evaluating a repository as a dependency, I want an ambient warning when it has not received commits in over half a year, so that I can factor maintenance risk into my decision without digging through commit history.
2. As a developer browsing an active repository, I want no extra UI, so that the helper stays invisible when it has nothing to say.
3. As a developer scanning a repository, I want the warning on the timestamp I already read, so that the last-commit age stands out without any extra UI.
4. As a developer opening an archived repository, I want GitHub's own archive banner to remain the only signal, so that the helper does not duplicate a stronger indicator.
5. As a developer opening an empty or inaccessible repository, I want silence, so that missing data never renders a false warning.
6. As a developer navigating between repositories with GitHub's client-side routing, I want the warning to appear and disappear with the current repository, so that it never describes the wrong project.
7. As a developer browsing many repositories in a session, I want repeated visits to avoid extra GitHub API calls, so that the helper stays within unauthenticated rate limits.

## Implementation Decisions

- Inactivity is judged by the default branch's latest commit **committer date** (`GET /repos/{owner}/{repo}/commits?per_page=1` when the SHA is omitted), not `pushed_at` (pushes to any branch refresh it) and not the author date (rebases preserve it).
- The repository metadata call (`GET /repos/{owner}/{repo}`) short-circuits archived repositories before the commit lookup.
- Forks are judged on their own history, not the upstream's.
- The threshold is a single constant: 90 days.
- The warning recolors GitHub's own last-commit `<relative-time>` on the Repository Home Page: the element whose `datetime` matches the default branch head commit's committer date gets an attention-colored class (GitHub orange `#bc4c00` light / `#f0883e` dark, bold) with a gentle opacity pulse that respects `prefers-reduced-motion`. No extra UI is injected.
- Data fetching follows the Star History background pattern: the content script sends a runtime message, a new `lib/github/inactive-warning-background.ts` handler performs both API calls in the background worker, and `entrypoints/background.ts` wires the handler.
- Results are cached in `storage.local` per `owner/repo` (committer date, archived flag, fetched-at) with a 7-day TTL.
- The helper plugs into the Repository Page Helper Lifecycle via a `RepositoryPageHelperAdapter` and renders only on the Repository Home Page, reusing `getRepositoryCoordinates` and `isRepositoryHomePath` from `lib/github/repository.ts`.
- No Tool Setting toggle: the GitHub page helpers currently install unconditionally, and this helper follows that precedent.

## Testing Decisions

- Threshold logic (180-day boundary, committer-date comparison) as pure functions with fixed dates.
- Message type guard and background handler with injected fetch deps: archived short-circuit, empty-commit list, API failure, and rate-limit failure all resolve without throwing.
- Cache read/write with TTL: fresh hit, stale miss, archived entries.
- View rendering: highlights on Repository Home Page only, absent on subpages, not duplicated after SPA navigation or DOM recovery, timestamp matching by `datetime`.
- Use the Star History view and background tests as prior art.

## Out of Scope

- A Tool Setting toggle for the warning.
- Configurable thresholds.
- Judging activity by issues, releases, or stars.
- Showing the warning on repository subpages (issues, pull requests, file views).
- Click actions such as opening the commit history.

## Further Notes

Design consensus reached 2026-08-27 through a grilling session. Iterated 2026-08-28 (2): threshold lowered from 180 to 90 days at user request; highlight upgraded from muted amber to GitHub orange with bold weight and a pulse animation.
Iterated 2026-08-28: the floating warning button was replaced by recoloring GitHub's own last-commit timestamp, which puts the signal on the timestamp the reader already looks at. The committer-date choice is deliberate: rebase and merge refresh it, so it reflects when code actually landed on the default branch. Do not "simplify" it to `pushed_at` or the author date; both alternatives were considered and rejected.
