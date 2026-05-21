import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLocalPersistedData,
  getToolStateStorageKey,
  removeLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from './local-persisted-data'

describe('chrome/local-persisted-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.local.set).mockImplementation(
      () => Promise.resolve() as never,
    )
    vi.mocked(chrome.storage.local.remove).mockImplementation(
      () => Promise.resolve() as never,
    )
    vi.mocked(chrome.storage.sync.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.sync.set).mockImplementation(
      () => Promise.resolve() as never,
    )
  })

  it('reads and writes local persisted data only through local storage', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () => Promise.resolve({ exampleKey: { enabled: true } }) as never,
    )

    await expect(getLocalPersistedData('exampleKey')).resolves.toEqual({
      enabled: true,
    })
    await setLocalPersistedData('exampleKey', { enabled: false })
    await removeLocalPersistedData('exampleKey')

    expect(chrome.storage.local.get).toHaveBeenCalledWith('exampleKey')
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      exampleKey: { enabled: false },
    })
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('exampleKey')
    expect(chrome.storage.sync.get).not.toHaveBeenCalled()
    expect(chrome.storage.sync.set).not.toHaveBeenCalled()
  })

  it('constructs tool state storage keys', () => {
    expect(getToolStateStorageKey('json', 'history')).toBe(
      'tool_json_history',
    )
  })

  it('subscribes to a single local key and unsubscribes from Chrome storage', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeLocalPersistedDataKey('exampleKey', listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        exampleKey: {
          newValue: { enabled: true },
        },
      },
      'local',
    )
    handleChange?.(
      {
        exampleKey: {
          newValue: { enabled: false },
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ enabled: true })
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })

  it('falls back to window storage events when Chrome storage is unavailable', () => {
    const listener = vi.fn()
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    vi.stubGlobal('chrome', {})

    const unsubscribe = subscribeLocalPersistedDataKey('exampleKey', listener)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'exampleKey',
        oldValue: '{"enabled":false}',
        newValue: '{"enabled":true}',
      }),
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'storage',
      expect.any(Function),
    )
    expect(listener).toHaveBeenCalledWith({ enabled: true })

    unsubscribe()
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'storage',
      expect.any(Function),
    )
  })
})
