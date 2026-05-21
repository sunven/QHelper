# Sync tool settings with local migration

QHelper syncs only low-sensitivity Tool Settings through the browser profile and keeps captured content, request data, history, and credentials device-local. When a Synced Setting has no `chrome.storage.sync` value yet, QHelper migrates the existing `chrome.storage.local` value into sync once and keeps the local value as a compatibility and rollback fallback.

If `chrome.storage.sync` cannot read or write, QHelper falls back to `chrome.storage.local` so the setting still applies on the current device. The UI should distinguish this Local Setting Fallback state from a successfully synced save.

When the same Synced Setting changes on multiple devices, QHelper accepts Chrome Sync's last-write result and does not implement custom conflict merging. These settings are simple booleans, so the latest observed value should replace the current local view.

The generic Chrome storage wrapper remains local-first. Only settings that are explicitly classified as Synced Settings use the sync path, so credentials, captured requests, history, and other local data are not accidentally synchronized.

The settings UI stays focused on the tool behavior, not on sync mechanics. Successful sync saves do not need visible status chrome; Local Setting Fallback saves should show a lightweight, non-blocking notice that the value was saved only on this device for now.

After a successful sync save, QHelper also writes the same value to local storage as a mirror. Sync remains the authority for normal reads, and the local mirror exists only for migration, rollback, and fallback.

## Considered Options

- Switch directly to `chrome.storage.sync`: rejected because existing local preferences would appear reset after upgrade.
- Mirror every stored value into sync: rejected because request data, history, and credentials are not Synced Settings.
- Migrate then delete local values: rejected because keeping local values makes rollback and fallback safer.
- Fail the save when sync is unavailable: rejected because sync should not block local tool behavior.
- Add custom conflict resolution: rejected because boolean Tool Settings do not need domain-specific merging.
- Change the generic storage wrapper to sync-first: rejected because too many existing callers store data that is not a Synced Setting.
