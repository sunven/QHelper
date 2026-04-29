import { describe, expect, it, vi } from 'vitest'
import * as chromeStorage from '@/lib/chrome/storage'
import {
  DEFAULT_WEB_SUMMARY_CONFIG,
  WEB_SUMMARY_CONFIG_KEY,
  getWebSummaryConfig,
  normalizeWebSummaryConfig,
  setWebSummaryConfig,
  validateWebSummaryConfig,
} from './config'

vi.mock('@/lib/chrome/storage', () => ({
  get: vi.fn(),
  set: vi.fn(),
}))

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

  it('rejects invalid endpoint URLs', () => {
    expect(
      validateWebSummaryConfig({
        endpoint: 'notaurl',
        model: 'gpt-4.1-mini',
        apiKey: 'secret',
      }),
    ).toContain('接口地址格式不正确，请输入完整 URL。')
  })

  it('persists the normalized config to dedicated storage', async () => {
    await setWebSummaryConfig({
      endpoint: ' https://example.com/v1/chat/completions ',
      model: ' gpt-4.1-mini ',
      apiKey: ' secret ',
    })

    expect(chromeStorage.set).toHaveBeenCalledWith(WEB_SUMMARY_CONFIG_KEY, {
      endpoint: 'https://example.com/v1/chat/completions',
      model: 'gpt-4.1-mini',
      apiKey: 'secret',
    })
  })

  it('loads and normalizes the dedicated summary config', async () => {
    vi.mocked(chromeStorage.get).mockResolvedValue({
      endpoint: ' https://example.com/v1/chat/completions ',
      model: ' test-model ',
      apiKey: ' test-key ',
    })

    await expect(getWebSummaryConfig()).resolves.toEqual({
      endpoint: 'https://example.com/v1/chat/completions',
      model: 'test-model',
      apiKey: 'test-key',
    })
    expect(chromeStorage.get).toHaveBeenCalledWith(
      WEB_SUMMARY_CONFIG_KEY,
      DEFAULT_WEB_SUMMARY_CONFIG,
    )
  })
})
