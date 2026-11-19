/**
 * 站点数据计数：Cookie 走 Cookies API，其余类型通过页面注入读取。
 */

import { getAll, getCookiesForHostname } from '@/lib/chrome/cookies'
import { executeScriptInTab } from '@/lib/chrome/scripting'
import {
  collectPageStorageSnapshot,
  type PageStorageSnapshot,
} from './page-storage'
import { getAffectedTabs } from './target'
import type { SiteDataCountMap, SiteTarget } from './types'

function prioritizeSourceTab(
  target: SiteTarget,
  tabs: chrome.tabs.Tab[],
): chrome.tabs.Tab[] {
  if (target.mode !== 'current-site' || target.tabId === undefined) {
    return tabs
  }

  return [...tabs].sort(
    (a, b) => Number(b.id === target.tabId) - Number(a.id === target.tabId),
  )
}

export async function collectSiteDataCounts(
  target: SiteTarget,
): Promise<SiteDataCountMap> {
  const cookies =
    target.mode === 'all-sites'
      ? await getAll()
      : await getCookiesForHostname(target.hostname)

  if (target.mode === 'all-sites') {
    return {
      cookies: cookies.length,
      localStorage: null,
      sessionStorage: null,
      indexedDB: null,
      cacheStorage: null,
      serviceWorkers: null,
    }
  }

  let sharedSnapshot: PageStorageSnapshot | null = null
  let sessionStorageKeys: number | null = null

  const tabs = prioritizeSourceTab(target, await getAffectedTabs(target))
  for (const tab of tabs) {
    if (tab.id === undefined) {
      continue
    }

    try {
      const snapshot = await executeScriptInTab(
        tab.id,
        collectPageStorageSnapshot,
      )
      if (!snapshot) {
        continue
      }

      sharedSnapshot = sharedSnapshot ?? snapshot
      sessionStorageKeys =
        (sessionStorageKeys ?? 0) + snapshot.sessionStorageKeys
    } catch {
      // 单标签页注入失败不影响其他标签页的统计
    }
  }

  return {
    cookies: cookies.length,
    localStorage: sharedSnapshot?.localStorageKeys ?? null,
    sessionStorage: sessionStorageKeys,
    indexedDB: sharedSnapshot?.indexedDBNames.length ?? null,
    cacheStorage: sharedSnapshot?.cacheNames.length ?? null,
    serviceWorkers: sharedSnapshot?.serviceWorkerRegistrations ?? null,
  }
}
