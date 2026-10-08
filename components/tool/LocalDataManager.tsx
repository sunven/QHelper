import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getToolCatalogTool } from '@/lib/tool-catalog'
import {
  clearToolData,
  getToolDataSummary,
  type ToolDataSummary,
} from '@/lib/tool-data/manager'
import { deleteData, withDataLock } from '@/lib/tool-data/storage'
import { RECENT_TOOLS_KEY } from '@/lib/tool-discovery'

export function LocalDataManager() {
  const [rows, setRows] = useState<ToolDataSummary[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const refresh = useCallback(async () => {
    setError('')
    try {
      setRows(await getToolDataSummary())
    } catch {
      setError('本地数据读取失败，请重试。')
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])
  async function clear(row: ToolDataSummary) {
    const name = getToolCatalogTool(row.toolId)?.name ?? row.toolId
    if (
      !window.confirm(
        `清理 ${name} 的输入、历史、快照和工作区（约 ${row.records} 条，文件授权 ${row.handles} 个）？已打开页面的普通草稿也会重置，磁盘文件、偏好和凭证会保留。`,
      )
    )
      return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await clearToolData(row.toolId)
      await refresh()
      setMessage(`${name} 的本地内容已清理。`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '清理失败，请重试。')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      aria-label="本地数据"
      className="mt-3 space-y-3 rounded border border-border bg-background p-4"
    >
      <div className="flex items-center gap-2">
        <h2 className="mr-auto font-semibold">本地数据</h2>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void refresh()}
        >
          刷新数据
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            setError('')
            void withDataLock(RECENT_TOOLS_KEY, () =>
              deleteData(RECENT_TOOLS_KEY),
            )
              .then(() => setMessage('最近使用已清空。'))
              .catch(() => setError('清空失败，请重试。'))
              .finally(() => setBusy(false))
          }}
        >
          清空最近使用
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        管理本机工具内容；保留 API
        凭证、偏好、收藏、请求捕获记录和浏览器书签、下载记录。体积为内容估算值，不含文件句柄占用。
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <div className="divide-y">
        {rows.map((row) => (
          <div
            key={row.toolId}
            className="flex items-center gap-2 py-2"
            data-testid={`local-data-${row.toolId}`}
          >
            <div className="mr-auto">
              <p className="text-sm">{getToolCatalogTool(row.toolId)?.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.categories.join(' / ') || '暂无保存内容'} · {row.records}{' '}
                条 · {(row.bytes / 1024).toFixed(1)} KB
                {row.toolId === 'text-preview'
                  ? ` · 文件授权 ${row.handles} 个`
                  : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void clear(row)}
            >
              清理
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
