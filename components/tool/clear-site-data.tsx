import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { reload } from '@/lib/chrome/tabs'
import { clearSiteData } from '@/lib/site-data/clear'
import { collectSiteDataCounts } from '@/lib/site-data/counts'
import { parseLaunchTarget } from '@/lib/site-data/target'
import {
  SITE_DATA_TYPES,
  SITE_DATA_TYPE_DESCRIPTIONS,
  SITE_DATA_TYPE_LABELS,
  type ClearSiteDataOutcome,
  type CurrentSiteTarget,
  type SiteDataClearStatus,
  type SiteDataCountMap,
  type SiteDataType,
  type SiteTarget,
} from '@/lib/site-data/types'
import { cn, getErrorMessage } from '@/lib/utils'

type TargetMode = 'current-site' | 'all-sites'

function readLaunchTarget(): CurrentSiteTarget | null {
  if (typeof window === 'undefined') {
    return null
  }

  return parseLaunchTarget(window.location.search)
}

function formatCount(
  counts: SiteDataCountMap | null,
  type: SiteDataType,
  loading: boolean,
  allSites: boolean,
): string {
  if (loading) {
    return '统计中…'
  }

  if (!counts) {
    return '不可用'
  }

  const value = counts[type]
  if (value !== null) {
    return String(value)
  }

  return allSites ? '不统计' : '不可用'
}

function getTargetLabel(target: SiteTarget): string {
  return target.mode === 'current-site' ? target.origin : '全部站点'
}

const STATUS_CONFIG: Record<
  SiteDataClearStatus,
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    className: 'text-emerald-600 dark:text-emerald-400',
    label: '成功',
  },
  failed: {
    icon: XCircle,
    className: 'text-destructive',
    label: '失败',
  },
  skipped: {
    icon: AlertTriangle,
    className: 'text-amber-600 dark:text-amber-400',
    label: '跳过',
  },
}

export function ClearSiteDataTool() {
  const [launchTarget] = useState(readLaunchTarget)
  const [mode, setMode] = useState<TargetMode>(() =>
    launchTarget ? 'current-site' : 'all-sites',
  )
  const [selectedTypes, setSelectedTypes] = useState<Set<SiteDataType>>(
    () => new Set(SITE_DATA_TYPES),
  )
  const [counts, setCounts] = useState<SiteDataCountMap | null>(null)
  const [countsLoading, setCountsLoading] = useState(true)
  const [countsError, setCountsError] = useState('')
  const [refreshAfterClear, setRefreshAfterClear] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState('')
  const [outcome, setOutcome] = useState<ClearSiteDataOutcome | null>(null)

  const target = useMemo<SiteTarget>(
    () =>
      mode === 'current-site' && launchTarget
        ? launchTarget
        : { mode: 'all-sites' },
    [mode, launchTarget],
  )

  const loadCounts = useCallback(async () => {
    setCountsLoading(true)
    setCountsError('')
    try {
      setCounts(await collectSiteDataCounts(target))
    } catch (error) {
      setCounts(null)
      setCountsError(getErrorMessage(error, '读取站点数据失败'))
    } finally {
      setCountsLoading(false)
    }
  }, [target])

  useEffect(() => {
    void loadCounts()
  }, [loadCounts])

  const selectedTypeList = useMemo(
    () => SITE_DATA_TYPES.filter((type) => selectedTypes.has(type)),
    [selectedTypes],
  )

  const toggleType = (type: SiteDataType) => {
    setSelectedTypes((current) => {
      const next = new Set(current)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const changeMode = (value: string) => {
    setMode(value === 'current-site' ? 'current-site' : 'all-sites')
    setOutcome(null)
    setClearError('')
    setConfirmOpen(false)
  }

  const handleClear = async () => {
    setClearing(true)
    setClearError('')
    try {
      const result = await clearSiteData(target, selectedTypeList)
      setOutcome(result)
      setConfirmOpen(false)

      if (refreshAfterClear) {
        await Promise.allSettled(
          result.affectedTabIds.map((tabId) => reload(tabId)),
        )
      }

      await loadCounts()
    } catch (error) {
      setClearError(getErrorMessage(error, '清除站点数据失败'))
    } finally {
      setClearing(false)
    }
  }

  const busy = clearing

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-3">
      <section className="flex flex-col gap-2 border border-border bg-card p-3">
        <h2 className="text-sm font-medium">清理目标</h2>
        <RadioGroup value={mode} onValueChange={changeMode}>
          <div className="flex items-start gap-2">
            <RadioGroupItem
              id="clear-site-data-target-current"
              value="current-site"
              disabled={!launchTarget}
              data-testid="clear-site-data-target-current"
              className="mt-0.5"
            />
            <div className="min-w-0">
              <Label htmlFor="clear-site-data-target-current">当前站点</Label>
              <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                {launchTarget
                  ? launchTarget.origin
                  : '未获取到有效网页，请从普通网页的弹窗入口打开'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem
              id="clear-site-data-target-all"
              value="all-sites"
              data-testid="clear-site-data-target-all"
              className="mt-0.5"
            />
            <div className="min-w-0">
              <Label htmlFor="clear-site-data-target-all">全部站点</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                影响所有网站，仅 Cookie 可统计数量
              </p>
            </div>
          </div>
        </RadioGroup>
        {target.mode === 'all-sites' ? (
          <div
            className="flex items-start gap-2 border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              将清除所有网站的登录状态与站点数据，包含扩展自身的 Cookie，操作无法撤销。
            </span>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 className="text-sm font-medium">选择数据类型</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadCounts()}
            disabled={countsLoading || busy}
            data-testid="clear-site-data-refresh"
          >
            {countsLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            刷新计数
          </Button>
        </div>

        {countsError ? (
          <p className="border-b border-border px-3 py-2 text-xs text-destructive">
            {countsError}
          </p>
        ) : null}

        {target.mode === 'all-sites' ? (
          <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
            全部站点模式下仅能统计 Cookie 数量；其余类型无法预览，但仍会随清理生效。
          </p>
        ) : null}

        <ul>
          {SITE_DATA_TYPES.map((type) => (
            <li
              key={type}
              className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
            >
              <div className="flex min-w-0 items-start gap-2">
                <Checkbox
                  id={`clear-site-data-type-${type}`}
                  checked={selectedTypes.has(type)}
                  onCheckedChange={() => toggleType(type)}
                  disabled={busy}
                  className="mt-0.5"
                  data-testid={`clear-site-data-type-${type}`}
                />
                <div className="min-w-0">
                  <Label htmlFor={`clear-site-data-type-${type}`}>
                    {SITE_DATA_TYPE_LABELS[type]}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {SITE_DATA_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </div>
              <span
                data-testid={`clear-site-data-count-${type}`}
                title={
                  target.mode === 'all-sites' && type !== 'cookies'
                    ? '全部站点模式下无法预览该类型，但清理仍然有效'
                    : undefined
                }
                className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums"
              >
                {formatCount(
                  counts,
                  type,
                  countsLoading,
                  target.mode === 'all-sites',
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 border border-border bg-card p-3">
        <label
          className="flex items-center gap-2 text-xs"
          htmlFor="clear-site-data-refresh-after"
        >
          <Checkbox
            id="clear-site-data-refresh-after"
            checked={refreshAfterClear}
            onCheckedChange={(checked) => setRefreshAfterClear(checked === true)}
            disabled={busy}
            data-testid="clear-site-data-refresh-after"
          />
          清理后刷新受影响的标签页
        </label>

        {clearError ? (
          <p className="text-xs text-destructive">{clearError}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {selectedTypeList.length === 0
              ? '请至少选择一种数据类型'
              : `已选择 ${selectedTypeList.length} 类数据`}
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedTypeList.length === 0 || busy}
            data-testid="clear-site-data-clear"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            清除数据
          </Button>
        </div>
      </section>

      {outcome ? (
        <section
          aria-label="清理结果"
          className="flex flex-col border border-border bg-card"
        >
          <div className="border-b border-border px-3 py-2">
            <h2 className="text-sm font-medium">清理结果</h2>
          </div>
          <ul>
            {outcome.results.map((result) => {
              const config = STATUS_CONFIG[result.status]
              const Icon = config.icon
              return (
                <li
                  key={result.type}
                  data-testid={`clear-site-data-result-${result.type}`}
                  className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
                >
                  <span className="flex items-center gap-2 text-xs">
                    <Icon className={cn('size-4', config.className)} />
                    {SITE_DATA_TYPE_LABELS[result.type]}
                  </span>
                  <span className="text-right text-xs text-muted-foreground">
                    {config.label}
                    {result.message ? ` · ${result.message}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
          {refreshAfterClear && outcome.affectedTabIds.length > 0 ? (
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              已刷新 {outcome.affectedTabIds.length} 个受影响的标签页
            </p>
          ) : null}
        </section>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-md border border-border bg-card p-4 shadow-xl">
            <h2 className="text-base font-medium">确认清除站点数据</h2>
            <p className="mt-2 break-all font-mono text-xs">
              {getTargetLabel(target)}
            </p>
            <ul className="mt-2 border border-border">
              {selectedTypeList.map((type) => (
                <li
                  key={type}
                  className="flex items-center justify-between gap-2 border-b border-border px-2 py-1.5 text-xs last:border-b-0"
                >
                  <span>{SITE_DATA_TYPE_LABELS[type]}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {formatCount(
                      counts,
                      type,
                      countsLoading,
                      target.mode === 'all-sites',
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {target.mode === 'all-sites' ? (
              <p className="mt-2 border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                全部站点模式会清除所有网站的登录状态与数据，且无法撤销。
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              此操作无法撤销。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={clearing}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleClear()}
                disabled={clearing}
                data-testid="clear-site-data-confirm"
              >
                {clearing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                确认清除
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
