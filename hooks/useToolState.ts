import { useState, useCallback, useEffect } from 'react';
import * as chromeStorage from '@/lib/chrome/storage';

/**
 * 工具状态管理 Hook
 *
 * 自动将状态持久化到 chrome.storage.local
 *
 * @template T - 状态类型
 * @param toolId - 工具ID，用作存储键名前缀
 * @param key - 状态键名
 * @param initialState - 初始状态
 * @returns [state, setState, loading] - 状态值、状态设置函数、加载状态
 *
 * @example
 * ```tsx
 * const [input, setInput, loading] = useToolState('json', 'input', '');
 * const [formatOptions, setFormatOptions, loading] = useToolState('json', 'options', {
 *   indent: 2,
 *   sortKeys: false,
 * });
 * ```
 */
export function useToolState<T>(
  toolId: string,
  key: string,
  initialState: T,
): [state: T, setState: (value: T | ((prev: T) => T)) => void, loading: boolean] {
  const storageKey = `tool_${toolId}_${key}`;
  const [state, setState] = useState<T>(initialState);
  const [loading, setLoading] = useState(true);

  // 加载初始状态
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedValue = await chromeStorage.get<T>(storageKey);
        if (storedValue !== undefined) {
          setState(storedValue);
        }
      } catch (error) {
        console.error(`Failed to load state for ${storageKey}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, [storageKey]);

  // 监听其他标签页的更改
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: chrome.storage.AreaName,
    ) => {
      if (areaName === 'local' && storageKey in changes) {
        const newValue = changes[storageKey].newValue;
        setState((newValue ?? initialState) as T);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [storageKey, initialState]);

  // 包装 setState 以自动持久化
  const setStateWithPersistence = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;

        // 异步保存到 chrome.storage
        chromeStorage.set(storageKey, newValue).catch((error) => {
          console.error(`Failed to save state for ${storageKey}:`, error);
        });

        return newValue;
      });
    },
    [storageKey],
  );

  return [state, setStateWithPersistence, loading];
}

/**
 * 工具状态管理 Hook 变体 - 支持自动保存配置
 *
 * @template T - 状态类型
 * @param toolId - 工具ID
 * @param key - 状态键名
 * @param initialState - 初始状态
 * @param options - 配置选项
 * @returns [state, setState, loading] - 状态值、状态设置函数、加载状态
 */
export function useToolStateWithConfig<T>(
  toolId: string,
  key: string,
  initialState: T,
  options: {
    /** 自动保存间隔（毫秒），默认为立即保存 */
    debounceMs?: number;
    /** 是否在页面卸载时保存，默认为 true */
    saveOnUnmount?: boolean;
  } = {},
): [state: T, setState: (value: T | ((prev: T) => T)) => void, loading: boolean] {
  const [state, setState, loading] = useToolState(toolId, key, initialState);
  const { saveOnUnmount = true } = options;

  // 页面卸载时保存
  useEffect(() => {
    if (!saveOnUnmount) return;

    const handleBeforeUnload = () => {
      chromeStorage.set(`tool_${toolId}_${key}`, state).catch((error) => {
        console.error(`Failed to save state on unmount for ${toolId}_${key}:`, error);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      chromeStorage.set(`tool_${toolId}_${key}`, state).catch(() => {
        // 静默失败，避免过多错误日志
      });
    };
  }, [toolId, key, state, saveOnUnmount]);

  return [state, setState, loading];
}
