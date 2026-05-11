import { get, set } from '@/lib/chrome/storage'

export const DICTIONARY_SETTINGS_STORAGE_KEY = 'dictionarySettings'

export type DictionarySettings = {
  selectionLookupEnabled: boolean
}

export const DEFAULT_DICTIONARY_SETTINGS: DictionarySettings = {
  selectionLookupEnabled: true,
}

function normalizeDictionarySettings(
  value: Partial<DictionarySettings> | undefined,
): DictionarySettings {
  return {
    selectionLookupEnabled:
      typeof value?.selectionLookupEnabled === 'boolean'
        ? value.selectionLookupEnabled
        : DEFAULT_DICTIONARY_SETTINGS.selectionLookupEnabled,
  }
}

export async function getDictionarySettings(): Promise<DictionarySettings> {
  const value = await get<Partial<DictionarySettings>>(
    DICTIONARY_SETTINGS_STORAGE_KEY,
  )
  return normalizeDictionarySettings(value)
}

export async function setDictionarySettings(
  nextSettings: Partial<DictionarySettings>,
): Promise<DictionarySettings> {
  const normalized = normalizeDictionarySettings(nextSettings)
  await set(DICTIONARY_SETTINGS_STORAGE_KEY, normalized)
  return normalized
}

export function subscribeDictionarySettings(
  listener: (settings: DictionarySettings) => void,
): () => void {
  const handleSettingsChange = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== 'local' || !(DICTIONARY_SETTINGS_STORAGE_KEY in changes)) {
      return
    }

    listener(
      normalizeDictionarySettings(
        changes[DICTIONARY_SETTINGS_STORAGE_KEY].newValue as
          | Partial<DictionarySettings>
          | undefined,
      ),
    )
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(handleSettingsChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleSettingsChange)
    }
  }

  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleLocalStorageChange = (event: StorageEvent) => {
    if (
      event.key !== DICTIONARY_SETTINGS_STORAGE_KEY ||
      event.newValue === event.oldValue
    ) {
      return
    }

    try {
      listener(
        normalizeDictionarySettings(
          event.newValue
            ? (JSON.parse(event.newValue) as Partial<DictionarySettings>)
            : undefined,
        ),
      )
    } catch {
      listener(DEFAULT_DICTIONARY_SETTINGS)
    }
  }

  window.addEventListener('storage', handleLocalStorageChange)
  return () => {
    window.removeEventListener('storage', handleLocalStorageChange)
  }
}
