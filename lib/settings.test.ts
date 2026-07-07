import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineSetting } from './settings'

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

describe('settings/defineSetting', () => {
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

  it('reads the sync value when present and mirrors it to local fallback', async () => {
    vi.mocked(chrome.storage.sync.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          testSetting: { enabled: false },
        }) as never,
    )
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )

    await expect(setting.get()).resolves.toEqual({ enabled: false })

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
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )

    await expect(setting.get()).resolves.toEqual({ enabled: false })

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
  })

  it('falls back to the local value when sync read fails', async () => {
    vi.mocked(chrome.storage.sync.get).mockRejectedValueOnce(
      new Error('sync unavailable'),
    )
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          testSetting: { enabled: false },
        }) as never,
    )
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )

    await expect(setting.get()).resolves.toEqual({ enabled: false })
  })

  it('writes to sync and mirrors to local', async () => {
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )

    await expect(setting.set({ enabled: false })).resolves.toEqual({
      settings: { enabled: false },
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
    vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(
      new Error('sync unavailable'),
    )
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )

    await expect(setting.set({ enabled: false })).resolves.toEqual({
      settings: { enabled: false },
      storageArea: 'local',
    })

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })
  })

  it('subscribes to sync and local chrome storage changes', () => {
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )
    const listener = vi.fn()
    const unsubscribe = setting.subscribe(listener)
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

    expect(listener).toHaveBeenNthCalledWith(1, { enabled: false })
    expect(listener).toHaveBeenNthCalledWith(2, { enabled: true })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      testSetting: { enabled: false },
    })

    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })

  it('resets to defaults through the same save path', async () => {
    const setting = defineSetting(
      'testSetting',
      { enabled: true },
      normalizeTestSetting,
    )

    await expect(setting.reset()).resolves.toEqual({
      settings: { enabled: true },
      storageArea: 'sync',
    })
  })
})
