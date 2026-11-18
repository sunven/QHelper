import {
  AUTO_REFRESH_PAUSED_STORAGE_KEY,
  AUTO_REFRESH_SESSIONS_STORAGE_KEY,
} from '@/types/auto-refresh'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getPausedTabIds,
  getSessionRefreshes,
  removeTabRuntimeState,
  sanitizePausedTabIds,
  sanitizeSessionRefreshes,
} from './runtime'

const sessionGet = chrome.storage.session.get as unknown as ReturnType<
  typeof vi.fn
>
const sessionSet = chrome.storage.session.set as unknown as ReturnType<
  typeof vi.fn
>

describe('auto-refresh/runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionGet.mockResolvedValue({})
    sessionSet.mockResolvedValue(undefined)
  })

  it('sanitizes session refreshes and restores the tab id', () => {
    const sessions = sanitizeSessionRefreshes({
      12: {
        url: 'https://example.com/a#hash',
        intervalSeconds: 10,
        startedAt: 1000,
      },
      13: {
        url: 'chrome://extensions',
        intervalSeconds: 10,
        startedAt: 1000,
      },
      14: {
        url: 'https://example.com/b',
        intervalSeconds: 4,
        startedAt: 1000,
      },
    })

    expect(sessions).toEqual({
      12: {
        tabId: 12,
        url: 'https://example.com/a',
        intervalSeconds: 10,
        startedAt: 1000,
      },
    })
  })

  it('deduplicates paused tab ids', () => {
    expect(sanitizePausedTabIds([1, 1, 2, -1, 3.5, '4'])).toEqual([1, 2])
  })

  it('reads sessions and paused tabs from session storage', async () => {
    sessionGet.mockResolvedValue({
      [AUTO_REFRESH_SESSIONS_STORAGE_KEY]: {
        1: {
          url: 'https://example.com/',
          intervalSeconds: 10,
          startedAt: 1,
        },
      },
      [AUTO_REFRESH_PAUSED_STORAGE_KEY]: [2],
    })

    await expect(getSessionRefreshes()).resolves.toMatchObject({
      1: { tabId: 1, intervalSeconds: 10 },
    })
    await expect(getPausedTabIds()).resolves.toEqual([2])
  })

  it('removes both session and pause state for a closed tab', async () => {
    sessionGet
      .mockResolvedValueOnce({
        [AUTO_REFRESH_SESSIONS_STORAGE_KEY]: {
          1: {
            url: 'https://example.com/',
            intervalSeconds: 10,
            startedAt: 1,
          },
          2: {
            url: 'https://example.com/',
            intervalSeconds: 10,
            startedAt: 1,
          },
        },
      })
      .mockResolvedValueOnce({
        [AUTO_REFRESH_PAUSED_STORAGE_KEY]: [1, 2],
      })

    await removeTabRuntimeState(1)

    expect(sessionSet).toHaveBeenCalledWith({
      [AUTO_REFRESH_SESSIONS_STORAGE_KEY]: {
        2: expect.objectContaining({ tabId: 2 }),
      },
    })
    expect(sessionSet).toHaveBeenCalledWith({
      [AUTO_REFRESH_PAUSED_STORAGE_KEY]: [2],
    })
  })
})
