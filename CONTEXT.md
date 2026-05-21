# QHelper

QHelper is a browser extension that provides developer-focused tools and optional page helpers. Its language distinguishes user preferences from captured data, credentials, and transient tool state.

## Language

**Tool Setting**:
A user preference that controls how a QHelper tool behaves. A **Tool Setting** is not captured content, request data, tool history, or an API credential.
_Avoid_: Tool data, runtime state, cache

**Tool Setting Definition**:
The source-of-truth declaration for a **Tool Setting**. It names the preference and defines how QHelper interprets it, without being captured content, request data, tool history, or an API credential.
_Avoid_: Setting wrapper, storage config, option schema

**Synced Setting**:
A low-sensitivity **Tool Setting** that should follow the user's browser profile across devices. Synced Settings are small preferences, not captured content, request data, tool history, API credentials, or backups.
_Avoid_: Cloud backup, telemetry, synced data

**Local Setting Fallback**:
A device-local copy of a **Synced Setting** used when browser profile sync cannot read or write successfully. It preserves tool behavior on the current device without changing captured content, request data, tool history, or credentials into Synced Settings.
_Avoid_: Sync failure, offline mode, backup

**Persisted Tool Data**:
Device-local information that lets a QHelper tool resume or display prior work on the same browser profile. Persisted Tool Data includes tool state and tool history, but not a **Synced Setting**.
_Avoid_: Synced data, cloud state, backup

**Tool Catalog**:
The source-of-truth collection of QHelper tools and their user-facing identity. It defines tool names, categories, descriptions, icons, and paths for navigation, popup entry points, and tool routes.
_Avoid_: Tool registry, navigation config, route map

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

Developer: "Where should a new tool's name and path be declared?"

Domain expert: "In the Tool Catalog. Navigation, popup launch, and route checks should derive from that declaration."
