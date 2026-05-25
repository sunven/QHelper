import {
  defineSyncedToolSetting,
  type SyncedToolSettingSaveResult,
} from '@/lib/chrome/synced-settings'

export const V2EX_BASE64_SETTINGS_STORAGE_KEY = 'v2exBase64Settings'

export type V2exBase64Settings = {
  entries: string[]
}

export type V2exBase64SettingsSaveResult =
  SyncedToolSettingSaveResult<V2exBase64Settings>

export const DEFAULT_V2EX_BASE64_SETTINGS: V2exBase64Settings = {
  entries: [],
}

export function normalizeV2exBase64Entries(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_V2EX_BASE64_SETTINGS.entries
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function normalizeV2exBase64Settings(
  value: Partial<V2exBase64Settings> | undefined,
): V2exBase64Settings {
  return {
    entries: normalizeV2exBase64Entries(value?.entries),
  }
}

export const v2exBase64Settings = defineSyncedToolSetting({
  key: V2EX_BASE64_SETTINGS_STORAGE_KEY,
  defaults: DEFAULT_V2EX_BASE64_SETTINGS,
  normalize: normalizeV2exBase64Settings,
})

export const getV2exBase64Settings = v2exBase64Settings.get

export const setV2exBase64Settings = v2exBase64Settings.set

export const subscribeV2exBase64Settings = v2exBase64Settings.subscribe
