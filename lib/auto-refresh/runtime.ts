import type { SessionRefresh } from '@/types/auto-refresh'
import {
  AUTO_REFRESH_PAUSED_STORAGE_KEY,
  AUTO_REFRESH_SESSIONS_STORAGE_KEY,
} from '@/types/auto-refresh'
import { normalizeIntervalSeconds, normalizePageUrl } from './url'

export function sanitizeSessionRefreshes(
  rawValue: unknown,
): Record<number, SessionRefresh> {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {}
  }

  const sessions: Record<number, SessionRefresh> = {}

  for (const [key, value] of Object.entries(rawValue)) {
    const tabId = Number(key)
    if (
      !Number.isInteger(tabId) ||
      tabId < 0 ||
      !value ||
      typeof value !== 'object'
    ) {
      continue
    }

    const candidate = value as Partial<SessionRefresh>
    const url = normalizePageUrl(
      typeof candidate.url === 'string' ? candidate.url : null,
    )
    const intervalSeconds =
      typeof candidate.intervalSeconds === 'number'
        ? normalizeIntervalSeconds('session', candidate.intervalSeconds)
        : null

    if (!url || !intervalSeconds) {
      continue
    }

    sessions[tabId] = {
      tabId,
      url,
      intervalSeconds,
      startedAt:
        typeof candidate.startedAt === 'number' ? candidate.startedAt : 0,
    }
  }

  return sessions
}

export async function getSessionRefreshes(): Promise<
  Record<number, SessionRefresh>
> {
  const result = await chrome.storage.session.get(
    AUTO_REFRESH_SESSIONS_STORAGE_KEY,
  )
  return sanitizeSessionRefreshes(result[AUTO_REFRESH_SESSIONS_STORAGE_KEY])
}

export async function writeSessionRefreshes(
  sessions: Record<number, SessionRefresh>,
): Promise<void> {
  await chrome.storage.session.set({
    [AUTO_REFRESH_SESSIONS_STORAGE_KEY]: sessions,
  })
}

export function sanitizePausedTabIds(rawValue: unknown): number[] {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const tabIds = new Set<number>()
  for (const value of rawValue) {
    if (Number.isInteger(value) && value >= 0) {
      tabIds.add(value)
    }
  }

  return [...tabIds]
}

export async function getPausedTabIds(): Promise<number[]> {
  const result = await chrome.storage.session.get(
    AUTO_REFRESH_PAUSED_STORAGE_KEY,
  )
  return sanitizePausedTabIds(result[AUTO_REFRESH_PAUSED_STORAGE_KEY])
}

export async function writePausedTabIds(
  tabIds: readonly number[],
): Promise<void> {
  await chrome.storage.session.set({
    [AUTO_REFRESH_PAUSED_STORAGE_KEY]: [...new Set(tabIds)],
  })
}

export async function removeTabRuntimeState(tabId: number): Promise<void> {
  const [sessions, pausedTabIds] = await Promise.all([
    getSessionRefreshes(),
    getPausedTabIds(),
  ])

  const nextSessions = { ...sessions }
  const nextPausedTabIds = pausedTabIds.filter((id) => id !== tabId)
  const hadSession = tabId in nextSessions

  if (hadSession) {
    delete nextSessions[tabId]
  }

  const writes: Promise<void>[] = []
  if (hadSession) {
    writes.push(writeSessionRefreshes(nextSessions))
  }
  if (nextPausedTabIds.length !== pausedTabIds.length) {
    writes.push(writePausedTabIds(nextPausedTabIds))
  }

  await Promise.all(writes)
}
