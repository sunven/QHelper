import { defineSetting } from '@/lib/settings'

export const DICTIONARY_SETTINGS_STORAGE_KEY = 'dictionarySettings'

export type DictionarySettings = {
  selectionLookupEnabled: boolean
}

export const dictionarySettings = defineSetting(
  DICTIONARY_SETTINGS_STORAGE_KEY,
  {
    selectionLookupEnabled: false,
  },
)
