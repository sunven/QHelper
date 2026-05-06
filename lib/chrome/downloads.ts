import type { CleanupDownloadItem } from '@/lib/downloads/cleanup'

export type DownloadHistoryItem = CleanupDownloadItem & {
  id: number
  danger?: string
  endTime?: string
  error?: string
  exists?: boolean
  filename: string
  finalUrl?: string
  mime?: string
  paused?: boolean
  state?: string
  url: string
}

function downloadsApi() {
  if (typeof chrome === 'undefined' || !chrome.downloads) {
    throw new Error('下载 API 不可用。请重新加载扩展，并确认已授予 downloads 权限。')
  }

  return chrome.downloads
}

export async function listDownloadsForCleanup(): Promise<DownloadHistoryItem[]> {
  const items = await downloadsApi().search({
    orderBy: ['-startTime'],
  })

  return items.map((item) => ({
    danger: item.danger,
    endTime: item.endTime,
    error: item.error,
    exists: item.exists,
    filename: item.filename,
    finalUrl: item.finalUrl,
    id: item.id,
    mime: item.mime,
    paused: item.paused,
    startTime: item.startTime,
    state: item.state,
    totalBytes: item.totalBytes,
    url: item.url,
  }))
}

export async function eraseDownloadHistoryRecords(ids: number[]): Promise<number[]> {
  if (ids.length === 0) {
    return []
  }

  const erasedIds = await Promise.all(
    ids.map((id) =>
      downloadsApi().erase({
        id,
      }),
    ),
  )

  return erasedIds.flat()
}
