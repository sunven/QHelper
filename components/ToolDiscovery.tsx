import { Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePersistedValue } from '@/hooks/usePersistedValue'
import { useToolSettingControl } from '@/hooks/useToolSettingControl'
import {
  isOrdinaryToolId,
  type ToolCatalogLaunchEntry,
} from '@/lib/tool-catalog'
import {
  deleteData,
  readData,
  subscribeData,
  writeData,
} from '@/lib/tool-data/storage'
import {
  favoriteTools,
  normalizeToolIds,
  RECENT_TOOLS_KEY,
  searchTools,
} from '@/lib/tool-discovery'

const recentStore = {
  get: readData,
  set: writeData,
  remove: deleteData,
  subscribe: subscribeData,
}

export function ToolDiscovery({
  entries,
  onLaunch,
  onSearchingChange,
}: {
  entries: ToolCatalogLaunchEntry[]
  onLaunch: (entry: ToolCatalogLaunchEntry) => void
  onSearchingChange: (searching: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const favorites = useToolSettingControl(favoriteTools)
  const { value: recent } = usePersistedValue<string[]>(
    RECENT_TOOLS_KEY,
    [],
    recentStore,
  )
  const results = useMemo(() => searchTools(entries, query), [entries, query])
  const searching = Boolean(query.trim())
  useEffect(() => onSearchingChange(searching), [searching, onSearchingChange])

  const byIds = (ids: string[]) =>
    ids.flatMap((toolId) => {
      const entry = entries.find((item) => item.id === toolId)
      return entry ? [entry] : []
    })

  function toggleFavorite(toolId: string) {
    const ids = favorites.value.ids
    void favorites.change({
      ids: ids.includes(toolId)
        ? ids.filter((item) => item !== toolId)
        : [...ids, toolId],
    })
  }

  function renderEntries(items: ToolCatalogLaunchEntry[], section: string) {
    return items.map((entry, index) => (
      <div key={entry.id} className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`min-w-0 flex-1 justify-start truncate ${searching && index === selected ? 'bg-accent' : ''}`}
          data-testid={`discovery-${section}-${entry.id}`}
          onClick={() => onLaunch(entry)}
        >
          {entry.name}
        </Button>
        {isOrdinaryToolId(entry.id) && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${favorites.value.ids.includes(entry.id) ? '取消收藏' : '收藏'}${entry.name}`}
            aria-pressed={favorites.value.ids.includes(entry.id)}
            disabled={favorites.loading}
            onClick={() => toggleFavorite(entry.id)}
          >
            <Star
              aria-hidden
              className={
                favorites.value.ids.includes(entry.id)
                  ? 'fill-current text-amber-500'
                  : ''
              }
            />
          </Button>
        )}
      </div>
    ))
  }

  const pinned = byIds(favorites.value.ids)
  const recentEntries = byIds(
    normalizeToolIds(recent).filter(
      (toolId) => !favorites.value.ids.includes(toolId),
    ),
  )
  return (
    <section aria-label="查找工具" className="space-y-1 p-1">
      <Input
        aria-label="搜索工具"
        placeholder="搜索工具名称或用途…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setSelected(0)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setQuery('')
            setSelected(0)
          }
          if (!searching || !results.length) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setSelected(
              (current) =>
                (current +
                  (event.key === 'ArrowDown' ? 1 : -1) +
                  results.length) %
                results.length,
            )
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            onLaunch(results[Math.min(selected, results.length - 1)])
          }
        }}
      />
      {favorites.error && (
        <p role="alert" className="text-xs text-destructive">
          {favorites.error}
        </p>
      )}
      {favorites.syncNotice && (
        <p role="status" className="text-xs text-muted-foreground">
          {favorites.syncNotice}
        </p>
      )}
      {searching ? (
        <div aria-label="搜索结果">
          {results.length ? (
            renderEntries(results, 'search')
          ) : (
            <p role="status" className="p-2 text-sm text-muted-foreground">
              没有找到匹配的工具。
            </p>
          )}
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">收藏</p>
              {renderEntries(pinned, 'favorites')}
            </div>
          )}
          {recentEntries.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">最近使用</p>
              {renderEntries(recentEntries, 'recent')}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            搜索工具后可点击星标收藏。
          </p>
        </>
      )}
    </section>
  )
}
