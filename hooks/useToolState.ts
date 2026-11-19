import { useLayoutEffect } from 'react'
import { useCurrentToolSession } from '@/components/tool/ToolSessionContext'
import {
  type PersistedValueOptions,
  usePersistedValue,
} from '@/hooks/usePersistedValue'
import { getToolStateStorageKey } from '@/lib/chrome/local-persisted-data'
import { isContentKey } from '@/lib/tool-data/catalog'

/**
 * 工具页状态管理 Hook：Persisted Tool Data 的工具入口。
 *
 * 在 usePersistedValue 之上做 tool_ key 推导，返回 [state, setState]。
 *
 * @template T - 状态类型
 * @param toolId - 工具ID，用作存储键名前缀
 * @param key - 状态键名
 * @param initialState - 初始状态
 *
 * @example
 * ```tsx
 * const [text, setText] = useToolState('qrcode', 'text', '')
 * const [size, setSize] = useToolState('qrcode', 'size', 280)
 * ```
 */
export function useToolState<T>(
  toolId: string,
  key: string,
  initialState: T,
  options?: PersistedValueOptions,
): [state: T, setState: (value: T | ((prev: T) => T)) => void] {
  const session = useCurrentToolSession()
  const storageKey = getToolStateStorageKey(toolId, key)
  const initial =
    session && key in session.values
      ? (session.values[key] as T)
      : session?.temporary && isContentKey(storageKey)
        ? ('' as T)
        : initialState
  const { value, setValue } = usePersistedValue(
    storageKey,
    initial,
    session?.storage,
    options,
  )

  // 会话快照读取 session.values；在提交后同步，避免渲染期写外部对象。
  useLayoutEffect(() => {
    if (session) {
      session.values[key] = value
    }
  }, [session, key, value])

  return [value, setValue]
}
