# TODOs

## Dictionary Dynamic Registration

- **What:** Consider registering the dictionary selection lookup content script only when the feature is enabled, or move it behind optional host permissions.
- **Why:** `entrypoints/dictionary.content.tsx` currently runs on `<all_urls>` and subscribes to settings on every page, even though `selectionLookupEnabled` defaults to `false` and the actual selection listeners mount only when enabled.
- **Pros:** Narrows the extension's persistent page footprint and further reduces store-review and privacy surface after web summary moves to on-demand injection.
- **Cons:** Requires careful handling for already-open tabs when the setting changes, plus tests for enable, disable, reload, and unsupported pages.
- **Context:** Web Summary now uses user-triggered `chrome.scripting.executeScript` instead of a persistent content script. Dictionary is lower risk because the feature is opt-in, but it is the remaining broad content-script surface worth revisiting.
- **Depends on / blocked by:** Decide whether the dictionary UX should activate immediately on existing tabs or only after reload/navigation.
