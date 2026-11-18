import { IntervalInput } from '@/components/auto-refresh/IntervalInput'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendAutoRefreshMessage } from '@/lib/auto-refresh/client'
import { formatIntervalSeconds, normalizePageUrl } from '@/lib/auto-refresh/url'
import { cn, getErrorMessage } from '@/lib/utils'
import type {
  AutoRefreshRuleView,
  AutoRefreshSaveRuleResult,
  AutoRefreshSnapshot,
} from '@/types/auto-refresh'
import {
  AUTO_REFRESH_DEFAULT_RULE_SECONDS,
  AUTO_REFRESH_MAX_SECONDS,
  AUTO_REFRESH_RULE_MIN_SECONDS,
  AUTO_REFRESH_RULE_PRESETS,
} from '@/types/auto-refresh'
import { Loader2, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

function readInitialUrl(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const rawUrl = new URLSearchParams(window.location.search).get('url')
  return normalizePageUrl(rawUrl) ?? ''
}

function SwitchButton({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        checked ? 'border-primary bg-primary' : 'border-border bg-muted',
      )}
    >
      <span
        className={cn(
          'block size-3.5 rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-[20px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function AutoRefreshTool() {
  const [snapshot, setSnapshot] = useState<AutoRefreshSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState(readInitialUrl)
  const [intervalSeconds, setIntervalSeconds] = useState(
    AUTO_REFRESH_DEFAULT_RULE_SECONDS,
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const nextSnapshot = await sendAutoRefreshMessage<AutoRefreshSnapshot>({
        type: 'AUTO_REFRESH_GET_SNAPSHOT',
      })
      setSnapshot(nextSnapshot)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  useEffect(() => {
    const handleFocus = () => {
      void loadSnapshot()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadSnapshot])

  const resetForm = () => {
    setEditingId(null)
    setUrl('')
    setIntervalSeconds(AUTO_REFRESH_DEFAULT_RULE_SECONDS)
    setFormError('')
  }

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    } finally {
      setBusy(false)
    }
  }

  const handleToggleMaster = () => {
    if (!snapshot) {
      return
    }

    void runAction(async () => {
      const nextSnapshot = await sendAutoRefreshMessage<AutoRefreshSnapshot>({
        type: 'AUTO_REFRESH_SET_MASTER',
        enabled: !snapshot.masterEnabled,
      })
      setSnapshot(nextSnapshot)
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setNotice('')

    const normalizedUrl = normalizePageUrl(url)
    if (!normalizedUrl) {
      setFormError('请输入有效的 http(s) 网页地址')
      return
    }

    if (
      intervalSeconds < AUTO_REFRESH_RULE_MIN_SECONDS ||
      intervalSeconds > AUTO_REFRESH_MAX_SECONDS
    ) {
      setFormError(
        `间隔需在 ${formatIntervalSeconds(AUTO_REFRESH_RULE_MIN_SECONDS)} 到 ${formatIntervalSeconds(AUTO_REFRESH_MAX_SECONDS)} 之间`,
      )
      return
    }

    const editingRule = snapshot?.rules.find((rule) => rule.id === editingId)

    void runAction(async () => {
      const result = await sendAutoRefreshMessage<AutoRefreshSaveRuleResult>({
        type: 'AUTO_REFRESH_SAVE_RULE',
        id: editingId ?? undefined,
        url: normalizedUrl,
        intervalSeconds,
        enabled: editingRule?.enabled ?? true,
      })
      setSnapshot(result.snapshot)
      setNotice(result.created ? '规则已添加' : '规则已更新')
      resetForm()
    })
  }

  const handleEdit = (rule: AutoRefreshRuleView) => {
    setEditingId(rule.id)
    setUrl(rule.url)
    setIntervalSeconds(rule.intervalSeconds)
    setFormError('')
    setNotice('')
    document
      .getElementById('auto-refresh-rule-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleDelete = (rule: AutoRefreshRuleView) => {
    if (!window.confirm(`删除规则后，${rule.url} 将不再自动刷新。继续？`)) {
      return
    }

    void runAction(async () => {
      const nextSnapshot = await sendAutoRefreshMessage<AutoRefreshSnapshot>({
        type: 'AUTO_REFRESH_DELETE_RULE',
        id: rule.id,
      })
      setSnapshot(nextSnapshot)
      if (editingId === rule.id) {
        resetForm()
      }
      setNotice('规则已删除')
    })
  }

  const handleToggleRule = (rule: AutoRefreshRuleView) => {
    void runAction(async () => {
      const nextSnapshot = await sendAutoRefreshMessage<AutoRefreshSnapshot>({
        type: 'AUTO_REFRESH_SET_RULE_ENABLED',
        id: rule.id,
        enabled: !rule.enabled,
      })
      setSnapshot(nextSnapshot)
    })
  }

  if (loading && !snapshot) {
    return (
      <div className="mx-auto flex max-w-[1200px] items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        正在读取自动刷新规则…
      </div>
    )
  }

  if (error && !snapshot) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-2 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadSnapshot()}
        >
          重试
        </Button>
      </div>
    )
  }

  const rules = snapshot?.rules ?? []
  const masterEnabled = snapshot?.masterEnabled ?? true

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-2">
      <section className="flex flex-col gap-2 border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-sm font-medium">
              <RefreshCw className="size-4" />
              自动刷新总开关
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              关闭后所有持久规则和临时刷新都会暂停，规则本身会保留。
            </p>
          </div>
          <SwitchButton
            checked={masterEnabled}
            onChange={handleToggleMaster}
            label="自动刷新总开关"
            disabled={busy}
          />
        </div>
        {!masterEnabled && (
          <p className="border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400">
            自动刷新已全局关闭，规则和临时刷新都不会执行。
          </p>
        )}
      </section>

      <section
        id="auto-refresh-rule-form"
        className="flex flex-col gap-3 border border-border bg-card p-3"
      >
        <div>
          <h2 className="text-sm font-medium">
            {editingId ? '编辑规则' : '添加持久规则'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            保存后会对所有当前及以后打开该 URL 的标签页生效。
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="auto-refresh-url">网页 URL</Label>
            <Input
              id="auto-refresh-url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value)
                setFormError('')
                setNotice('')
              }}
              placeholder="https://example.com/dashboard"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="auto-refresh-interval">刷新间隔</Label>
            <IntervalInput
              id="auto-refresh-interval"
              valueSeconds={intervalSeconds}
              onChange={setIntervalSeconds}
              presets={AUTO_REFRESH_RULE_PRESETS}
              minSeconds={AUTO_REFRESH_RULE_MIN_SECONDS}
              maxSeconds={AUTO_REFRESH_MAX_SECONDS}
              disabled={busy}
            />
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}
          {notice && <p className="text-xs text-emerald-600">{notice}</p>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : editingId ? (
                <Save className="size-3.5" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {editingId ? '保存修改' : '添加规则'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={resetForm}
              >
                取消
              </Button>
            )}
          </div>
        </form>
      </section>

      <section className="flex flex-col border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 className="text-sm font-medium">持久规则</h2>
          <span className="text-xs text-muted-foreground">
            {rules.length} 条
          </span>
        </div>

        {error && <p className="px-3 py-2 text-xs text-destructive">{error}</p>}

        {rules.length === 0 ? (
          <Empty className="border-0 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RefreshCw />
              </EmptyMedia>
              <EmptyTitle>还没有持久规则</EmptyTitle>
              <EmptyDescription>
                在上方输入目标 URL，保存后对应的标签页会按间隔自动刷新。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul>
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-col gap-2 border-b border-border p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'shrink-0 px-1.5 py-0.5 text-[10px] font-medium',
                        rule.enabled
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {rule.enabled ? '已启用' : '已停用'}
                    </span>
                    <span
                      className="truncate font-mono text-xs"
                      title={rule.url}
                    >
                      {rule.url}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      每 {formatIntervalSeconds(rule.intervalSeconds)}
                    </span>
                    <span>
                      {rule.activeTabCount > 0
                        ? `${rule.activeTabCount} 个标签页生效中`
                        : '等待匹配标签页'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <SwitchButton
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule)}
                    label={rule.enabled ? '停用规则' : '启用规则'}
                    disabled={busy}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleEdit(rule)}
                  >
                    <Pencil className="size-3.5" />
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleDelete(rule)}
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
