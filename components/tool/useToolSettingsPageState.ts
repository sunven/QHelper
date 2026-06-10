import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_DICTIONARY_SETTINGS,
  getDictionarySettings,
  setDictionarySettings,
  subscribeDictionarySettings,
  type DictionarySettings,
} from '@/lib/dictionary/settings'
import {
  DEFAULT_JSON_STRING_SETTINGS,
  getJsonStringSettings,
  setJsonStringSettings,
  subscribeJsonStringSettings,
  type JsonStringSettings,
} from '@/lib/fe-tools/json-string'
import {
  DEFAULT_V2EX_BASE64_SETTINGS,
  getV2exBase64Settings,
  normalizeV2exBase64Entries,
  setV2exBase64Settings,
  subscribeV2exBase64Settings,
  type V2exBase64Settings,
} from '@/lib/v2ex-base64/settings'

type SavingTarget = 'dictionary' | 'jsonString' | 'v2exBase64' | null
type CheckboxValue = boolean | 'indeterminate'
export type V2exBase64StatusTone =
  | 'saving'
  | 'error'
  | 'dirty'
  | 'saved'
  | 'muted'

const V2EX_BASE64_AUTOSAVE_DELAY_MS = 500
const LOCAL_SETTING_FALLBACK_NOTICE = '已保存到本机，暂未同步'

function formatV2exBase64Entries(entries: string[]): string {
  return entries.join('\n')
}

function getSyncNotice(storageArea: 'sync' | 'local'): string | null {
  return storageArea === 'local' ? LOCAL_SETTING_FALLBACK_NOTICE : null
}

export function useToolSettingsPageState() {
  const [dictionarySettings, setDictionarySettingsState] =
    useState<DictionarySettings>(DEFAULT_DICTIONARY_SETTINGS)
  const [jsonStringSettings, setJsonStringSettingsState] =
    useState<JsonStringSettings>(DEFAULT_JSON_STRING_SETTINGS)
  const [v2exBase64Settings, setV2exBase64SettingsState] =
    useState<V2exBase64Settings>(DEFAULT_V2EX_BASE64_SETTINGS)
  const [v2exBase64Draft, setV2exBase64Draft] = useState('')
  const [v2exBase64SavedDraft, setV2exBase64SavedDraft] = useState('')
  const v2exBase64DraftRef = useRef('')
  const v2exBase64SavedDraftRef = useRef('')
  const v2exBase64FailedDraftRef = useRef<string | null>(null)
  const v2exBase64SaveIdRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [savingTarget, setSavingTarget] = useState<SavingTarget>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const [v2exBase64SaveFailed, setV2exBase64SaveFailed] = useState(false)
  const savingDictionary = savingTarget === 'dictionary'
  const savingJsonString = savingTarget === 'jsonString'
  const savingV2exBase64 = savingTarget === 'v2exBase64'
  const saving = savingTarget !== null
  const v2exBase64DraftDirty = v2exBase64Draft !== v2exBase64SavedDraft
  const v2exBase64StatusText = loading
    ? '正在加载...'
    : savingV2exBase64
      ? '正在自动保存...'
      : v2exBase64SaveFailed
        ? '自动保存失败，修改后重试'
        : v2exBase64DraftDirty
          ? '等待自动保存...'
          : v2exBase64Settings.entries.length > 0
            ? `${v2exBase64Settings.entries.length} 行已保存`
            : '尚未配置字符串'
  const v2exBase64StatusTone: V2exBase64StatusTone = savingV2exBase64
    ? 'saving'
    : v2exBase64SaveFailed
      ? 'error'
      : v2exBase64DraftDirty
        ? 'dirty'
        : v2exBase64Settings.entries.length > 0
          ? 'saved'
          : 'muted'

  function setV2exBase64DraftValue(nextDraft: string) {
    v2exBase64DraftRef.current = nextDraft
    setV2exBase64Draft(nextDraft)
  }

  function setV2exBase64SavedDraftValue(nextDraft: string) {
    v2exBase64SavedDraftRef.current = nextDraft
    setV2exBase64SavedDraft(nextDraft)
  }

  useEffect(() => {
    let active = true

    void Promise.all([
      getDictionarySettings(),
      getJsonStringSettings(),
      getV2exBase64Settings(),
    ])
      .then(
        ([
          nextDictionarySettings,
          nextJsonStringSettings,
          nextV2exBase64Settings,
        ]) => {
          if (active) {
            setDictionarySettingsState(nextDictionarySettings)
            setJsonStringSettingsState(nextJsonStringSettings)
            setV2exBase64SettingsState(nextV2exBase64Settings)
            const nextDraft = formatV2exBase64Entries(
              nextV2exBase64Settings.entries,
            )
            setV2exBase64DraftValue(nextDraft)
            setV2exBase64SavedDraftValue(nextDraft)
          }
        },
      )
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

    const unsubscribeDictionarySettings = subscribeDictionarySettings(
      (nextSettings) => {
        if (active) {
          setDictionarySettingsState(nextSettings)
        }
      },
    )
    const unsubscribeJsonStringSettings = subscribeJsonStringSettings(
      (nextSettings) => {
        if (active) {
          setJsonStringSettingsState(nextSettings)
        }
      },
    )
    const unsubscribeV2exBase64Settings = subscribeV2exBase64Settings(
      (nextSettings) => {
        if (active) {
          setV2exBase64SettingsState(nextSettings)
          const nextDraft = formatV2exBase64Entries(nextSettings.entries)
          if (
            v2exBase64DraftRef.current ===
              v2exBase64SavedDraftRef.current ||
            v2exBase64DraftRef.current === nextDraft
          ) {
            setV2exBase64DraftValue(nextDraft)
          }
          setV2exBase64SavedDraftValue(nextDraft)
        }
      },
    )

    return () => {
      active = false
      unsubscribeDictionarySettings()
      unsubscribeJsonStringSettings()
      unsubscribeV2exBase64Settings()
    }
  }, [])

  async function changeSelectionLookup(checked: CheckboxValue) {
    const nextSettings = {
      ...dictionarySettings,
      selectionLookupEnabled: checked === true,
    }

    setDictionarySettingsState(nextSettings)
    setSavingTarget('dictionary')
    setError(null)
    setSyncNotice(null)

    try {
      const result = await setDictionarySettings(nextSettings)
      setDictionarySettingsState(result.settings)
      setSyncNotice(getSyncNotice(result.storageArea))
    } catch {
      setError('保存失败，请重试')
      setDictionarySettingsState(
        await getDictionarySettings().catch(() => dictionarySettings),
      )
    } finally {
      setSavingTarget(null)
    }
  }

  async function changeJsonStringEnabled(checked: CheckboxValue) {
    const nextSettings = {
      ...jsonStringSettings,
      enabled: checked === true,
    }

    setJsonStringSettingsState(nextSettings)
    setSavingTarget('jsonString')
    setError(null)
    setSyncNotice(null)

    try {
      const result = await setJsonStringSettings(nextSettings)
      setJsonStringSettingsState(result.settings)
      setSyncNotice(getSyncNotice(result.storageArea))
    } catch {
      setError('保存失败，请重试')
      setJsonStringSettingsState(
        await getJsonStringSettings().catch(() => jsonStringSettings),
      )
    } finally {
      setSavingTarget(null)
    }
  }

  useEffect(() => {
    if (
      loading ||
      !v2exBase64DraftDirty ||
      savingTarget !== null ||
      v2exBase64FailedDraftRef.current === v2exBase64Draft
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void saveV2exBase64Draft(v2exBase64Draft)
    }, V2EX_BASE64_AUTOSAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loading, savingTarget, v2exBase64Draft, v2exBase64DraftDirty])

  async function saveV2exBase64Draft(draft: string) {
    const saveId = v2exBase64SaveIdRef.current + 1
    v2exBase64SaveIdRef.current = saveId
    const nextSettings = {
      entries: normalizeV2exBase64Entries(draft.split('\n')),
    }

    setSavingTarget('v2exBase64')
    setError(null)
    setSyncNotice(null)

    try {
      const result = await setV2exBase64Settings(nextSettings)
      setV2exBase64SettingsState(result.settings)
      const nextDraft = formatV2exBase64Entries(result.settings.entries)
      if (v2exBase64DraftRef.current === draft) {
        setV2exBase64DraftValue(nextDraft)
      }
      setV2exBase64SavedDraftValue(nextDraft)
      setSyncNotice(getSyncNotice(result.storageArea))
      v2exBase64FailedDraftRef.current = null
      setV2exBase64SaveFailed(false)
    } catch {
      v2exBase64FailedDraftRef.current = draft
      setV2exBase64SaveFailed(true)
      setError('保存失败，请重试')
    } finally {
      if (v2exBase64SaveIdRef.current === saveId) {
        setSavingTarget(null)
      }
    }
  }

  function changeV2exBase64Draft(nextDraft: string) {
    setV2exBase64DraftValue(nextDraft)
    v2exBase64FailedDraftRef.current = null
    setV2exBase64SaveFailed(false)
    setError(null)
    setSyncNotice(null)
  }

  return {
    loading,
    error,
    syncNotice,
    dictionary: {
      selectionLookupEnabled: dictionarySettings.selectionLookupEnabled,
      disabled: loading || saving,
      saving: savingDictionary,
      changeSelectionLookup,
    },
    jsonString: {
      enabled: jsonStringSettings.enabled,
      disabled: loading || saving,
      saving: savingJsonString,
      changeEnabled: changeJsonStringEnabled,
    },
    v2exBase64: {
      draft: v2exBase64Draft,
      disabled: loading,
      statusText: v2exBase64StatusText,
      statusTone: v2exBase64StatusTone,
      changeDraft: changeV2exBase64Draft,
    },
  }
}
