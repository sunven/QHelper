import { describe, expect, it, vi } from 'vitest'
import {
  checkBookmarkUrl,
  checkBookmarkUrls,
  collectBookmarkUrlTargets,
} from './dead-link-checker'

describe('bookmark dead-link checker', () => {
  it('collects bookmark URLs from nested trees', () => {
    expect(
      collectBookmarkUrlTargets([
        {
          id: 'folder',
          title: 'Folder',
          children: [
            {
              id: 'a',
              title: 'Alpha',
              url: 'https://example.com/a',
            },
            {
              id: 'nested',
              children: [
                {
                  id: 'b',
                  title: 'Beta',
                  url: 'https://example.com/b',
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual([
      {
        id: 'a',
        title: 'Alpha',
        url: 'https://example.com/a',
      },
      {
        id: 'b',
        title: 'Beta',
        url: 'https://example.com/b',
      },
    ])
  })

  it('skips URLs that browsers cannot check with fetch', async () => {
    const result = await checkBookmarkUrl({
      id: 'chrome-url',
      title: 'Chrome',
      url: 'chrome://extensions',
    })

    expect(result.status).toBe('skipped')
    expect(result.reason).toContain('HTTP and HTTPS')
  })

  it('marks successful HTTP responses as ok', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 204 }),
    )

    const result = await checkBookmarkUrl(
      {
        id: 'ok',
        title: 'OK',
        url: 'https://example.com/ok',
      },
      { fetcher },
    )

    expect(result.status).toBe('ok')
    expect(result.statusCode).toBe(204)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][1]?.method).toBe('HEAD')
  })

  it('retries with GET when HEAD is not supported', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await checkBookmarkUrl(
      {
        id: 'head-blocked',
        title: 'HEAD Blocked',
        url: 'https://example.com/head-blocked',
      },
      { fetcher },
    )

    expect(result.status).toBe('ok')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls[0][1]?.method).toBe('HEAD')
    expect(fetcher.mock.calls[1][1]?.method).toBe('GET')
  })

  it('marks HTTP error responses as broken', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 404 }),
    )

    const result = await checkBookmarkUrl(
      {
        id: 'broken',
        title: 'Broken',
        url: 'https://example.com/missing',
      },
      { fetcher },
    )

    expect(result.status).toBe('broken')
    expect(result.statusCode).toBe(404)
  })

  it('marks fetch TypeError failures as broken links', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch')
    })

    const result = await checkBookmarkUrl(
      {
        id: 'blocked',
        title: 'Blocked',
        url: 'https://example.com/blocked',
      },
      { fetcher },
    )

    expect(result.status).toBe('broken')
    expect(result.reason).toBe('Failed to fetch')
  })

  it('does not retry with GET after a HEAD timeout', async () => {
    const fetcher = vi.fn<typeof fetch>((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted')
          error.name = 'AbortError'
          reject(error)
        })
      })
    })

    const result = await checkBookmarkUrl(
      {
        id: 'timeout',
        title: 'Timeout',
        url: 'https://example.com/slow',
      },
      { fetcher, timeoutMs: 5 },
    )

    expect(result.status).toBe('error')
    expect(result.reason).toBe('Request timed out')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('deduplicates network checks for repeated URLs', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 200 }),
    )
    const onProgress = vi.fn()

    const results = await checkBookmarkUrls(
      [
        { id: 'a', title: 'A', url: 'https://example.com/shared' },
        { id: 'b', title: 'B', url: 'https://example.com/shared' },
        { id: 'c', title: 'C', url: 'https://example.com/other' },
      ],
      { fetcher, onProgress },
    )

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(results.map((result) => result.id)).toEqual(['a', 'b', 'c'])
    expect(onProgress).toHaveBeenCalledTimes(3)
  })

  it('stops checking remaining targets after abort', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>(async () => {
      controller.abort()
      return new Response(null, { status: 200 })
    })

    const results = await checkBookmarkUrls(
      [
        { id: 'a', title: 'A', url: 'https://example.com/a' },
        { id: 'b', title: 'B', url: 'https://example.com/b' },
      ],
      { concurrency: 1, fetcher, signal: controller.signal },
    )

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(results).toHaveLength(2)
    expect(results[1].reason).toBe('Request cancelled')
  })

  it('checks batches with bounded concurrency and progress updates', async () => {
    let active = 0
    let maxActive = 0
    const fetcher = vi.fn<typeof fetch>(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await Promise.resolve()
      active -= 1
      return new Response(null, { status: 200 })
    })
    const onProgress = vi.fn()

    const results = await checkBookmarkUrls(
      Array.from({ length: 5 }, (_, index) => ({
        id: `bookmark-${index}`,
        title: `Bookmark ${index}`,
        url: `https://example.com/${index}`,
      })),
      {
        concurrency: 2,
        fetcher,
        onProgress,
      },
    )

    expect(results).toHaveLength(5)
    expect(results.every((result) => result.status === 'ok')).toBe(true)
    expect(maxActive).toBeLessThanOrEqual(2)
    expect(onProgress).toHaveBeenCalledTimes(5)
  })
})
