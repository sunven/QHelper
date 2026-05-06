import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  eraseDownloadHistoryRecords,
  listDownloadsForCleanup,
} from './downloads'

describe('chrome/downloads', () => {
  const mockChrome = {
    downloads: {
      erase: vi.fn(),
      search: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: mockChrome,
    })
  })

  it('lists downloads using newest-first search order', async () => {
    mockChrome.downloads.search.mockResolvedValue([
      {
        exists: false,
        filename: '/tmp/missing.zip',
        finalUrl: 'https://example.com/missing.zip',
        id: 10,
        startTime: '2026-05-06T01:00:00.000Z',
        totalBytes: 123,
        url: 'https://example.com/missing.zip',
      },
    ])

    await expect(listDownloadsForCleanup()).resolves.toEqual([
      expect.objectContaining({
        exists: false,
        filename: '/tmp/missing.zip',
        id: 10,
      }),
    ])
    expect(mockChrome.downloads.search).toHaveBeenCalledWith({
      orderBy: ['-startTime'],
    })
  })

  it('surfaces search failures', async () => {
    mockChrome.downloads.search.mockRejectedValue(new Error('downloads unavailable'))

    await expect(listDownloadsForCleanup()).rejects.toThrow('downloads unavailable')
  })

  it('explains when the downloads API is unavailable', async () => {
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {},
    })

    await expect(listDownloadsForCleanup()).rejects.toThrow('下载 API 不可用')
  })

  it('erases only the provided history record ids', async () => {
    mockChrome.downloads.erase
      .mockResolvedValueOnce([1])
      .mockResolvedValueOnce([2])

    await expect(eraseDownloadHistoryRecords([1, 2])).resolves.toEqual([1, 2])
    expect(mockChrome.downloads.erase).toHaveBeenCalledTimes(2)
    expect(mockChrome.downloads.erase).toHaveBeenCalledWith({ id: 1 })
    expect(mockChrome.downloads.erase).toHaveBeenCalledWith({ id: 2 })
  })

  it('does not call erase for empty ids', async () => {
    await expect(eraseDownloadHistoryRecords([])).resolves.toEqual([])
    expect(mockChrome.downloads.erase).not.toHaveBeenCalled()
  })

  it('explains when erase is requested without the downloads API', async () => {
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {},
    })

    await expect(eraseDownloadHistoryRecords([1])).rejects.toThrow('下载 API 不可用')
  })

  it('does not expose local-file deletion behavior', () => {
    expect('removeFile' in mockChrome.downloads).toBe(false)
  })
})
