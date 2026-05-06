import { Button } from '@/components/ui/button'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import {
  eraseDownloadHistoryRecords,
  listDownloadsForCleanup,
  type DownloadHistoryItem,
} from '@/lib/chrome/downloads'
import {
  classifyDownloadsForCleanup,
  getCleanupIds,
  type ClassifiedDownloadItem,
  type DownloadCleanupSummary,
} from '@/lib/downloads/cleanup'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileQuestion,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../../index.css'

type ScanState = 'idle' | 'loading' | 'ready' | 'cleaning' | 'error'

function formatBytes(value: number | undefined) {
  if (!value || value < 0) {
    return '-'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDate(value: string | undefined) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function getFileName(path: string | undefined) {
  if (!path) {
    return '未知文件'
  }

  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || path
}

function openUrl(url: string | undefined) {
  if (!url) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function SummaryCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'danger' | 'neutral' | 'safe' | 'warning'
}) {
  const toneClassName = {
    danger: 'border-red-200 bg-red-50 text-red-700',
    neutral: 'border-slate-200 bg-white text-slate-700',
    safe: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  }[tone]

  return (
    <div className={cn('rounded-md border px-3 py-2', toneClassName)}>
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function DownloadRow({
  item,
  muted = false,
}: {
  item: ClassifiedDownloadItem
  muted?: boolean
}) {
  return (
    <li className={cn('rounded-md border border-slate-200 bg-white p-3', muted && 'bg-slate-50 text-slate-500')}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{getFileName(item.filename)}</div>
          <div className="mt-1 truncate font-mono text-xs text-slate-500">{item.filename || '无本地路径'}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{formatBytes(item.totalBytes)}</span>
            <span>{formatDate(item.startTime)}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5"
          disabled={!item.finalUrl && !item.url}
          onClick={() => openUrl(item.finalUrl || item.url)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          来源
        </Button>
      </div>
    </li>
  )
}

function App() {
  const [downloads, setDownloads] = useState<DownloadHistoryItem[]>([])
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cleanedCount, setCleanedCount] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const summary = useMemo<DownloadCleanupSummary>(
    () => classifyDownloadsForCleanup(downloads),
    [downloads],
  )
  const cleanupIds = useMemo(() => getCleanupIds(downloads), [downloads])
  const isBusy = scanState === 'loading' || scanState === 'cleaning'

  const scanDownloads = useCallback(async () => {
    setScanState('loading')
    setErrorMessage('')
    setCleanedCount(null)
    setConfirmOpen(false)

    try {
      const items = await listDownloadsForCleanup()
      setDownloads(items)
      setScanState('ready')
    } catch (error) {
      setScanState('error')
      setErrorMessage(error instanceof Error ? error.message : '扫描下载记录失败')
    }
  }, [])

  const confirmCleanup = useCallback(async () => {
    if (cleanupIds.length === 0) {
      return
    }

    setScanState('cleaning')
    setErrorMessage('')

    try {
      const erasedIds = await eraseDownloadHistoryRecords(cleanupIds)
      const erasedIdSet = new Set(erasedIds)
      setDownloads((items) => items.filter((item) => !erasedIdSet.has(item.id)))
      setCleanedCount(erasedIds.length)
      setConfirmOpen(false)
      setScanState('ready')
    } catch (error) {
      setScanState('error')
      setErrorMessage(error instanceof Error ? error.message : '清理下载历史失败')
    }
  }, [cleanupIds])

  return (
    <ToolPageShell
      toolId="downloads"
      heroActions={
        <Button type="button" onClick={scanDownloads} disabled={isBusy} className="h-8 gap-1.5">
          {scanState === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          扫描
        </Button>
      }
    >
      <section className="grid gap-2 md:grid-cols-4">
        <SummaryCard label="确认缺失" value={summary.missing.length} tone="danger" />
        <SummaryCard label="已存在" value={summary.existing.length} tone="safe" />
        <SummaryCard label="已跳过" value={summary.unknown.length} tone="warning" />
        <SummaryCard label="总记录" value={downloads.length} />
      </section>

      <section className="mt-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">失效下载记录</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              仅清理确认原始文件不存在的下载历史记录。无法确认的记录会跳过，不会进入批量清理。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={isBusy || cleanupIds.length === 0}
              className="h-8 gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              一键清除
            </Button>
          </div>
        </div>

        {cleanedCount !== null ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            已清理 {cleanedCount} 条下载历史记录。
          </div>
        ) : null}

        {scanState === 'error' ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </div>
        ) : null}

        {scanState === 'idle' ? (
          <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            点击扫描开始检查下载历史。
          </div>
        ) : null}

        {scanState === 'loading' || scanState === 'cleaning' ? (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {scanState === 'loading' ? '正在扫描下载记录...' : '正在清理下载历史...'}
          </div>
        ) : null}

        {scanState === 'ready' && summary.missing.length === 0 ? (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-8 text-center text-sm text-emerald-700">
            没有发现确认缺失的下载记录。
          </div>
        ) : null}

        {summary.missing.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {summary.missing.map((item) => (
              <DownloadRow key={item.id} item={item} />
            ))}
          </ul>
        ) : null}
      </section>

      {summary.unknown.length > 0 ? (
        <section className="mt-2 rounded-md border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <FileQuestion className="h-4 w-4" />
            已跳过无法确认的记录
          </div>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            这些记录不会被一键清除。请在 Chrome 原生下载页中手动确认。
          </p>
          <ul className="mt-3 space-y-2">
            {summary.unknown.map((item) => (
              <DownloadRow key={`unknown-${item.id}-${item.filename}`} item={item} muted />
            ))}
          </ul>
        </section>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-base font-semibold text-slate-950">确认清理下载历史</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              将从下载历史中移除 {cleanupIds.length} 条确认缺失的记录。此操作不会删除任何本地文件。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={scanState === 'cleaning'}>
                取消
              </Button>
              <Button type="button" onClick={confirmCleanup} disabled={scanState === 'cleaning'} className="gap-1.5 bg-red-600 hover:bg-red-700">
                {scanState === 'cleaning' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                确认清理
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
