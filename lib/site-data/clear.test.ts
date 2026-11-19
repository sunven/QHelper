import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSiteData } from './clear'
import type { SiteTarget } from './types'

function makeCookie(
  partial: Partial<chrome.cookies.Cookie> = {},
): chrome.cookies.Cookie {
  return {
    domain: 'app.example.com',
    name: 'c',
    value: 'v',
    session: false,
    hostOnly: true,
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    storeId: '0',
    ...partial,
  }
}

const currentSiteTarget: SiteTarget = {
  mode: 'current-site',
  origin: 'https://app.example.com',
  hostname: 'app.example.com',
  tabId: 1,
}

const mockChrome = {
  cookies: { getAll: vi.fn(), remove: vi.fn() },
  browsingData: { remove: vi.fn() },
  tabs: { query: vi.fn() },
  scripting: { executeScript: vi.fn() },
}

describe('site-data/clear', () => {
  beforeEach(() => {
    ;(global as any).chrome = mockChrome
    vi.clearAllMocks()
    mockChrome.cookies.remove.mockResolvedValue({})
    mockChrome.browsingData.remove.mockResolvedValue(undefined)
    mockChrome.scripting.executeScript.mockResolvedValue([
      { result: undefined },
    ])
    mockChrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://app.example.com/one' },
      { id: 2, url: 'https://app.example.com/two' },
    ])
  })

  it('clears cookies and origin-scoped storage for the current site', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([
      makeCookie({ name: 'host-only' }),
      makeCookie({ domain: '.example.com', hostOnly: false, name: 'shared' }),
      makeCookie({ domain: '.other.test', hostOnly: false, name: 'other' }),
    ])

    const outcome = await clearSiteData(currentSiteTarget, [
      'cookies',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'cacheStorage',
      'serviceWorkers',
    ])

    expect(mockChrome.cookies.remove).toHaveBeenCalledTimes(2)
    expect(mockChrome.browsingData.remove).toHaveBeenCalledWith(
      { origins: ['https://app.example.com'] },
      {
        localStorage: true,
        indexedDB: true,
        cacheStorage: true,
        serviceWorkers: true,
      },
    )
    expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(2)
    expect(outcome.affectedTabIds).toEqual([1, 2])
    expect(outcome.results.map((result) => [result.type, result.status])).toEqual(
      [
        ['cookies', 'success'],
        ['localStorage', 'success'],
        ['sessionStorage', 'success'],
        ['indexedDB', 'success'],
        ['cacheStorage', 'success'],
        ['serviceWorkers', 'success'],
      ],
    )
  })

  it('uses global browsing data and all cookies for all sites', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([
      makeCookie({ name: 'a', domain: '.a.test', hostOnly: false }),
      makeCookie({ name: 'b', domain: '.b.test', hostOnly: false }),
    ])

    const outcome = await clearSiteData({ mode: 'all-sites' }, [
      'cookies',
      'localStorage',
      'serviceWorkers',
    ])

    expect(mockChrome.cookies.remove).toHaveBeenCalledTimes(2)
    expect(mockChrome.browsingData.remove).toHaveBeenCalledWith(
      {},
      { localStorage: true, serviceWorkers: true },
    )
    expect(outcome.results.map((result) => result.type)).toEqual([
      'cookies',
      'localStorage',
      'serviceWorkers',
    ])
  })

  it('reports browsing data failures per storage type', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([makeCookie()])
    mockChrome.browsingData.remove.mockRejectedValue(new Error('denied'))

    const outcome = await clearSiteData(currentSiteTarget, [
      'cookies',
      'localStorage',
      'indexedDB',
    ])

    expect(outcome.results).toEqual([
      expect.objectContaining({ type: 'cookies', status: 'success' }),
      expect.objectContaining({
        type: 'localStorage',
        status: 'failed',
        message: 'denied',
      }),
      expect.objectContaining({
        type: 'indexedDB',
        status: 'failed',
        message: 'denied',
      }),
    ])
  })

  it('skips sessionStorage when no tabs are open', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([])
    mockChrome.tabs.query.mockResolvedValue([])

    const outcome = await clearSiteData(currentSiteTarget, ['sessionStorage'])

    expect(outcome.results).toEqual([
      {
        type: 'sessionStorage',
        status: 'skipped',
        message: '没有打开的标签页可供清理',
      },
    ])
    expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled()
  })

  it('tolerates tabs that reject injection', async () => {
    mockChrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://app.example.com/one' },
      { id: 2, url: 'https://app.example.com/two' },
    ])
    mockChrome.scripting.executeScript
      .mockRejectedValueOnce(new Error('Cannot access'))
      .mockResolvedValueOnce([{ result: undefined }])

    const outcome = await clearSiteData(currentSiteTarget, ['sessionStorage'])

    expect(outcome.results).toEqual([
      expect.objectContaining({
        type: 'sessionStorage',
        status: 'success',
        message: '已清理 1 个标签页，1 个无法访问',
      }),
    ])
  })

  it('omits types that were not selected', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([makeCookie()])

    const outcome = await clearSiteData(currentSiteTarget, ['cookies'])

    expect(outcome.results.map((result) => result.type)).toEqual(['cookies'])
    expect(mockChrome.browsingData.remove).not.toHaveBeenCalled()
    expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled()
  })
})
