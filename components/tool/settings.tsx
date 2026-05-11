import { GearSixIcon, TranslateIcon } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_DICTIONARY_SETTINGS,
  getDictionarySettings,
  setDictionarySettings,
  subscribeDictionarySettings,
  type DictionarySettings,
} from '@/lib/dictionary/settings'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const selectionLookupId = useId()
  const [settings, setSettings] = useState<DictionarySettings>(
    DEFAULT_DICTIONARY_SETTINGS,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void getDictionarySettings()
      .then((nextSettings) => {
        if (active) {
          setSettings(nextSettings)
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

    const unsubscribe = subscribeDictionarySettings((nextSettings) => {
      if (active) {
        setSettings(nextSettings)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function handleSelectionLookupChange(checked: boolean | 'indeterminate') {
    const nextSettings = {
      ...settings,
      selectionLookupEnabled: checked === true,
    }

    setSettings(nextSettings)
    setSaving(true)
    setError(null)

    try {
      setSettings(await setDictionarySettings(nextSettings))
    } catch {
      setError('保存失败，请重试')
      setSettings(await getDictionarySettings().catch(() => settings))
    } finally {
      setSaving(false)
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
                checked={settings.selectionLookupEnabled}
                disabled={loading || saving}
                onCheckedChange={handleSelectionLookupChange}
              />
              <Label htmlFor={selectionLookupId}>启用字典划词翻译</Label>
            </div>
            <p
              id={`${selectionLookupId}-status`}
              className={cn(
                'text-xs leading-5',
                settings.selectionLookupEnabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {settings.selectionLookupEnabled ? '已启用' : '已停用'}
            </p>
          </div>

          {saving ? (
            <p
              className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
              role="status"
            >
              正在保存...
            </p>
          ) : null}
        </div>

        {error ? (
          <p
            className="border-t border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300 sm:px-5"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>
    </article>
  )
}
