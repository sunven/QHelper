/**
 * 清理目标站点的解析与受影响标签页
 */

import { query as queryTabs } from '@/lib/chrome/tabs'
import type { CurrentSiteTarget, SiteTarget } from './types'

const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:'])

export function getSiteOrigin(url: string | null | undefined): string | null {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    return SUPPORTED_PROTOCOLS.has(parsed.protocol) ? parsed.origin : null
  } catch {
    return null
  }
}

export function getSiteHostname(origin: string): string | null {
  try {
    return new URL(origin).hostname || null
  } catch {
    return null
  }
}

/**
 * 从启动参数解析目标站点快照；参数缺失或不是 http(s) 网页时返回 null。
 */
export function parseLaunchTarget(search: string): CurrentSiteTarget | null {
  const params = new URLSearchParams(search)
  const origin = getSiteOrigin(params.get('origin'))
  if (!origin) {
    return null
  }

  const hostname = getSiteHostname(origin)
  if (!hostname) {
    return null
  }

  const rawTabId = params.get('tabId')
  const tabId =
    rawTabId && /^\d+$/.test(rawTabId) ? Number(rawTabId) : undefined

  return { mode: 'current-site', origin, hostname, tabId }
}

export async function getAffectedTabs(
  target: SiteTarget,
): Promise<chrome.tabs.Tab[]> {
  const tabs = await queryTabs({})

  return tabs.filter((tab) => {
    if (tab.id === undefined) {
      return false
    }

    const origin = getSiteOrigin(tab.url)
    if (!origin) {
      return false
    }

    return target.mode === 'all-sites' || origin === target.origin
  })
}
