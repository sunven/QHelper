/**
 * Chrome Storage API 封装测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as chromeStorage from './storage';

describe('chrome/storage', () => {
  const mockChrome = {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    (global as any).chrome = mockChrome;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('should get value from chrome.storage.local', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ testKey: 'testValue' });
      const result = await chromeStorage.get('testKey');
      expect(result).toBe('testValue');
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('testKey');
    });

    it('should return default value when key does not exist', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      const result = await chromeStorage.get('testKey', 'defaultValue');
      expect(result).toBe('defaultValue');
    });

    it('should return undefined when no default value provided', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      const result = await chromeStorage.get('testKey');
      expect(result).toBeUndefined();
    });

    it('should handle complex objects', async () => {
      const obj = { nested: { value: 123 } };
      mockChrome.storage.local.get.mockResolvedValue({ testKey: obj });
      const result = await chromeStorage.get('testKey');
      expect(result).toEqual(obj);
    });

    it('should handle arrays', async () => {
      const arr = [1, 2, 3, { key: 'value' }];
      mockChrome.storage.local.get.mockResolvedValue({ testKey: arr });
      const result = await chromeStorage.get('testKey');
      expect(result).toEqual(arr);
    });

    it('should fallback to localStorage when chrome.storage fails', async () => {
      const localStorage = {
        getItem: vi.fn().mockReturnValue('"fallbackValue"'),
      };
      mockChrome.storage.local.get.mockRejectedValue(new Error('Chrome storage failed'));
      (global as any).localStorage = localStorage;

      const result = await chromeStorage.get('testKey');
      expect(result).toBe('fallbackValue');
      expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
    });
  });

  describe('set', () => {
    it('should set value in chrome.storage.local', async () => {
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      await chromeStorage.set('testKey', 'testValue');
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'testValue' });
    });

    it('should set complex objects', async () => {
      const obj = { nested: { value: 123 } };
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      await chromeStorage.set('testKey', obj);
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ testKey: obj });
    });

    it('should fallback to localStorage when chrome.storage fails', async () => {
      const localStorage = {
        setItem: vi.fn(),
      };
      mockChrome.storage.local.set.mockRejectedValue(new Error('Chrome storage failed'));
      (global as any).localStorage = localStorage;

      await chromeStorage.set('testKey', 'testValue');
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('testValue'));
    });
  });

  describe('remove', () => {
    it('should remove value from chrome.storage.local', async () => {
      mockChrome.storage.local.remove.mockResolvedValue(undefined);
      await chromeStorage.remove('testKey');
      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('testKey');
    });

    it('should fallback to localStorage when chrome.storage fails', async () => {
      const localStorage = {
        removeItem: vi.fn(),
      };
      mockChrome.storage.local.remove.mockRejectedValue(new Error('Chrome storage failed'));
      (global as any).localStorage = localStorage;

      await chromeStorage.remove('testKey');
      expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
    });
  });

  describe('clear', () => {
    it('should clear all values from chrome.storage.local', async () => {
      mockChrome.storage.local.clear.mockResolvedValue(undefined);
      await chromeStorage.clear();
      expect(mockChrome.storage.local.clear).toHaveBeenCalled();
    });

    it('should fallback to localStorage when chrome.storage fails', async () => {
      const localStorage = {
        clear: vi.fn(),
      };
      mockChrome.storage.local.clear.mockRejectedValue(new Error('Chrome storage failed'));
      (global as any).localStorage = localStorage;

      await chromeStorage.clear();
      expect(localStorage.clear).toHaveBeenCalled();
    });
  });

  describe('onChanged', () => {
    it('should add listener to chrome.storage.onChanged', () => {
      const callback = vi.fn();
      chromeStorage.onChanged(callback);
      expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalledWith(callback);
    });

    it('should fallback to window storage event when chrome.storage is not available', () => {
      const callback = vi.fn();
      (global as any).chrome = {};
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      chromeStorage.onChanged(callback);

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });
  });
});
