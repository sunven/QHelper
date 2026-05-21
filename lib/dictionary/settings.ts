import {
  defineSyncedToolSetting,
  type SyncedToolSettingSaveResult,
} from '@/lib/chrome/synced-settings'

export const DICTIONARY_SETTINGS_STORAGE_KEY = 'dictionarySettings'

export type DictionarySettings = {
  selectionLookupEnabled: boolean
}

export type DictionarySettingsSaveResult =
  SyncedToolSettingSaveResult<DictionarySettings>

export const DEFAULT_DICTIONARY_SETTINGS: DictionarySettings = {
  selectionLookupEnabled: true,
}

export function normalizeDictionarySettings(
  value: Partial<DictionarySettings> | undefined,
): DictionarySettings {
  return {
    selectionLookupEnabled:
      typeof value?.selectionLookupEnabled === 'boolean'
        ? value.selectionLookupEnabled
        : DEFAULT_DICTIONARY_SETTINGS.selectionLookupEnabled,
  }
}

export const dictionarySettings = defineSyncedToolSetting({
  key: DICTIONARY_SETTINGS_STORAGE_KEY,
  defaults: DEFAULT_DICTIONARY_SETTINGS,
  normalize: normalizeDictionarySettings,
})

export const getDictionarySettings = dictionarySettings.get

export const setDictionarySettings = dictionarySettings.set

export const subscribeDictionarySettings = dictionarySettings.subscribe
