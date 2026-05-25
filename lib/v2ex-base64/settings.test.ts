import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_V2EX_BASE64_SETTINGS,
  normalizeV2exBase64Entries,
  normalizeV2exBase64Settings,
  V2EX_BASE64_SETTINGS_STORAGE_KEY,
  v2exBase64Settings,
} from './settings'

describe('v2ex-base64/settings', () => {
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

  it('defines V2EX Base64 settings as a synced tool setting', () => {
    expect(v2exBase64Settings).toMatchObject({
      key: V2EX_BASE64_SETTINGS_STORAGE_KEY,
      defaults: DEFAULT_V2EX_BASE64_SETTINGS,
    })
  })

  it('normalizes settings to empty by default', () => {
    expect(normalizeV2exBase64Settings(undefined)).toEqual({ entries: [] })
  })

  it('trims entries and drops blanks', () => {
    expect(
      normalizeV2exBase64Entries([
        '  user@example.com  ',
        '',
        '   ',
        '13800138000',
        123,
      ]),
    ).toEqual(['user@example.com', '13800138000'])
  })

  it('uses the definition for compatible get and set exports', async () => {
    vi.mocked(chrome.storage.sync.get).mockImplementationOnce(
      () =>
        Promise.resolve({
          [V2EX_BASE64_SETTINGS_STORAGE_KEY]: {
            enabled: true,
            entries: ['  user@example.com  '],
          },
        }) as never,
    )

    await expect(v2exBase64Settings.get()).resolves.toEqual({
      entries: ['user@example.com'],
    })
    await expect(
      v2exBase64Settings.set({
        entries: [' phone '],
      }),
    ).resolves.toEqual({
      settings: { entries: ['phone'] },
      storageArea: 'sync',
    })
  })

  it('ignores legacy enabled flags so saved entries still show on V2EX', () => {
    expect(
      normalizeV2exBase64Settings({
        enabled: false,
        entries: [' user@example.com '],
      } as never),
    ).toEqual({ entries: ['user@example.com'] })
  })

  it('subscribes through the definition', () => {
    const listener = vi.fn()
    const unsubscribe = v2exBase64Settings.subscribe(listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        [V2EX_BASE64_SETTINGS_STORAGE_KEY]: {
          newValue: { enabled: true, entries: [' phone '] },
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledWith({
      entries: ['phone'],
    })
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })
})
