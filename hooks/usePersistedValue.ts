import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getLocalPersistedData,
  setLocalPersistedData,
  subscribeLocalPersistedDataKey,
} from '@/lib/chrome/local-persisted-data'

export type PersistedValueOptions = {
  /**
   * 写入持久化的防抖间隔（毫秒）。默认 0：每次更新立即写入。
   * 高频输入（如文本编辑器）应设置该值以合并写入。
   */
  writeDelayMs?: number
}

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
  options: PersistedValueOptions = {},
): {
  value: T
  setValue: (value: T | ((prev: T) => T)) => Promise<void>
  loading: boolean
} {
  const [value, setValueState] = useState<T>(initialValue)
  // 最新值存 ref：setValue 读取它而不是渲染期闭包，保证同一 tick 内的
  // 连续函数式更新不丢；回调也无需依赖 value 而保持稳定。
  const valueRef = useRef(value)
  const edits = useRef(0)
  const [loading, setLoading] = useState(true)
  // initialValue 存 ref：订阅回调引用它而不必反复重连监听
  const initialValueRef = useRef(initialValue)
  initialValueRef.current = initialValue
  const writeDelayRef = useRef(options.writeDelayMs ?? 0)
  writeDelayRef.current = options.writeDelayMs ?? 0
  const pendingWriteRef = useRef<{ value: T } | null>(null)
  const writeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    const initialEdits = edits.current

    const loadValue = async () => {
      try {
        const storedValue = await getLocalPersistedData<T>(key)
        if (
          active &&
          edits.current === initialEdits &&
          storedValue !== undefined
        ) {
          valueRef.current = storedValue
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

    const unsubscribe = subscribeLocalPersistedDataKey<T>(key, (nextValue) => {
      if (active) {
        const next = (nextValue ?? initialValueRef.current) as T
        valueRef.current = next
        setValueState(next)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [key])

  const writeThrough = useCallback(
    async (nextValue: T) => {
      try {
        await setLocalPersistedData(key, nextValue)
      } catch (error) {
        console.error(`Failed to save persisted value for ${key}:`, error)
      }
    },
    [key],
  )

  // 卸载或换 key 时把待写入值落盘，避免 Activity 隐藏后丢失最后一次输入。
  const flushPendingWrite = useCallback(() => {
    if (writeTimerRef.current !== null) {
      window.clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
    }

    const pending = pendingWriteRef.current
    pendingWriteRef.current = null
    if (pending) {
      void writeThrough(pending.value)
    }
  }, [writeThrough])

  useEffect(() => flushPendingWrite, [flushPendingWrite])

  const scheduleWrite = useCallback(
    (nextValue: T): Promise<void> => {
      const delay = writeDelayRef.current
      if (delay <= 0) {
        return writeThrough(nextValue)
      }

      pendingWriteRef.current = { value: nextValue }
      if (writeTimerRef.current === null) {
        writeTimerRef.current = window.setTimeout(() => {
          writeTimerRef.current = null
          flushPendingWrite()
        }, delay)
      }
      return Promise.resolve()
    },
    [flushPendingWrite, writeThrough],
  )

  const setValue = useCallback(
    (next: T | ((prev: T) => T)): Promise<void> => {
      const newValue =
        typeof next === 'function'
          ? (next as (prev: T) => T)(valueRef.current)
          : next

      edits.current += 1
      valueRef.current = newValue
      setValueState(newValue)
      return scheduleWrite(newValue)
    },
    [scheduleWrite],
  )

  return { value, setValue, loading }
}
