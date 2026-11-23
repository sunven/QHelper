import {
  type PersistedValueOptions,
  usePersistedValue,
} from '@/hooks/usePersistedValue'
import { getToolStateStorageKey } from '@/lib/chrome/local-persisted-data'

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
 * const [length, setLength] = useToolState('password', 'length', 16)
 * ```
 */
export function useToolState<T>(
  toolId: string,
  key: string,
  initialState: T,
  options?: PersistedValueOptions,
): [state: T, setState: (value: T | ((prev: T) => T)) => void] {
  const storageKey = getToolStateStorageKey(toolId, key)
  const { value, setValue } = usePersistedValue(
    storageKey,
    initialState,
    options,
  )

  return [value, setValue]
}
