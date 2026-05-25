import { describe, expect, it } from 'vitest'
import { decodeUtf8Base64, encodeUtf8Base64 } from './base64'

describe('base64', () => {
  it('encodes ASCII text', () => {
    expect(encodeUtf8Base64('hello')).toBe('aGVsbG8=')
  })

  it('encodes Chinese and emoji text as UTF-8', () => {
    expect(encodeUtf8Base64('邮箱📮')).toBe('6YKu566x8J+Trg==')
  })

  it('encodes an empty string', () => {
    expect(encodeUtf8Base64('')).toBe('')
  })

  it('decodes UTF-8 Base64 text', () => {
    expect(decodeUtf8Base64('6YKu566x8J+Trg==')).toBe('邮箱📮')
  })

  it('rejects Base64 bytes that are not valid UTF-8 text', () => {
    expect(() => decodeUtf8Base64('//8=')).toThrow()
  })
})
