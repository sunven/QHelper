import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { snapshotsKey } from '@/lib/tool-data/catalog'
import {
  getToolSnapshots,
  removeToolSnapshot,
  type SavedToolSnapshot,
  saveToolSnapshot,
} from '@/lib/tool-data/manager'
import { subscribeData } from '@/lib/tool-data/storage'
import { serializeSession, type ToolSession } from '@/lib/tool-sessions'

export function ToolSessionToolbar({
  session,
  onStart,
  onEnd,
}: {
  session: ToolSession
  onStart: (values?: Record<string, unknown>) => void
  onEnd: () => void
}) {
  const [snapshots, setSnapshots] = useState<SavedToolSnapshot[]>([])
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    const reload = () => {
      void getToolSnapshots(session.toolId)
        .then((items) => {
          if (active) setSnapshots(items)
        })
        .catch(() => {
          if (active) {
            setFailed(true)
            setMessage('快照加载失败，请重试。')
          }
        })
    }
    reload()
    const unsubscribe = subscribeData(snapshotsKey(session.toolId), reload)
    return () => {
      active = false
      unsubscribe()
    }
  }, [session.toolId])

  async function save() {
    setBusy(true)
    setFailed(false)
    try {
      await saveToolSnapshot(session.toolId, serializeSession(session))
      setSnapshots(await getToolSnapshots(session.toolId))
      setMessage('已保存一份快照，当前编辑模式不变。')
    } catch {
      setFailed(true)
      setMessage('保存失败，请重试。')
    } finally {
      setBusy(false)
    }
  }
  session.saveSnapshot = save

  return (
    <section
      aria-label="工具会话"
      className="mb-2 space-y-2 rounded border border-border p-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-muted-foreground">
          {session.temporary
            ? '临时处理 · 内容仅在当前标签页保留，刷新后丢弃'
            : '普通编辑 · 沿用此工具的保存方式'}
        </span>
        {!session.temporary && (
          <Button size="sm" variant="outline" onClick={() => onStart()}>
            开始临时处理
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void save()}
        >
          保存一份
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSnapshots(!showSnapshots)}
        >
          已保存快照 ({snapshots.length})
        </Button>
        {session.temporary && (
          <Button size="sm" variant="outline" onClick={onEnd}>
            结束临时处理
          </Button>
        )}
      </div>
      {message && (
        <p role={failed ? 'alert' : 'status'} className="text-xs">
          {message}
        </p>
      )}
      {showSnapshots && (
        <div className="max-h-56 overflow-y-auto text-xs">
          <p className="text-muted-foreground">
            最多保留最近 50 份；恢复将在临时会话中打开。
          </p>
          {[...snapshots].reverse().map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex items-center gap-2 border-b py-1"
            >
              <span className="mr-auto">
                {new Date(snapshot.timestamp).toLocaleString()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStart(snapshot.values)}
              >
                恢复
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void removeToolSnapshot(session.toolId, snapshot.id)
                    .then(async () =>
                      setSnapshots(await getToolSnapshots(session.toolId)),
                    )
                    .catch(() => {
                      setFailed(true)
                      setMessage('删除失败，请重试。')
                    })
                }}
              >
                删除
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
