import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DICTIONARY_SETTINGS,
  DICTIONARY_SETTINGS_STORAGE_KEY,
  dictionarySettings,
  normalizeDictionarySettings,
} from './settings'

describe('dictionary/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.storage.sync.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.sync.set).mockImplementation(
      () => Promise.resolve() as never,
    )
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.local.set).mockImplementation(
      () => Promise.resolve() as never,
    )
  })

  it('defines dictionary settings as a synced Tool Setting', () => {
    expect(dictionarySettings).toMatchObject({
      key: DICTIONARY_SETTINGS_STORAGE_KEY,
      defaults: DEFAULT_DICTIONARY_SETTINGS,
    })
  })

  it('normalizes dictionary settings to enabled by default', () => {
    expect(normalizeDictionarySettings(undefined)).toEqual({
      selectionLookupEnabled: true,
    })
    expect(normalizeDictionarySettings({ selectionLookupEnabled: false })).toEqual({
      selectionLookupEnabled: false,
    })
  })

  it('uses the definition for compatible get and set exports', async () => {
    vi.mocked(chrome.storage.sync.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          [DICTIONARY_SETTINGS_STORAGE_KEY]: {
            selectionLookupEnabled: false,
          },
        }) as never,
    )

    await expect(dictionarySettings.get()).resolves.toEqual({
      selectionLookupEnabled: false,
    })
    await expect(dictionarySettings.set({ selectionLookupEnabled: false })).resolves.toEqual({
      settings: { selectionLookupEnabled: false },
      storageArea: 'sync',
    })
  })

  it('subscribes through the definition without exposing storage area', () => {
    const listener = vi.fn()
    const unsubscribe = dictionarySettings.subscribe(listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        [DICTIONARY_SETTINGS_STORAGE_KEY]: {
          newValue: { selectionLookupEnabled: false },
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledWith({ selectionLookupEnabled: false })
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })
})
