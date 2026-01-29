/**
 * Chrome Cookies API 封装测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as chromeCookies from './cookies';

describe('chrome/cookies', () => {
  const mockCookies = [
    { name: 'session', value: 'abc123', domain: '.example.com' },
    { name: 'user', value: 'john', domain: '.example.com' },
    { name: 'pref', value: 'dark', domain: '.test.com' },
  ];

  const mockChrome = {
    cookies: {
      getAll: vi.fn(),
      remove: vi.fn(),
    },
  };

  beforeEach(() => {
    (global as any).chrome = mockChrome;
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all cookies without details', async () => {
      mockChrome.cookies.getAll.mockResolvedValue(mockCookies);
      const result = await chromeCookies.getAll();
      expect(result).toEqual(mockCookies);
      expect(mockChrome.cookies.getAll).toHaveBeenCalledWith({});
    });

    it('should get cookies with details', async () => {
      const details = { domain: '.example.com' };
      const filteredCookies = mockCookies.filter((c) => c.domain === details.domain);
      mockChrome.cookies.getAll.mockResolvedValue(filteredCookies);

      const result = await chromeCookies.getAll(details);
      expect(result).toEqual(filteredCookies);
      expect(mockChrome.cookies.getAll).toHaveBeenCalledWith(details);
    });

    it('should return empty array when no cookies found', async () => {
      mockChrome.cookies.getAll.mockResolvedValue([]);
      const result = await chromeCookies.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should remove a cookie by name and url', async () => {
      const details = { name: 'session', url: 'https://example.com' };
      mockChrome.cookies.remove.mockResolvedValue({ name: 'session', url: 'https://example.com' });

      const result = await chromeCookies.remove(details);
      expect(result).toEqual({ name: 'session', url: 'https://example.com' });
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith(details);
    });

    it('should return null when cookie not found', async () => {
      const details = { name: 'nonexistent', url: 'https://example.com' };
      mockChrome.cookies.remove.mockResolvedValue(null);

      const result = await chromeCookies.remove(details);
      expect(result).toBeNull();
    });
  });

  describe('removeAll', () => {
    it('should remove all cookies', async () => {
      mockChrome.cookies.getAll.mockResolvedValue(mockCookies);
      mockChrome.cookies.remove.mockResolvedValue({ name: 'test', url: 'https://example.com' });

      await chromeCookies.removeAll();

      expect(mockChrome.cookies.getAll).toHaveBeenCalled();
      expect(mockChrome.cookies.remove).toHaveBeenCalledTimes(3);
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({ name: 'session', url: 'https://.example.com' });
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({ name: 'user', url: 'https://.example.com' });
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({ name: 'pref', url: 'https://.test.com' });
    });

    it('should handle empty cookie list', async () => {
      mockChrome.cookies.getAll.mockResolvedValue([]);

      await chromeCookies.removeAll();

      expect(mockChrome.cookies.getAll).toHaveBeenCalled();
      expect(mockChrome.cookies.remove).not.toHaveBeenCalled();
    });

    it('should handle cookies with different domains correctly', async () => {
      const cookies = [
        { name: 'c1', value: 'v1', domain: 'example.com' },
        { name: 'c2', value: 'v2', domain: '.example.com' },
        { name: 'c3', value: 'v3', domain: '.sub.example.com' },
      ];
      mockChrome.cookies.getAll.mockResolvedValue(cookies);
      mockChrome.cookies.remove.mockResolvedValue({});

      await chromeCookies.removeAll();

      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({ name: 'c1', url: 'https://example.com' });
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({ name: 'c2', url: 'https://.example.com' });
      expect(mockChrome.cookies.remove).toHaveBeenCalledWith({ name: 'c3', url: 'https://.sub.example.com' });
    });
  });
});
