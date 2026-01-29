/**
 * 最近使用工具管理测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as chromeStorage from '@/lib/chrome/storage';
import * as recentTools from './recentTools';

// Mock chrome storage module
vi.mock('@/lib/chrome/storage', () => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

describe('recentTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chrome.storage, 'onChanged', 'get').mockReturnValue({
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as any);
  });

  describe('trackToolUsage', () => {
    it('should add new tool to recent tools', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue([]);

      await recentTools.trackToolUsage('json', 'JSON 格式化');

      expect(chromeStorage.set).toHaveBeenCalledWith('recent_tools', [
        {
          toolId: 'json',
          toolName: 'JSON 格式化',
          timestamp: expect.any(Number),
        },
      ]);
    });

    it('should move existing tool to top when used again', async () => {
      const existingRecent = [
        { toolId: 'json', toolName: 'JSON 格式化', timestamp: Date.now() - 1000 },
        { toolId: 'yaml', toolName: 'YAML 转换器', timestamp: Date.now() - 2000 },
      ];
      vi.mocked(chromeStorage.get).mockResolvedValue(existingRecent);

      await recentTools.trackToolUsage('yaml', 'YAML 转换器');

      expect(chromeStorage.set).toHaveBeenCalledWith('recent_tools', [
        {
          toolId: 'yaml',
          toolName: 'YAML 转换器',
          timestamp: expect.any(Number),
        },
        {
          toolId: 'json',
          toolName: 'JSON 格式化',
          timestamp: existingRecent[0].timestamp,
        },
      ]);
    });

    it('should limit to 8 recent tools', async () => {
      const existingRecent = Array.from({ length: 8 }, (_, i) => ({
        toolId: `tool${i}`,
        toolName: `Tool ${i}`,
        timestamp: Date.now() - i * 1000,
      }));
      vi.mocked(chromeStorage.get).mockResolvedValue(existingRecent);

      await recentTools.trackToolUsage('newTool', 'New Tool');

      const calls = vi.mocked(chromeStorage.set).mock.calls;
      const newRecent = calls[0][1] as recentTools.RecentToolEntry[];
      expect(newRecent).toHaveLength(8);
      expect(newRecent[0].toolId).toBe('newTool');
    });

    it('should update tool name if different', async () => {
      const existingRecent = [
        { toolId: 'json', toolName: 'JSON Formatter', timestamp: Date.now() },
      ];
      vi.mocked(chromeStorage.get).mockResolvedValue(existingRecent);

      await recentTools.trackToolUsage('json', 'JSON 格式化');

      const calls = vi.mocked(chromeStorage.set).mock.calls;
      const newRecent = calls[0][1] as recentTools.RecentToolEntry[];
      expect(newRecent[0].toolName).toBe('JSON 格式化');
    });
  });

  describe('getRecentTools', () => {
    it('should return empty array when no recent tools', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue([]);

      const result = await recentTools.getRecentTools();

      expect(result).toEqual([]);
    });

    it('should return stored recent tools', async () => {
      const stored = [
        { toolId: 'json', toolName: 'JSON 格式化', timestamp: Date.now() },
        { toolId: 'yaml', toolName: 'YAML 转换器', timestamp: Date.now() },
      ];
      vi.mocked(chromeStorage.get).mockResolvedValue(stored);

      const result = await recentTools.getRecentTools();

      expect(result).toEqual(stored);
    });

    it('should return empty array when storage returns null', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue(null);

      const result = await recentTools.getRecentTools();

      expect(result).toEqual([]);
    });

    it('should return empty array when storage throws', async () => {
      vi.mocked(chromeStorage.get).mockRejectedValue(new Error('Storage error'));

      const result = await recentTools.getRecentTools();

      expect(result).toEqual([]);
    });
  });

  describe('clearRecentTools', () => {
    it('should remove recent tools from storage', async () => {
      await recentTools.clearRecentTools();

      expect(chromeStorage.remove).toHaveBeenCalledWith('recent_tools');
    });
  });

  describe('onRecentToolsChange', () => {
    it('should add listener to chrome.storage.onChanged', () => {
      const callback = vi.fn();
      const mockAddListener = vi.fn();
      vi.spyOn(chrome.storage.onChanged, 'addListener').mockImplementation(mockAddListener);

      const unsubscribe = recentTools.onRecentToolsChange(callback);

      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when recent_tools changes', () => {
      const callback = vi.fn();
      const mockListeners: Array<(changes: any, areaName: string) => void> = [];
      vi.spyOn(chrome.storage.onChanged, 'addListener').mockImplementation(
        (listener: any) => {
          mockListeners.push(listener);
        }
      );

      recentTools.onRecentToolsChange(callback);

      const newRecent = [
        { toolId: 'json', toolName: 'JSON 格式化', timestamp: Date.now() },
      ];
      const changes = {
        recent_tools: {
          newValue: newRecent,
          oldValue: [],
        },
      };

      mockListeners[0](changes, 'local');

      expect(callback).toHaveBeenCalledWith(newRecent);
    });

    it('should not call callback when other keys change', () => {
      const callback = vi.fn();
      const mockListeners: Array<(changes: any, areaName: string) => void> = [];
      vi.spyOn(chrome.storage.onChanged, 'addListener').mockImplementation(
        (listener: any) => {
          mockListeners.push(listener);
        }
      );

      recentTools.onRecentToolsChange(callback);

      const changes = {
        other_key: {
          newValue: 'value',
        },
      };

      mockListeners[0](changes, 'local');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not call callback when area is not local', () => {
      const callback = vi.fn();
      const mockListeners: Array<(changes: any, areaName: string) => void> = [];
      vi.spyOn(chrome.storage.onChanged, 'addListener').mockImplementation(
        (listener: any) => {
          mockListeners.push(listener);
        }
      );

      recentTools.onRecentToolsChange(callback);

      const changes = {
        recent_tools: {
          newValue: [],
        },
      };

      mockListeners[0](changes, 'sync');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function that removes listener', () => {
      const callback = vi.fn();
      const mockRemoveListener = vi.fn();
      vi.spyOn(chrome.storage.onChanged, 'removeListener').mockImplementation(mockRemoveListener);

      const unsubscribe = recentTools.onRecentToolsChange(callback);

      unsubscribe();

      expect(mockRemoveListener).toHaveBeenCalled();
    });
  });
});
