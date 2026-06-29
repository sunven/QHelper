import { useCallback, useEffect, useState } from 'react'
import {
  getLocalPersistedData,
  getToolStateStorageKey,
  removeLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'
import type { HistoryEntry } from '@/types/storage'
import type { ToolHistoryItem } from '@/types/tool'

/**
 * 历史记录配置选项
 */
interface ModernHistoryOptions<TInput, TOutput> {
  /** 最大历史记录条数，默认为 50 */
  maxHistory?: number
  /** 存储键名前缀，默认为 'history' */
  storageKey?: string
  /** 是否自动记录，默认为 true */
  autoRecord?: boolean
  /** 过滤函数，返回 false 时不记录该条历史 */
  filter?: (entry: HistoryEntry<TInput, TOutput>) => boolean
  /** 自定义序列化函数 */
  serialize?: (
    entry: HistoryEntry<TInput, TOutput>,
  ) => HistoryEntry<unknown, unknown>
  /** 自定义反序列化函数 */
  deserialize?: (
    entry: HistoryEntry<unknown, unknown>,
  ) => HistoryEntry<TInput, TOutput>
}

/**
 * 兼容模式历史记录配置选项
 */
interface CompatibilityHistoryOptions {
  /** 兼容模式最大历史记录条数配置 */
  maxSize?: number
  /** 兼容模式存储键配置 */
  key?: string
}

type HistoryOptions<TInput, TOutput> =
  | ModernHistoryOptions<TInput, TOutput>
  | CompatibilityHistoryOptions

interface HistoryActions<TInput, TOutput> {
  loading: boolean
  addHistory: (
    input: TInput,
    output: TOutput,
    metadata?: Record<string, unknown>,
  ) => HistoryEntry<TInput, TOutput>
  clearHistory: () => Promise<void>
  removeHistory: (id: string) => Promise<void>
}

type ModernHistoryReturn<TInput, TOutput> = HistoryActions<TInput, TOutput> & {
  history: HistoryEntry<TInput, TOutput>[]
  addToHistory: (
    item: TInput | ToolHistoryItem,
    metadata?: Record<string, unknown>,
  ) => HistoryEntry<TInput, TOutput>
}

type CompatibilityHistoryReturn<TState> = HistoryActions<TState, TState> & {
  history: TState[]
  addToHistory: (
    item: TState | ToolHistoryItem,
    metadata?: Record<string, unknown>,
  ) => HistoryEntry<TState, TState>
}

function isCompatibilityOptions<TInput, TOutput>(
  options: HistoryOptions<TInput, TOutput>,
): options is CompatibilityHistoryOptions {
  return 'maxSize' in options || 'key' in options
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
 * const { history, addHistory, clearHistory } = useToolHistory<string, string>(
 *   'json',
 *   { maxHistory: 100 }
 * );
 *
 * // 记录历史
 * addHistory(input, output, { language: 'json' });
 * ```
 */
export function useToolHistory<TState = unknown>(
  toolId: string,
  options: CompatibilityHistoryOptions,
): CompatibilityHistoryReturn<TState>
export function useToolHistory<TInput = unknown, TOutput = unknown>(
  toolId: string,
  options?: ModernHistoryOptions<TInput, TOutput>,
): ModernHistoryReturn<TInput, TOutput>
export function useToolHistory<TInput = unknown, TOutput = unknown>(
  toolId: string,
  options: HistoryOptions<TInput, TOutput> = {},
): ModernHistoryReturn<TInput, TOutput> | CompatibilityHistoryReturn<TInput> {
  const compatibilityMode = isCompatibilityOptions(options)
  const maxHistory = compatibilityMode
    ? (options.maxSize ?? 50)
    : (options.maxHistory ?? 50)
  const storageKey = compatibilityMode
    ? (options.key ?? 'history')
    : (options.storageKey ?? 'history')
  const filter = compatibilityMode ? undefined : options.filter
  const serialize = compatibilityMode ? undefined : options.serialize
  const deserialize = compatibilityMode ? undefined : options.deserialize

  const fullStorageKey = getToolStateStorageKey(toolId, storageKey)
  const [history, setHistory] = useState<HistoryEntry<TInput, TOutput>[]>([])
  const [loading, setLoading] = useState(true)

  // 生成历史记录ID
  const generateId = useCallback(() => {
    return `${toolId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [toolId])

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await getLocalPersistedData<
          HistoryEntry<unknown, unknown>[]
        >(fullStorageKey, [])
        const deserializedHistory = deserialize
          ? stored.map(deserialize)
          : (stored as HistoryEntry<TInput, TOutput>[])

        setHistory(deserializedHistory)
      } catch (error) {
        console.error(`Failed to load history for ${toolId}:`, error)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [toolId, fullStorageKey, deserialize])

  // 监听其他标签页的更改
  useEffect(() => {
    const unsubscribe = subscribeLocalPersistedDataKey<
      HistoryEntry<unknown, unknown>[]
    >(fullStorageKey, (value) => {
      const newHistory = value || []
      const deserializedHistory = deserialize
        ? newHistory.map(deserialize)
        : (newHistory as HistoryEntry<TInput, TOutput>[])

      setHistory(deserializedHistory)
    })

    return () => {
      unsubscribe()
    }
  }, [fullStorageKey, deserialize])

  // 保存历史记录到 chrome.storage
  const saveHistory = useCallback(
    async (newHistory: HistoryEntry<TInput, TOutput>[]) => {
      const trimmedHistory = newHistory.slice(-maxHistory)
      const serializedHistory = serialize
        ? trimmedHistory.map(serialize)
        : (trimmedHistory as HistoryEntry<unknown, unknown>[])

      await setLocalPersistedData(fullStorageKey, serializedHistory)
    },
    [fullStorageKey, maxHistory, serialize],
  )

  // 添加历史记录
  const addHistory = useCallback(
    (input: TInput, output: TOutput, metadata?: Record<string, unknown>) => {
      const entry: HistoryEntry<TInput, TOutput> = {
        id: generateId(),
        timestamp: Date.now(),
        input,
        output,
        metadata,
      }

      // 检查过滤器
      if (filter && !filter(entry)) {
        return entry
      }

      setHistory((prev) => {
        const newHistory = [...prev, entry]
        saveHistory(newHistory).catch((error) => {
          console.error(`Failed to save history for ${toolId}:`, error)
        })
        return newHistory.slice(-maxHistory)
      })

      return entry
    },
    [toolId, generateId, filter, saveHistory, maxHistory],
  )

  // 清除历史记录
  const clearHistory = useCallback(async () => {
    setHistory([])
    await removeLocalPersistedData(fullStorageKey)
  }, [fullStorageKey])

  // 删除单条历史记录
  const removeHistory = useCallback(
    async (id: string) => {
      setHistory((prev) => {
        const newHistory = prev.filter((entry) => entry.id !== id)
        saveHistory(newHistory).catch((error) => {
          console.error(
            `Failed to save history after removal for ${toolId}:`,
            error,
          )
        })
        return newHistory
      })
    },
    [toolId, saveHistory],
  )

  const addToHistory = useCallback(
    (item: TInput | ToolHistoryItem, metadata?: Record<string, unknown>) => {
      const snapshot = item as TInput
      return addHistory(snapshot, snapshot as unknown as TOutput, metadata)
    },
    [addHistory],
  )

  const actions = {
    /** 历史记录列表 */
    /** 是否正在加载 */
    loading,
    /** 添加历史记录 */
    addHistory,
    /** 兼容模式 API 的添加历史记录方法 */
    addToHistory,
    /** 清除所有历史记录 */
    clearHistory,
    /** 删除单条历史记录 */
    removeHistory,
  }

  if (compatibilityMode) {
    return {
      ...actions,
      history: history.map((entry) => entry.input as TInput),
    } as unknown as CompatibilityHistoryReturn<TInput>
  }

  return {
    ...actions,
    history,
  } as ModernHistoryReturn<TInput, TOutput>
}
