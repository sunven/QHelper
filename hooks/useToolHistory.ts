import { useState, useCallback, useEffect, useRef } from 'react';
import type { HistoryEntry } from '@/types/storage';
import * as chromeStorage from '@/lib/chrome/storage';

/**
 * 历史记录配置选项
 */
interface HistoryOptions<TInput, TOutput> {
  /** 最大历史记录条数，默认为 50 */
  maxHistory?: number;
  /** 存储键名前缀，默认为 'history' */
  storageKey?: string;
  /** 是否自动记录，默认为 true */
  autoRecord?: boolean;
  /** 过滤函数，返回 false 时不记录该条历史 */
  filter?: (entry: HistoryEntry<TInput, TOutput>) => boolean;
  /** 自定义序列化函数 */
  serialize?: (entry: HistoryEntry<TInput, TOutput>) => HistoryEntry<unknown, unknown>;
  /** 自定义反序列化函数 */
  deserialize?: (entry: HistoryEntry<unknown, unknown>) => HistoryEntry<TInput, TOutput>;
}

/**
 * 工具历史记录 Hook
 *
 * 用于记录工具的使用历史，支持持久化存储和搜索
 *
 * @template TInput - 输入类型
 * @template TOutput - 输出类型
 * @param toolId - 工具ID，用作存储键名
 * @param options - 配置选项
 * @returns 历史记录对象
 *
 * @example
 * ```tsx
 * const { history, addHistory, clearHistory, searchHistory } = useToolHistory<string, string>(
 *   'json',
 *   { maxHistory: 100 }
 * );
 *
 * // 记录历史
 * addHistory(input, output, { language: 'json' });
 *
 * // 搜索历史
 * const results = searchHistory('my data');
 * ```
 */
export function useToolHistory<TInput = unknown, TOutput = unknown>(
  toolId: string,
  options: HistoryOptions<TInput, TOutput> = {},
) {
  const {
    maxHistory = 50,
    storageKey = 'history',
    autoRecord = true,
    filter,
    serialize,
    deserialize,
  } = options;

  const fullStorageKey = `tool_${toolId}_${storageKey}`;
  const [history, setHistory] = useState<HistoryEntry<TInput, TOutput>[]>([]);
  const [loading, setLoading] = useState(true);
  const addHistoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 生成历史记录ID
  const generateId = useCallback(() => {
    return `${toolId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, [toolId]);

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await chromeStorage.get<HistoryEntry<unknown, unknown>[]>(fullStorageKey, []);
        const deserializedHistory = deserialize
          ? stored.map(deserialize)
          : (stored as HistoryEntry<TInput, TOutput>[]);

        setHistory(deserializedHistory);
      } catch (error) {
        console.error(`Failed to load history for ${toolId}:`, error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [toolId, fullStorageKey, deserialize]);

  // 监听其他标签页的更改
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: chrome.storage.AreaName,
    ) => {
      if (areaName === 'local' && fullStorageKey in changes) {
        const newHistory = (changes[fullStorageKey].newValue as HistoryEntry<unknown, unknown>[]) || [];
        const deserializedHistory = deserialize
          ? newHistory.map(deserialize)
          : (newHistory as HistoryEntry<TInput, TOutput>[]);

        setHistory(deserializedHistory);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [fullStorageKey, deserialize]);

  // 保存历史记录到 chrome.storage
  const saveHistory = useCallback(
    async (newHistory: HistoryEntry<TInput, TOutput>[]) => {
      const trimmedHistory = newHistory.slice(-maxHistory);
      const serializedHistory = serialize
        ? trimmedHistory.map(serialize)
        : (trimmedHistory as HistoryEntry<unknown, unknown>[]);

      await chromeStorage.set(fullStorageKey, serializedHistory);
    },
    [fullStorageKey, maxHistory, serialize],
  );

  // 添加历史记录
  const addHistory = useCallback(
    (input: TInput, output: TOutput, metadata?: Record<string, unknown>) => {
      const entry: HistoryEntry<TInput, TOutput> = {
        id: generateId(),
        timestamp: Date.now(),
        input,
        output,
        metadata,
      };

      // 检查过滤器
      if (filter && !filter(entry)) {
        return entry;
      }

      setHistory((prev) => {
        const newHistory = [...prev, entry];
        saveHistory(newHistory).catch((error) => {
          console.error(`Failed to save history for ${toolId}:`, error);
        });
        return newHistory.slice(-maxHistory);
      });

      return entry;
    },
    [toolId, generateId, filter, saveHistory, maxHistory],
  );

  // 清除历史记录
  const clearHistory = useCallback(async () => {
    setHistory([]);
    await chromeStorage.remove(fullStorageKey);
  }, [fullStorageKey]);

  // 删除单条历史记录
  const removeHistory = useCallback(
    async (id: string) => {
      setHistory((prev) => {
        const newHistory = prev.filter((entry) => entry.id !== id);
        saveHistory(newHistory).catch((error) => {
          console.error(`Failed to save history after removal for ${toolId}:`, error);
        });
        return newHistory;
      });
    },
    [toolId, saveHistory],
  );

  // 搜索历史记录
  const searchHistory = useCallback(
    (query: string, fields: ('input' | 'output' | 'metadata')[] = ['input', 'output']): HistoryEntry<TInput, TOutput>[] => {
      const lowerQuery = query.toLowerCase();

      return history.filter((entry) => {
        return fields.some((field) => {
          const value = entry[field];
          if (value === null || value === undefined) return false;

          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }

          if (typeof value === 'object') {
            return JSON.stringify(value).toLowerCase().includes(lowerQuery);
          }

          return String(value).toLowerCase().includes(lowerQuery);
        });
      });
    },
    [history],
  );

  // 按时间范围过滤
  const filterByTimeRange = useCallback(
    (startTime: number, endTime: number): HistoryEntry<TInput, TOutput>[] => {
      return history.filter((entry) => entry.timestamp >= startTime && entry.timestamp <= endTime);
    },
    [history],
  );

  // 获取最近的 N 条记录
  const getRecent = useCallback(
    (count: number): HistoryEntry<TInput, TOutput>[] => {
      return history.slice(-count);
    },
    [history],
  );

  return {
    /** 历史记录列表 */
    history,
    /** 是否正在加载 */
    loading,
    /** 添加历史记录 */
    addHistory,
    /** 清除所有历史记录 */
    clearHistory,
    /** 删除单条历史记录 */
    removeHistory,
    /** 搜索历史记录 */
    searchHistory,
    /** 按时间范围过滤 */
    filterByTimeRange,
    /** 获取最近的 N 条记录 */
    getRecent,
  };
}

/**
 * 历史记录统计 Hook
 *
 * 提供历史记录的统计信息
 *
 * @template TInput - 输入类型
 * @template TOutput - 输出类型
 * @param toolId - 工具ID
 * @returns 统计信息对象
 */
export function useToolHistoryStats<TInput = unknown, TOutput = unknown>(
  toolId: string,
) {
  const { history, loading } = useToolHistory<TInput, TOutput>(toolId);

  const stats = {
    /** 总记录数 */
    totalCount: history.length,
    /** 今天使用次数 */
    todayCount: history.filter((entry) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return entry.timestamp >= today.getTime();
    }).length,
    /** 本周使用次数 */
    weekCount: history.filter((entry) => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return entry.timestamp >= weekAgo;
    }).length,
    /** 最早记录时间 */
    earliestTime: history.length > 0 ? history[0].timestamp : null,
    /** 最晚记录时间 */
    latestTime: history.length > 0 ? history[history.length - 1].timestamp : null,
  };

  return { stats, loading };
}
