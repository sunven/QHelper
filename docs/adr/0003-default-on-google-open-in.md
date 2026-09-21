---
status: accepted
---

# Default the Google Open in Repository Result Helper to on

The **Repository Result Helper** is a **Synced Setting** that defaults to enabled. Dictionary selection lookup also injects into third-party pages and defaults to off because it runs on `<all_urls>`; this helper only runs on Google web search, and the feature is useless if the user must discover a Settings checkbox before any result shows Open in. Changing the default later rewrites behavior for profiles that never touched the setting, so keep the opt-out explicit.

## Considered Options

- Default on (chosen): Open in appears on matching Google results immediately; users who do not want SERP injection turn it off.
- Default off: matches dictionary, but hides the feature until Settings is opened.
- No setting: matches GitHub.com Open in, but Google SERP injection is harder to undo when layout fights the control.
