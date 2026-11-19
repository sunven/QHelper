import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collectSiteDataCounts } from './counts'

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

const snapshotA = {
  localStorageKeys: 4,
  sessionStorageKeys: 2,
  indexedDBNames: ['db1'],
  cacheNames: ['c1', 'c2'],
  serviceWorkerRegistrations: 1,
}

const snapshotB = {
  localStorageKeys: 4,
  sessionStorageKeys: 3,
  indexedDBNames: ['db1'],
  cacheNames: ['c1', 'c2'],
  serviceWorkerRegistrations: 1,
}

const mockChrome = {
  cookies: { getAll: vi.fn() },
  tabs: { query: vi.fn() },
  scripting: { executeScript: vi.fn() },
}

describe('site-data/counts', () => {
  beforeEach(() => {
    ;(global as any).chrome = mockChrome
    vi.clearAllMocks()
  })

  it('counts cookies for all sites and leaves other types unavailable', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([
      makeCookie(),
      makeCookie({ name: 'b' }),
    ])

    const counts = await collectSiteDataCounts({ mode: 'all-sites' })

    expect(counts).toEqual({
      cookies: 2,
      localStorage: null,
      sessionStorage: null,
      indexedDB: null,
      cacheStorage: null,
      serviceWorkers: null,
    })
    expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled()
  })

  it('aggregates page storage across affected tabs for the current site', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([
      makeCookie({ name: 'host-only' }),
      makeCookie({ domain: '.example.com', hostOnly: false, name: 'shared' }),
      makeCookie({ domain: '.other.test', hostOnly: false, name: 'other' }),
    ])
    mockChrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://app.example.com/one' },
      { id: 2, url: 'https://app.example.com/two' },
    ])
    mockChrome.scripting.executeScript
      .mockResolvedValueOnce([{ result: snapshotA }])
      .mockResolvedValueOnce([{ result: snapshotB }])

    const counts = await collectSiteDataCounts({
      mode: 'current-site',
      origin: 'https://app.example.com',
      hostname: 'app.example.com',
      tabId: 2,
    })

    expect(counts).toEqual({
      cookies: 2,
      localStorage: 4,
      sessionStorage: 5,
      indexedDB: 1,
      cacheStorage: 2,
      serviceWorkers: 1,
    })
    expect(mockChrome.scripting.executeScript).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ target: { tabId: 2 } }),
    )
    expect(mockChrome.scripting.executeScript).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ target: { tabId: 1 } }),
    )
  })

  it('keeps counting when a tab rejects injection', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([makeCookie()])
    mockChrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://app.example.com/one' },
      { id: 2, url: 'https://app.example.com/two' },
    ])
    mockChrome.scripting.executeScript
      .mockRejectedValueOnce(new Error('Cannot access'))
      .mockResolvedValueOnce([{ result: snapshotB }])

    const counts = await collectSiteDataCounts({
      mode: 'current-site',
      origin: 'https://app.example.com',
      hostname: 'app.example.com',
      tabId: 1,
    })

    expect(counts).toMatchObject({
      cookies: 1,
      localStorage: 4,
      sessionStorage: 3,
      indexedDB: 1,
      cacheStorage: 2,
      serviceWorkers: 1,
    })
  })

  it('marks page storage unavailable when no affected tab is reachable', async () => {
    mockChrome.cookies.getAll.mockResolvedValue([makeCookie()])
    mockChrome.tabs.query.mockResolvedValue([])

    const counts = await collectSiteDataCounts({
      mode: 'current-site',
      origin: 'https://app.example.com',
      hostname: 'app.example.com',
    })

    expect(counts).toEqual({
      cookies: 1,
      localStorage: null,
      sessionStorage: null,
      indexedDB: null,
      cacheStorage: null,
      serviceWorkers: null,
    })
  })
})
