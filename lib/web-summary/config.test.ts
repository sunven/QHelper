import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEB_SUMMARY_CONFIG,
  normalizeWebSummaryConfig,
  validateWebSummaryConfig,
} from './config'

describe('web-summary/config', () => {
  it('normalizes and trims config values', () => {
    expect(
      normalizeWebSummaryConfig({
        endpoint: ' https://example.com/v1/chat/completions ',
        model: ' gpt-4.1-mini ',
        apiKey: ' secret ',
      }),
    ).toEqual({
      endpoint: 'https://example.com/v1/chat/completions',
      model: 'gpt-4.1-mini',
      apiKey: 'secret',
    })
  })

  it('returns actionable validation errors for missing fields', () => {
    expect(validateWebSummaryConfig(DEFAULT_WEB_SUMMARY_CONFIG)).toEqual([
      '请先填写兼容 OpenAI 的接口地址。',
      '请先填写模型名称。',
      '请先填写 API Key。',
    ])
  })

  it('requires https except for loopback endpoints', () => {
    const base = { model: 'gpt-4.1-mini', apiKey: 'secret' }

    expect(
      validateWebSummaryConfig({
        ...base,
        endpoint: 'http://example.com/v1/chat/completions',
      }),
    ).toContain('接口地址必须使用 https（localhost 例外）。')
    expect(
      validateWebSummaryConfig({
        ...base,
        endpoint: 'http://localhost:11434/v1/chat/completions',
      }),
    ).toEqual([])
    expect(
      validateWebSummaryConfig({
        ...base,
        endpoint: 'http://127.0.0.1:11434/v1/chat/completions',
      }),
    ).toEqual([])
    expect(
      validateWebSummaryConfig({
        ...base,
        endpoint: 'https://example.com/v1/chat/completions',
      }),
    ).toEqual([])
  })

  it('rejects invalid endpoint URLs', () => {
    expect(
      validateWebSummaryConfig({
        endpoint: 'notaurl',
        model: 'gpt-4.1-mini',
        apiKey: 'secret',
      }),
    ).toContain('接口地址格式不正确，请输入完整 URL。')
  })
})
