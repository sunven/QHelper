---
status: accepted
---

# Split auto-refresh execution between alarms and page timers

**Refresh Rules** are URL-keyed, persist across browser restarts, and apply automatically to matching tabs, so their reloads must survive a tab being in the background. **Session Refreshes** are started by the user on the page they are watching and need seconds-level intervals. Chrome's `chrome.alarms` has a minimum period of about 30 seconds and may delay further, while page timers can fire every few seconds but are throttled in hidden tabs. Use `chrome.alarms` for **Refresh Rules** (minimum 30 seconds) and an injected page timer for **Session Refreshes** (minimum 5 seconds), accepting that only visible **Session Refreshes** are accurate.

## Considered Options

- One alarms path for everything: reliable in the background, but cannot offer seconds-level refreshes.
- One page-timer path for everything: seconds-level and one mechanism, but persistent rules would stop refreshing on hidden tabs once Chrome throttles them.
- Restrict both to 30 seconds: simplest and most reliable, but loses the interactive use case that justifies **Session Refresh**.

## Consequences

- The extension needs the `alarms` permission; `tabs`, `storage`, `scripting`, and `<all_urls>` host access are already present.
- Hidden tabs running a **Session Refresh** may refresh far less often than configured; the UI must not promise background accuracy for them.
- **Refresh Rules** can keep working when a page cannot host the **Refresh Indicator**; a **Session Refresh** cannot start on such pages.
- Both paths skip ticks while a tab is loading, discarded, or frozen, so a slow page is refreshed on the next interval rather than in a reload loop.