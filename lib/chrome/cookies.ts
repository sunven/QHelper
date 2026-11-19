/**
 * Chrome Cookies API 封装
 */

export type CookieRemovalDetails = {
  name: string
  url: string
  storeId?: string
  partitionKey?: chrome.cookies.CookiePartitionKey
}

export type CookieRemovalSummary = {
  removed: number
  failed: number
}

export async function getAll(
  details?: chrome.cookies.GetAllDetails | undefined,
): Promise<chrome.cookies.Cookie[]> {
  return chrome.cookies.getAll(details ?? {})
}

export async function remove(
  details: CookieRemovalDetails,
): Promise<chrome.cookies.CookieDetails | null> {
  return chrome.cookies.remove(details)
}

export function getCookieRemovalUrl(cookie: chrome.cookies.Cookie): string {
  const protocol = cookie.secure ? 'https' : 'http'
  const domain = cookie.domain.replace(/^\./, '')
  const path = cookie.path
    ? cookie.path.startsWith('/')
      ? cookie.path
      : `/${cookie.path}`
    : '/'

  return `${protocol}://${domain}${path}`
}

/**
 * Cookie 的 domain 匹配，与浏览器发送规则一致：
 * Host-only Cookie 仅匹配精确主机；带 Domain 属性的 Cookie 对对应子域可见。
 */
export function isCookieVisibleToHostname(
  cookie: chrome.cookies.Cookie,
  hostname: string,
): boolean {
  const domain = cookie.domain.replace(/^\./, '').toLowerCase()
  const host = hostname.toLowerCase()

  if (cookie.hostOnly) {
    return host === domain
  }

  return host === domain || host.endsWith(`.${domain}`)
}

export async function getCookiesForHostname(
  hostname: string,
): Promise<chrome.cookies.Cookie[]> {
  const cookies = await getAll()
  return cookies.filter((cookie) =>
    isCookieVisibleToHostname(cookie, hostname),
  )
}

export function toRemovalDetails(
  cookie: chrome.cookies.Cookie,
): CookieRemovalDetails {
  const details: CookieRemovalDetails = {
    name: cookie.name,
    url: getCookieRemovalUrl(cookie),
    storeId: cookie.storeId,
  }

  if (cookie.partitionKey?.topLevelSite) {
    details.partitionKey = {
      topLevelSite: cookie.partitionKey.topLevelSite,
    }
  }

  return details
}

export async function removeCookies(
  cookies: readonly chrome.cookies.Cookie[],
): Promise<CookieRemovalSummary> {
  const results = await Promise.allSettled(
    cookies.map((cookie) => remove(toRemovalDetails(cookie))),
  )
  const failed = results.filter(
    (result) => result.status === 'rejected',
  ).length

  return { removed: results.length - failed, failed }
}
