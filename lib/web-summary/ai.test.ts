import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildWebSummaryPrompt,
  parseWebSummaryEventBlock,
  readWebSummaryStream,
  streamWebSummaryMessages,
} from './ai'

const pageContent = {
  title: 'Test page',
  url: 'https://example.com/article',
  content: 'Some article content',
  source: 'article' as const,
  truncated: false,
  charCount: 20,
}

const messages = [{ role: 'user' as const, content: 'Read the page' }]

const config = {
  endpoint: 'https://example.com/v1/chat/completions',
  model: 'gpt-4.1-mini',
  apiKey: 'secret',
}

describe('web-summary/ai', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('includes the page identity and complete original text in its prompt', () => {
    expect(buildWebSummaryPrompt(pageContent)).toContain(pageContent.content)
    expect(buildWebSummaryPrompt(pageContent)).toContain(pageContent.url)
  })

  it('parses streaming event blocks and done sentinels', () => {
    expect(
      parseWebSummaryEventBlock(
        'data: {"choices":[{"delta":{"content":"hello"}}]}',
      ),
    ).toEqual({ done: false, delta: 'hello' })
    expect(parseWebSummaryEventBlock('data: [DONE]')).toEqual({
      done: true,
      delta: '',
    })
  })

  it('reads SSE responses and ignores malformed chunks', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              [
                'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n',
                'data: not-json\n\n',
                'data: {"choices":[{"delta":{"content":"world"}}]}\n\n',
                'data: [DONE]\n\n',
              ].join(''),
            ),
          )
          controller.close()
        },
      }),
      {
        headers: { 'Content-Type': 'text/event-stream' },
      },
    )

    const deltas: string[] = []
    await expect(
      readWebSummaryStream(response, (delta) => deltas.push(delta)),
    ).resolves.toBe('Hello world')
    expect(deltas).toEqual(['Hello ', 'world'])
    expect(warn).toHaveBeenCalled()
  })

  it('rejects a stream that ends without content', async () => {
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    )

    await expect(readWebSummaryStream(response)).rejects.toThrow(
      'AI 未返回任何摘要内容。',
    )
  })

  it('surfaces non-200 responses with the response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('bad request', {
            status: 400,
            statusText: 'Bad Request',
            headers: { 'Content-Type': 'text/plain' },
          }),
        ),
      ),
    )

    await expect(
      streamWebSummaryMessages({ messages, config }),
    ).rejects.toThrow('总结接口返回 400：bad request')
  })

  it('preserves abort errors from fetch', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(abortError)),
    )

    await expect(
      streamWebSummaryMessages({ messages, config }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rejects insecure endpoints before fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      streamWebSummaryMessages({
        messages,
        config: {
          ...config,
          endpoint: 'http://example.com/v1/chat/completions',
        },
      }),
    ).rejects.toThrow('接口地址必须使用 https')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('supports non-stream JSON responses as a fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: '# 总结\n\n- 完成' } }],
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        ),
      ),
    )

    const deltas: string[] = []
    await expect(
      streamWebSummaryMessages({
        messages,
        config,
        onDelta: (delta) => deltas.push(delta),
      }),
    ).resolves.toBe('# 总结\n\n- 完成')
    expect(deltas).toEqual(['# 总结\n\n- 完成'])
  })
  it('marks an abruptly ended stream as incomplete while retaining its deltas', async () => {
    const onDelta = vi.fn()
    const response = new Response(
      'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } },
    )
    await expect(readWebSummaryStream(response, onDelta)).rejects.toThrow(
      '中断',
    )
    expect(onDelta).toHaveBeenCalledWith('partial')
  })

  it('surfaces SSE errors and output limits instead of marking partial answers complete', async () => {
    const error = new Response(
      'data: {"error":{"message":"quota exceeded"}}\n\n',
    )
    await expect(readWebSummaryStream(error)).rejects.toThrow('quota exceeded')
    const onDelta = vi.fn()
    const limit = new Response(
      'data: {"choices":[{"delta":{"content":"half"},"finish_reason":"length"}]}\n\n',
    )
    await expect(readWebSummaryStream(limit, onDelta)).rejects.toThrow('未完成')
    expect(onDelta).toHaveBeenCalledWith('half')
  })
})
