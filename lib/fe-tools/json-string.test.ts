import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getJsonStringSettings,
  JSON_STRING_SETTINGS_STORAGE_KEY,
  isJsonString,
  setJsonStringSettings,
  shouldCaptureJsonRequest,
  subscribeJsonStringSettings,
  transformJsonStringToJson,
} from './json-string'

describe('fe-tools/json-string', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('defaults Json String settings to enabled', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () => Promise.resolve({}) as never,
    )

    await expect(getJsonStringSettings()).resolves.toEqual({ enabled: true })
  })

  it('persists normalized Json String settings', async () => {
    vi.mocked(chrome.storage.local.set).mockImplementationOnce(
      () => Promise.resolve() as never,
    )

    await expect(setJsonStringSettings({ enabled: false })).resolves.toEqual({
      enabled: false,
    })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [JSON_STRING_SETTINGS_STORAGE_KEY]: { enabled: false },
    })
  })

  it('subscribes to Json String settings changes', () => {
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
      'local',
    )

    expect(listener).toHaveBeenCalledWith({ enabled: false })
    unsubscribe()
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledWith(
      handleChange,
    )
  })
})
