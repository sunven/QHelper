/**
 * 站点数据清理的领域类型
 */

export type SiteDataType =
  | 'cookies'
  | 'localStorage'
  | 'sessionStorage'
  | 'indexedDB'
  | 'cacheStorage'
  | 'serviceWorkers'

export const SITE_DATA_TYPES: readonly SiteDataType[] = [
  'cookies',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'cacheStorage',
  'serviceWorkers',
]

export const SITE_DATA_TYPE_LABELS: Record<SiteDataType, string> = {
  cookies: 'Cookie',
  localStorage: 'localStorage',
  sessionStorage: 'sessionStorage',
  indexedDB: 'IndexedDB',
  cacheStorage: 'Cache Storage',
  serviceWorkers: 'Service Worker',
}

export const SITE_DATA_TYPE_DESCRIPTIONS: Record<SiteDataType, string> = {
  cookies: '登录态与站点偏好，包含父域共享的 Cookie',
  localStorage: '长期保存的本地键值数据',
  sessionStorage: '仅在所属标签页会话内有效的键值数据',
  indexedDB: '结构化离线数据库',
  cacheStorage: 'Service Worker 使用的 Cache Storage',
  serviceWorkers: '已注册的 Service Worker 及其缓存',
}

export type SiteTarget =
  | {
      mode: 'current-site'
      origin: string
      hostname: string
      tabId?: number
    }
  | {
      mode: 'all-sites'
    }

export type CurrentSiteTarget = Extract<SiteTarget, { mode: 'current-site' }>

/**
 * 各数据类型当前计数；null 表示该目标模式下无法统计
 */
export type SiteDataCountMap = Record<SiteDataType, number | null>

export type SiteDataClearStatus = 'success' | 'failed' | 'skipped'

export type SiteDataClearResult = {
  type: SiteDataType
  status: SiteDataClearStatus
  message?: string
}

export type ClearSiteDataOutcome = {
  results: SiteDataClearResult[]
  affectedTabIds: number[]
}
