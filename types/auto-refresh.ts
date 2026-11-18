export type RefreshRule = {
  id: string
  url: string
  intervalSeconds: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export type SessionRefresh = {
  tabId: number
  url: string
  intervalSeconds: number
  startedAt: number
}

export type AutoRefreshRuntimeSnapshot = {
  masterEnabled: boolean
  rules: RefreshRule[]
  sessions: Record<number, SessionRefresh>
  pausedTabIds: number[]
}

export type AutoRefreshEffectiveMode = 'none' | 'rule' | 'session'

export type AutoRefreshTabState = {
  tabId: number
  url: string | null
  supported: boolean
  masterEnabled: boolean
  paused: boolean
  rule: RefreshRule | null
  session: SessionRefresh | null
  effective: AutoRefreshEffectiveMode
  nextRefreshAt?: number
}

export type AutoRefreshRuleView = RefreshRule & {
  activeTabCount: number
}

export type AutoRefreshSnapshot = {
  masterEnabled: boolean
  rules: AutoRefreshRuleView[]
}

export type AutoRefreshResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type AutoRefreshSaveRuleResult = {
  created: boolean
  rule: RefreshRule
  snapshot: AutoRefreshSnapshot
}

export type AutoRefreshMessage =
  | { type: 'AUTO_REFRESH_GET_TAB_STATE'; tabId: number }
  | { type: 'AUTO_REFRESH_GET_SNAPSHOT' }
  | { type: 'AUTO_REFRESH_SET_MASTER'; enabled: boolean }
  | {
      type: 'AUTO_REFRESH_SAVE_RULE'
      id?: string
      url: string
      intervalSeconds: number
      enabled?: boolean
    }
  | { type: 'AUTO_REFRESH_DELETE_RULE'; id: string }
  | { type: 'AUTO_REFRESH_SET_RULE_ENABLED'; id: string; enabled: boolean }
  | {
      type: 'AUTO_REFRESH_START_SESSION'
      tabId: number
      intervalSeconds: number
    }
  | { type: 'AUTO_REFRESH_STOP_SESSION'; tabId: number }
  | { type: 'AUTO_REFRESH_PAUSE_TAB'; tabId: number }
  | { type: 'AUTO_REFRESH_RESUME_TAB'; tabId: number }
  | { type: 'AUTO_REFRESH_OPEN_MANAGER'; url?: string }
  | { type: 'AUTO_REFRESH_CONTENT_READY' }
  | { type: 'AUTO_REFRESH_SESSION_TICK' }
  | { type: 'AUTO_REFRESH_PAUSE_SELF' }
  | { type: 'AUTO_REFRESH_OPEN_MANAGER_SELF' }
  | { type: 'AUTO_REFRESH_PING' }
  | {
      type: 'AUTO_REFRESH_STATE_CHANGED'
      state: AutoRefreshTabState
    }

export const AUTO_REFRESH_RULES_STORAGE_KEY = 'qhelper.autoRefresh.rules.v1'
export const AUTO_REFRESH_MASTER_STORAGE_KEY =
  'qhelper.autoRefresh.masterEnabled'
export const AUTO_REFRESH_SESSIONS_STORAGE_KEY =
  'qhelper.autoRefresh.sessions.v1'
export const AUTO_REFRESH_PAUSED_STORAGE_KEY =
  'qhelper.autoRefresh.pausedTabs.v1'
export const AUTO_REFRESH_ALARM_PREFIX = 'qhelper.autoRefresh.rule:'

export const AUTO_REFRESH_RULE_MIN_SECONDS = 30
export const AUTO_REFRESH_SESSION_MIN_SECONDS = 5
export const AUTO_REFRESH_MAX_SECONDS = 24 * 60 * 60
export const AUTO_REFRESH_DEFAULT_RULE_SECONDS = 60
export const AUTO_REFRESH_DEFAULT_SESSION_SECONDS = 10

export const AUTO_REFRESH_RULE_PRESETS = [30, 60, 300, 600, 1800, 3600] as const
export const AUTO_REFRESH_SESSION_PRESETS = [5, 10, 15, 30, 60, 300] as const
