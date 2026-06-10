import {
  BracketsCurlyIcon,
  GearSixIcon,
  KeyIcon,
  TranslateIcon,
} from '@phosphor-icons/react'
import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  useToolSettingsPageState,
  type V2exBase64StatusTone,
} from './useToolSettingsPageState'

function getV2exBase64StatusClass(tone: V2exBase64StatusTone): string {
  switch (tone) {
    case 'saving':
      return 'text-sky-700 dark:text-sky-300'
    case 'error':
      return 'text-red-700 dark:text-red-300'
    case 'dirty':
      return 'text-amber-700 dark:text-amber-300'
    case 'saved':
      return 'text-emerald-700 dark:text-emerald-400'
    case 'muted':
      return 'text-slate-500 dark:text-slate-400'
  }
}

export function SettingsPage() {
  const selectionLookupId = useId()
  const jsonStringId = useId()
  const v2exBase64EntriesId = useId()
  const settingsState = useToolSettingsPageState()
  const { dictionary, jsonString, v2exBase64 } = settingsState

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
              value={v2exBase64.draft}
              aria-describedby={`${v2exBase64EntriesId}-status`}
              disabled={v2exBase64.disabled}
              placeholder="user@example.com&#10;13800138000"
              className="min-h-28 resize-y font-mono"
              onChange={(event) => {
                v2exBase64.changeDraft(event.target.value)
              }}
            />
            <p
              id={`${v2exBase64EntriesId}-status`}
              className={cn(
                'text-xs leading-5',
                getV2exBase64StatusClass(v2exBase64.statusTone),
              )}
            >
              {v2exBase64.statusText}
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
                checked={dictionary.selectionLookupEnabled}
                disabled={dictionary.disabled}
                onCheckedChange={dictionary.changeSelectionLookup}
              />
              <Label htmlFor={selectionLookupId}>启用字典划词翻译</Label>
            </div>
            <p
              id={`${selectionLookupId}-status`}
              className={cn(
                'text-xs leading-5',
                dictionary.selectionLookupEnabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {dictionary.selectionLookupEnabled ? '已启用' : '已停用'}
            </p>
          </div>

          {dictionary.saving ? (
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
                checked={jsonString.enabled}
                disabled={jsonString.disabled}
                onCheckedChange={jsonString.changeEnabled}
              />
              <Label htmlFor={jsonStringId}>启用 Json String</Label>
            </div>
            <p
              id={`${jsonStringId}-status`}
              className={cn(
                'text-xs leading-5',
                jsonString.enabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {jsonString.enabled ? '已启用' : '已停用'}
            </p>
          </div>

          {jsonString.saving ? (
            <p
              className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
              role="status"
            >
              正在保存...
            </p>
          ) : null}
        </div>
      </section>

      {settingsState.error ? (
        <p
          className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300 sm:px-5"
          role="alert"
        >
          {settingsState.error}
        </p>
      ) : null}

      {settingsState.syncNotice ? (
        <p
          className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-200 sm:px-5"
          role="status"
        >
          {settingsState.syncNotice}
        </p>
      ) : null}
    </article>
  )
}
