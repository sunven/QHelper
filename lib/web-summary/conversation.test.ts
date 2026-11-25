import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebSummaryConversation } from '@/types/web-summary'
import { streamWebSummaryMessages } from './ai'
import {
  answerPageConversation,
  HISTORY_CHARS,
  splitPageText,
} from './conversation'

vi.mock('./ai', async (original) => ({
  ...(await original<typeof import('./ai')>()),
  streamWebSummaryMessages: vi.fn(),
}))
const request = vi.mocked(streamWebSummaryMessages)
const config = {
  endpoint: 'https://example.com/v1/chat/completions',
  model: 'reader',
  apiKey: 'test',
}
const base = (): WebSummaryConversation => ({
  id: 'c1',
  windowId: 1,
  tabId: 2,
  createdAt: 1,
  page: {
    title: 'Article',
    url: 'https://example.com',
    content: 'Original evidence',
    source: 'article',
    charCount: 17,
    truncated: false,
  },
  memory: '',
  memoryThrough: 0,
  messages: [
    { id: 'summary', role: 'assistant', content: '', status: 'streaming' },
  ],
})
const run = (conversation: WebSummaryConversation, extra = {}) =>
  answerPageConversation({
    conversation,
    config,
    signal: new AbortController().signal,
    onDelta: vi.fn(),
    onMemory: vi.fn(),
    onStatus: vi.fn(),
    ...extra,
  })

describe('page conversation', () => {
  beforeEach(() => {
    request.mockReset().mockResolvedValue('Answer')
  })

  it('splits without omitting paragraphs or breaking surrogate pairs', () => {
    const text = `abc\n${'正文😀\n'.repeat(2000)}the ending`
    const parts = splitPageText(text)
    expect(parts.join('')).toBe(text)
    expect(parts.every((part) => part.length <= 5000)).toBe(true)
    expect(parts.every((part) => !/[\ud800-\udbff]$/.test(part))).toBe(true)
  })

  it('sends the snapshot, earlier exchanges and current question', async () => {
    const value = base()
    value.messages = [
      {
        id: 's',
        role: 'assistant',
        content: 'First summary',
        status: 'complete',
      },
      {
        id: 'q1',
        role: 'user',
        content: 'Explain point two',
        status: 'complete',
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Partial explanation',
        status: 'stopped',
      },
      { id: 'q2', role: 'user', content: 'Continue', status: 'complete' },
      { id: 'a2', role: 'assistant', content: '', status: 'streaming' },
    ]
    await run(value)
    const messages = request.mock.calls[0][0].messages
    expect(messages.map((m) => m.content).join('\n')).toContain(
      'Original evidence',
    )
    expect(messages).toContainEqual({
      role: 'user',
      content: 'Explain point two',
    })
    expect(messages).toContainEqual({
      role: 'assistant',
      content: expect.stringContaining('未完成'),
    })
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: 'Continue',
    })
    expect(messages).not.toContainEqual({ role: 'assistant', content: '' })
  })

  it('reads every part including the tail, and revisits the original on a question', async () => {
    const value = base()
    value.page.content = `${'正文 '.repeat(9000)}末尾事实：42`
    value.messages.unshift(
      { id: 's', role: 'assistant', content: 'Summary', status: 'complete' },
      {
        id: 'q',
        role: 'user',
        content: '结尾给出的数字是多少？',
        status: 'complete',
      },
    )
    request.mockImplementation(async ({ messages }) =>
      messages.some((m) => m.content.includes('末尾事实：42'))
        ? '末尾事实：42'
        : '此段无相关事实',
    )
    const result = await run(value)
    expect(result).toContain('42')
    const prompts = request.mock.calls.map(([call]) =>
      call.messages.map((m) => m.content).join('\n'),
    )
    const segments = prompts.filter((prompt) => prompt.includes('<网页正文>'))
    expect(segments).toHaveLength(splitPageText(value.page.content).length)
    expect(segments[segments.length - 1]).toContain('末尾事实：42')
    expect(value.page.content.endsWith('末尾事实：42')).toBe(true)
  })

  it('compresses old turns, retains visible history, and carries memory into the next request', async () => {
    const value = base()
    value.messages.unshift(
      {
        id: 's',
        role: 'assistant',
        content: 'Keep important agreement. '.repeat(300),
        status: 'complete',
      },
      {
        id: 'q',
        role: 'user',
        content: 'What did we agree?',
        status: 'complete',
      },
    )
    const onMemory = vi.fn()
    request
      .mockResolvedValueOnce('Earlier agreement')
      .mockResolvedValueOnce('Earlier agreement')
      .mockResolvedValue('Final answer')
    await run(value, { onMemory })
    expect(onMemory).toHaveBeenCalledWith('Earlier agreement', 1)
    const final = request.mock.calls[request.mock.calls.length - 1][0].messages
    expect(final.some((m) => m.content.includes('Earlier agreement'))).toBe(
      true,
    )
    expect(value.messages[0].content.length).toBeGreaterThan(HISTORY_CHARS)
    expect(value.memoryThrough).toBe(0)
  })

  it('does not discard history or proceed when compression fails', async () => {
    const value = base()
    value.messages.unshift(
      {
        id: 's',
        role: 'assistant',
        content: 'Old fact'.repeat(1000),
        status: 'complete',
      },
      { id: 'q', role: 'user', content: 'Remember this?', status: 'complete' },
    )
    request.mockRejectedValueOnce(new Error('quota'))
    const onMemory = vi.fn()
    await expect(run(value, { onMemory })).rejects.toThrow('quota')
    expect(onMemory).not.toHaveBeenCalled()
    expect(value.messages[1].content).toBe('Remember this?')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('stops the remaining long-page requests when cancelled', async () => {
    const value = base()
    value.page.content = 'content'.repeat(4000)
    const controller = new AbortController()
    request.mockImplementationOnce(async () => {
      controller.abort()
      return 'partial note'
    })
    await expect(
      run(value, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
