import type {
  AutoRefreshRuntimeSnapshot,
  AutoRefreshSnapshot,
  AutoRefreshTabState,
} from '@/types/auto-refresh'
import { getMasterEnabled, getRefreshRules } from './rules'
import { getPausedTabIds, getSessionRefreshes } from './runtime'
import { normalizePageUrl } from './url'

export async function loadRuntimeSnapshot(): Promise<AutoRefreshRuntimeSnapshot> {
  const [masterEnabled, rules, sessions, pausedTabIds] = await Promise.all([
    getMasterEnabled(),
    getRefreshRules(),
    getSessionRefreshes(),
    getPausedTabIds(),
  ])

  return {
    masterEnabled,
    rules,
    sessions,
    pausedTabIds,
  }
}

export function resolveTabState(
  tabId: number,
  rawUrl: string | null | undefined,
  snapshot: AutoRefreshRuntimeSnapshot,
): AutoRefreshTabState {
  const url = normalizePageUrl(rawUrl)
  const supported = url !== null
  const paused = snapshot.pausedTabIds.includes(tabId)
  const rule =
    url === null
      ? null
      : (snapshot.rules.find(
          (candidate) => candidate.enabled && candidate.url === url,
        ) ?? null)
  const storedSession = snapshot.sessions[tabId]
  const session =
    storedSession && url !== null && storedSession.url === url
      ? storedSession
      : null

  let effective: AutoRefreshTabState['effective'] = 'none'
  if (snapshot.masterEnabled && !paused && supported) {
    if (session) {
      effective = 'session'
    } else if (rule) {
      effective = 'rule'
    }
  }

  return {
    tabId,
    url,
    supported,
    masterEnabled: snapshot.masterEnabled,
    paused,
    rule,
    session,
    effective,
  }
}

export function isRefreshTargetTab(tab: chrome.tabs.Tab): boolean {
  if (typeof tab.id !== 'number' || tab.discarded || tab.frozen) {
    return false
  }

  return normalizePageUrl(tab.url) !== null
}

export function canRefreshTab(tab: chrome.tabs.Tab): boolean {
  return isRefreshTargetTab(tab) && tab.status !== 'loading'
}

export function countActiveTabsByRule(
  tabs: readonly chrome.tabs.Tab[],
  snapshot: AutoRefreshRuntimeSnapshot,
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const tab of tabs) {
    if (typeof tab.id !== 'number' || !isRefreshTargetTab(tab)) {
      continue
    }

    const state = resolveTabState(tab.id, tab.url, snapshot)
    if (state.effective === 'rule' && state.rule) {
      counts[state.rule.id] = (counts[state.rule.id] ?? 0) + 1
    }
  }

  return counts
}

export function buildSnapshot(
  tabs: readonly chrome.tabs.Tab[],
  runtime: AutoRefreshRuntimeSnapshot,
): AutoRefreshSnapshot {
  const counts = countActiveTabsByRule(tabs, runtime)

  return {
    masterEnabled: runtime.masterEnabled,
    rules: [...runtime.rules]
      .sort(
        (left, right) =>
          Number(right.enabled) - Number(left.enabled) ||
          right.createdAt - left.createdAt,
      )
      .map((rule) => ({
        ...rule,
        activeTabCount: counts[rule.id] ?? 0,
      })),
  }
}
