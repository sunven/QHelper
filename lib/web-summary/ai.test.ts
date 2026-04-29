import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildWebSummaryRequest,
  parseWebSummaryEventBlock,
  readWebSummaryStream,
  streamWebPageSummary,
} from './ai'

const pageContent = {
  title: 'Test page',
  url: 'https://example.com/article',
  content: 'Some article content',
  source: 'article' as const,
  truncated: false,
  charCount: 20,
}

const config = {
  endpoint: 'https://example.com/v1/chat/completions',
  model: 'gpt-4.1-mini',
  apiKey: 'secret',
}

describe('web-summary/ai', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('builds an OpenAI-compatible request payload', () => {
    expect(buildWebSummaryRequest(config, pageContent)).toMatchObject({
      model: 'gpt-4.1-mini',
      stream: true,
      temperature: 0.2,
      messages: [
        { role: 'system' },
        { role: 'user' },
      ],
    })
  })

  it('parses streaming event blocks and done sentinels', () => {
    expect(
      parseWebSummaryEventBlock(
        'data: {"choices":[{"delta":{"content":"hello"}}]}',
      ),
    ).toEqual({ done: false, delta: 'hello' })
    expect(parseWebSummaryEventBlock('data: [DONE]')).toEqual({ done: true, delta: '' })
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
    await expect(readWebSummaryStream(response, (delta) => deltas.push(delta))).resolves.toBe(
      'Hello world',
    )
    expect(deltas).toEqual(['Hello ', 'world'])
    expect(warn).toHaveBeenCalled()
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

    await expect(streamWebPageSummary({ pageContent, config })).rejects.toThrow(
      '总结接口返回 400：bad request',
    )
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
      streamWebPageSummary({
        pageContent,
        config,
        onDelta: (delta) => deltas.push(delta),
      }),
    ).resolves.toBe('# 总结\n\n- 完成')
    expect(deltas).toEqual(['# 总结\n\n- 完成'])
  })
})
