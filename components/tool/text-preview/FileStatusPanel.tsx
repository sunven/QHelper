import { FileWarning, RefreshCcw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { WorkspaceTab } from '@/lib/text-preview/workspace'

type FileStatusPanelProps = {
  onDownloadCopy: () => void
  onForceOverwrite: () => void
  onReload: () => void
  tab: WorkspaceTab
}

export function FileStatusPanel({
  onDownloadCopy,
  onForceOverwrite,
  onReload,
  tab,
}: FileStatusPanelProps) {
  if (tab.source.kind !== 'local-file') {
    return null
  }

  if (tab.fileStatus.kind === 'conflict') {
    return (
      <Alert className="border-x-0 border-b-0 border-[var(--warning-border)] bg-[var(--warning-surface)] px-3 py-2.5 text-[var(--warning)]">
        <FileWarning aria-hidden="true" />
        <AlertTitle>本地文件已在外部变更</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <p>当前修改尚未保存。请先选择重新载入、覆盖本地文件，或下载副本。</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReload}
              >
                <RefreshCcw data-icon="inline-start" aria-hidden="true" />
                重新载入文件
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onForceOverwrite}
              >
                仍然覆盖
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDownloadCopy}
              >
                下载副本
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const text = getStatusText(tab)
  if (!text) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text)]">
        本地文件：{tab.source.name}
      </span>
      <span>{text}</span>
    </div>
  )
}

function getStatusText(tab: WorkspaceTab) {
  if (tab.source.kind !== 'local-file') {
    return ''
  }

  switch (tab.fileStatus.kind) {
    case 'clean':
      return tab.source.lastSavedAt
        ? `已保存 ${formatTime(tab.source.lastSavedAt)}`
        : '已载入'
    case 'dirty':
      return '未保存'
    case 'saving':
      return '保存中...'
    case 'permission-needed':
      return '需要重新授权后才能保存'
    case 'handle-missing':
      return '需要重新打开文件后才能保存'
    case 'save-failed':
      return `保存失败：${tab.fileStatus.message}`
    default:
      return ''
  }
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}
