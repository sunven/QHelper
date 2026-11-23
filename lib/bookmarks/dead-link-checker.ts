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
  signal?: AbortSignal
  timeoutMs?: number
  onProgress?: (result: BookmarkLinkCheckResult) => void
}

const DEFAULT_CONCURRENCY = 6
const DEFAULT_TIMEOUT_MS = 10000
const RETRYABLE_HEAD_STATUSES = new Set([405, 501])

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  )
}

function abortedResult(
  target: BookmarkUrlTarget,
  checkedAt: number,
): BookmarkLinkCheckResult {
  return {
    checkedAt,
    id: target.id,
    reason: 'Request cancelled',
    status: 'error',
    url: target.url,
  }
}

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
  options: Pick<
    BookmarkLinkCheckOptions,
    'fetcher' | 'signal' | 'timeoutMs'
  > = {},
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

  if (options.signal?.aborted) {
    return abortedResult(target, checkedAt)
  }

  const fetcher = options.fetcher ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  try {
    const headResponse = await fetchWithTimeout(fetcher, target.url, {
      method: 'HEAD',
      signal: options.signal,
      timeoutMs,
    })

    if (!RETRYABLE_HEAD_STATUSES.has(headResponse.status)) {
      return responseToResult(target, headResponse, checkedAt)
    }
  } catch (error) {
    if (options.signal?.aborted) {
      return abortedResult(target, checkedAt)
    }

    if (isAbortError(error)) {
      return errorToResult(target, error, checkedAt)
    }

    // Some servers and extension contexts reject HEAD even when GET works.
  }

  if (options.signal?.aborted) {
    return abortedResult(target, checkedAt)
  }

  try {
    const getResponse = await fetchWithTimeout(fetcher, target.url, {
      method: 'GET',
      signal: options.signal,
      timeoutMs,
    })

    return responseToResult(target, getResponse, checkedAt)
  } catch (error) {
    if (options.signal?.aborted) {
      return abortedResult(target, checkedAt)
    }

    return errorToResult(target, error, checkedAt)
  }
}

export async function checkBookmarkUrls(
  targets: BookmarkUrlTarget[],
  options: BookmarkLinkCheckOptions = {},
): Promise<BookmarkLinkCheckResult[]> {
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY)
  const targetsByUrl = new Map<string, BookmarkUrlTarget[]>()

  for (const target of targets) {
    const group = targetsByUrl.get(target.url)
    if (group) {
      group.push(target)
    } else {
      targetsByUrl.set(target.url, [target])
    }
  }

  const uniqueTargets = [...targetsByUrl.values()].map((group) => group[0])
  const resultsByUrl = new Map<string, BookmarkLinkCheckResult>()
  let nextIndex = 0

  async function worker() {
    while (!options.signal?.aborted && nextIndex < uniqueTargets.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const target = uniqueTargets[currentIndex]
      const result = await checkBookmarkUrl(target, options)
      resultsByUrl.set(target.url, result)

      for (const member of targetsByUrl.get(target.url) ?? []) {
        options.onProgress?.({ ...result, id: member.id, url: member.url })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, uniqueTargets.length) }, () =>
      worker(),
    ),
  )

  return targets.map((target) => {
    const result = resultsByUrl.get(target.url)
    return result
      ? { ...result, id: target.id, url: target.url }
      : abortedResult(target, Date.now())
  })
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  url: string,
  {
    method,
    signal,
    timeoutMs,
  }: {
    method: 'GET' | 'HEAD'
    signal?: AbortSignal
    timeoutMs: number
  },
) {
  const controller = new AbortController()
  const abortFromSignal = () => controller.abort()
  if (signal?.aborted) {
    controller.abort()
  } else {
    signal?.addEventListener('abort', abortFromSignal, { once: true })
  }
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
    signal?.removeEventListener('abort', abortFromSignal)
  }
}

function responseToResult(
  target: BookmarkUrlTarget,
  response: Response,
  checkedAt: number,
): BookmarkLinkCheckResult {
  void response.body?.cancel().catch(() => undefined)

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
  if (isAbortError(error)) {
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
    status: error instanceof TypeError ? 'broken' : 'error',
    url: target.url,
  }
}
