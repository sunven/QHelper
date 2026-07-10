# QHelper

QHelper is a browser extension that provides developer-focused tools and optional page helpers. Its language distinguishes user preferences from captured data, credentials, and transient tool state.

## Language

**Tool Setting**:
A user preference that controls how a QHelper tool behaves. A **Tool Setting** is defined via `defineSetting(key, defaults)` in `lib/settings.ts`, which returns `{get, set, subscribe, reset}`. The module handles sync/local fallback internally; definitions are declarations, not implementations. A **Tool Setting** is not captured content, request data, tool history, or an API credential.
_Avoid_: Tool data, runtime state, cache

**Tool Setting Definition**:
The source-of-truth declaration for a **Tool Setting**. It names the preference and defines how QHelper interprets it, without being captured content, request data, tool history, or an API credential.
_Avoid_: Setting wrapper, storage config, option schema

**Tool Setting Page State**:
The page-level state that presents **Tool Settings** for editing. It owns loading, subscriptions, optimistic saves, rollback, **Local Setting Fallback** messaging, and autosave behavior; the Settings page UI renders this state but does not call individual **Tool Setting Definitions** directly.
_Avoid_: Settings component logic, settings form helper, options page state

**Synced Setting**:
A low-sensitivity **Tool Setting** that should follow the user's browser profile across devices. Synced Settings are small preferences, not captured content, request data, tool history, API credentials, or backups.
_Avoid_: Cloud backup, telemetry, synced data

**Local Setting Fallback**:
A device-local copy of a **Synced Setting** used when browser profile sync cannot read or write successfully. It preserves tool behavior on the current device without changing captured content, request data, tool history, or credentials into Synced Settings.
_Avoid_: Sync failure, offline mode, backup

**Persisted Tool Data**:
Device-local information that lets a QHelper tool resume or display prior work on the same browser profile. Persisted Tool Data includes tool state and tool history, but not a **Synced Setting**.
_Avoid_: Synced data, cloud state, backup

**Text Preview Workspace**:
The **Persisted Tool Data** for the Text Preview tool. It contains open text tabs, the active tab, each tab's source, and local-file save status; it may reference recoverable local file handles, but it is not a **Tool Setting** or a **Synced Setting**.
_Avoid_: Text preview cache, editor state, file backup

**Text Diff Tool**:
An ordinary QHelper tool that compares two revisions of plain text without interpreting them as structured data. It treats line-ending conventions as equivalent, is not a byte-level file comparison, and is distinct from the structural Diff provided by the JSON tool.
_Avoid_: JSON Diff, Text Preview

**Tool Catalog**:
The source-of-truth collection of QHelper tools and their user-facing identity. It defines tool names, categories, category order, category labels, descriptions, stable icon tokens, and paths for navigation, popup entry points, and tool routes. Ordinary tool paths are derived by the **Tool Catalog** from the tool id unless an entry is explicitly not an ordinary tool page. The **Tool Catalog** does not own React icon modules or visual accent styles; those belong to the surface adapter.
_Avoid_: Tool registry, navigation config, route map

**Launch Entry**:
A user-startable QHelper destination or command declared by the **Tool Catalog**. A **Launch Entry** describes identity, surface visibility, and launch intent for ordinary tool pages, system pages such as settings, extension pages such as bookmarks, side panel actions, and browser commands such as clearing cookies. A **Launch Entry** does not execute Chrome behavior itself; execution belongs to the adapter that consumes the catalog in its surface. Destructive browser commands are still **Launch Entries**, but must declare their risk so the adapter can confirm before execution.
_Avoid_: Popup-only tool, special tool, action config

**Repository Page Helper**:
An optional QHelper aid that appears in the context of the currently viewed public code repository. A **Repository Page Helper** is not a standalone tool in the **Tool Catalog** and should use the current repository as its subject unless the user explicitly chooses another subject. Multiple **Repository Page Helpers** may coexist when each has a distinct purpose.
_Avoid_: Global widget, fixed repo helper, tool page

**Repository Page Helper Lifecycle**:
The shared install loop for **Repository Page Helpers** on GitHub pages. It owns GitHub SPA navigation events, path-change detection, retry timing, and DOM-mutation recovery. It does not render a helper or decide that helper's repository-specific placement; those belong to each **Repository Page Helper** adapter.
_Avoid_: GitHub observer, page watcher, helper scheduler

**Repository Home Page**:
The main page for a code repository, where the repository itself is the subject. A **Repository Home Page** is distinct from repository subpages such as file views, issue lists, pull requests, actions, settings, or discussions.
_Avoid_: Project page, repo page, GitHub page

**Star History View**:
A **Repository Page Helper** for a **Repository Home Page** that presents public star-growth history for the current repository. It is repository-specific public metadata, not captured content, request data, tool history, or a **Tool Setting**.
_Avoid_: Star widget, fixed star chart, repository analytics

**Star History Detail**:
The external Star History page for a repository's public star-growth history. A **Star History View** may point to a **Star History Detail** when the user wants the full external view.
_Avoid_: Internal analytics page, embedded report

## Example Dialogue

Developer: "Should Json String request data be a Synced Setting?"

Domain expert: "No. The enabled toggle is a Synced Setting; captured requests are tool data and stay device-local."

Developer: "Should the dictionary selection lookup toggle sync?"

Domain expert: "Yes. It is a low-sensitivity Tool Setting that controls behavior, not user content."

Developer: "Where should the dictionary selection lookup preference be declared?"

Domain expert: "In a Tool Setting Definition. The storage behavior can be shared, but the preference meaning belongs in that definition."

Developer: "If profile sync fails, should saving a Tool Setting fail?"

Domain expert: "No. Use the Local Setting Fallback so the current device keeps working, and make it clear that the setting was not synced."

Developer: "Should tool history use the Synced Setting path?"

Domain expert: "No. Tool history is Persisted Tool Data, so it stays device-local."

Developer: "Should the Text Preview Workspace sync across devices?"

Domain expert: "No. It is Persisted Tool Data. The text tabs and local-file handles stay device-local."

Developer: "Where should a new tool's name and path be declared?"

Domain expert: "In the Tool Catalog. Navigation, popup launch, and route checks should derive from that declaration. For ordinary tools, the path should derive from the tool id instead of being repeated per tool."

Developer: "Should popup entries like settings, bookmarks, web summary, and clear cookies live in popup code?"

Domain expert: "No. They are Launch Entries in the Tool Catalog. The catalog describes the entry and launch intent; the popup adapter executes the Chrome behavior."

Developer: "Should every Launch Entry appear in every QHelper surface?"

Domain expert: "No. Surface visibility belongs in the Launch Entry so popup, sidebar, route aliases, and build outputs do not each invent their own filters."

Developer: "Should the popup keep its own launch entry list, category order, or icon identity?"

Domain expert: "No. The popup is a Tool Catalog consumer. It may adapt catalog entries into Chrome behavior and rendered icons, but it should not maintain a second catalog."

Developer: "Should a destructive browser command like clearing cookies stay outside the Tool Catalog?"

Domain expert: "No. It is a Launch Entry with explicit risk metadata. The catalog describes the risk; the adapter handles confirmation and execution."

Developer: "Should a GitHub star history helper always show ultraworkers/claw-code?"

Domain expert: "No. A Star History View is a Repository Page Helper, so its subject is the current repository unless the user explicitly chooses another one."

Developer: "Should the Star History View appear on issue, pull request, or file pages?"

Domain expert: "No. It belongs on the Repository Home Page; repository subpages have their own workflows."

Developer: "Should selecting the chart open a fuller Star History page?"

Domain expert: "Yes. The Star History View can point to the Star History Detail for the same repository."

Developer: "Should each Repository Page Helper install its own GitHub SPA navigation and DOM recovery loop?"

Domain expert: "No. That is the Repository Page Helper Lifecycle. Each helper adapter should provide render and recovery decisions while the lifecycle owns GitHub navigation and retry mechanics."
