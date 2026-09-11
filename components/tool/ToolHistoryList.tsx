import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HistoryEntry } from '@/hooks/useToolHistory'

export type ToolHistoryListProps<T> = {
  /** 历史快照,按传入顺序渲染(最新在后) */
  entries: HistoryEntry<T>[]
  /** 单条历史的内容;行外壳、hover 与 onSelect 触发点由本 module 拥有 */
  renderItem: (entry: HistoryEntry<T>) => ReactNode
  /** 点击某条历史 */
  onSelect: (entry: HistoryEntry<T>) => void
  /** 提供时渲染「清除历史」控件 */
  onClear?: () => void
  /** 提供时在每行尾部渲染删除按钮 */
  onRemove?: (id: string) => void
}

/**
 * Tool History List:某个 Persisted Tool Data 历史的共享展示。
 * 拥有外壳、网格布局、滚动区、清除与删除控件、onSelect 触发点;
 * 条目内容归调用方,顺序与条数上限归 useToolHistory 的 max 选项。
 * 无历史时不渲染。
 */
export function ToolHistoryList<T>({
  entries,
  renderItem,
  onSelect,
  onClear,
  onRemove,
}: ToolHistoryListProps<T>) {
  if (entries.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm">历史记录</CardTitle>
        {onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            清除历史 ({entries.length})
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id ?? index}
              className="flex cursor-pointer items-center gap-2 rounded bg-muted p-2 transition-colors hover:bg-muted/70"
              onClick={() => onSelect(entry)}
            >
              <div className="min-w-0 flex-1">{renderItem(entry)}</div>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="删除这条历史"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(entry.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
