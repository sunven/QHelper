import { defineSetting } from '@/lib/settings'
import {
  isOrdinaryToolId,
  type ToolCatalogLaunchEntry,
} from '@/lib/tool-catalog'

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
