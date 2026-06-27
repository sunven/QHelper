import { defineSetting } from '@/lib/settings'

export const DICTIONARY_SETTINGS_STORAGE_KEY = 'dictionarySettings'

export type DictionarySettings = {
  selectionLookupEnabled: boolean
}

export const dictionarySettings = defineSetting(DICTIONARY_SETTINGS_STORAGE_KEY, {
  selectionLookupEnabled: false,
})

export const DEFAULT_DICTIONARY_SETTINGS = dictionarySettings.defaults
export const getDictionarySettings = dictionarySettings.get
export const setDictionarySettings = dictionarySettings.set
export const subscribeDictionarySettings = dictionarySettings.subscribe
export const normalizeDictionarySettings = (v: Partial<DictionarySettings> | undefined) =>
  ({ ...dictionarySettings.defaults, ...v })
