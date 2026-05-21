import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defineSyncedToolSetting,
  getSyncedSetting,
  setSyncedSetting,
  subscribeSyncedSetting,
} from './synced-settings'

type TestSetting = {
  enabled: boolean
}

function normalizeTestSetting(
  value: Partial<TestSetting> | undefined,
): TestSetting {
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
  }
}

describe('chrome/synced-settings', () => {
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

  it('reads the sync value when present', async () => {
    vi.mocked(chrome.storage.sync.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          testSetting: { enabled: false },
        }) as never,
    )

    await expect(
      getSyncedSetting('testSetting', normalizeTestSetting),
    ).resolves.toEqual({ enabled: false })

    expect(chrome.storage.local.get).not.toHaveBeenCalled()
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
    expect(chrome.storage.sync.set).not.toHaveBeenCalled()
  })

  it('migrates an existing local value when sync is empty', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          testSetting: { enabled: false },
        }) as never,
    )

    await expect(
      getSyncedSetting('testSetting', normalizeTestSetting),
    ).resolves.toEqual({ enabled: false })

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
  })

  it('falls back to the local value when sync read fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.mocked(chrome.storage.sync.get).mockRejectedValueOnce(
      new Error('sync unavailable'),
    )
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          testSetting: { enabled: false },
        }) as never,
    )

    await expect(
      getSyncedSetting('testSetting', normalizeTestSetting),
    ).resolves.toEqual({ enabled: false })

    expect(warn).toHaveBeenCalledWith(
      'chrome.storage.sync get failed, falling back to local setting:',
      expect.any(Error),
    )
  })

  it('writes to sync and mirrors to local', async () => {
    await expect(
      setSyncedSetting('testSetting', { enabled: false }),
    ).resolves.toEqual({
      value: { enabled: false },
      storageArea: 'sync',
    })

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
  })

  it('writes to local when sync write fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(
      new Error('sync unavailable'),
    )

    await expect(
      setSyncedSetting('testSetting', { enabled: false }),
    ).resolves.toEqual({
      value: { enabled: false },
      storageArea: 'local',
    })

    expect(warn).toHaveBeenCalledWith(
      'chrome.storage.sync set failed, falling back to local setting:',
      expect.any(Error),
    )
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
  })

  it('subscribes to sync and local changes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSyncedSetting(
      'testSetting',
      normalizeTestSetting,
      listener,
    )
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        testSetting: {
          newValue: { enabled: false },
        },
      },
      'sync',
    )
    handleChange?.(
      {
        testSetting: {
          newValue: { enabled: true },
        },
      },
      'local',
    )

    expect(listener).toHaveBeenNthCalledWith(1, { enabled: false }, 'sync')
    expect(listener).toHaveBeenNthCalledWith(2, { enabled: true }, 'local')
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })

    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })

  it('defines a synced Tool Setting with get, set, and subscribe', async () => {
    const setting = defineSyncedToolSetting({
      key: 'testSetting',
      defaults: { enabled: true },
      normalize: normalizeTestSetting,
    })

    expect(setting).toMatchObject({
      key: 'testSetting',
      defaults: { enabled: true },
    })

    vi.mocked(chrome.storage.sync.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          testSetting: { enabled: false },
        }) as never,
    )

    await expect(setting.get()).resolves.toEqual({ enabled: false })
    await expect(setting.set({ enabled: false })).resolves.toEqual({
      settings: { enabled: false },
      storageArea: 'sync',
    })

    const listener = vi.fn()
    setting.subscribe(listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        testSetting: {
          newValue: { enabled: false },
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledWith({ enabled: false })
  })
})
