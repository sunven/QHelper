import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildWebSummaryModelsUrl, fetchWebSummaryModels } from './models'

describe('web-summary/models', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('derives the models URL from OpenAI-compatible endpoints', () => {
    expect(
      buildWebSummaryModelsUrl(
        'https://token.sensenova.cn/v1/chat/completions',
      ),
    ).toBe('https://token.sensenova.cn/v1/models')
    expect(buildWebSummaryModelsUrl(' https://api.openai.com/v1 ')).toBe(
      'https://api.openai.com/v1/models',
    )
    expect(buildWebSummaryModelsUrl('notaurl')).toBe('')
    expect(buildWebSummaryModelsUrl('')).toBe('')

    expect(
      buildWebSummaryModelsUrl(
        'https://example.com/v1/chat/completions?api-version=1',
      ),
    ).toBe('https://example.com/v1/models?api-version=1')
    expect(
      buildWebSummaryModelsUrl(
        'https://res.openai.azure.com/openai/deployments/demo/chat/completions?api-version=2024-02-01',
      ),
    ).toBe('https://res.openai.azure.com/openai/models?api-version=2024-02-01')
  })

  it('fetches, dedupes and sorts model ids', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [{ id: 'b-model' }, { id: 'a-model' }, { id: 'b-model' }, {}],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchWebSummaryModels({
        endpoint: 'https://example.com/v1/chat/completions',
        apiKey: ' secret ',
      }),
    ).resolves.toEqual(['a-model', 'b-model'])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer secret' },
      }),
    )
  })

  it('surfaces a readable error when the models request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('unauthorized', {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'Content-Type': 'text/plain' },
          }),
        ),
      ),
    )

    await expect(
      fetchWebSummaryModels({
        endpoint: 'https://example.com/v1/chat/completions',
      }),
    ).rejects.toThrow('模型列表接口返回 401：unauthorized')
  })

  it('rejects endpoints without a usable URL', async () => {
    await expect(
      fetchWebSummaryModels({ endpoint: 'notaurl' }),
    ).rejects.toThrow('请先填写正确的接口地址，再获取模型列表。')
  })

  it('rejects insecure endpoints before fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchWebSummaryModels({
        endpoint: 'http://example.com/v1/chat/completions',
      }),
    ).rejects.toThrow('接口地址必须使用 https')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects empty model lists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    await expect(
      fetchWebSummaryModels({
        endpoint: 'https://example.com/v1/chat/completions',
      }),
    ).rejects.toThrow('接口没有返回可用模型，请检查接口地址或 API Key。')
  })
})
