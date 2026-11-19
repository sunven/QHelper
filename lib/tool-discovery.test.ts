import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLaunchDirectory } from '@/lib/tool-catalog'
import { installToolDataStorage } from '@/test/tool-data-storage'
import { favoriteTools, normalizeToolIds, searchTools } from './tool-discovery'

describe('tool discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installToolDataStorage()
  })
  it('finds canonical tools using aliases and preserves directory order', () => {
    const entries = getLaunchDirectory('popup-main').entries
    expect(searchTools(entries, 'HTMLFORMAT')).toEqual([])
    expect(searchTools(entries, 'binary').map((entry) => entry.id)).toEqual([
      'trans-radix',
    ])
    expect(searchTools(entries, 'does not exist')).toEqual([])
    expect(searchTools(entries, '')).toEqual(entries)
  })
  it('normalizes favorite IDs and falls back locally when sync fails', async () => {
    expect(
      normalizeToolIds(['trans-radix', 'trans-radix', 'removed', 'clear-cookie']),
    ).toEqual(['trans-radix'])
    vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(
      new Error('offline'),
    )
    const result = await favoriteTools.set({ ids: ['trans-radix', 'uuid'] })
    expect(result.storageArea).toBe('local')
    expect(await favoriteTools.get()).toEqual({ ids: ['trans-radix', 'uuid'] })
  })

  it('excludes removed 数据格式 tools from search and existing favorites', () => {
    const removedIds = ['cron', 'csv2json', 'yaml', 'toml', 'jsonschema']
    const entries = getLaunchDirectory('popup-main').entries

    for (const id of removedIds) {
      expect(searchTools(entries, id)).toEqual([])
    }
    expect(normalizeToolIds(['trans-radix', ...removedIds, 'uuid'])).toEqual([
      'trans-radix',
      'uuid',
    ])
  })
})
