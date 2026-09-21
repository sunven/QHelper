import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getToolStateStorageKey } from '@/lib/chrome/local-persisted-data'
import type { HistoryEntry } from '@/lib/tool-history-store'
import {
  formatterHistoryMigratedKey,
  formatterHistoryStorageKey,
  migrateLegacyFormatterHistory,
  snapshotFromLegacyEntry,
} from './history'

function mockStorage(data: Record<string, unknown>) {
  const store = { ...data }
  vi.mocked(chrome.storage.local.get).mockImplementation((key) => {
    const storageKey = typeof key === 'string' ? key : ''
    return Promise.resolve({ [storageKey]: store[storageKey] }) as never
  })
  vi.mocked(chrome.storage.local.set).mockImplementation((items) => {
    Object.assign(store, items)
    return Promise.resolve()
  })
  vi.mocked(chrome.storage.local.remove).mockImplementation((key) => {
    const keys = Array.isArray(key) ? key : [key]
    for (const storageKey of keys) {
      delete store[storageKey as string]
    }
    return Promise.resolve()
  })
  return store
}

describe('snapshotFromLegacyEntry', () => {
  it('tags a transform-tool snapshot with the Formatter Language', () => {
    const entry: HistoryEntry<unknown> = {
      id: 'html-1',
      timestamp: 10,
      input: {
        input: '<div/>',
        options: {
          mode: 'minify',
          indentSize: 4,
          indentChar: 'tab',
          wrapLineLength: 80,
        },
      },
    }

    expect(snapshotFromLegacyEntry('html', entry)).toEqual({
      id: 'html-1',
      timestamp: 10,
      metadata: undefined,
      input: {
        input: '<div/>',
        language: 'html',
        mode: 'minify',
        htmlOptions: {
          indentSize: 4,
          indentChar: 'tab',
          wrapLineLength: 80,
        },
      },
    })
  })

  it('returns null when the legacy payload has no input string', () => {
    expect(
      snapshotFromLegacyEntry('xml', {
        id: 'bad',
        timestamp: 1,
        input: { options: { mode: 'beautify' } },
      }),
    ).toBeNull()
  })
})

describe('migrateLegacyFormatterHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips when the migrated flag is already set', async () => {
    mockStorage({ [formatterHistoryMigratedKey]: true })

    await expect(migrateLegacyFormatterHistory()).resolves.toBeNull()
    expect(chrome.storage.local.set).not.toHaveBeenCalled()
  })

  it('merges the three legacy stores, newest last, and removes the old keys', async () => {
    const htmlKey = getToolStateStorageKey('htmlformat', 'htmlformat-state')
    const xmlKey = getToolStateStorageKey('xmlformatter', 'xmlformatter-state')
    const cssKey = getToolStateStorageKey('csstool', 'csstool-state')

    const store = mockStorage({
      [htmlKey]: [
        {
          id: 'html-old',
          timestamp: 1,
          input: { input: '<div/>', options: { mode: 'beautify' } },
        },
      ],
      [xmlKey]: [
        {
          id: 'xml-new',
          timestamp: 3,
          input: { input: '<root/>', options: { mode: 'minify' } },
        },
      ],
      [cssKey]: [
        {
          id: 'css-mid',
          timestamp: 2,
          input: { input: '.a{}', options: { mode: 'beautify' } },
        },
      ],
    })

    const merged = await migrateLegacyFormatterHistory()

    expect(merged?.map((entry) => entry.id)).toEqual([
      'html-old',
      'css-mid',
      'xml-new',
    ])
    expect(merged?.[2]?.input.language).toBe('xml')
    expect(store[formatterHistoryMigratedKey]).toBe(true)
    expect(store[formatterHistoryStorageKey]).toEqual(merged)
    expect(store[htmlKey]).toBeUndefined()
    expect(store[xmlKey]).toBeUndefined()
    expect(store[cssKey]).toBeUndefined()
  })
})
