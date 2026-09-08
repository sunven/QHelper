import { query as queryTabs } from '@/lib/chrome/tabs'
import { getErrorMessage } from '@/lib/utils'
import { extractPageContent } from '@/lib/web-summary/content'
import type { WebSummaryPageContent } from '@/types/web-summary'

export type PageSourceDeps = {
  getTab?: (tabId: number) => Promise<chrome.tabs.Tab | undefined>
  queryTabs?: (
    queryInfo: chrome.tabs.QueryInfo,
  ) => Promise<chrome.tabs.Tab[]>
  executeScript?: (injection: {
    target: { tabId: number }
    func: (win: Window, doc: Document, maxChars: number) => unknown
  }) => Promise<Array<{ result?: unknown } | null>>
}

function getDefaultExecuteScript(): PageSourceDeps['executeScript'] {
  return chrome.scripting?.executeScript
    ? (injection) =>
        chrome.scripting.executeScript(
          injection as Parameters<typeof chrome.scripting.executeScript>[0],
        ) as unknown as Promise<Array<{ result?: unknown } | null>>
    : undefined
}

function isUnsupportedUrl(url?: string | null): boolean {
  if (!url) {
    return true
  }

  return /^(about:|chrome:|chrome-extension:|edge:|moz-extension:|opera:|vivaldi:)/.test(url)
}

/**
 * 解析可总结的目标标签页：优先请求的 tabId，失败回落当前活动标签页，
 * 并通过 URL 闸门拒绝浏览器内部页面。
 */
export async function resolveSummarizableTab(
  requestedTabId?: number,
  deps: PageSourceDeps = {},
): Promise<chrome.tabs.Tab & { id: number }> {
  const getTab = deps.getTab ?? ((tabId) => chrome.tabs.get(tabId))
  const queryTabsDep = deps.queryTabs ?? queryTabs

  let tab: chrome.tabs.Tab | undefined
  if (requestedTabId) {
    try {
      tab = await getTab(requestedTabId)
    } catch {
      // 回落到活动标签页查找
    }
  }

  if (!tab) {
    const [activeTab] = await queryTabsDep({ active: true, currentWindow: true })
    tab = activeTab
  }

  if (!tab?.id) {
    throw new Error('未找到当前活动网页。')
  }

  if (isUnsupportedUrl(tab.url)) {
    throw new Error('当前页面不是普通网页，无法提取正文内容。')
  }

  // 上方 throw 已保证 tab 与 tab.id 存在
  return tab as chrome.tabs.Tab & { id: number }
}

/**
 * 按需提取标签页正文：能力探测 + executeScript 注入纯提取函数。
 */
export async function extractTabContent(
  tabId: number,
  deps: PageSourceDeps = {},
): Promise<WebSummaryPageContent> {
  // 调用时探测执行器：deps 未注入时如实反映浏览器能力
  const executeScript = deps.executeScript ?? getDefaultExecuteScript()

  if (!executeScript) {
    throw new Error('当前浏览器不支持按需提取网页内容。')
  }

  const [injectionResult] = await executeScript({
    target: { tabId },
    func: extractPageContent,
  })
  const pageContent = injectionResult?.result

  if (!pageContent) {
    throw new Error('未能从当前网页提取正文内容。')
  }

  return pageContent as WebSummaryPageContent
}

/**
 * 把 Chrome 注入类错误翻译成用户可行动的提示，其余错误原样透出。
 */
export function getRefreshHint(error: unknown): string {
  const message = getErrorMessage(error)
  if (/Cannot access|Extension manifest must request permission|activeTab|Cannot load contents/i.test(message)) {
    return '无法访问当前网页内容，请确认这是普通网页，并从当前页面重新发起总结。'
  }

  return message
}
