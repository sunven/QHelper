import { describe, expect, it, vi } from 'vitest'
import {
  handleDictionaryFetchMessage,
  isDictionaryFetchMessage,
} from './background'
import { DICTIONARY_FETCH_MESSAGE } from './types'

describe('dictionary/background', () => {
  it('identifies dictionary fetch messages', () => {
    expect(
      isDictionaryFetchMessage({
        type: DICTIONARY_FETCH_MESSAGE,
        url: 'https://dict.youdao.com/jsonapi?q=test',
      }),
    ).toBe(true)
    expect(isDictionaryFetchMessage({ type: 'OPEN_WEB_SUMMARY' })).toBe(false)
  })

  it('fetches text and responds asynchronously for dictionary messages', async () => {
    const sendResponse = vi.fn()
    const fetchText = vi.fn(() => Promise.resolve('{"simple":{"query":"test"}}'))

    const handled = handleDictionaryFetchMessage(
      {
        type: DICTIONARY_FETCH_MESSAGE,
        url: 'https://dict.youdao.com/jsonapi?q=test',
      },
      sendResponse,
      { fetchText },
    )

    expect(handled).toBe(true)
    expect(fetchText).toHaveBeenCalledWith('https://dict.youdao.com/jsonapi?q=test')

    await Promise.resolve()
    expect(sendResponse).toHaveBeenCalledWith('{"simple":{"query":"test"}}')
  })

  it('ignores unrelated messages', () => {
    const sendResponse = vi.fn()
    const fetchText = vi.fn()

    expect(
      handleDictionaryFetchMessage(
        { type: 'OPEN_WEB_SUMMARY' },
        sendResponse,
        { fetchText },
      ),
    ).toBe(false)
    expect(fetchText).not.toHaveBeenCalled()
    expect(sendResponse).not.toHaveBeenCalled()
  })
})

