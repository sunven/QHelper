import { beforeEach, describe, expect, it, vi } from 'vitest'

const { extractPageContent } = vi.hoisted(() => ({
  extractPageContent: vi.fn(() => ({
    title: 'Example',
    url: 'https://example.com',
    content: 'content',
    source: 'article',
    truncated: false,
    charCount: 7,
  })),
}))

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}))

vi.mock('@/lib/web-summary/content', () => ({
  extractPageContent,
}))

import webSummaryContentScript from '../entrypoints/web-summary.content'

describe('entrypoints/web-summary.content.ts', () => {
  beforeEach(() => {
    extractPageContent.mockClear()
  })

  it('registers the page-summary content script and responds with extracted content', () => {
    expect(webSummaryContentScript.matches).toEqual(['<all_urls>'])
    expect(webSummaryContentScript.runAt).toBe('document_idle')

    const listeners: Array<(message: unknown, sender: unknown, sendResponse: (value: unknown) => void) => unknown> = []
    vi.spyOn(chrome.runtime.onMessage, 'addListener').mockImplementation((listener: any) => {
      listeners.push(listener)
    })

    webSummaryContentScript.main({} as never)

    const sendResponse = vi.fn()
    const handled = listeners[0]({ type: 'WEB_SUMMARY_EXTRACT_PAGE' }, {}, sendResponse)

    expect(handled).toBe(true)
    expect(extractPageContent).toHaveBeenCalledWith(window, document)
    expect(sendResponse).toHaveBeenCalledWith({
      title: 'Example',
      url: 'https://example.com',
      content: 'content',
      source: 'article',
      truncated: false,
      charCount: 7,
    })
  })
})
