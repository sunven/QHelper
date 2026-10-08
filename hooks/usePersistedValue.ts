import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'
import type { DataStore } from '@/lib/tool-data/storage'

/**
 * 单值 Persisted Tool Data 的 React 绑定：加载、跨标签页订阅、写穿
 * 集中在此。工具页状态请用 useToolState（它在此之上做 tool_ key 推导）；
 * 本入口用于非工具数据（如 Web Summary 配置）。
 *
 * 写入是乐观的：新值立即生效，持久化失败只记录错误不回滚。
 * （storage adapter 对写错误尽力降级、不向上抛出，回滚分支无从触发。）
 */
export function usePersistedValue<T>(
  key: string,
  initialValue: T,
  storage?: DataStore,
): {
  value: T
  setValue: (value: T | ((prev: T) => T)) => Promise<void>
  loading: boolean
} {
  const [value, setValueState] = useState<T>(initialValue)
  const edits = useRef(0)
  const [loading, setLoading] = useState(true)
  // initialValue 存 ref：订阅回调引用它而不必反复重连监听
  const initialValueRef = useRef(initialValue)
  initialValueRef.current = initialValue

  useEffect(() => {
    let active = true
    const initialEdits = edits.current

    const loadValue = async () => {
      try {
        const storedValue = await (storage ? storage.get<T>(key) : getLocalPersistedData<T>(key))
        if (active && edits.current === initialEdits && storedValue !== undefined) {
          setValueState(storedValue)
        }
      } catch (error) {
        console.error(`Failed to load persisted value for ${key}:`, error)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadValue()

    const unsubscribe = (storage?.subscribe ?? subscribeLocalPersistedDataKey)<T>(key, (nextValue) => {
      if (active) {
        setValueState((nextValue ?? initialValueRef.current) as T)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [key, storage])

  const setValue = useCallback(
    async (next: T | ((prev: T) => T)) => {
      const newValue =
        typeof next === 'function' ? (next as (prev: T) => T)(value) : next

      edits.current += 1
      setValueState(newValue)

      try {
        await (storage ? storage.set(key, newValue) : setLocalPersistedData(key, newValue))
      } catch (error) {
        console.error(`Failed to save persisted value for ${key}:`, error)
      }
    },
    [key, value, storage],
  )

  return { value, setValue, loading }
}
