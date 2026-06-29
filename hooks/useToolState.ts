import { useCallback, useEffect, useState } from 'react'
import {
  getLocalPersistedData,
  getToolStateStorageKey,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'

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
): [
  state: T,
  setState: (value: T | ((prev: T) => T)) => void,
  loading: boolean,
] {
  const storageKey = getToolStateStorageKey(toolId, key)
  const [state, setState] = useState<T>(initialState)
  const [loading, setLoading] = useState(true)

  // 加载初始状态
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedValue = await getLocalPersistedData<T>(storageKey)
        if (storedValue !== undefined) {
          setState(storedValue)
        }
      } catch (error) {
        console.error(`Failed to load state for ${storageKey}:`, error)
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [storageKey])

  // 监听其他标签页的更改
  useEffect(() => {
    const unsubscribe = subscribeLocalPersistedDataKey<T>(
      storageKey,
      (newValue) => {
        setState((newValue ?? initialState) as T)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [storageKey, initialState])

  // 包装 setState 以自动持久化
  const setStateWithPersistence = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue =
          typeof value === 'function' ? (value as (prev: T) => T)(prev) : value

        // 异步保存到 chrome.storage
        setLocalPersistedData(storageKey, newValue).catch((error) => {
          console.error(`Failed to save state for ${storageKey}:`, error)
        })

        return newValue
      })
    },
    [storageKey],
  )

  return [state, setStateWithPersistence, loading]
}
