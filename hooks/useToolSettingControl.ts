import { useEffect, useRef, useState } from 'react'
import type { SettingDefinition } from '@/lib/settings'

const LOCAL_SETTING_FALLBACK_NOTICE = '已保存到本机，暂未同步'

function getSyncNotice(storageArea: 'sync' | 'local'): string | null {
  return storageArea === 'local' ? LOCAL_SETTING_FALLBACK_NOTICE : null
}

/**
 * 「保存一个 Tool Setting」的单一职责模块：
 * 加载、订阅、乐观保存、失败回滚与 Local Setting Fallback 提示。
 * 页面按 definition 组合，不直接调用 Tool Setting Definition。
 */
export function useToolSettingControl<T extends object>(
  definition: SettingDefinition<T>,
) {
  const [value, setValue] = useState<T>(definition.defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const valueRef = useRef(definition.defaults)

  function applyValue(next: T) {
    valueRef.current = next
    setValue(next)
  }

  useEffect(() => {
    let active = true

    void definition
      .get()
      .then((next) => {
        if (active) {
          applyValue(next)
        }
      })
      .catch(() => {
        if (active) {
          setError('设置加载失败')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    const unsubscribe = definition.subscribe((next) => {
      if (active) {
        applyValue(next)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [definition])

  async function change(next: Partial<T>) {
    const previous = valueRef.current

    applyValue({ ...previous, ...next })
    setSaving(true)
    setError(null)
    setSyncNotice(null)

    try {
      const result = await definition.set(next)
      applyValue(result.settings)
      setSyncNotice(getSyncNotice(result.storageArea))
    } catch {
      setError('保存失败，请重试')
      applyValue(await definition.get().catch(() => previous))
    } finally {
      setSaving(false)
    }
  }

  return { value, loading, saving, error, syncNotice, change }
}
