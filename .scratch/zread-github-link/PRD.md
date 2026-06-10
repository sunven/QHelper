# Zread to GitHub repository navigation
Status: done

## Problem Statement

When a developer is reading a repository on Zread, there is no direct way to jump back to the matching GitHub repository through QHelper. GitHub pages already have a Zread entry point, but the navigation is one-way, so users have to reconstruct the GitHub URL manually when they want to return to source.

## Solution

Add reciprocal repository navigation on Zread pages so the matching GitHub repository is always one click away. The new control should use the same repository identity that the existing GitHub-side integration already understands, and it should stay out of the way on pages that are not tied to a repository.

## User Stories

1. As a developer reading a repository on Zread, I want a GitHub link back to the same repository, so that I can inspect the canonical source without rebuilding the URL myself.
2. As a developer moving between GitHub and Zread, I want both directions to work, so that navigation feels symmetrical and predictable.
3. As a developer on a Zread subpage, I want the GitHub link to resolve to the repository root, so that I can return to the main project page from deep content.
4. As a developer on a Zread page that does not represent a repository, I do not want QHelper to inject a repository link, so that unrelated pages stay uncluttered.
5. As a developer using client-side navigation, I want the injected link to update or disappear as I move between pages, so that it never points at the wrong repository.
6. As a developer using the extension on GitHub, I want the existing GitHub-to-Zread behavior to keep working, so that the new feature does not regress the current flow.
7. As a developer landing on a Zread page with a different header layout, I want the link to appear in a sensible fallback location, so that the feature still works when the primary slot is unavailable.
8. As a developer whose browser runtime cannot provide the extension icon, I still want the control to render as a usable text link, so that the navigation still works.
9. As a developer opening the reciprocal link, I want it to open the target in a new tab, so that I do not lose my current reading position.
10. As a developer inspecting a repository through Zread after navigating from GitHub, I want the reverse link to preserve the same owner and repository names, so that I do not end up in the wrong project.
11. As a developer on a repository page with late-rendered page chrome, I want the link to attach after the page finishes mounting, so that it is visible once the host app settles.
12. As a developer who revisits the same repository repeatedly, I want only one injected reciprocal link at a time, so that duplicate controls do not accumulate after navigation.

## Implementation Decisions

- Extend the repository-navigation feature to recognize Zread repository pages in addition to GitHub pages.
- Reuse the existing repository-coordinate parsing and URL-building rules as the source of truth for both directions.
- Add a Zread-side injection path that renders a GitHub link for the matching repository, instead of requiring users to manually edit the address bar.
- Keep the current GitHub-side Zread control in place; this work is additive and should not remove the existing reader links.
- Share the DOM insertion and cleanup behavior where possible so navigation, remounts, and route changes do not duplicate controls.
- Prefer a stable, high-visibility placement in the page chrome, with a fallback location when the preferred slot is missing.

## Testing Decisions

- Test the URL and coordinate helpers with repository root paths and subpaths for both GitHub and Zread.
- Test the DOM injection behavior on supported repository pages, unsupported pages, and late-mounted page chrome.
- Test that navigation removes stale controls and does not duplicate the reciprocal link after rerenders.
- Test that the GitHub-side behavior still renders its existing Zread control unchanged.
- Use the existing GitHub content-script and Zread-button tests as prior art for DOM-oriented behavior tests.

## Out of Scope

- Redesigning the existing GitHub-side dropdown beyond what is needed to share the reciprocal-link logic.
- Adding support for non-repository Zread pages such as search results or documentation pages.
- Adding new destination services beyond the existing GitHub, Zread, DeepWiki, and github.dev destinations.
- Changing Zread or GitHub branding, styling, or site chrome outside the injected control.

## Further Notes

The current codebase already injects a Zread control on GitHub pages. This PRD fills the missing reverse path so the navigation is bidirectional instead of one-way.
