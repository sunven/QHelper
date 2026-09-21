import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GOOGLE_SEARCH_SETTINGS_STORAGE_KEY,
  googleSearchSettings,
} from './settings'

describe('google-search/settings', () => {
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

  it('defines Google search settings as a synced Tool Setting that defaults to on', () => {
    expect(googleSearchSettings).toMatchObject({
      key: GOOGLE_SEARCH_SETTINGS_STORAGE_KEY,
      defaults: { openInEnabled: true },
    })
  })

  it('uses the definition for compatible get and set exports', async () => {
    vi.mocked(chrome.storage.sync.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          [GOOGLE_SEARCH_SETTINGS_STORAGE_KEY]: {
            openInEnabled: false,
          },
        }) as never,
    )

    await expect(googleSearchSettings.get()).resolves.toEqual({
      openInEnabled: false,
    })
    await expect(
      googleSearchSettings.set({ openInEnabled: true }),
    ).resolves.toEqual({
      settings: { openInEnabled: true },
      storageArea: 'sync',
    })
  })

  it('subscribes through the definition without exposing storage area', () => {
    const listener = vi.fn()
    const unsubscribe = googleSearchSettings.subscribe(listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        [GOOGLE_SEARCH_SETTINGS_STORAGE_KEY]: {
          newValue: { openInEnabled: false },
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledWith({ openInEnabled: false })
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })
})
