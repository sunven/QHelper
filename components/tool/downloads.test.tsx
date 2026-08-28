import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DownloadsTool } from './downloads'

const { eraseDownloadHistoryRecords, listDownloadsForCleanup } = vi.hoisted(
  () => ({
    eraseDownloadHistoryRecords: vi.fn(),
    listDownloadsForCleanup: vi.fn(),
  }),
)

vi.mock('@/lib/chrome/downloads', () => ({
  eraseDownloadHistoryRecords,
  listDownloadsForCleanup,
}))

describe('downloads/DownloadsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listDownloadsForCleanup.mockResolvedValue([
      {
        id: 1,
        filename: '/Users/example/Downloads/missing.zip',
        exists: false,
        totalBytes: 1024,
        startTime: '2026-05-08T00:00:00.000Z',
        url: 'https://example.com/missing.zip',
      },
    ])
  })

  it('automatically scans downloads once when the page opens', async () => {
    render(<DownloadsTool />)

    await waitFor(() => {
      expect(listDownloadsForCleanup).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText('missing.zip')).toBeVisible()
    expect(screen.getByText('确认缺失').nextElementSibling).toHaveTextContent(
      '1',
    )
    expect(eraseDownloadHistoryRecords).not.toHaveBeenCalled()
  })
})
