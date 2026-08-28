import {
  getLocalPersistedData,
  getToolStateStorageKey,
  removeLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'

export type HistoryEntry<T> = {
  id: string
  timestamp: number
  input: T
  metadata?: Record<string, unknown>
}

export type ToolHistoryStore<T> = {
  /** 读取已持久化的历史（重复调用复用同一次加载） */
  load: () => Promise<HistoryEntry<T>[]>
  /** 订阅变更（含其他标签页写入的历史） */
  subscribe: (
    listener: (entries: HistoryEntry<T>[]) => void,
  ) => () => void
  /** 追加一条快照：同步返回 entry，持久化在后台进行，超出上限时裁剪最旧的 */
  add: (input: T, metadata?: Record<string, unknown>) => HistoryEntry<T>
  /** 删除单条 */
  remove: (id: string) => HistoryEntry<T>[]
  /** 清空全部历史 */
  clear: () => Promise<void>
}

const DEFAULT_MAX_HISTORY = 50

/**
 * 工具历史的持久化 store：加载、订阅、追加与裁剪集中在此，
 * React 侧只做状态镜像。
 */
export function createToolHistoryStore<T>(
  toolId: string,
  options: { max?: number; key?: string } = {},
): ToolHistoryStore<T> {
  const max = options.max ?? DEFAULT_MAX_HISTORY
  const storageKey = getToolStateStorageKey(toolId, options.key ?? 'history')
  const listeners = new Set<(entries: HistoryEntry<T>[]) => void>()
  let entries: HistoryEntry<T>[] = []
  let loadPromise: Promise<HistoryEntry<T>[]> | null = null

  function notify() {
    for (const listener of listeners) {
      listener(entries)
    }
  }

  function persist() {
    setLocalPersistedData(storageKey, entries).catch((error) => {
      console.error(`Failed to save history for ${toolId}:`, error)
    })
  }

  function load(): Promise<HistoryEntry<T>[]> {
    if (loadPromise) {
      return loadPromise
    }

    loadPromise = (async () => {
      try {
        const stored = await getLocalPersistedData<HistoryEntry<T>[]>(
          storageKey,
          [],
        )
        entries = Array.isArray(stored) ? stored : []
      } catch (error) {
        console.error(`Failed to load history for ${toolId}:`, error)
        entries = []
      } finally {
        notify()
      }
      return entries
    })()
    return loadPromise
  }

  function add(
    input: T,
    metadata?: Record<string, unknown>,
  ): HistoryEntry<T> {
    const entry: HistoryEntry<T> = {
      id: `${toolId}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
      input,
      metadata,
    }

    entries = [...entries, entry].slice(-max)
    persist()
    notify()
    return entry
  }

  function remove(id: string): HistoryEntry<T>[] {
    entries = entries.filter((entry) => entry.id !== id)
    persist()
    notify()
    return entries
  }

  async function clear(): Promise<void> {
    entries = []
    loadPromise = null
    await removeLocalPersistedData(storageKey)
    notify()
  }

  function subscribe(
    listener: (entries: HistoryEntry<T>[]) => void,
  ): () => void {
    listeners.add(listener)
    const unsubscribeStorage = subscribeLocalPersistedDataKey<HistoryEntry<T>[]>(
      storageKey,
      (value) => {
        entries = value || []
        notify()
      },
    )

    return () => {
      listeners.delete(listener)
      unsubscribeStorage()
    }
  }

  return { load, subscribe, add, remove, clear }
}
