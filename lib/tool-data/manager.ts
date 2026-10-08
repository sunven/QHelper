import {
  browserFileHandleStore,
  countStoredFileHandles,
} from '@/lib/text-preview/fileHandleStore'
import { contentKeys, SESSION_TOOL_IDS, snapshotsKey } from './catalog'
import {
  deleteData,
  generationKey,
  readData,
  withDataLock,
  writeData,
} from './storage'

export type ToolDataSummary = {
  toolId: string
  records: number
  bytes: number
  handles: number
  categories: string[]
}

export async function getToolDataSummary(): Promise<ToolDataSummary[]> {
  return Promise.all(
    SESSION_TOOL_IDS.map(async (toolId) => {
      let records = 0
      let bytes = 0
      const categories = new Set<string>()
      for (const key of contentKeys(toolId)) {
        // Count both stores: an old fallback copy also needs to be cleared.
        const chromeValue = globalThis.chrome?.storage?.local
          ? (await chrome.storage.local.get(key))[key]
          : undefined
        const fallbackValue = globalThis.localStorage?.getItem(key)
        let fallback: unknown = fallbackValue ?? undefined
        if (fallbackValue) {
          try {
            fallback = JSON.parse(fallbackValue)
          } catch {
            /* Corrupt content must still be clearable. */
          }
        }
        for (const value of [chromeValue, fallback]) {
          if (value === undefined) continue
          bytes += new TextEncoder().encode(JSON.stringify(value)).byteLength
          records += Array.isArray(value) ? value.length : 1
          categories.add(
            key === snapshotsKey(toolId)
              ? '快照'
              : toolId === 'text-preview'
                ? '工作区'
                : Array.isArray(value)
                  ? '历史'
                  : '输入',
          )
        }
      }
      const handles =
        toolId === 'text-preview' ? await countStoredFileHandles() : 0
      return { toolId, records, bytes, handles, categories: [...categories] }
    }),
  )
}

export async function clearToolData(toolId: string) {
  if (!SESSION_TOOL_IDS.includes(toolId)) throw new Error('不支持清理此工具')
  await withDataLock(toolId, async () => {
    await writeData(generationKey(toolId), crypto.randomUUID())
    const results = await Promise.allSettled(
      contentKeys(toolId).map(deleteData),
    )
    if (toolId === 'formatter')
      await writeData('tool_formatter_history-migrated', true)
    if (toolId === 'text-preview') {
      const result = await browserFileHandleStore.clear()
      if (!result.ok) throw new Error(result.warning || '文件授权清理失败')
    }
    if (results.some((result) => result.status === 'rejected'))
      throw new Error('部分数据清理失败，请重试。')
  })
}

export type SavedToolSnapshot = {
  id: string
  version: 1
  timestamp: number
  values: Record<string, unknown>
}

export async function getToolSnapshots(toolId: string) {
  const values = await readData<unknown>(snapshotsKey(toolId))
  return Array.isArray(values)
    ? values.filter(
        (value): value is SavedToolSnapshot =>
          value?.version === 1 &&
          typeof value.id === 'string' &&
          value.values &&
          typeof value.values === 'object',
      )
    : []
}

export async function saveToolSnapshot(
  toolId: string,
  values: Record<string, unknown>,
) {
  await withDataLock(toolId, async () => {
    const previous = await getToolSnapshots(toolId)
    await writeData(
      snapshotsKey(toolId),
      [
        ...previous,
        {
          id: crypto.randomUUID(),
          version: 1,
          timestamp: Date.now(),
          values,
        },
      ].slice(-50),
    )
  })
}

export async function removeToolSnapshot(toolId: string, id: string) {
  await withDataLock(toolId, async () => {
    await writeData(
      snapshotsKey(toolId),
      (await getToolSnapshots(toolId)).filter((snapshot) => snapshot.id !== id),
    )
  })
}
