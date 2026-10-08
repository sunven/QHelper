import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLaunchDirectory } from '@/lib/tool-catalog'
import { installToolDataStorage } from '@/test/tool-data-storage'
import {
  favoriteTools,
  normalizeToolIds,
  RECENT_TOOLS_KEY,
  recordRecentTool,
  searchTools,
} from './tool-discovery'

describe('tool discovery', () => {
  let storage: ReturnType<typeof installToolDataStorage>
  beforeEach(() => {
    vi.clearAllMocks()
    storage = installToolDataStorage()
  })
  it('finds canonical tools using aliases and preserves directory order', () => {
    const entries = getLaunchDirectory('popup-main').entries
    expect(searchTools(entries, 'HTMLFORMAT').map((entry) => entry.id)).toEqual(
      ['formatter'],
    )
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
  it('records only the eight most recent unique tool IDs', async () => {
    for (const id of [
      'json',
      'convert',
      'urlparser',
      'timestamp',
      'cron',
      'markdown',
      'qrcode',
      'toml',
      'formatter',
      'json',
      'clear-cookie',
    ])
      await recordRecentTool(id)
    expect(storage.local[RECENT_TOOLS_KEY]).toEqual([
      'json',
      'formatter',
      'toml',
      'qrcode',
      'markdown',
      'cron',
      'timestamp',
      'urlparser',
    ])
  })
})
