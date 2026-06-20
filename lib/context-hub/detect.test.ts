import { describe, expect, it } from 'vitest'
import { detectContextInput } from './detect'

describe('detectContextInput', () => {
  it('detects JWT before generic base64 content', () => {
    const result = detectContextInput(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiUXVpbm4ifQ.signature',
    )

    expect(result).toMatchObject({
      kind: 'jwt',
      confidence: 'high',
      summary: 'JWT token with decodable header and payload.',
      facts: expect.arrayContaining([
        { label: 'Algorithm', value: 'HS256' },
        { label: 'Type', value: 'JWT' },
      ]),
    })
  })

  it('detects JSON objects and arrays', () => {
    expect(detectContextInput('{"ok":true}')).toMatchObject({
      kind: 'json',
      confidence: 'high',
    })

    expect(detectContextInput('[1,2,3]')).toMatchObject({
      kind: 'json',
      confidence: 'high',
    })
  })

  it('does not classify JSON primitives as JSON tool input', () => {
    expect(detectContextInput('"hello"')).toMatchObject({
      kind: 'unknown',
    })
  })

  it('detects HTTP and HTTPS URLs', () => {
    expect(detectContextInput('https://example.com/path?q=1#top')).toMatchObject({
      kind: 'url',
      confidence: 'high',
      facts: expect.arrayContaining([
        { label: 'Host', value: 'example.com' },
      ]),
    })
  })

  it('detects plausible Unix timestamps in seconds and milliseconds', () => {
    expect(detectContextInput('1714392000')).toMatchObject({
      kind: 'timestamp',
      confidence: 'high',
      facts: expect.arrayContaining([
        { label: 'Precision', value: 'seconds' },
      ]),
    })

    expect(detectContextInput('1714392000000')).toMatchObject({
      kind: 'timestamp',
      confidence: 'high',
      facts: expect.arrayContaining([
        { label: 'Precision', value: 'milliseconds' },
      ]),
    })
  })

  it('does not classify arbitrary numeric ids as timestamps', () => {
    expect(detectContextInput('123456')).toMatchObject({
      kind: 'unknown',
    })
  })

  it('detects five-field Cron expressions', () => {
    expect(detectContextInput('*/5 * * * *')).toMatchObject({
      kind: 'cron',
      confidence: 'high',
      summary: 'Five-field Cron expression.',
    })
  })

  it('detects base64-encoded UTF-8 text after more specific detectors', () => {
    expect(detectContextInput('SGVsbG8sIFFIZWxwZXI=')).toMatchObject({
      kind: 'base64',
      confidence: 'medium',
      facts: expect.arrayContaining([
        { label: 'Decoded preview', value: 'Hello, QHelper' },
      ]),
    })
  })

  it('returns unknown for empty or ambiguous input', () => {
    expect(detectContextInput('')).toMatchObject({
      kind: 'unknown',
      confidence: 'low',
    })
    expect(detectContextInput('hello world')).toMatchObject({
      kind: 'unknown',
      confidence: 'low',
    })
  })
})
