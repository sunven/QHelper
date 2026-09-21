# Google search Open in for GitHub results
Status: done

## Problem Statement

On Google web search, GitHub repository hits are ordinary blue links. QHelper already offers an **Open in Menu** (Zread, DeepWiki, github.dev) on `github.com` repository pages, but that control is a **Repository Page Helper**: its subject is the currently viewed repository. A search results page is not a repository page, so users who discover a repo from Google have to open GitHub first, then use Open in.

## Solution

Add a **Repository Result Helper** on Google web search result pages. For each organic result whose primary URL identifies a public GitHub repository, inject an **Open in Menu** for that repository. The helper is gated by a **Synced Setting** that defaults to on. GitHub.com Open in is unchanged and is not gated by this setting.

A throwaway layout prototype lives at `.scratch/google-open-in/prototype.html`.

## User Stories

1. As a developer scanning Google web results, I want an Open in control on GitHub repository hits, so that I can open Zread, DeepWiki, or github.dev without first visiting GitHub.
2. As a developer whose result is a file, issue, or other repository subpath, I want Open in to target the repository root, so that the destinations match GitHub.com Open in.
3. As a developer looking at sitelinks, ads, knowledge panels, or People also ask, I do not want Open in on those modules, so that only the organic title is decorated.
4. As a developer whose result is a Gist, GitHub Pages site, or a GitHub directory/search URL, I do not want Open in, so that fake owner/repo pairs are not invented.
5. As a developer on a regional Google host (`google.com.hk`, `google.co.jp`, and similar), I want the same helper on web search, so that locale choice does not drop the feature.
6. As a developer on Images, News, Scholar, or another search engine, I do not expect this helper, so that injection stays scoped to Google web search.
7. As a developer who does not want search results modified, I want a Settings toggle that removes the helper, so that I can turn it off without affecting GitHub.com Open in.
8. As a developer who never opens Settings, I still see Open in on matching Google results, because the Synced Setting defaults to on.
9. As a developer opening a destination, I want it in a new tab, so that the search page stays put.
10. As a developer reading a wrapping result title, I want the trigger tucked against the title text, so that it does not sit on the far right of the result column.

## Implementation Decisions

- Identity: **Repository Result Helper** presenting an **Open in Menu**. Do not extend **Repository Page Helper**.
- Subject: parse `github.com/{owner}/{repo}` and subpaths from the organic result's primary URL. Exclude GitHub reserved first path segments, `gist.github.com`, and `*.github.io`.
- Destinations: Zread, DeepWiki, github.dev at the repository root, same as GitHub.com Open in.
- Surface: Google web search result pages on regional Google hosts. All tab is in scope. Vertical search is out of scope.
- Placement: one control per matching organic result, on the primary title link only.
- Chrome: a small icon trigger, inline after the title text, Google-like styling, no Primer `btn` classes, no Zread favicon on SERP.
- Enablement: a **Synced Setting** declared as a **Tool Setting Definition**, applied through a **Tool Setting Watcher**, default on (ADR-0003). Settings copy:
  - Section: `Google 搜索`
  - Description: `在网页搜索结果里，为 GitHub 仓库显示 Open in。`
  - Checkbox: `在 Google 搜索结果中显示 Open in`
- GitHub.com Open in stays always-on and ignores this setting.
- Use **Page Helper Lifecycle** for Google's in-page search navigation and result rerenders.
- Classify subjects from the result URL locally. Do not fetch GitHub or send search content off the page.
- Prefer a stable title heuristic (main-column link that contains the result heading) over hashed SERP class names such as `.g` or `.tF2Cxc`.

## Testing Decisions

- URL classification: repository root, subpaths, reserved GitHub paths, Gist, GitHub Pages, non-GitHub results.
- Injection: matching organic titles get one Open in Menu; ads, sitelinks, knowledge panel, and non-GitHub titles do not.
- Destinations always resolve to `{owner}/{repo}` even when the result URL is a subpath.
- Setting off removes the helper; setting on restores it. GitHub.com Open in is unaffected.
- Lifecycle: query changes and result rerenders replace stale menus and do not duplicate them.
