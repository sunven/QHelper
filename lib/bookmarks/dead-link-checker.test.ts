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

  it('marks fetch TypeError failures as blocked', async () => {
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

    expect(result.status).toBe('blocked')
    expect(result.reason).toBe('Failed to fetch')
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
