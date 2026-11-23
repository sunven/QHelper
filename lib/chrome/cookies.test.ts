/**
 * Chrome Cookies API 封装测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as chromeCookies from './cookies'

function makeCookie(
  partial: Partial<chrome.cookies.Cookie>,
): chrome.cookies.Cookie {
  return {
    domain: 'example.com',
    name: 'c',
    value: 'v',
    session: false,
    hostOnly: false,
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    storeId: '0',
    ...partial,
  }
}

describe('chrome/cookies', () => {
  const mockChrome = {
    cookies: {
      getAll: vi.fn(),
      remove: vi.fn(),
    },
  }

  beforeEach(() => {
    ;(global as any).chrome = mockChrome
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should get all cookies without details', async () => {
      const cookies = [makeCookie({})]
      mockChrome.cookies.getAll.mockResolvedValue(cookies)
      const result = await chromeCookies.getAll()
      expect(result).toEqual(cookies)
      expect(mockChrome.cookies.getAll).toHaveBeenCalledWith({})
    })

    it('should get cookies with details', async () => {
      const details = { domain: '.example.com' }
      mockChrome.cookies.getAll.mockResolvedValue([])

      await chromeCookies.getAll(details)
      expect(mockChrome.cookies.getAll).toHaveBeenCalledWith(details)
    })
  })

  describe('remove', () => {
    it('should remove a cookie by name and url', async () => {
      const details = { name: 'session', url: 'https://example.com' }
      mockChrome.cookies.remove.mockResolvedValue({
        name: 'session',
        url: 'https://example.com',
      })

      const result = await chromeCookies.remove(details)
      expect(result).toEqual({ name: 'session', url: 'https://example.com' })
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith(details)
    })

    it('should return null when cookie not found', async () => {
      mockChrome.cookies.remove.mockResolvedValue(null)

      const result = await chromeCookies.remove({
        name: 'nonexistent',
        url: 'https://example.com',
      })
      expect(result).toBeNull()
    })
  })

  describe('isCookieVisibleToHostname', () => {
    it('matches host-only cookies only on the exact host', () => {
      const hostOnly = makeCookie({
        domain: 'example.com',
        hostOnly: true,
      })

      expect(
        chromeCookies.isCookieVisibleToHostname(hostOnly, 'example.com'),
      ).toBe(true)
      expect(
        chromeCookies.isCookieVisibleToHostname(hostOnly, 'www.example.com'),
      ).toBe(false)
    })

    it('matches domain cookies for the domain and its subdomains', () => {
      const domainCookie = makeCookie({ domain: '.example.com' })

      expect(
        chromeCookies.isCookieVisibleToHostname(domainCookie, 'example.com'),
      ).toBe(true)
      expect(
        chromeCookies.isCookieVisibleToHostname(
          domainCookie,
          'app.example.com',
        ),
      ).toBe(true)
      expect(
        chromeCookies.isCookieVisibleToHostname(
          domainCookie,
          'example.com.evil.test',
        ),
      ).toBe(false)
    })

    it('does not match sibling subdomains', () => {
      const siblingCookie = makeCookie({ domain: '.foo.example.com' })

      expect(
        chromeCookies.isCookieVisibleToHostname(
          siblingCookie,
          'www.example.com',
        ),
      ).toBe(false)
    })
  })

  describe('getCookiesForHostname', () => {
    it('keeps only cookies visible to the hostname', async () => {
      mockChrome.cookies.getAll.mockResolvedValue([
        makeCookie({ name: 'host-only', hostOnly: true }),
        makeCookie({ name: 'parent-domain', domain: '.example.com' }),
        makeCookie({ name: 'sibling', domain: '.api.example.com' }),
        makeCookie({ name: 'other', domain: '.other.test' }),
      ])

      const result = await chromeCookies.getCookiesForHostname('example.com')

      expect(mockChrome.cookies.getAll).toHaveBeenCalledWith({})
      expect(result.map((cookie) => cookie.name)).toEqual([
        'host-only',
        'parent-domain',
      ])
    })
  })

  describe('removeCookies', () => {
    it('removes every cookie with its removal URL and store id', async () => {
      mockChrome.cookies.remove.mockResolvedValue({})

      const summary = await chromeCookies.removeCookies([
        makeCookie({
          name: 'session',
          domain: '.example.com',
          path: '/',
          secure: true,
        }),
        makeCookie({
          name: 'user',
          domain: '.example.com',
          path: '/account',
          secure: false,
        }),
        makeCookie({
          name: 'pref',
          domain: '.test.com',
          path: '/settings',
          secure: true,
        }),
      ])

      expect(summary).toEqual({ removed: 3, failed: 0 })
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({
        name: 'session',
        url: 'https://example.com/',
        storeId: '0',
      })
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({
        name: 'user',
        url: 'http://example.com/account',
        storeId: '0',
      })
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({
        name: 'pref',
        url: 'https://test.com/settings',
        storeId: '0',
      })
    })

    it('passes the partition key of partitioned cookies', async () => {
      mockChrome.cookies.remove.mockResolvedValue({})

      await chromeCookies.removeCookies([
        makeCookie({
          name: 'chips',
          partitionKey: { topLevelSite: 'https://top.example.com' },
        }),
      ])

      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({
        name: 'chips',
        url: 'https://example.com/',
        storeId: '0',
        partitionKey: { topLevelSite: 'https://top.example.com' },
      })
    })

    it('does not count missing cookies as removed', async () => {
      mockChrome.cookies.remove.mockResolvedValue(null)

      const summary = await chromeCookies.removeCookies([
        makeCookie({ name: 'already-gone' }),
      ])

      expect(summary).toEqual({ removed: 0, failed: 0 })
    })

    it('counts failed removals without aborting the rest', async () => {
      mockChrome.cookies.remove
        .mockRejectedValueOnce(new Error('failed'))
        .mockResolvedValue({})

      const summary = await chromeCookies.removeCookies([
        makeCookie({ name: 'a' }),
        makeCookie({ name: 'b' }),
      ])

      expect(summary).toEqual({ removed: 1, failed: 1 })
      expect(mockChrome.cookies.remove).toHaveBeenCalledTimes(2)
    })

    it('does nothing for an empty cookie list', async () => {
      const summary = await chromeCookies.removeCookies([])

      expect(summary).toEqual({ removed: 0, failed: 0 })
      expect(mockChrome.cookies.remove).not.toHaveBeenCalled()
    })
  })
})
