import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_JSON_STRING_SETTINGS,
  getJsonStringSettings,
  JSON_STRING_SETTINGS_STORAGE_KEY,
  isJsonString,
  jsonStringSettings,
  normalizeJsonStringSettings,
  setJsonStringSettings,
  shouldCaptureJsonRequest,
  subscribeJsonStringSettings,
  transformJsonStringToJson,
} from './json-string'

describe('fe-tools/json-string', () => {
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

  it('expands nested object strings', () => {
    expect(transformJsonStringToJson({ payload: '{"a":1}' })).toEqual({
      payload: { a: 1 },
    })
  })

  it('expands nested array strings and recurses inside arrays', () => {
    expect(
      transformJsonStringToJson({
        payload: '[{"a":"{\\"b\\":2}"}]',
      }),
    ).toEqual({
      payload: [{ a: { b: 2 } }],
    })
  })

  it('leaves non-json, invalid, empty, and whitespace strings unchanged', () => {
    const source = {
      plain: 'hello',
      invalid: '{"a":',
      empty: '',
      whitespace: '   ',
    }

    expect(transformJsonStringToJson(source)).toEqual(source)
  })

  it('safely detects large json-looking strings', () => {
    const large = `{"payload":"${'x'.repeat(120_000)}"}`

    expect(isJsonString(large)).toBe(true)
    expect(isJsonString(`{${'x'.repeat(120_000)}`)).toBe(false)
  })

  it('captures local json requests', () => {
    const headers = [{ name: 'content-type', value: 'Application/JSON; charset=utf-8' }]

    expect(
      shouldCaptureJsonRequest({
        request: { url: 'http://localhost:3000/api' },
        response: { headers },
      }),
    ).toBe(true)
    expect(
      shouldCaptureJsonRequest({
        request: { url: 'http://127.0.0.1:3000/api' },
        response: { headers },
      }),
    ).toBe(true)
    expect(
      shouldCaptureJsonRequest({
        request: { url: 'http://192.168.1.10/api' },
        response: { headers },
      }),
    ).toBe(true)
  })

  it('rejects extension, remote, non-json, and malformed requests', () => {
    expect(
      shouldCaptureJsonRequest({
        request: { url: 'chrome-extension://abc/api' },
        response: { headers: [{ name: 'content-type', value: 'application/json' }] },
      }),
    ).toBe(false)
    expect(
      shouldCaptureJsonRequest({
        request: { url: 'https://example.com/api' },
        response: { headers: [{ name: 'content-type', value: 'application/json' }] },
      }),
    ).toBe(false)
    expect(
      shouldCaptureJsonRequest({
        request: { url: 'http://localhost:3000/api' },
        response: { headers: [{ name: 'content-type', value: 'text/plain' }] },
      }),
    ).toBe(false)
    expect(
      shouldCaptureJsonRequest({
        request: { url: 'not a url' },
        response: { headers: [{ name: 'content-type', value: 'application/json' }] },
      }),
    ).toBe(false)
  })

  it('defines Json String settings as a synced Tool Setting', () => {
    expect(jsonStringSettings).toMatchObject({
      key: JSON_STRING_SETTINGS_STORAGE_KEY,
      defaults: DEFAULT_JSON_STRING_SETTINGS,
    })
  })

  it('normalizes Json String settings to disabled by default', () => {
    expect(normalizeJsonStringSettings(undefined)).toEqual({ enabled: false })
    expect(normalizeJsonStringSettings({ enabled: true })).toEqual({
      enabled: true,
    })
  })

  it('keeps compatible get and set exports on the definition', async () => {
    await expect(getJsonStringSettings()).resolves.toEqual({ enabled: false })
    await expect(setJsonStringSettings({ enabled: true })).resolves.toEqual({
      settings: { enabled: true },
      storageArea: 'sync',
    })
  })

  it('subscribes through the definition without exposing storage area', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeJsonStringSettings(listener)
    const calls = vi.mocked(chrome.storage.onChanged.addListener).mock.calls
    const handleChange = calls[calls.length - 1]?.[0]

    handleChange?.(
      {
        [JSON_STRING_SETTINGS_STORAGE_KEY]: {
          newValue: { enabled: false },
        },
      },
      'sync',
    )

    expect(listener).toHaveBeenCalledWith({ enabled: false })
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })
})
