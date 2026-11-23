import type { RefreshRule } from '@/types/auto-refresh'
import {
  AUTO_REFRESH_MASTER_STORAGE_KEY,
  AUTO_REFRESH_RULES_STORAGE_KEY,
} from '@/types/auto-refresh'
import { normalizeIntervalSeconds, normalizePageUrl } from './url'

function sanitizeRule(value: unknown): RefreshRule | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<RefreshRule>
  if (typeof candidate.id !== 'string' || !candidate.id) {
    return null
  }

  const url = normalizePageUrl(
    typeof candidate.url === 'string' ? candidate.url : null,
  )
  if (!url) {
    return null
  }

  const intervalSeconds =
    typeof candidate.intervalSeconds === 'number'
      ? normalizeIntervalSeconds('rule', candidate.intervalSeconds)
      : null
  if (!intervalSeconds) {
    return null
  }

  return {
    id: candidate.id,
    url,
    intervalSeconds,
    enabled: candidate.enabled !== false,
    createdAt:
      typeof candidate.createdAt === 'number' ? candidate.createdAt : 0,
    updatedAt:
      typeof candidate.updatedAt === 'number' ? candidate.updatedAt : 0,
  }
}

export function sanitizeRefreshRules(rawValue: unknown): RefreshRule[] {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const rules: RefreshRule[] = []
  const seenIds = new Set<string>()
  const seenUrls = new Set<string>()

  for (const item of rawValue) {
    const rule = sanitizeRule(item)
    if (!rule || seenIds.has(rule.id) || seenUrls.has(rule.url)) {
      continue
    }
    seenIds.add(rule.id)
    seenUrls.add(rule.url)
    rules.push(rule)
  }

  return rules
}

export async function getRefreshRules(): Promise<RefreshRule[]> {
  const result = await chrome.storage.local.get(AUTO_REFRESH_RULES_STORAGE_KEY)
  return sanitizeRefreshRules(result[AUTO_REFRESH_RULES_STORAGE_KEY])
}

export async function writeRefreshRules(
  rules: readonly RefreshRule[],
): Promise<void> {
  await chrome.storage.local.set({
    [AUTO_REFRESH_RULES_STORAGE_KEY]: rules,
  })
}

export async function getMasterEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(AUTO_REFRESH_MASTER_STORAGE_KEY)
  const value = result[AUTO_REFRESH_MASTER_STORAGE_KEY]
  return typeof value === 'boolean' ? value : true
}

export async function setMasterEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({
    [AUTO_REFRESH_MASTER_STORAGE_KEY]: enabled,
  })
}
