import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createToolHistoryStore,
  type HistoryEntry,
} from './tool-history-store'
import { getToolStateStorageKey } from './chrome/local-persisted-data'

type Snapshot = { value: string }

function primeStoredHistory(
  storageKey: string,
  entries: HistoryEntry<Snapshot>[],
) {
  vi.mocked(chrome.storage.local.get).mockImplementation(
    () => Promise.resolve({ [storageKey]: entries }) as never,
  )
}

describe('createToolHistoryStore', () => {
  const toolId = 'svgoptimizer'
  const storageKey = getToolStateStorageKey(toolId, 'history')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads persisted entries', async () => {
    const stored: HistoryEntry<Snapshot>[] = [
      {
        id: 'entry-1',
        timestamp: 1,
        input: { value: 'a' },
        metadata: { name: 'first' },
      },
    ]
    primeStoredHistory(storageKey, stored)

    const store = createToolHistoryStore<Snapshot>(toolId, {
      key: 'history',
    })

    await expect(store.load()).resolves.toEqual(stored)
  })

  it('falls back to an empty history on malformed data', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({ [storageKey]: 'not-an-array' }) as never,
    )

    const store = createToolHistoryStore<Snapshot>(toolId)

    await expect(store.load()).resolves.toEqual([])
  })

  it('reuses a single load when called twice', async () => {
    primeStoredHistory(storageKey, [])
    const store = createToolHistoryStore<Snapshot>(toolId)

    const [first, second] = await Promise.all([store.load(), store.load()])
    expect(first).toBe(second)
    expect(chrome.storage.local.get).toHaveBeenCalledTimes(1)
  })

  it('appends snapshots, trims to max, and persists', async () => {
    primeStoredHistory(storageKey, [])
    const store = createToolHistoryStore<Snapshot>(toolId, { max: 2 })

    await store.load()
    const first = store.add({ value: 'a' })
    store.add({ value: 'b' }, { note: 'second' })
    const trimmed = store.add({ value: 'c' })

    expect(first).toMatchObject({ input: { value: 'a' } })
    expect(trimmed).toMatchObject({ input: { value: 'c' } })

    const persisted = vi.mocked(chrome.storage.local.set).mock.calls[
      vi.mocked(chrome.storage.local.set).mock.calls.length - 1
    ]?.[0] as Record<string, HistoryEntry<Snapshot>[]>
    expect(persisted[storageKey].map((entry) => entry.input.value)).toEqual([
      'b',
      'c',
    ])
    expect(persisted[storageKey][0].metadata).toEqual({ note: 'second' })
  })

  it('notifies subscribers on load and on add', async () => {
    primeStoredHistory(storageKey, [])
    const store = createToolHistoryStore<Snapshot>(toolId)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    await store.load()
    expect(listener).toHaveBeenCalledWith([])

    store.add({ value: 'a' })
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({ input: { value: 'a' } }),
    ])

    unsubscribe()
    store.add({ value: 'b' })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('removes a single entry and persists the rest', async () => {
    primeStoredHistory(storageKey, [
      { id: 'keep', timestamp: 1, input: { value: 'keep' } },
      { id: 'drop', timestamp: 2, input: { value: 'drop' } },
    ])
    const store = createToolHistoryStore<Snapshot>(toolId)
    await store.load()

    const remaining = store.remove('drop')

    expect(remaining.map((entry) => entry.input.value)).toEqual(['keep'])
    const persisted = vi.mocked(chrome.storage.local.set).mock.calls[
      vi.mocked(chrome.storage.local.set).mock.calls.length - 1
    ]?.[0] as Record<string, HistoryEntry<Snapshot>[]>
    expect(persisted[storageKey].map((entry) => entry.id)).toEqual(['keep'])
  })

  it('clears the storage key', async () => {
    primeStoredHistory(storageKey, [
      { id: 'one', timestamp: 1, input: { value: 'a' } },
    ])
    const store = createToolHistoryStore<Snapshot>(toolId)
    const listener = vi.fn()
    store.subscribe(listener)
    await store.load()

    await store.clear()

    expect(chrome.storage.local.remove).toHaveBeenCalledWith(storageKey)
    expect(listener).toHaveBeenLastCalledWith([])

    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    await expect(store.load()).resolves.toEqual([])
  })
})
