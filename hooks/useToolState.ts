import { useCurrentToolSession } from '@/components/tool/ToolSessionContext'
import { usePersistedValue } from '@/hooks/usePersistedValue'
import {
  getToolStateStorageKey,
} from '@/lib/chrome/local-persisted-data'
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
 * const [input, setInput] = useToolState('json', 'input', '')
 * const [formatOptions, setFormatOptions] = useToolState('json', 'options', {
 *   indent: 2,
 *   sortKeys: false,
 * })
 * ```
 */
export function useToolState<T>(
  toolId: string,
  key: string,
  initialState: T,
): [
  state: T,
  setState: (value: T | ((prev: T) => T)) => void,
] {
  const session = useCurrentToolSession()
  const storageKey = getToolStateStorageKey(toolId, key)
  const initial = session && key in session.values ? session.values[key] as T
    : session?.temporary && isContentKey(storageKey) ? '' as T : initialState
  const { value, setValue } = usePersistedValue(storageKey, initial, session?.storage)
  if (session) session.values[key] = value

  return [value, setValue]
}
