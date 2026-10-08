import { defineSetting } from '@/lib/settings'
import {
  isOrdinaryToolId,
  type ToolCatalogLaunchEntry,
} from '@/lib/tool-catalog'
import { readData, withDataLock, writeData } from '@/lib/tool-data/storage'

export const RECENT_TOOLS_KEY = 'qhelper.recent-tools.v1'
export const RECENT_TOOLS_LIMIT = 8

export function normalizeToolIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter(isOrdinaryToolId))]
    : []
}

export const favoriteTools = defineSetting<{ ids: string[] }>(
  'qhelper.favorite-tools.v1',
  { ids: [] },
  (value) => ({ ids: normalizeToolIds(value?.ids) }),
)

export function searchTools(entries: ToolCatalogLaunchEntry[], query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return entries.filter((entry) => {
    const text = [
      entry.id,
      entry.name,
      entry.description,
      ...(entry.keywords ?? []),
    ]
      .join(' ')
      .toLocaleLowerCase()
    return terms.every((term) => text.includes(term))
  })
}

export async function recordRecentTool(toolId: string) {
  if (!isOrdinaryToolId(toolId)) return
  const update = async () => {
    const previous = normalizeToolIds(await readData(RECENT_TOOLS_KEY))
    await writeData(
      RECENT_TOOLS_KEY,
      [toolId, ...previous.filter((id) => id !== toolId)].slice(
        0,
        RECENT_TOOLS_LIMIT,
      ),
    )
  }
  await withDataLock(RECENT_TOOLS_KEY, update)
}
