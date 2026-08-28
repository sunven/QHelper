import { useEffect, useMemo, useState } from 'react'
import {
  createToolHistoryStore,
  type HistoryEntry,
  type ToolHistoryStore,
} from '@/lib/tool-history-store'

export type { HistoryEntry }

export type UseToolHistoryOptions = {
  /** 最大历史条数，默认 50 */
  max?: number
  /** 存储键名后缀，默认 'history' */
  key?: string
}

export type ToolHistory<T> = {
  /** 历史快照列表，最新在末尾 */
  history: HistoryEntry<T>[]
  loading: boolean
  /** 追加一条快照（同步返回 entry，持久化在后台） */
  add: ToolHistoryStore<T>['add']
  remove: (id: string) => void
  clear: () => Promise<void>
}

/**
 * 工具历史的 React 绑定：逻辑在 createToolHistoryStore，
 * 这里只做加载与状态镜像。
 */
export function useToolHistory<T>(
  toolId: string,
  options: UseToolHistoryOptions = {},
): ToolHistory<T> {
  const { max, key } = options
  const store = useMemo(
    () => createToolHistoryStore<T>(toolId, { max, key }),
    [toolId, max, key],
  )
  const [history, setHistory] = useState<HistoryEntry<T>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const unsubscribe = store.subscribe((entries) => {
      if (active) {
        setHistory(entries)
      }
    })
    void store
      .load()
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [store])

  return {
    history,
    loading,
    add: store.add,
    remove: store.remove,
    clear: store.clear,
  }
}
