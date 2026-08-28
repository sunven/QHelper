import { get, set } from '@/lib/chrome/storage'
import type { RepoCoordinates } from './repository'
import {
  buildDefaultBranchCommitsUrl,
  buildRepositoryMetaUrl,
  isInactiveRepository,
} from './inactive-warning'

export const INACTIVE_WARNING_MESSAGE = 'QHELPER_INACTIVE_WARNING'

const CACHE_KEY_PREFIX = 'github_inactive_warning_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface InactiveWarningMessage {
  type: typeof INACTIVE_WARNING_MESSAGE
  repo: RepoCoordinates
}

export interface InactiveWarningResponse {
  ok: boolean
  inactive?: boolean
  lastCommitDate?: string
  error?: string
}

export interface InactiveWarningCacheEntry {
  archived: boolean
  lastCommitDate: string | null
  fetchedAt: number
}

export type InactiveWarningBackgroundDeps = {
  fetchJson: (url: string) => Promise<unknown>
  storageGet: (key: string) => Promise<unknown>
  storageSet: (key: string, value: InactiveWarningCacheEntry) => Promise<void>
  now: () => Date
}

const defaultDeps: InactiveWarningBackgroundDeps = {
  fetchJson: async (url: string) => {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }
    return response.json()
  },
  storageGet: (key: string) => get(key),
  storageSet: (key: string, value: InactiveWarningCacheEntry) =>
    set(key, value),
  now: () => new Date(),
}

function isRepoCoordinates(value: unknown): value is RepoCoordinates {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RepoCoordinates).owner === 'string' &&
    typeof (value as RepoCoordinates).repo === 'string'
  )
}

export function isInactiveWarningMessage(
  message: unknown,
): message is InactiveWarningMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as InactiveWarningMessage).type === INACTIVE_WARNING_MESSAGE &&
    isRepoCoordinates((message as InactiveWarningMessage).repo)
  )
}

function buildCacheKey({ owner, repo }: RepoCoordinates): string {
  return `${CACHE_KEY_PREFIX}${owner}/${repo}`
}

function isCacheEntry(value: unknown): value is InactiveWarningCacheEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as InactiveWarningCacheEntry).archived === 'boolean' &&
    ((value as InactiveWarningCacheEntry).lastCommitDate === null ||
      typeof (value as InactiveWarningCacheEntry).lastCommitDate ===
        'string') &&
    typeof (value as InactiveWarningCacheEntry).fetchedAt === 'number'
  )
}

async function readCache(
  repo: RepoCoordinates,
  deps: InactiveWarningBackgroundDeps,
): Promise<InactiveWarningCacheEntry | null> {
  try {
    const value = await deps.storageGet(buildCacheKey(repo))
    if (
      !isCacheEntry(value) ||
      deps.now().getTime() - value.fetchedAt >= CACHE_TTL_MS
    ) {
      return null
    }
    return value
  } catch {
    return null
  }
}

async function writeCache(
  repo: RepoCoordinates,
  entry: InactiveWarningCacheEntry,
  deps: InactiveWarningBackgroundDeps,
): Promise<void> {
  try {
    await deps.storageSet(buildCacheKey(repo), entry)
  } catch {
    // Cache write failures must not fail the activity verdict.
  }
}

function responseFromEntry(
  entry: InactiveWarningCacheEntry,
  now: Date,
): InactiveWarningResponse {
  if (entry.archived || entry.lastCommitDate === null) {
    return { ok: true, inactive: false }
  }

  return {
    ok: true,
    inactive: isInactiveRepository(new Date(entry.lastCommitDate), now),
    lastCommitDate: entry.lastCommitDate,
  }
}

function extractCommitterDate(commits: unknown): string | null {
  if (!Array.isArray(commits) || commits.length === 0) {
    return null
  }

  const date = (commits[0] as { commit?: { committer?: { date?: unknown } } })
    ?.commit?.committer?.date
  return typeof date === 'string' ? date : null
}

async function resolveInactiveWarning(
  repo: RepoCoordinates,
  deps: InactiveWarningBackgroundDeps,
): Promise<InactiveWarningResponse> {
  const cached = await readCache(repo, deps)
  if (cached) {
    return responseFromEntry(cached, deps.now())
  }

  const meta = await deps.fetchJson(buildRepositoryMetaUrl(repo))
  const archived =
    typeof meta === 'object' &&
    meta !== null &&
    (meta as { archived?: unknown }).archived === true
  const fetchedAt = deps.now().getTime()

  if (archived) {
    await writeCache(
      repo,
      { archived: true, lastCommitDate: null, fetchedAt },
      deps,
    )
    return { ok: true, inactive: false }
  }

  const commits = await deps.fetchJson(buildDefaultBranchCommitsUrl(repo))
  const lastCommitDate = extractCommitterDate(commits)

  if (
    lastCommitDate === null ||
    Number.isNaN(new Date(lastCommitDate).getTime())
  ) {
    await writeCache(
      repo,
      { archived: false, lastCommitDate: null, fetchedAt },
      deps,
    )
    return { ok: true, inactive: false }
  }

  await writeCache(repo, { archived: false, lastCommitDate, fetchedAt }, deps)
  return {
    ok: true,
    inactive: isInactiveRepository(new Date(lastCommitDate), deps.now()),
    lastCommitDate,
  }
}

export function handleInactiveWarningMessage(
  message: unknown,
  sendResponse: (value: InactiveWarningResponse) => void,
  deps: InactiveWarningBackgroundDeps = defaultDeps,
): boolean {
  if (!isInactiveWarningMessage(message)) {
    return false
  }

  void resolveInactiveWarning(message.repo, deps)
    .then((response) => {
      sendResponse(response)
    })
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check repository activity',
      })
    })

  return true
}
