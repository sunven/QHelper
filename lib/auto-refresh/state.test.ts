import type {
  AutoRefreshRuntimeSnapshot,
  RefreshRule,
  SessionRefresh,
} from '@/types/auto-refresh'
import { describe, expect, it } from 'vitest'
import { buildSnapshot, countActiveTabsByRule, resolveTabState } from './state'

const rule: RefreshRule = {
  id: 'rule-1',
  url: 'https://example.com/dashboard',
  intervalSeconds: 30,
  enabled: true,
  createdAt: 100,
  updatedAt: 100,
}

const session: SessionRefresh = {
  tabId: 1,
  url: rule.url,
  intervalSeconds: 10,
  startedAt: 1000,
}

function createRuntime(
  overrides: Partial<AutoRefreshRuntimeSnapshot> = {},
): AutoRefreshRuntimeSnapshot {
  return {
    masterEnabled: true,
    rules: [rule],
    sessions: {},
    pausedTabIds: [],
    ...overrides,
  }
}

function createTab(
  id: number,
  url: string,
  overrides: Partial<chrome.tabs.Tab> = {},
): chrome.tabs.Tab {
  return {
    id,
    url,
    status: 'complete',
    discarded: false,
    frozen: false,
    ...overrides,
  } as chrome.tabs.Tab
}

describe('auto-refresh/state', () => {
  it('lets an active session override a rule', () => {
    const state = resolveTabState(
      1,
      rule.url,
      createRuntime({ sessions: { 1: session } }),
    )

    expect(state.effective).toBe('session')
    expect(state.session).toEqual(session)
    expect(state.rule).toEqual(rule)
  })

  it('keeps rule and session visible while master is off', () => {
    const state = resolveTabState(
      1,
      rule.url,
      createRuntime({
        masterEnabled: false,
        sessions: { 1: session },
      }),
    )

    expect(state.effective).toBe('none')
    expect(state.rule).toEqual(rule)
    expect(state.session).toEqual(session)
  })

  it('lets a per-tab pause suspend both rule and session', () => {
    const state = resolveTabState(
      1,
      rule.url,
      createRuntime({
        sessions: { 1: session },
        pausedTabIds: [1],
      }),
    )

    expect(state.paused).toBe(true)
    expect(state.effective).toBe('none')
  })

  it('treats a session as dormant when the tab is on another page', () => {
    const state = resolveTabState(
      1,
      rule.url,
      createRuntime({
        sessions: { 1: { ...session, url: 'https://other.example/' } },
      }),
    )

    expect(state.session).toBeNull()
    expect(state.effective).toBe('rule')
  })

  it('reports unsupported pages', () => {
    const state = resolveTabState(1, 'chrome://extensions', createRuntime())

    expect(state.supported).toBe(false)
    expect(state.rule).toBeNull()
    expect(state.effective).toBe('none')
  })

  it('counts active tabs per rule but skips paused, discarded and frozen tabs', () => {
    const runtime = createRuntime({
      pausedTabIds: [3],
      sessions: { 6: { ...session, tabId: 6 } },
    })
    const tabs = [
      createTab(1, rule.url),
      createTab(2, rule.url, { status: 'loading' }),
      createTab(3, rule.url),
      createTab(4, rule.url, { discarded: true }),
      createTab(5, rule.url, { frozen: true }),
      createTab(6, rule.url),
      createTab(7, 'https://other.example/'),
    ]

    expect(countActiveTabsByRule(tabs, runtime)).toEqual({ 'rule-1': 2 })
  })

  it('sorts enabled rules first and attaches active tab counts', () => {
    const secondRule: RefreshRule = {
      ...rule,
      id: 'rule-2',
      url: 'https://example.com/logs',
      createdAt: 200,
    }
    const disabledRule: RefreshRule = {
      ...rule,
      id: 'rule-3',
      url: 'https://example.com/old',
      enabled: false,
      createdAt: 300,
    }
    const tabs = [createTab(1, rule.url), createTab(2, secondRule.url)]

    const snapshot = buildSnapshot(tabs, {
      masterEnabled: true,
      rules: [rule, disabledRule, secondRule],
      sessions: {},
      pausedTabIds: [],
    })

    expect(snapshot.rules.map((item) => item.id)).toEqual([
      'rule-2',
      'rule-1',
      'rule-3',
    ])
    expect(snapshot.rules[0].activeTabCount).toBe(1)
    expect(snapshot.rules[2].activeTabCount).toBe(0)
  })
})
