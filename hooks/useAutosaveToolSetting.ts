import { useEffect, useRef, useState } from 'react'
import type { SettingDefinition } from '@/lib/settings'

const LOCAL_SETTING_FALLBACK_NOTICE = '已保存到本机，暂未同步'
const DEFAULT_DELAY_MS = 500

function getSyncNotice(storageArea: 'sync' | 'local'): string | null {
  return storageArea === 'local' ? LOCAL_SETTING_FALLBACK_NOTICE : null
}

export type AutosaveToolSettingOptions<T> = {
  serialize: (value: T) => string
  parse: (draft: string) => T
  delayMs?: number
}

/**
 * 草稿型 Tool Setting 的保存模块：
 * 防抖、保存竞态守卫、失败保留草稿等重试（不回滚）。
 */
export function useAutosaveToolSetting<T extends object>(
  definition: SettingDefinition<T>,
  {
    serialize,
    parse,
    delayMs = DEFAULT_DELAY_MS,
  }: AutosaveToolSettingOptions<T>,
) {
  const [savedValue, setSavedValue] = useState<T>(definition.defaults)
  const [draft, setDraft] = useState(() => serialize(definition.defaults))
  const [savedDraft, setSavedDraft] = useState(() =>
    serialize(definition.defaults),
  )
  const draftRef = useRef(serialize(definition.defaults))
  const savedDraftRef = useRef(serialize(definition.defaults))
  const failedDraftRef = useRef<string | null>(null)
  const saveIdRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const dirty = draft !== savedDraft

  function setDraftValue(nextDraft: string) {
    draftRef.current = nextDraft
    setDraft(nextDraft)
  }

  function setSavedDraftValue(nextDraft: string) {
    savedDraftRef.current = nextDraft
    setSavedDraft(nextDraft)
  }

  useEffect(() => {
    let active = true

    void definition
      .get()
      .then((next) => {
        if (active) {
          setSavedValue(next)
          const nextDraft = serialize(next)
          setDraftValue(nextDraft)
          setSavedDraftValue(nextDraft)
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
        setSavedValue(next)
        const nextDraft = serialize(next)
        if (
          draftRef.current === savedDraftRef.current ||
          draftRef.current === nextDraft
        ) {
          setDraftValue(nextDraft)
        }
        setSavedDraftValue(nextDraft)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [definition, serialize])

  async function saveDraft(nextDraft: string) {
    const saveId = saveIdRef.current + 1
    saveIdRef.current = saveId

    setSaving(true)
    setError(null)
    setSyncNotice(null)

    try {
      const result = await definition.set(parse(nextDraft))
      setSavedValue(result.settings)
      const canonicalDraft = serialize(result.settings)
      if (draftRef.current === nextDraft) {
        setDraftValue(canonicalDraft)
      }
      setSavedDraftValue(canonicalDraft)
      setSyncNotice(getSyncNotice(result.storageArea))
      failedDraftRef.current = null
      setSaveFailed(false)
    } catch {
      failedDraftRef.current = nextDraft
      setSaveFailed(true)
      setError('保存失败，请重试')
    } finally {
      if (saveIdRef.current === saveId) {
        setSaving(false)
      }
    }
  }

  useEffect(() => {
    if (loading || !dirty || saving || failedDraftRef.current === draft) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void saveDraft(draftRef.current)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loading, saving, dirty, draft, delayMs])

  function changeDraft(nextDraft: string) {
    setDraftValue(nextDraft)
    failedDraftRef.current = null
    setSaveFailed(false)
    setError(null)
    setSyncNotice(null)
  }

  return {
    draft,
    value: savedValue,
    loading,
    saving,
    saveFailed,
    error,
    syncNotice,
    dirty,
    changeDraft,
  }
}
