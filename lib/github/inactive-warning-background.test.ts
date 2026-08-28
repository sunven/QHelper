import { describe, expect, it, vi } from 'vitest'
import {
  INACTIVE_WARNING_MESSAGE,
  handleInactiveWarningMessage,
  isInactiveWarningMessage,
  type InactiveWarningCacheEntry,
} from './inactive-warning-background'

const NOW = new Date('2026-08-27T00:00:00Z')
const NOW_MS = NOW.getTime()
const DAY_MS = 24 * 60 * 60 * 1000
const INACTIVE_COMMIT_DATE = '2026-01-01T00:00:00Z'
const ACTIVE_COMMIT_DATE = '2026-08-01T00:00:00Z'
const REPO = { owner: 'ultraworkers', repo: 'claw-code' }
const CACHE_KEY = 'github_inactive_warning_ultraworkers/claw-code'

interface FetchPlan {
  meta?: { archived?: boolean }
  commits?: Array<{ commit?: { committer?: { date?: string } } }>
}

function createDeps(plan: FetchPlan = {}) {
  const fetchJson = vi.fn(async (url: string) => {
    if (url.endsWith('/commits?per_page=1')) {
      return (
        plan.commits ?? [
          { commit: { committer: { date: INACTIVE_COMMIT_DATE } } },
        ]
      )
    }
    return plan.meta ?? { archived: false }
  })
  const storageGet = vi.fn(async (): Promise<unknown> => undefined)
  const storageSet = vi.fn(async () => undefined)

  return {
    deps: {
      fetchJson,
      storageGet,
      storageSet,
      now: () => NOW,
    },
    fetchJson,
    storageGet,
    storageSet,
  }
}

describe('isInactiveWarningMessage', () => {
  it('accepts valid inactive warning messages', () => {
    expect(
      isInactiveWarningMessage({ type: INACTIVE_WARNING_MESSAGE, repo: REPO }),
    ).toBe(true)
  })

  it('rejects unrelated or malformed messages', () => {
    expect(isInactiveWarningMessage({ type: 'OTHER' })).toBe(false)
    expect(
      isInactiveWarningMessage({
        type: INACTIVE_WARNING_MESSAGE,
        repo: { owner: 'a' },
      }),
    ).toBe(false)
    expect(isInactiveWarningMessage(null)).toBe(false)
  })
})

describe('handleInactiveWarningMessage', () => {
  it('ignores unrelated messages', () => {
    const sendResponse = vi.fn()

    expect(handleInactiveWarningMessage({ type: 'OTHER' }, sendResponse)).toBe(
      false,
    )
    expect(sendResponse).not.toHaveBeenCalled()
  })

  it('reports an inactive repository with its last commit date', async () => {
    const sendResponse = vi.fn()
    const { deps, fetchJson, storageSet } = createDeps()

    expect(
      handleInactiveWarningMessage(
        { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
        sendResponse,
        deps,
      ),
    ).toBe(true)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        inactive: true,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      })
    })
    expect(fetchJson).toHaveBeenCalledWith(
      'https://api.github.com/repos/ultraworkers/claw-code',
    )
    expect(fetchJson).toHaveBeenCalledWith(
      'https://api.github.com/repos/ultraworkers/claw-code/commits?per_page=1',
    )
    expect(storageSet).toHaveBeenCalledWith(CACHE_KEY, {
      archived: false,
      lastCommitDate: INACTIVE_COMMIT_DATE,
      fetchedAt: NOW_MS,
    })
  })

  it('reports an active repository without a warning', async () => {
    const sendResponse = vi.fn()
    const { deps } = createDeps({
      commits: [{ commit: { committer: { date: ACTIVE_COMMIT_DATE } } }],
    })

    handleInactiveWarningMessage(
      { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
      sendResponse,
      deps,
    )

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        inactive: false,
        lastCommitDate: ACTIVE_COMMIT_DATE,
      })
    })
  })

  it('short-circuits archived repositories without fetching commits', async () => {
    const sendResponse = vi.fn()
    const { deps, fetchJson, storageSet } = createDeps({
      meta: { archived: true },
    })

    handleInactiveWarningMessage(
      { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
      sendResponse,
      deps,
    )

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, inactive: false })
    })
    expect(fetchJson).toHaveBeenCalledTimes(1)
    expect(storageSet).toHaveBeenCalledWith(CACHE_KEY, {
      archived: true,
      lastCommitDate: null,
      fetchedAt: NOW_MS,
    })
  })

  it('treats empty commit lists as active', async () => {
    const sendResponse = vi.fn()
    const { deps, storageSet } = createDeps({ commits: [] })

    handleInactiveWarningMessage(
      { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
      sendResponse,
      deps,
    )

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, inactive: false })
    })
    expect(storageSet).toHaveBeenCalledWith(CACHE_KEY, {
      archived: false,
      lastCommitDate: null,
      fetchedAt: NOW_MS,
    })
  })

  it('returns a fresh cached verdict without fetching', async () => {
    const sendResponse = vi.fn()
    const { deps, fetchJson, storageSet } = createDeps()
    deps.storageGet = vi.fn(async () =>
      Promise.resolve({
        archived: false,
        lastCommitDate: INACTIVE_COMMIT_DATE,
        fetchedAt: NOW_MS - DAY_MS,
      } satisfies InactiveWarningCacheEntry),
    )
    deps.fetchJson = fetchJson

    handleInactiveWarningMessage(
      { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
      sendResponse,
      deps,
    )

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        inactive: true,
        lastCommitDate: INACTIVE_COMMIT_DATE,
      })
    })
    expect(fetchJson).not.toHaveBeenCalled()
    expect(storageSet).not.toHaveBeenCalled()
  })

  it('refetches when the cache entry is stale', async () => {
    const sendResponse = vi.fn()
    const { deps, fetchJson } = createDeps()
    deps.storageGet = vi.fn(async () =>
      Promise.resolve({
        archived: false,
        lastCommitDate: INACTIVE_COMMIT_DATE,
        fetchedAt: NOW_MS - 8 * DAY_MS,
      } satisfies InactiveWarningCacheEntry),
    )
    deps.fetchJson = fetchJson

    handleInactiveWarningMessage(
      { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
      sendResponse,
      deps,
    )

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled()
    })
    expect(fetchJson).toHaveBeenCalledTimes(2)
  })

  it('returns an error response when the API fails', async () => {
    const sendResponse = vi.fn()
    const deps = {
      fetchJson: vi.fn(async () => {
        throw new Error('network failed')
      }),
      storageGet: vi.fn(async () => undefined),
      storageSet: vi.fn(async () => undefined),
      now: () => NOW,
    }

    handleInactiveWarningMessage(
      { type: INACTIVE_WARNING_MESSAGE, repo: REPO },
      sendResponse,
      deps,
    )

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        error: 'network failed',
      })
    })
    expect(deps.storageSet).not.toHaveBeenCalled()
  })
})
