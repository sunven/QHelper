import {
  BracketsCurlyIcon,
  GearSixIcon,
  KeyIcon,
  TranslateIcon,
} from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { cn } from '@/lib/utils'
import {
  DEFAULT_V2EX_BASE64_SETTINGS,
  getV2exBase64Settings,
  normalizeV2exBase64Entries,
  setV2exBase64Settings,
  subscribeV2exBase64Settings,
  type V2exBase64Settings,
} from '@/lib/v2ex-base64/settings'

type SavingTarget = 'dictionary' | 'jsonString' | 'v2exBase64' | null

const V2EX_BASE64_AUTOSAVE_DELAY_MS = 500

function formatV2exBase64Entries(entries: string[]): string {
  return entries.join('\n')
}

export function SettingsPage() {
  const selectionLookupId = useId()
  const jsonStringId = useId()
  const v2exBase64EntriesId = useId()
  const [dictionarySettings, setDictionarySettingsState] =
    useState<DictionarySettings>(
    DEFAULT_DICTIONARY_SETTINGS,
  )
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

    const unsubscribeDictionarySettings = subscribeDictionarySettings((nextSettings) => {
      if (active) {
        setDictionarySettingsState(nextSettings)
      }
    })
    const unsubscribeJsonStringSettings = subscribeJsonStringSettings((nextSettings) => {
      if (active) {
        setJsonStringSettingsState(nextSettings)
      }
    })
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

  async function handleSelectionLookupChange(checked: boolean | 'indeterminate') {
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
      setSyncNotice(
        result.storageArea === 'local' ? '已保存到本机，暂未同步' : null,
      )
    } catch {
      setError('保存失败，请重试')
      setDictionarySettingsState(
        await getDictionarySettings().catch(() => dictionarySettings),
      )
    } finally {
      setSavingTarget(null)
    }
  }

  async function handleJsonStringEnabledChange(
    checked: boolean | 'indeterminate',
  ) {
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
      setSyncNotice(
        result.storageArea === 'local' ? '已保存到本机，暂未同步' : null,
      )
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

  function setV2exBase64DraftValue(nextDraft: string) {
    v2exBase64DraftRef.current = nextDraft
    setV2exBase64Draft(nextDraft)
  }

  function setV2exBase64SavedDraftValue(nextDraft: string) {
    v2exBase64SavedDraftRef.current = nextDraft
    setV2exBase64SavedDraft(nextDraft)
  }

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
      setSyncNotice(
        result.storageArea === 'local' ? '已保存到本机，暂未同步' : null,
      )
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

  return (
    <article className="min-h-full">
      <section className="border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <GearSixIcon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="font-mono text-lg font-semibold leading-6 text-slate-950 dark:text-slate-50">
              设置
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              QHelper Tools
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200">
            <KeyIcon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-sm font-semibold text-slate-950 dark:text-slate-50">
              V2EX Base64
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              管理 V2EX 页面右下角可复制的 Base64 字符串。
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:px-5">
          <div className="grid gap-2">
            <Label htmlFor={v2exBase64EntriesId}>可转 Base64 的字符串</Label>
            <Textarea
              id={v2exBase64EntriesId}
              value={v2exBase64Draft}
              aria-describedby={`${v2exBase64EntriesId}-status`}
              disabled={loading}
              placeholder="user@example.com&#10;13800138000"
              className="min-h-28 resize-y font-mono"
              onChange={(event) => {
                setV2exBase64DraftValue(event.target.value)
                v2exBase64FailedDraftRef.current = null
                setV2exBase64SaveFailed(false)
                setError(null)
                setSyncNotice(null)
              }}
            />
            <p
              id={`${v2exBase64EntriesId}-status`}
              className={cn(
                'text-xs leading-5',
                savingV2exBase64
                  ? 'text-sky-700 dark:text-sky-300'
                  : v2exBase64SaveFailed
                    ? 'text-red-700 dark:text-red-300'
                  : v2exBase64DraftDirty
                    ? 'text-amber-700 dark:text-amber-300'
                    : v2exBase64Settings.entries.length > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {v2exBase64StatusText}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200">
            <TranslateIcon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-sm font-semibold text-slate-950 dark:text-slate-50">
              字典
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              控制网页划词后的字典查询入口。
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
          <div className="grid min-w-0 gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id={selectionLookupId}
                aria-describedby={`${selectionLookupId}-status`}
                checked={dictionarySettings.selectionLookupEnabled}
                disabled={loading || saving}
                onCheckedChange={handleSelectionLookupChange}
              />
              <Label htmlFor={selectionLookupId}>启用字典划词翻译</Label>
            </div>
            <p
              id={`${selectionLookupId}-status`}
              className={cn(
                'text-xs leading-5',
                dictionarySettings.selectionLookupEnabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {dictionarySettings.selectionLookupEnabled ? '已启用' : '已停用'}
            </p>
          </div>

          {savingDictionary ? (
            <p
              className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
              role="status"
            >
              正在保存...
            </p>
          ) : null}
        </div>

      </section>

      <section className="mt-3 border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200">
            <BracketsCurlyIcon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-sm font-semibold text-slate-950 dark:text-slate-50">
              开发者工具
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              控制 DevTools 中 Json String 面板的请求采集与解析。
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
          <div className="grid min-w-0 gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id={jsonStringId}
                aria-describedby={`${jsonStringId}-status`}
                checked={jsonStringSettings.enabled}
                disabled={loading || saving}
                onCheckedChange={handleJsonStringEnabledChange}
              />
              <Label htmlFor={jsonStringId}>启用 Json String</Label>
            </div>
            <p
              id={`${jsonStringId}-status`}
              className={cn(
                'text-xs leading-5',
                jsonStringSettings.enabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {jsonStringSettings.enabled ? '已启用' : '已停用'}
            </p>
          </div>

          {savingJsonString ? (
            <p
              className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
              role="status"
            >
              正在保存...
            </p>
          ) : null}
        </div>
      </section>

      {error ? (
        <p
          className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300 sm:px-5"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {syncNotice ? (
        <p
          className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-200 sm:px-5"
          role="status"
        >
          {syncNotice}
        </p>
      ) : null}
    </article>
  )
}
