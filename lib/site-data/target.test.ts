import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAffectedTabs,
  getSiteHostname,
  getSiteOrigin,
  parseLaunchTarget,
} from './target'

const mockChrome = {
  tabs: {
    query: vi.fn(),
  },
}

describe('site-data/target', () => {
  beforeEach(() => {
    ;(global as any).chrome = mockChrome
    vi.clearAllMocks()
  })

  describe('getSiteOrigin', () => {
    it('returns the origin for http(s) urls', () => {
      expect(getSiteOrigin('https://app.example.com/dashboard?q=1')).toBe(
        'https://app.example.com',
      )
      expect(getSiteOrigin('http://localhost:3000/x')).toBe(
        'http://localhost:3000',
      )
    })

    it('rejects restricted pages and invalid urls', () => {
      expect(getSiteOrigin('chrome://settings')).toBeNull()
      expect(getSiteOrigin('chrome-extension://abc/popup.html')).toBeNull()
      expect(getSiteOrigin('about:blank')).toBeNull()
      expect(getSiteOrigin('file:///tmp/a.html')).toBeNull()
      expect(getSiteOrigin('not a url')).toBeNull()
      expect(getSiteOrigin(undefined)).toBeNull()
    })
  })

  describe('getSiteHostname', () => {
    it('derives the hostname from an origin', () => {
      expect(getSiteHostname('https://app.example.com')).toBe('app.example.com')
      expect(getSiteHostname('http://127.0.0.1:8080')).toBe('127.0.0.1')
    })

    it('returns null for invalid origins', () => {
      expect(getSiteHostname('not an origin')).toBeNull()
    })
  })

  describe('parseLaunchTarget', () => {
    it('parses the origin and tab snapshot from launch params', () => {
      expect(
        parseLaunchTarget('?origin=https%3A%2F%2Fapp.example.com&tabId=42'),
      ).toEqual({
        mode: 'current-site',
        origin: 'https://app.example.com',
        hostname: 'app.example.com',
        tabId: 42,
      })
    })

    it('drops an invalid tab id', () => {
      expect(
        parseLaunchTarget('?origin=https%3A%2F%2Fapp.example.com&tabId=x'),
      ).toMatchObject({ tabId: undefined })
    })

    it('returns null without a valid origin', () => {
      expect(parseLaunchTarget('')).toBeNull()
      expect(parseLaunchTarget('?origin=chrome%3A%2F%2Fsettings')).toBeNull()
      expect(parseLaunchTarget('?tabId=1')).toBeNull()
    })
  })

  describe('getAffectedTabs', () => {
    it('keeps only tabs of the exact origin in current-site mode', async () => {
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1, url: 'https://app.example.com/home' },
        { id: 2, url: 'https://app.example.com:8443/home' },
        { id: 3, url: 'https://www.example.com/home' },
        { id: 4, url: 'chrome://settings' },
        { url: 'https://app.example.com/no-id' },
      ])

      const tabs = await getAffectedTabs({
        mode: 'current-site',
        origin: 'https://app.example.com',
        hostname: 'app.example.com',
      })

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({})
      expect(tabs.map((tab) => tab.id)).toEqual([1])
    })

    it('keeps all http(s) tabs in all-sites mode', async () => {
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1, url: 'https://app.example.com/home' },
        { id: 2, url: 'http://localhost:3000/' },
        { id: 3, url: 'chrome-extension://abc/tools/clear-site-data.html' },
        { id: 4 },
      ])

      const tabs = await getAffectedTabs({ mode: 'all-sites' })

      expect(tabs.map((tab) => tab.id)).toEqual([1, 2])
    })
  })
})
