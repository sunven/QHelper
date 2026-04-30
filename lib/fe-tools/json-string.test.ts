import { describe, expect, it } from 'vitest'
import {
  isJsonString,
  shouldCaptureJsonRequest,
  transformJsonStringToJson,
} from './json-string'

describe('fe-tools/json-string', () => {
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
})
