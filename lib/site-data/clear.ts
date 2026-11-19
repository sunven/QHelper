/**
 * 站点数据清理编排：Cookie / 浏览器存储 / sessionStorage 三条执行通道。
 */

import {
  ORIGIN_STORAGE_DATA_TYPES,
  removeAllStorage,
  removeStorageForOrigin,
  type OriginStorageDataType,
} from '@/lib/chrome/browsing-data'
import { getAll, getCookiesForHostname, removeCookies } from '@/lib/chrome/cookies'
import { executeScriptInTab } from '@/lib/chrome/scripting'
import { getErrorMessage } from '@/lib/utils'
import { clearPageSessionStorage } from './page-storage'
import { getAffectedTabs } from './target'
import {
  SITE_DATA_TYPES,
  type ClearSiteDataOutcome,
  type SiteDataClearResult,
  type SiteDataType,
  type SiteTarget,
} from './types'

function getTabIds(tabs: chrome.tabs.Tab[]): number[] {
  return tabs.flatMap((tab) => (tab.id === undefined ? [] : [tab.id]))
}

async function clearCookies(target: SiteTarget): Promise<SiteDataClearResult> {
  try {
    const cookies =
      target.mode === 'all-sites'
        ? await getAll()
        : await getCookiesForHostname(target.hostname)
    const summary = await removeCookies(cookies)

    if (summary.failed > 0) {
      return {
        type: 'cookies',
        status: 'failed',
        message: `${summary.failed} 条 Cookie 删除失败`,
      }
    }

    return {
      type: 'cookies',
      status: 'success',
      message: `已删除 ${summary.removed} 条 Cookie`,
    }
  } catch (error) {
    return {
      type: 'cookies',
      status: 'failed',
      message: getErrorMessage(error, '删除 Cookie 失败'),
    }
  }
}

async function clearStorageTypes(
  target: SiteTarget,
  types: readonly OriginStorageDataType[],
): Promise<SiteDataClearResult[]> {
  if (types.length === 0) {
    return []
  }

  try {
    if (target.mode === 'all-sites') {
      await removeAllStorage(types)
    } else {
      await removeStorageForOrigin(target.origin, types)
    }

    return types.map((type) => ({ type, status: 'success' }))
  } catch (error) {
    const message = getErrorMessage(error, '清理浏览器存储失败')
    return types.map((type) => ({ type, status: 'failed', message }))
  }
}

async function clearSessionStorage(
  tabs: chrome.tabs.Tab[],
): Promise<SiteDataClearResult> {
  const tabIds = getTabIds(tabs)
  if (tabIds.length === 0) {
    return {
      type: 'sessionStorage',
      status: 'skipped',
      message: '没有打开的标签页可供清理',
    }
  }

  let failed = 0
  for (const tabId of tabIds) {
    try {
      await executeScriptInTab(tabId, clearPageSessionStorage)
    } catch {
      failed += 1
    }
  }

  if (failed === tabIds.length) {
    return {
      type: 'sessionStorage',
      status: 'failed',
      message: '所有标签页都无法访问 sessionStorage',
    }
  }

  if (failed > 0) {
    return {
      type: 'sessionStorage',
      status: 'success',
      message: `已清理 ${tabIds.length - failed} 个标签页，${failed} 个无法访问`,
    }
  }

  return {
    type: 'sessionStorage',
    status: 'success',
    message: `已清理 ${tabIds.length} 个标签页`,
  }
}

export async function clearSiteData(
  target: SiteTarget,
  types: readonly SiteDataType[],
): Promise<ClearSiteDataOutcome> {
  const selected = new Set(types)
  const affectedTabs =
    selected.size > 0 ? await getAffectedTabs(target) : []
  const resultByType = new Map<SiteDataType, SiteDataClearResult>()

  if (selected.has('cookies')) {
    resultByType.set('cookies', await clearCookies(target))
  }

  const storageTypes = ORIGIN_STORAGE_DATA_TYPES.filter(
    (type): type is OriginStorageDataType => selected.has(type),
  )
  for (const result of await clearStorageTypes(target, storageTypes)) {
    resultByType.set(result.type, result)
  }

  if (selected.has('sessionStorage')) {
    resultByType.set(
      'sessionStorage',
      await clearSessionStorage(affectedTabs),
    )
  }

  const results: SiteDataClearResult[] = []
  for (const type of SITE_DATA_TYPES) {
    const result = resultByType.get(type)
    if (result) {
      results.push(result)
    }
  }

  return { results, affectedTabIds: getTabIds(affectedTabs) }
}
