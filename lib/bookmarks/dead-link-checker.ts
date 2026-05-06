export type BookmarkLinkCheckStatus =
  | 'unchecked'
  | 'pending'
  | 'ok'
  | 'broken'
  | 'blocked'
  | 'skipped'
  | 'error'

export type BookmarkLinkTarget = {
  id: string
  title?: unknown
  url?: unknown
  children?: BookmarkLinkTarget[]
}

export type BookmarkUrlTarget = {
  id: string
  title: string
  url: string
}

export type BookmarkLinkCheckResult = {
  id: string
  url: string
  status: BookmarkLinkCheckStatus
  checkedAt: number
  finalUrl?: string
  reason?: string
  statusCode?: number
  statusText?: string
}

export type BookmarkLinkCheckOptions = {
  concurrency?: number
  fetcher?: typeof fetch
  timeoutMs?: number
  onProgress?: (result: BookmarkLinkCheckResult) => void
}

const DEFAULT_CONCURRENCY = 6
const DEFAULT_TIMEOUT_MS = 10000
const RETRYABLE_HEAD_STATUSES = new Set([405, 501])

export function collectBookmarkUrlTargets(
  items: BookmarkLinkTarget[] | undefined,
): BookmarkUrlTarget[] {
  const targets: BookmarkUrlTarget[] = []

  function visit(nodes: BookmarkLinkTarget[] | undefined) {
    for (const node of nodes ?? []) {
      if (typeof node.url === 'string' && node.url.trim()) {
        targets.push({
          id: node.id,
          title: typeof node.title === 'string' ? node.title : '',
          url: node.url,
        })
      }

      visit(node.children)
    }
  }

  visit(items)
  return targets
}

export function isCheckableBookmarkUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export async function checkBookmarkUrl(
  target: BookmarkUrlTarget,
  options: Pick<BookmarkLinkCheckOptions, 'fetcher' | 'timeoutMs'> = {},
): Promise<BookmarkLinkCheckResult> {
  const checkedAt = Date.now()

  if (!isCheckableBookmarkUrl(target.url)) {
    return {
      checkedAt,
      id: target.id,
      reason: 'Only HTTP and HTTPS URLs can be checked',
      status: 'skipped',
      url: target.url,
    }
  }

  const fetcher = options.fetcher ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  try {
    const headResponse = await fetchWithTimeout(fetcher, target.url, {
      method: 'HEAD',
      timeoutMs,
    })

    if (!RETRYABLE_HEAD_STATUSES.has(headResponse.status)) {
      return responseToResult(target, headResponse, checkedAt)
    }
  } catch {
    // Some servers and extension contexts reject HEAD even when GET works.
  }

  try {
    const getResponse = await fetchWithTimeout(fetcher, target.url, {
      method: 'GET',
      timeoutMs,
    })

    return responseToResult(target, getResponse, checkedAt)
  } catch (error) {
    return errorToResult(target, error, checkedAt)
  }
}

export async function checkBookmarkUrls(
  targets: BookmarkUrlTarget[],
  options: BookmarkLinkCheckOptions = {},
): Promise<BookmarkLinkCheckResult[]> {
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY)
  const results: BookmarkLinkCheckResult[] = []
  let nextIndex = 0

  async function worker() {
    while (nextIndex < targets.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const result = await checkBookmarkUrl(targets[currentIndex], options)

      results[currentIndex] = result
      options.onProgress?.(result)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, targets.length) }, () =>
      worker(),
    ),
  )

  return results
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  url: string,
  {
    method,
    timeoutMs,
  }: {
    method: 'GET' | 'HEAD'
    timeoutMs: number
  },
) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetcher(url, {
      cache: 'no-store',
      method,
      redirect: 'follow',
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

function responseToResult(
  target: BookmarkUrlTarget,
  response: Response,
  checkedAt: number,
): BookmarkLinkCheckResult {
  return {
    checkedAt,
    finalUrl: response.url || target.url,
    id: target.id,
    status: response.status >= 400 ? 'broken' : 'ok',
    statusCode: response.status,
    statusText: response.statusText,
    url: target.url,
  }
}

function errorToResult(
  target: BookmarkUrlTarget,
  error: unknown,
  checkedAt: number,
): BookmarkLinkCheckResult {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      checkedAt,
      id: target.id,
      reason: 'Request timed out',
      status: 'error',
      url: target.url,
    }
  }

  return {
    checkedAt,
    id: target.id,
    reason: error instanceof Error ? error.message : 'Request failed',
    status: error instanceof TypeError ? 'blocked' : 'error',
    url: target.url,
  }
}
