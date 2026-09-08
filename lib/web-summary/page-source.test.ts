import { describe, expect, it } from 'vitest'
import {
  extractTabContent,
  getRefreshHint,
  resolveSummarizableTab,
} from './page-source'
import type { WebSummaryPageContent } from '@/types/web-summary'

type Tab = Partial<chrome.tabs.Tab> & { id?: number }

function createDeps(options: {
  tab?: Tab
  activeTab?: Tab
  injectionResults?: Array<{ result?: unknown } | null>
  executeScriptMissing?: boolean
}) {
  return {
    getTab: async (tabId: number) => {
      if (options.tab?.id === tabId) {
        return options.tab as chrome.tabs.Tab
      }
      throw new Error('No tab')
    },
    queryTabs: async () =>
      options.activeTab ? [options.activeTab as chrome.tabs.Tab] : [],
    executeScript: options.executeScriptMissing
      ? undefined
      : async () => options.injectionResults ?? [],
  }
}

const PAGE_CONTENT: WebSummaryPageContent = {
  title: 'Example',
  url: 'https://example.com/article',
  content: 'Body text',
  source: 'article',
  truncated: false,
  charCount: 9,
}

describe('resolveSummarizableTab', () => {
  it('resolves the requested tab when it exists', async () => {
    const tab = { id: 7, url: 'https://example.com/a' }
    const deps = createDeps({ tab })

    await expect(resolveSummarizableTab(7, deps)).resolves.toMatchObject({
      id: 7,
    })
  })

  it('falls back to the active tab when the requested id cannot be resolved', async () => {
    const activeTab = { id: 3, url: 'https://example.com/b' }
    const deps = createDeps({ activeTab })

    await expect(resolveSummarizableTab(undefined, deps)).resolves.toMatchObject(
      { id: 3 },
    )
  })

  it('rejects with a readable error when no tab can be resolved', async () => {
    const deps = createDeps({})

    await expect(resolveSummarizableTab(undefined, deps)).rejects.toThrow(
      '未找到当前活动网页。',
    )
  })

  it('rejects when the tab is not a normal web page', async () => {
    const activeTab = { id: 3, url: 'chrome://extensions' }
    const deps = createDeps({ activeTab })

    await expect(resolveSummarizableTab(undefined, deps)).rejects.toThrow(
      '当前页面不是普通网页，无法提取正文内容。',
    )
  })
})

describe('extractTabContent', () => {
  it('rejects with a readable error when scripting is unavailable', async () => {
    // 模拟浏览器没有 chrome.scripting：默认 deps 在加载时探测不到执行器
    const scripting = chrome.scripting
    ;(chrome as { scripting?: unknown }).scripting = undefined
    try {
      const deps = createDeps({ executeScriptMissing: true })

      await expect(extractTabContent(3, deps)).rejects.toThrow(
        '当前浏览器不支持按需提取网页内容。',
      )
    } finally {
      ;(chrome as { scripting?: unknown }).scripting = scripting
    }
  })

  it('rejects when the page yields no content', async () => {
    const deps = createDeps({ injectionResults: [{ result: null }] })

    await expect(extractTabContent(3, deps)).rejects.toThrow(
      '未能从当前网页提取正文内容。',
    )
  })

  it('returns the injected extraction result', async () => {
    const deps = createDeps({
      injectionResults: [{ result: PAGE_CONTENT }],
    })

    await expect(extractTabContent(3, deps)).resolves.toEqual(PAGE_CONTENT)
  })
})

describe('getRefreshHint', () => {
  it('translates scripting access failures into an actionable hint', () => {
    const hint = getRefreshHint(
      new Error('Cannot access contents of the page.'),
    )

    expect(hint).toBe(
      '无法访问当前网页内容，请确认这是普通网页，并从当前页面重新发起总结。',
    )
  })

  it('passes other errors through as their message', () => {
    expect(getRefreshHint(new Error('接口超时'))).toBe('接口超时')
  })
})
