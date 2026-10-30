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
    expect(searchTools(entries, 'json diff').map((entry) => entry.id)).toEqual([
      'json',
    ])
    expect(searchTools(entries, 'does not exist')).toEqual([])
    expect(searchTools(entries, '')).toEqual(entries)
  })
  it('normalizes favorite IDs and falls back locally when sync fails', async () => {
    expect(
      normalizeToolIds(['json', 'json', 'removed', 'clear-cookie']),
    ).toEqual(['json'])
    vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(
      new Error('offline'),
    )
    const result = await favoriteTools.set({ ids: ['json', 'convert'] })
    expect(result.storageArea).toBe('local')
    expect(await favoriteTools.get()).toEqual({ ids: ['json', 'convert'] })
  })

  it('excludes removed 数据格式 tools from search and existing favorites', () => {
    const removedIds = ['cron', 'csv2json', 'yaml', 'toml', 'jsonschema']
    const entries = getLaunchDirectory('popup-main').entries

    for (const id of removedIds) {
      expect(searchTools(entries, id)).toEqual([])
    }
    expect(normalizeToolIds(['json', ...removedIds, 'convert'])).toEqual([
      'json',
      'convert',
    ])
  })
})
