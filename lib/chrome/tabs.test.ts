/**
 * Chrome Tabs API 封装测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as chromeTabs from './tabs';

describe('chrome/tabs', () => {
  const mockTabs = [
    { id: 1, url: 'https://example.com', active: true },
    { id: 2, url: 'https://test.com', active: false },
  ];

  const mockChrome = {
    tabs: {
      create: vi.fn(),
      query: vi.fn(),
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    },
  };

  beforeEach(() => {
    (global as any).chrome = mockChrome;
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tab with full URL', async () => {
      const url = 'https://example.com';
      const mockTab = { id: 1, url };
      mockChrome.tabs.create.mockResolvedValue(mockTab);

      const result = await chromeTabs.create(url);
      expect(result).toEqual(mockTab);
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url });
    });

    it('should convert relative path to extension URL', async () => {
      const path = 'entrypoints/json.html';
      const fullUrl = 'chrome-extension://test/entrypoints/json.html';
      const mockTab = { id: 1, url: fullUrl };
      mockChrome.tabs.create.mockResolvedValue(mockTab);
      mockChrome.runtime.getURL.mockReturnValue(fullUrl);

      const result = await chromeTabs.create(path);
      expect(result).toEqual(mockTab);
      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(path);
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: fullUrl });
    });

    it('should not convert chrome:// URLs', async () => {
      const url = 'chrome://extensions';
      const mockTab = { id: 1, url };
      mockChrome.tabs.create.mockResolvedValue(mockTab);

      const result = await chromeTabs.create(url);
      expect(result).toEqual(mockTab);
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url });
      expect(mockChrome.runtime.getURL).not.toHaveBeenCalled();
    });

    it('should handle .html file paths', async () => {
      const path = 'json.html';
      const fullUrl = 'chrome-extension://test/json.html';
      const mockTab = { id: 1, url: fullUrl };
      mockChrome.tabs.create.mockResolvedValue(mockTab);
      mockChrome.runtime.getURL.mockReturnValue(fullUrl);

      await chromeTabs.create(path);
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: fullUrl });
    });
  });

  describe('query', () => {
    it('should query tabs with query info', async () => {
      const queryInfo = { active: true };
      mockChrome.tabs.query.mockResolvedValue([mockTabs[0]]);

      const result = await chromeTabs.query(queryInfo);
      expect(result).toEqual([mockTabs[0]]);
      expect(mockChrome.tabs.query).toHaveBeenCalledWith(queryInfo);
    });

    it('should return all tabs when querying without filters', async () => {
      mockChrome.tabs.query.mockResolvedValue(mockTabs);

      const result = await chromeTabs.query({});
      expect(result).toEqual(mockTabs);
    });

    it('should return empty array when no tabs match', async () => {
      mockChrome.tabs.query.mockResolvedValue([]);

      const result = await chromeTabs.query({ url: 'https://nonexistent.com' });
      expect(result).toEqual([]);
    });
  });

  describe('getCurrent', () => {
    it('should return the active tab in current window', async () => {
      mockChrome.tabs.query.mockResolvedValue([mockTabs[0]]);

      const result = await chromeTabs.getCurrent();
      expect(result).toEqual(mockTabs[0]);
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    it('should return undefined when no active tab', async () => {
      mockChrome.tabs.query.mockResolvedValue([]);

      const result = await chromeTabs.getCurrent();
      expect(result).toBeUndefined();
    });

    it('should return first tab when multiple tabs match', async () => {
      const activeTabs = [mockTabs[0], { id: 3, url: 'https://another.com', active: true }];
      mockChrome.tabs.query.mockResolvedValue(activeTabs);

      const result = await chromeTabs.getCurrent();
      expect(result).toEqual(mockTabs[0]);
    });
  });
});
